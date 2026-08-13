/**
 * Renderer-side voice capture for the desktop composer. Captures the microphone
 * via `getUserMedia`, resamples to 16 kHz mono s16le PCM in a ScriptProcessor,
 * and streams the raw frames to the main process's loopback `/voice/stream`
 * WebSocket. Transcription runs in the main process (credentials never reach the
 * renderer) and the final transcript comes back for the user to review.
 *
 * Adapted from the Web Shell hook (packages/web-shell/client/voice/useVoiceCapture.ts);
 * the desktop receives a ready-to-use ws url (token in the query) from the
 * preload, so there is no bearer-subprotocol handshake here.
 */
export type VoiceCaptureStatus = 'idle' | 'connecting' | 'recording' | 'transcribing' | 'error';
export interface UseVoiceCaptureOptions {
    /** Full ws url (with token) from electronAPI.getVoiceStreamUrl(); null disables. */
    wsUrl: string | null;
    /** Called with the final transcript (may be empty). */
    onFinal: (text: string) => void;
    onError?: (message: string) => void;
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
export declare function resampleToSampleRate(input: Float32Array, inputSampleRate: number, outputSampleRate?: number): Float32Array;
export declare function useVoiceCapture(options: UseVoiceCaptureOptions): UseVoiceCaptureReturn;
