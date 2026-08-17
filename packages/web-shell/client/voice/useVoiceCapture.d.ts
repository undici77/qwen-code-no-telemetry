/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Captures 16 kHz mono PCM in the browser and streams it to the immutable
 * workspace owner selected when recording starts. Credentials remain in the
 * browser-to-daemon transport; transcription stays server-side. The bearer
 * subprotocol is verified by the daemon's ACP upgrade listener in
 * `serve/acp-http/index.ts`.
 */
export type VoiceCaptureStatus =
  | 'idle'
  | 'connecting'
  | 'recording'
  | 'transcribing'
  | 'error';
export interface VoiceCaptureTarget {
  ownerKey: string;
  streamPath: string;
}
export interface VoiceUnexpectedClose {
  code: number;
  reason: string;
}
export interface UseVoiceCaptureOptions {
  baseUrl: string;
  token?: string;
  target: VoiceCaptureTarget | undefined;
  /** Called with the final transcript (may be empty). */
  onFinal: (text: string) => void;
  onError?: (message: string) => void;
  onUnexpectedClose?: (event: VoiceUnexpectedClose) => void;
}
export interface UseVoiceCaptureReturn {
  status: VoiceCaptureStatus;
  interimText: string;
  /** Recent input level, 0..1, for a live meter. */
  audioLevel: number;
  errorMessage: string | undefined;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
export declare function toVoiceWebSocketUrl(
  baseUrl: string,
  streamPath: string,
): string;
export declare function useVoiceCapture({
  baseUrl,
  token,
  target,
  onFinal,
  onError,
  onUnexpectedClose,
}: UseVoiceCaptureOptions): UseVoiceCaptureReturn;
