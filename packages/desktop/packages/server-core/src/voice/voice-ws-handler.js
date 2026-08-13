/**
 * Per-connection handler for the desktop `/voice/stream` WebSocket.
 *
 * Supports both transcription transports:
 *   - batch (qwen3-asr-flash): accumulate PCM, transcribe on stop
 *   - realtime (qwen3-asr-flash-realtime / *-realtime): open an upstream ASR
 *     WebSocket, stream PCM, forward interim transcripts, finalize on stop
 *
 * Protocol — client → server:
 *   - text   `{"type":"start"}`  resolve config + (realtime) open the stream
 *   - binary  raw s16le / 16 kHz / mono PCM frames
 *   - text   `{"type":"stop"}`   finalize and return the transcript
 *   - text   `{"type":"abort"}`  discard and close
 *
 * server → client:
 *   - `{"type":"ready","streaming":bool,"model":string}`
 *   - `{"type":"interim","text":string}`  (realtime only)
 *   - `{"type":"final","text":string}`
 *   - `{"type":"error","message":string}`
 *
 * Capture happens in the renderer; transcription runs here so provider
 * credentials never reach the renderer. Mirrors the daemon Web Shell handler
 * (packages/cli/src/serve/voice/voice-ws.ts).
 */
import { encodeWav } from './wav';
import { assertVoiceBaseUrlNetworkAllowed } from './net-guard';
import { MAX_AUDIO_BYTES, sanitizeResponseDetails, transcribeQwenAsrBatch, } from './transcribe';
import { openVoiceStream, } from './voice-stream-session';
import { openQwenAsrRealtimeStream } from './qwen-asr-realtime-session';
import { openVoiceStreamWithRetry } from './voice-stream-retry';
import { isStreamingVoiceModel, resolveVoiceTransport } from './voice-model';
// Qwen-ASR caps each file at 10 MB / ~5 minutes; guard before WAV-encoding.
const MAX_QUEUED_AUDIO_BYTES = MAX_AUDIO_BYTES * 2;
// Hard cap so a client that opens the socket and never sends `stop` can't pin
// an upstream ASR session indefinitely.
const MAX_CONNECTION_MS = 6 * 60_000;
// Cap concurrent sessions so a client can't open unbounded sockets.
const MAX_CONCURRENT_VOICE_SESSIONS = 8;
const MAX_PENDING_OPERATIONS = 64;
function errMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
// Streaming/realtime stream errors can carry raw upstream socket detail (auth
// URLs, Bearer tokens) via `ws.on('error')`; redact through the same sanitizer
// the batch path uses before the text reaches the renderer.
function sanitizeStreamError(error, apiKey) {
    return sanitizeResponseDetails(errMessage(error), apiKey);
}
export function toStreamConfig(config) {
    return {
        baseUrl: config.baseUrl,
        model: config.model,
        ...(config.apiKey ? { apiKey: config.apiKey } : {}),
        ...(config.language ? { language: config.language } : {}),
    };
}
async function defaultOpenStreamFor(config, callbacks) {
    await assertVoiceBaseUrlNetworkAllowed(config);
    const cfg = toStreamConfig(config);
    const transport = resolveVoiceTransport(config.model);
    return openVoiceStreamWithRetry(() => transport === 'qwen-asr-realtime'
        ? openQwenAsrRealtimeStream(cfg, callbacks)
        : openVoiceStream(cfg, callbacks));
}
async function defaultTranscribeBatch(config, pcm, signal) {
    await assertVoiceBaseUrlNetworkAllowed(config);
    return transcribeQwenAsrBatch({ data: encodeWav(pcm), mimeType: 'audio/wav' }, config, { signal });
}
function toBuffer(data) {
    if (Buffer.isBuffer(data))
        return data;
    if (Array.isArray(data))
        return Buffer.concat(data);
    return Buffer.from(data);
}
function parseControl(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        return undefined;
    }
    const type = parsed?.type;
    if (type === 'start' || type === 'stop' || type === 'abort') {
        return { type };
    }
    return undefined;
}
export function createVoiceConnectionHandler(deps) {
    const log = deps.logger;
    const openStream = deps.openStream ?? defaultOpenStreamFor;
    const transcribeBatch = deps.transcribeBatch ?? defaultTranscribeBatch;
    // Shared across all connections from this server (factory closure).
    let activeSessions = 0;
    let connSeq = 0;
    return (ws) => {
        // Short per-connection id so concurrent sessions (up to
        // MAX_CONCURRENT_VOICE_SESSIONS) are distinguishable in the logs.
        const connId = (++connSeq).toString(36);
        if (activeSessions >= MAX_CONCURRENT_VOICE_SESSIONS) {
            log?.warn(`[voice-ws ${connId}] rejected: activeSessions=${activeSessions} limit=${MAX_CONCURRENT_VOICE_SESSIONS}`);
            try {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Too many voice sessions in progress; try again shortly.',
                }));
                ws.close(1013, 'busy');
            }
            catch {
                // ignore
            }
            return;
        }
        activeSessions++;
        let released = false;
        const releaseSlot = () => {
            if (!released) {
                released = true;
                activeSessions--;
            }
        };
        let state = 'idle';
        let ctx;
        let session;
        let sessionPromise;
        const pcmChunks = [];
        let bufferedBytes = 0;
        let queuedBytes = 0;
        let pendingOperations = 0;
        // The count cap guards control-message backlog only; buffered PCM is already
        // bounded by queuedBytes. A slow upstream connect can legitimately queue
        // dozens of frames behind `start`, which must not trip the cap.
        let pendingControlOps = 0;
        const abortController = new AbortController();
        // Serialize message handling so async start/push/finalize never interleave.
        let chain = Promise.resolve();
        const hardTimer = setTimeout(() => {
            if (!isClosed())
                fail('Voice session exceeded the time limit.');
        }, MAX_CONNECTION_MS);
        hardTimer.unref?.();
        // Read `state` through a helper so an async error path that flips it to
        // 'closed' isn't flow-narrowed away by an earlier guard.
        const isClosed = () => state === 'closed';
        const releaseSlotWhenIdle = () => {
            if (state === 'closed' && pendingOperations === 0)
                releaseSlot();
        };
        const sendJson = (obj) => {
            if (ws.readyState === ws.OPEN) {
                try {
                    ws.send(JSON.stringify(obj));
                }
                catch {
                    // socket already going away
                }
            }
        };
        function cleanup() {
            state = 'closed';
            abortController.abort();
            clearTimeout(hardTimer);
            if (session) {
                try {
                    session.abort();
                }
                catch {
                    // best effort
                }
                session = undefined;
            }
            sessionPromise = undefined;
            pcmChunks.length = 0;
            bufferedBytes = 0;
            queuedBytes = 0;
        }
        function fail(message) {
            if (state === 'closed')
                return;
            log?.warn(`[voice-ws ${connId}] failed: ${message}`);
            sendJson({ type: 'error', message });
            cleanup();
            releaseSlotWhenIdle();
            try {
                ws.close(1011, 'voice error');
            }
            catch {
                // ignore
            }
        }
        async function ensureStarted() {
            if (ctx)
                return;
            let config;
            try {
                config = await deps.resolveConfig();
            }
            catch (error) {
                // Config-resolution errors (e.g. no credentials) surface verbatim.
                fail(errMessage(error));
                return;
            }
            if (isClosed())
                return;
            if (resolveVoiceTransport(config.model) === 'unsupported') {
                fail(`Voice model '${config.model}' is not a supported transcription model.`);
                return;
            }
            ctx = { config, streaming: isStreamingVoiceModel(config.model) };
            sendJson({ type: 'ready', streaming: ctx.streaming, model: config.model });
            if (ctx.streaming) {
                const callbacks = {
                    onInterim: (text) => sendJson({ type: 'interim', text }),
                    onError: (error) => fail(sanitizeStreamError(error, config.apiKey)),
                };
                const opening = openStream(config, callbacks);
                sessionPromise = opening;
                let opened;
                try {
                    opened = await opening;
                }
                catch (error) {
                    fail(sanitizeStreamError(error, config.apiKey));
                    return;
                }
                if (isClosed()) {
                    try {
                        opened.abort();
                    }
                    catch {
                        // best effort
                    }
                    return;
                }
                session = opened;
            }
            if (state === 'idle')
                state = 'active';
        }
        async function finalize() {
            if (state === 'closed' || state === 'finalizing')
                return;
            state = 'finalizing';
            await ensureStarted();
            if (isClosed() || !ctx)
                return;
            let transcript = '';
            try {
                if (ctx.streaming) {
                    const active = session ?? (sessionPromise ? await sessionPromise : undefined);
                    if (isClosed())
                        return;
                    if (active) {
                        try {
                            transcript = await active.finish();
                        }
                        finally {
                            session = undefined;
                        }
                    }
                    else {
                        log?.warn(`[voice-ws ${connId}] finalize with no active streaming session (bufferedBytes=${bufferedBytes}, pcmChunks=${pcmChunks.length})`);
                    }
                }
                else if (pcmChunks.length > 0) {
                    transcript = await transcribeBatch(ctx.config, Buffer.concat(pcmChunks), abortController.signal);
                }
                else {
                    log?.warn(`[voice-ws ${connId}] finalize with no batch audio (bufferedBytes=${bufferedBytes}, pcmChunks=${pcmChunks.length})`);
                }
            }
            catch (error) {
                // Streaming finish() can reject with raw upstream socket detail; redact
                // it. Batch errors are already sanitized inside transcribeQwenAsrBatch.
                fail(ctx.streaming
                    ? sanitizeStreamError(error, ctx.config.apiKey)
                    : errMessage(error));
                return;
            }
            sendJson({ type: 'final', text: transcript });
            cleanup();
            try {
                ws.close(1000, 'done');
            }
            catch {
                // ignore
            }
        }
        async function handleMessage(data, isBinary) {
            if (state === 'closed' || state === 'finalizing')
                return;
            if (isBinary) {
                await ensureStarted();
                if (isClosed() || !ctx)
                    return;
                bufferedBytes += data.byteLength;
                // MAX_AUDIO_BYTES is the batch file ceiling (Qwen-ASR caps each WAV at
                // 10 MB / ~5 min). Streaming forwards frames immediately and is bounded
                // by MAX_CONNECTION_MS (the 6-min hard timer) + queuedBytes, so counting
                // already-forwarded frames toward the batch cap would cut a legit stream
                // off ~30 s early — enforce the file cap for batch only.
                if (!ctx.streaming && bufferedBytes > MAX_AUDIO_BYTES) {
                    fail('Recording is too long for transcription (max ~5 minutes).');
                    return;
                }
                if (ctx.streaming) {
                    const active = session ?? (sessionPromise ? await sessionPromise : undefined);
                    active?.pushAudio(data);
                }
                else {
                    pcmChunks.push(data);
                }
                return;
            }
            const text = data.toString('utf8');
            const control = parseControl(text);
            if (!control) {
                // Non-JSON or unknown control type — leave a trace for protocol drift.
                log?.debug(`[voice-ws ${connId}] unrecognized text frame:`, text.slice(0, 80));
                return;
            }
            switch (control.type) {
                case 'start':
                    await ensureStarted();
                    return;
                case 'stop':
                    await finalize();
                    return;
                default:
                    return;
            }
        }
        ws.on('message', (data, isBinary) => {
            if (state === 'closed' || state === 'finalizing')
                return;
            const buf = toBuffer(data);
            if (!isBinary) {
                const control = parseControl(buf.toString('utf8'));
                if (control?.type === 'abort') {
                    log?.debug(`[voice-ws ${connId}] abort requested, discarding session state`);
                    cleanup();
                    try {
                        ws.close(1000, 'aborted');
                    }
                    catch {
                        // ignore
                    }
                    releaseSlotWhenIdle();
                    return;
                }
            }
            const queuedSize = isBinary ? buf.byteLength : 0;
            if (queuedSize > 0) {
                queuedBytes += queuedSize;
                if (queuedBytes > MAX_QUEUED_AUDIO_BYTES) {
                    fail('Queued voice audio exceeded the memory limit.');
                    releaseSlotWhenIdle();
                    return;
                }
            }
            if (!isBinary && pendingControlOps >= MAX_PENDING_OPERATIONS) {
                fail('Too many pending voice messages.');
                releaseSlotWhenIdle();
                return;
            }
            pendingOperations++;
            if (!isBinary)
                pendingControlOps++;
            chain = chain
                .then(async () => {
                try {
                    await handleMessage(buf, isBinary);
                }
                finally {
                    if (queuedSize > 0) {
                        queuedBytes = Math.max(0, queuedBytes - queuedSize);
                    }
                    pendingOperations--;
                    if (!isBinary)
                        pendingControlOps--;
                    releaseSlotWhenIdle();
                }
            })
                .catch((error) => {
                fail(errMessage(error));
                releaseSlotWhenIdle();
            });
        });
        ws.on('close', (code, reason) => {
            log?.info(`[voice-ws ${connId}] close`, {
                code,
                reason: reason?.toString(),
                state,
            });
            if (state !== 'closed')
                cleanup();
            releaseSlotWhenIdle();
        });
        ws.on('error', (error) => {
            log?.warn(`[voice-ws ${connId}] socket error: ${error.message}`);
            if (state !== 'closed')
                cleanup();
            releaseSlotWhenIdle();
        });
    };
}
//# sourceMappingURL=voice-ws-handler.js.map