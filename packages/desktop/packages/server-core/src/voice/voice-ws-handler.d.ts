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
import type { WebSocket } from 'ws';
import type { Logger } from '../runtime/platform';
import { type VoiceConfig } from './transcribe';
import { type VoiceStreamCallbacks, type VoiceStreamConfig, type VoiceStreamSession } from './voice-stream-session';
export interface VoiceHandlerDeps {
    /** Resolve the configured ASR endpoint + credentials at request time. */
    resolveConfig: () => Promise<VoiceConfig> | VoiceConfig;
    openStream?: (config: VoiceConfig, callbacks: VoiceStreamCallbacks) => Promise<VoiceStreamSession>;
    transcribeBatch?: (config: VoiceConfig, pcm: Uint8Array, signal: AbortSignal) => Promise<string>;
    logger?: Logger;
}
export declare function toStreamConfig(config: VoiceConfig): VoiceStreamConfig;
export declare function createVoiceConnectionHandler(deps: VoiceHandlerDeps): (ws: WebSocket) => void;
