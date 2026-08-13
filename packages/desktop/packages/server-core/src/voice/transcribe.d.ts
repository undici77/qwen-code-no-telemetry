/**
 * Batch voice transcription via the DashScope / Qwen-ASR OpenAI-compatible
 * protocol: the audio rides as an `input_audio` chat message and the transcript
 * comes back as the assistant message content. (DashScope does NOT serve the
 * Whisper-style `/audio/transcriptions` endpoint — it 404s.)
 *
 * Ported from the CLI voice pipeline (packages/cli/src/ui/voice/voice-transcriber.ts),
 * reduced to the batch path and decoupled from CLI settings: it takes a resolved
 * `{ model, baseUrl, apiKey }` so the desktop can supply credentials from its own
 * LLM-connection store.
 */
export declare const MAX_AUDIO_BYTES: number;
export interface VoiceConfig {
    model: string;
    baseUrl: string;
    apiKey?: string;
    language?: string;
    allowInsecureBaseUrl?: boolean;
}
export interface VoiceAudio {
    data: Uint8Array;
    mimeType: string;
}
export declare function sanitizeResponseDetails(raw: string, apiKey?: string): string;
export declare function transcribeQwenAsrBatch(audio: VoiceAudio, config: VoiceConfig, options?: {
    language?: string;
    signal?: AbortSignal;
}, fetchFn?: typeof fetch): Promise<string>;
