/**
 * Wrap raw PCM in a WAV container for the batch transcription endpoint.
 *
 * Browser capture streams raw s16le / 16 kHz / mono PCM frames; the Qwen-ASR
 * batch path (non-streaming) wants a WAV file, so the daemon-side accumulates
 * the frames and prepends a 44-byte header before posting.
 */
/** PCM capture format shared with the renderer (useVoiceCapture). */
export declare const VOICE_SAMPLE_RATE = 16000;
export declare function encodeWav(pcm: Uint8Array): Uint8Array;
