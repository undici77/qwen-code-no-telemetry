/**
 * Composer-facing voice dictation state: resolves the loopback voice ws url,
 * wraps the capture hook, and derives the live waveform + elapsed timer the
 * recording bar renders. The voice (ASR) model is chosen elsewhere and read
 * server-side, so this hook doesn't need it.
 */
import { type VoiceCaptureStatus } from './useVoiceCapture';
/**
 * True once the retry budget is spent with no resolved URL. The effect uses
 * this to stop polling and surface the failure; exported so the retry-exhaustion
 * decision is unit-testable by driving the counter directly (no timers).
 */
export declare function isVoiceInitExhausted(wsUrl: string | null, retryCount: number): boolean;
/** Diagnostic logged once when voice-server URL resolution is abandoned. */
export declare function formatVoiceInitFailureWarning(): string;
export interface UseVoiceDictationReturn {
    available: boolean;
    /** True once the voice-server URL never resolved within the retry budget. */
    initFailed: boolean;
    status: VoiceCaptureStatus;
    isRecording: boolean;
    isConnecting: boolean;
    isTranscribing: boolean;
    isError: boolean;
    /** True while the recording bar should replace the normal toolbar. */
    isActive: boolean;
    /** Rolling waveform levels (0..1), oldest first. */
    levels: number[];
    elapsedMs: number;
    interimText: string;
    errorMessage: string | undefined;
    notice: string | undefined;
    start: () => void;
    stop: () => void;
    abort: () => void;
}
export declare function useVoiceDictation(options: {
    onInsert: (text: string) => void;
}): UseVoiceDictationReturn;
