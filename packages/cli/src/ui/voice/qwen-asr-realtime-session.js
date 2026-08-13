/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import WebSocket from 'ws';
import { deriveWebSocketBase } from './voice-stream-session.js';
import { escapeAnsiCtrlCodes } from '../utils/textUtils.js';
const CONNECT_TIMEOUT_MS = 8000;
const FINISH_TIMEOUT_MS = 60_000;
const MAX_BUFFERED_AUDIO_BYTES = 1024 * 1024;
const MAX_SERVER_ERROR_MESSAGE_LENGTH = 200;
const debugLogger = createDebugLogger('VOICE_QWEN_REALTIME');
export function deriveQwenRealtimeUrl(baseUrl, model) {
    return `${deriveWebSocketBase(baseUrl)}/api-ws/v1/realtime?model=${encodeURIComponent(model)}`;
}
function appendTranscript(existing, next) {
    const text = next.trim();
    if (!text)
        return existing;
    return existing ? `${existing} ${text}` : text;
}
function toError(error) {
    return error instanceof Error ? error : new Error(String(error));
}
function formatServerErrorMessage(raw) {
    const text = typeof raw === 'string' ? raw : 'Qwen ASR realtime failed.';
    return escapeAnsiCtrlCodes(text).slice(0, MAX_SERVER_ERROR_MESSAGE_LENGTH);
}
export function openQwenAsrRealtimeStream(config, callbacks = {}, deps = {}) {
    const createWebSocket = deps.createWebSocket ??
        ((url, options) => new WebSocket(url, {
            headers: options.headers,
        }));
    return new Promise((resolve, reject) => {
        if (deps.abortSignal?.aborted) {
            reject(new Error('Voice stream opening was aborted.'));
            return;
        }
        const ws = createWebSocket(deriveQwenRealtimeUrl(config.baseUrl, config.model), {
            headers: config.apiKey
                ? { Authorization: `Bearer ${config.apiKey}` }
                : {},
        });
        let opened = false;
        let openSettled = false;
        let committed = '';
        let finishPromise = null;
        let finishResolve = null;
        let finishReject = null;
        let finishTimer = null;
        let connectTimer = null;
        let finishedTranscript = null;
        let terminalError = null;
        let failed = false;
        let backpressureWarned = false;
        let onAbort;
        const removeAbortListener = () => {
            if (!onAbort)
                return;
            deps.abortSignal?.removeEventListener('abort', onAbort);
            onAbort = undefined;
        };
        const sendJson = (body) => {
            ws.send(JSON.stringify({ event_id: randomUUID(), ...body }));
        };
        const close = () => {
            try {
                ws.close();
            }
            catch {
                /* ignore */
            }
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
            if (failed)
                return;
            failed = true;
            removeAbortListener();
            const normalized = toError(error);
            clearConnectTimer();
            clearFinishTimer();
            close();
            if (finishReject) {
                finishReject(normalized);
                finishResolve = null;
                finishReject = null;
                return;
            }
            if (!openSettled) {
                openSettled = true;
                reject(normalized);
                return;
            }
            terminalError = normalized;
            callbacks.onError?.(normalized);
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
            if (!opened)
                fail(new Error('Qwen ASR realtime connection timed out.'));
        }, CONNECT_TIMEOUT_MS);
        const sendSessionUpdate = () => {
            sendJson({
                type: 'session.update',
                session: {
                    input_audio_format: 'pcm',
                    sample_rate: 16000,
                    input_audio_transcription: {
                        ...(config.language ? { language: config.language } : {}),
                        ...(config.keytermsContext
                            ? { corpus_text: config.keytermsContext }
                            : {}),
                    },
                    turn_detection: null,
                },
            });
        };
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
                debugLogger.warn('[voice] failed to parse Qwen ASR realtime message:', error);
                return;
            }
            switch (msg.type) {
                case 'session.created':
                    sendSessionUpdate();
                    break;
                case 'session.updated':
                    opened = true;
                    openSettled = true;
                    clearConnectTimer();
                    resolve({
                        pushAudio: (pcm) => {
                            if (ws.readyState !== ws.OPEN || pcm.length === 0)
                                return;
                            if ((ws.bufferedAmount ?? 0) > MAX_BUFFERED_AUDIO_BYTES) {
                                if (!backpressureWarned) {
                                    backpressureWarned = true;
                                    debugLogger.warn('[voice] dropping Qwen ASR realtime audio due to socket backpressure.');
                                }
                                return;
                            }
                            backpressureWarned = false;
                            sendJson({
                                type: 'input_audio_buffer.append',
                                audio: Buffer.from(pcm).toString('base64'),
                            });
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
                                    fail(new Error('Qwen ASR realtime finish timed out.'));
                                }, FINISH_TIMEOUT_MS);
                                try {
                                    sendJson({ type: 'input_audio_buffer.commit' });
                                    sendJson({ type: 'session.finish' });
                                }
                                catch (error) {
                                    fail(error);
                                }
                            });
                            return finishPromise;
                        },
                        abort: close,
                    });
                    break;
                case 'conversation.item.input_audio_transcription.text': {
                    const text = typeof msg.text === 'string' ? msg.text : '';
                    const stash = typeof msg.stash === 'string' ? msg.stash : '';
                    const preview = `${text}${stash}`.trim();
                    callbacks.onInterim?.([committed, preview].filter(Boolean).join(' '));
                    break;
                }
                case 'conversation.item.input_audio_transcription.completed':
                    if (typeof msg.transcript === 'string') {
                        committed = appendTranscript(committed, msg.transcript);
                        callbacks.onInterim?.(committed);
                    }
                    break;
                case 'conversation.item.input_audio_transcription.failed':
                    fail(new Error(formatServerErrorMessage(msg.error?.message ??
                        msg.error?.code ??
                        'Qwen ASR realtime transcription failed.')));
                    break;
                case 'session.finished':
                    if (!openSettled) {
                        fail(new Error('Qwen ASR realtime session finished before it was ready.'));
                        break;
                    }
                    failed = true;
                    removeAbortListener();
                    clearFinishTimer();
                    finishedTranscript = committed.trim();
                    finishResolve?.(finishedTranscript);
                    finishResolve = null;
                    finishReject = null;
                    close();
                    break;
                case 'error':
                    fail(new Error(formatServerErrorMessage(msg.error?.message ??
                        msg.error?.code ??
                        'Qwen ASR realtime request failed.')));
                    break;
                default:
                    break;
            }
        });
        ws.on('error', fail);
        ws.on('close', () => {
            removeAbortListener();
            clearConnectTimer();
            clearFinishTimer();
            if (failed)
                return;
            if (!openSettled) {
                openSettled = true;
                reject(new Error('Qwen ASR realtime connection closed.'));
                return;
            }
            if (finishReject) {
                finishReject(new Error('Qwen ASR realtime connection closed unexpectedly. Transcript may be incomplete.'));
                finishResolve = null;
                finishReject = null;
            }
            else {
                const error = new Error('Qwen ASR realtime connection closed unexpectedly. Transcript may be incomplete.');
                terminalError ??= error;
                callbacks.onError?.(terminalError);
            }
        });
    });
}
//# sourceMappingURL=qwen-asr-realtime-session.js.map