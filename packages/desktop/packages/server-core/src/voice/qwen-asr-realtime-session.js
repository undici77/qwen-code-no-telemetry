import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { deriveWebSocketBase } from './voice-stream-session';
import { CONSOLE_LOGGER, createScopedLogger, } from '../runtime/platform';
import { escapeAnsiCtrlCodes } from './ansi';
import { sanitizeResponseDetails } from './transcribe';
const CONNECT_TIMEOUT_MS = 8000;
const FINISH_TIMEOUT_MS = 60_000;
const MAX_BUFFERED_AUDIO_BYTES = 1024 * 1024;
const CONNECTION_CLOSED_MESSAGE = 'Qwen ASR realtime connection closed unexpectedly. Transcript may be incomplete.';
const debugLogger = createScopedLogger(CONSOLE_LOGGER, 'VOICE_QWEN_REALTIME');
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
function formatServerErrorMessage(raw, apiKey) {
    const text = typeof raw === 'string' ? raw : 'Qwen ASR realtime failed.';
    // sanitizeResponseDetails already caps length and appends `...`; slicing
    // again here would clip that indicator off.
    return escapeAnsiCtrlCodes(sanitizeResponseDetails(text, apiKey));
}
export function openQwenAsrRealtimeStream(config, callbacks = {}, deps = {}) {
    const createWebSocket = deps.createWebSocket ??
        ((url, options) => new WebSocket(url, {
            headers: options.headers,
        }));
    const logger = deps.logger ?? debugLogger;
    return new Promise((resolve, reject) => {
        const ws = createWebSocket(deriveQwenRealtimeUrl(config.baseUrl, config.model), {
            headers: config.apiKey
                ? { Authorization: `Bearer ${config.apiKey}` }
                : {},
        });
        let opened = false;
        let openSettled = false;
        let committed = '';
        let lastPartial = '';
        let finishPromise = null;
        let finishResolve = null;
        let finishReject = null;
        let finishTimer = null;
        let connectTimer = null;
        let finishedTranscript = null;
        let terminalError = null;
        let settled = false;
        let backpressureWarned = false;
        let droppedFrames = 0;
        let droppedBytes = 0;
        const sendJson = (body) => {
            ws.send(JSON.stringify({ event_id: randomUUID(), ...body }));
        };
        // A session that drops audio under backpressure would otherwise leave the
        // cumulative loss unreported. Surface the running total exactly once at
        // session end (mirrors voice-stream-session) so a degraded session is
        // quantified end-to-end.
        let droppedTotalsReported = false;
        const reportDroppedTotals = () => {
            if (droppedTotalsReported)
                return;
            droppedTotalsReported = true;
            if (droppedFrames > 0) {
                logger.warn(`[voice] session ended with ${droppedFrames} dropped frame(s) / ` +
                    `${droppedBytes} bytes total`);
            }
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
            if (settled)
                return;
            settled = true;
            reportDroppedTotals();
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
                logger.warn('[voice] failed to parse Qwen ASR realtime message:', error);
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
                                // Count every drop — silent gaps are otherwise invisible — and
                                // warn once on entering backpressure (reset on recovery below).
                                droppedFrames += 1;
                                droppedBytes += pcm.length;
                                if (!backpressureWarned) {
                                    backpressureWarned = true;
                                    logger.warn('[voice] dropping Qwen ASR realtime audio due to socket backpressure.');
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
                    lastPartial = [committed, preview].filter(Boolean).join(' ');
                    callbacks.onInterim?.(lastPartial);
                    break;
                }
                case 'conversation.item.input_audio_transcription.completed':
                    if (typeof msg.transcript === 'string') {
                        committed = appendTranscript(committed, msg.transcript);
                        lastPartial = '';
                        callbacks.onInterim?.(committed);
                    }
                    break;
                case 'conversation.item.input_audio_transcription.failed':
                    fail(new Error(formatServerErrorMessage(msg.error?.message ??
                        msg.error?.code ??
                        'Qwen ASR realtime transcription failed.', config.apiKey)));
                    break;
                case 'session.finished':
                    if (!openSettled) {
                        fail(new Error('Qwen ASR realtime session finished before it was ready.'));
                        break;
                    }
                    settled = true;
                    reportDroppedTotals();
                    clearFinishTimer();
                    finishedTranscript = lastPartial.trim() || committed.trim();
                    finishResolve?.(finishedTranscript);
                    finishResolve = null;
                    finishReject = null;
                    close();
                    break;
                case 'error':
                    fail(new Error(formatServerErrorMessage(msg.error?.message ??
                        msg.error?.code ??
                        'Qwen ASR realtime request failed.', config.apiKey)));
                    break;
                default:
                    break;
            }
        });
        ws.on('error', fail);
        ws.on('close', () => {
            clearConnectTimer();
            clearFinishTimer();
            if (settled)
                return;
            reportDroppedTotals();
            // Every branch below is terminal; mark settled so a late error/close event
            // can't re-enter via fail() and double-fire reject/onError.
            settled = true;
            if (!openSettled) {
                openSettled = true;
                reject(new Error('Qwen ASR realtime connection closed.'));
                return;
            }
            if (finishReject) {
                finishReject(new Error(CONNECTION_CLOSED_MESSAGE));
                finishResolve = null;
                finishReject = null;
            }
            else {
                const error = new Error(CONNECTION_CLOSED_MESSAGE);
                terminalError ??= error;
                callbacks.onError?.(terminalError);
            }
        });
    });
}
//# sourceMappingURL=qwen-asr-realtime-session.js.map