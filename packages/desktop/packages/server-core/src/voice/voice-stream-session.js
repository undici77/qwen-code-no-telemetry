import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { CONSOLE_LOGGER, createScopedLogger } from '../runtime/platform';
import { escapeAnsiCtrlCodes } from './ansi';
import { sanitizeResponseDetails } from './transcribe';
const CONNECT_TIMEOUT_MS = 8000;
const FINISH_TIMEOUT_MS = 60_000;
const MAX_BUFFERED_AUDIO_BYTES = 1024 * 1024;
const debugLogger = createScopedLogger(CONSOLE_LOGGER, 'VOICE_STREAM_SESSION');
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
function formatServerErrorMessage(raw, apiKey) {
    const text = typeof raw === 'string' ? raw : 'unknown';
    // sanitizeResponseDetails already caps length and appends `...`; slicing
    // again here would clip that indicator off.
    return escapeAnsiCtrlCodes(sanitizeResponseDetails(text, apiKey));
}
export function openVoiceStream(config, callbacks = {}, deps = {}) {
    const createWebSocket = deps.createWebSocket ??
        ((url, options) => new WebSocket(url, {
            headers: options.headers,
        }));
    return new Promise((resolve, reject) => {
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
        let lastPartial = '';
        let finishPromise = null;
        let finishResolve = null;
        let finishReject = null;
        let finishTimer = null;
        let connectTimer = null;
        let terminalError = null;
        let finishedTranscript = null;
        let droppedFrames = 0;
        let droppedBytes = 0;
        let backpressureActive = false;
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
        // Per-frame drops are warned on backpressure enter/recover transitions, but a
        // session that ends mid-backpressure (or after a recovery) would otherwise
        // leave the cumulative loss unreported. Surface the running total exactly once
        // at session end so a degraded session is quantified end-to-end.
        let droppedTotalsReported = false;
        const reportDroppedTotals = () => {
            if (droppedTotalsReported)
                return;
            droppedTotalsReported = true;
            if (droppedFrames > 0) {
                debugLogger.warn(`[voice] session ended with ${droppedFrames} dropped frame(s) / ` +
                    `${droppedBytes} bytes total`);
            }
        };
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            reportDroppedTotals();
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
                        if (pcm.length === 0)
                            return;
                        if (ws.readyState === ws.OPEN &&
                            (ws.bufferedAmount ?? 0) <= MAX_BUFFERED_AUDIO_BYTES) {
                            if (backpressureActive) {
                                // Recovered: report the running totals so the cumulative gap is
                                // quantified (droppedFrames/droppedBytes are session-wide, never
                                // reset between drop episodes).
                                backpressureActive = false;
                                debugLogger.warn(`[voice] DashScope socket recovered from backpressure ` +
                                    `(dropped ${droppedFrames} frame(s) / ${droppedBytes} bytes total)`);
                            }
                            ws.send(pcm);
                            return;
                        }
                        // Upstream send buffer is over the ceiling (or the socket is no longer
                        // OPEN): drop this frame so the buffer can't grow without bound. Count
                        // every drop — silent gaps are otherwise invisible to the user — and
                        // warn once on entering backpressure (throttled) with the running total.
                        droppedFrames += 1;
                        droppedBytes += pcm.length;
                        if (!backpressureActive) {
                            backpressureActive = true;
                            debugLogger.warn(`[voice] dropping DashScope audio due to socket backpressure ` +
                                `(dropped ${droppedFrames} frame(s) / ${droppedBytes} bytes so far)`);
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
                        lastPartial = '';
                        callbacks.onInterim?.(committed);
                    }
                    else {
                        const running = committed
                            ? `${committed} ${sentence.text}`
                            : sentence.text;
                        lastPartial = running;
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
                finishedTranscript = lastPartial.trim() || committed.trim();
                settled = true;
                reportDroppedTotals();
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
                const code = msg.header?.error_code ?? 'error';
                const message = formatServerErrorMessage(msg.header?.error_message, config.apiKey);
                debugLogger.warn(`[voice] stream failed at ${streamUrl} task ${taskId} (${code}): ${message}`);
                fail(new Error(`Voice stream failed (${code}): ${message}`));
            }
        });
        ws.on('error', (...args) => {
            clearConnectTimer();
            const error = args[0];
            fail(error instanceof Error ? error : new Error(String(error)));
        });
        ws.on('close', () => {
            clearConnectTimer();
            clearFinishTimer();
            if (settled)
                return;
            reportDroppedTotals();
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
                // Match the other terminal branches: mark settled so a late error/close
                // can't re-enter and double-fire onError.
                settled = true;
                const err = new Error('Voice stream connection closed unexpectedly. Transcript may be incomplete.');
                terminalError ??= err;
                callbacks.onError?.(err);
            }
        });
    });
}
//# sourceMappingURL=voice-stream-session.js.map