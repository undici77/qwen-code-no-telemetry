/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import WebSocket from 'ws';
import { escapeAnsiCtrlCodes } from '../utils/textUtils.js';
const CONNECT_TIMEOUT_MS = 8000;
const FINISH_TIMEOUT_MS = 60_000;
const MAX_BUFFERED_AUDIO_BYTES = 1024 * 1024;
const MAX_SERVER_ERROR_MESSAGE_LENGTH = 200;
const debugLogger = createDebugLogger('VOICE_STREAM_SESSION');
export function deriveWebSocketBase(baseUrl) {
    const url = new URL(baseUrl);
    const wsScheme = url.protocol === 'https:' ? 'wss:' : 'ws:';
    let prefix = url.pathname.replace(/\/+$/, '');
    if (prefix.endsWith('/compatible-mode/v1')) {
        prefix = prefix.slice(0, -'/compatible-mode/v1'.length);
    }
    else if (prefix.endsWith('/v1')) {
        prefix = prefix.slice(0, -'/v1'.length);
    }
    return `${wsScheme}//${url.host}${prefix}`;
}
export function deriveStreamUrl(baseUrl) {
    return `${deriveWebSocketBase(baseUrl)}/api-ws/v1/inference`;
}
function formatServerErrorMessage(raw) {
    const text = typeof raw === 'string' ? raw : 'unknown';
    return escapeAnsiCtrlCodes(text).slice(0, MAX_SERVER_ERROR_MESSAGE_LENGTH);
}
export function openVoiceStream(config, callbacks = {}, deps = {}) {
    const createWebSocket = deps.createWebSocket ??
        ((url, options) => new WebSocket(url, {
            headers: options.headers,
        }));
    return new Promise((resolve, reject) => {
        if (deps.abortSignal?.aborted) {
            reject(new Error('Voice stream opening was aborted.'));
            return;
        }
        const streamUrl = deriveStreamUrl(config.baseUrl);
        const ws = createWebSocket(streamUrl, {
            headers: config.apiKey
                ? { Authorization: `Bearer ${config.apiKey}` }
                : {},
        });
        const taskId = randomUUID();
        let started = false;
        let settled = false;
        let committed = '';
        let finishPromise = null;
        let finishResolve = null;
        let finishReject = null;
        let finishTimer = null;
        let connectTimer = null;
        let terminalError = null;
        let finishedTranscript = null;
        let backpressureWarned = false;
        let onAbort;
        const removeAbortListener = () => {
            if (!onAbort)
                return;
            deps.abortSignal?.removeEventListener('abort', onAbort);
            onAbort = undefined;
        };
        const clearFinishTimer = () => {
            if (finishTimer) {
                clearTimeout(finishTimer);
                finishTimer = null;
            }
        };
        const clearConnectTimer = () => {
            if (connectTimer) {
                clearTimeout(connectTimer);
                connectTimer = null;
            }
        };
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            removeAbortListener();
            const normalized = error instanceof Error ? error : new Error(String(error));
            clearConnectTimer();
            clearFinishTimer();
            try {
                ws.close();
            }
            catch {
                /* ignore */
            }
            if (finishReject) {
                finishReject(normalized);
                finishResolve = null;
                finishReject = null;
            }
            else {
                terminalError = normalized;
                if (!started) {
                    reject(normalized);
                }
                else {
                    callbacks.onError?.(normalized);
                }
            }
        };
        if (deps.abortSignal) {
            onAbort = () => fail(new Error('Voice stream opening was aborted.'));
            if (deps.abortSignal.aborted) {
                onAbort();
                return;
            }
            deps.abortSignal.addEventListener('abort', onAbort, { once: true });
        }
        connectTimer = setTimeout(() => {
            if (!started)
                fail(new Error('Voice stream connection timed out.'));
        }, CONNECT_TIMEOUT_MS);
        ws.on('open', () => {
            ws.send(JSON.stringify({
                header: { action: 'run-task', task_id: taskId, streaming: 'duplex' },
                payload: {
                    task_group: 'audio',
                    task: 'asr',
                    function: 'recognition',
                    model: config.model,
                    parameters: {
                        format: 'pcm',
                        sample_rate: 16000,
                        ...(config.language ? { language_hints: [config.language] } : {}),
                    },
                    input: {},
                },
            }));
        });
        ws.on('message', (...args) => {
            const data = args[0];
            const isBinary = args[1] === true;
            if (isBinary)
                return;
            let msg;
            try {
                msg = JSON.parse(String(data));
            }
            catch (error) {
                debugLogger.warn('[voice] failed to parse stream message:', error);
                return;
            }
            const event = msg.header?.event;
            if (event === 'task-started') {
                started = true;
                clearConnectTimer();
                resolve({
                    pushAudio: (pcm) => {
                        if (ws.readyState === ws.OPEN &&
                            pcm.length > 0 &&
                            (ws.bufferedAmount ?? 0) <= MAX_BUFFERED_AUDIO_BYTES) {
                            backpressureWarned = false;
                            ws.send(pcm);
                        }
                        else if (pcm.length > 0 && !backpressureWarned) {
                            backpressureWarned = true;
                            debugLogger.warn('[voice] dropping DashScope audio due to socket backpressure');
                        }
                    },
                    finish: () => {
                        if (finishPromise)
                            return finishPromise;
                        finishPromise = new Promise((res, rej) => {
                            if (finishedTranscript !== null) {
                                res(finishedTranscript);
                                return;
                            }
                            if (terminalError) {
                                rej(terminalError);
                                return;
                            }
                            finishResolve = res;
                            finishReject = rej;
                            finishTimer = setTimeout(() => {
                                fail(new Error('Voice stream finish timed out.'));
                            }, FINISH_TIMEOUT_MS);
                            try {
                                ws.send(JSON.stringify({
                                    header: {
                                        action: 'finish-task',
                                        task_id: taskId,
                                        streaming: 'duplex',
                                    },
                                    payload: { input: {} },
                                }));
                            }
                            catch (error) {
                                fail(error);
                            }
                        });
                        return finishPromise;
                    },
                    abort: () => {
                        try {
                            ws.close();
                        }
                        catch {
                            /* ignore */
                        }
                    },
                });
            }
            else if (event === 'result-generated') {
                const sentence = msg.payload?.output?.sentence;
                if (sentence &&
                    !sentence.heartbeat &&
                    typeof sentence.text === 'string') {
                    if (sentence.sentence_end) {
                        committed = committed
                            ? `${committed} ${sentence.text}`
                            : sentence.text;
                        callbacks.onInterim?.(committed);
                    }
                    else {
                        const running = committed
                            ? `${committed} ${sentence.text}`
                            : sentence.text;
                        callbacks.onInterim?.(running);
                    }
                }
            }
            else if (event === 'task-finished') {
                if (!started) {
                    // Out-of-order finish before task-started: the connect promise only
                    // resolves on task-started, so reject it instead of hanging forever.
                    fail(new Error('Voice stream finished before it started.'));
                    return;
                }
                finishedTranscript = committed.trim();
                settled = true;
                removeAbortListener();
                clearConnectTimer();
                clearFinishTimer();
                try {
                    ws.close();
                }
                catch {
                    /* ignore */
                }
                finishResolve?.(finishedTranscript);
                finishResolve = null;
                finishReject = null;
            }
            else if (event === 'task-failed') {
                clearConnectTimer();
                fail(new Error(`Voice stream failed at ${streamUrl} task ${taskId} (${msg.header?.error_code ?? 'error'}): ${formatServerErrorMessage(msg.header?.error_message)}`));
            }
        });
        ws.on('error', (...args) => {
            clearConnectTimer();
            const error = args[0];
            fail(error instanceof Error ? error : new Error(String(error)));
        });
        ws.on('close', () => {
            removeAbortListener();
            clearConnectTimer();
            clearFinishTimer();
            if (settled)
                return;
            if (started && finishReject) {
                settled = true;
                finishReject(new Error('Voice stream connection closed unexpectedly. Transcript may be incomplete.'));
                finishResolve = null;
                finishReject = null;
            }
            else if (!started) {
                fail(new Error('Voice stream closed before it started.'));
            }
            else {
                const err = new Error('Voice stream connection closed unexpectedly. Transcript may be incomplete.');
                terminalError ??= err;
                callbacks.onError?.(err);
            }
        });
    });
}
//# sourceMappingURL=voice-stream-session.js.map