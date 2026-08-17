/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import { type DaemonVoiceContext } from './resolve-voice-config.js';
import type {
  VoiceStreamCallbacks,
  VoiceStreamSession,
} from '../../ui/voice/voice-stream-session.js';
import { type VoiceAdmissionResult } from './workspace-voice-coordinator.js';
/** Injection seams for unit tests; production uses the reused CLI pipeline. */
export interface VoiceWsDeps {
  loadContext?: (workspaceCwd: string) => DaemonVoiceContext;
  env?: Readonly<Record<string, string | undefined>>;
  isWorkspaceTrusted?: () => boolean;
  openStream?: (
    ctx: DaemonVoiceContext,
    callbacks: VoiceStreamCallbacks,
    abortSignal?: AbortSignal,
  ) => Promise<VoiceStreamSession>;
  transcribe?: (
    ctx: DaemonVoiceContext,
    pcm: Uint8Array,
    abortSignal?: AbortSignal,
  ) => Promise<string>;
  acquireVoiceLease?: () => VoiceAdmissionResult;
}
/**
 * Build the per-connection handler for the daemon `/voice/stream` WebSocket.
 *
 * Protocol — client → server:
 *   - text  `{"type":"start"}`  open the upstream session (optional; lazily
 *           opened on first audio frame otherwise)
 *   - binary  raw s16le/16 kHz/mono PCM frames
 *   - text  `{"type":"stop"}`   finalize and return the transcript
 *   - text  `{"type":"abort"}`  discard and close
 *
 * server → client:
 *   - `{"type":"ready","streaming":bool,"model":string}`
 *   - `{"type":"interim","text":string}`  (streaming models only)
 *   - `{"type":"final","text":string}`
 *   - `{"type":"error","message":string}`
 *
 * Capture happens in the browser; the daemon reuses the CLI transcription
 * pipeline so provider credentials never leave the server.
 */
export declare function createVoiceWsConnectionHandler(
  boundWorkspace: string,
  deps?: VoiceWsDeps,
): (ws: WebSocket, req: IncomingMessage) => void;
