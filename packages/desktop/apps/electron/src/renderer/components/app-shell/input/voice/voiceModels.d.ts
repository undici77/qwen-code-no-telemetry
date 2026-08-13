/**
 * Selectable voice (ASR) models for dictation. These are DashScope/Qwen-ASR
 * models, not chat models — they aren't in the agent's ACP model list, so the
 * picker offers a fixed set. `batch` transcribes on stop; `realtime` streams
 * live interim text.
 */
export interface VoiceModelOption {
    id: string;
    label: string;
    kind: 'batch' | 'realtime';
    /** Single source of truth for the picker subtitle (settings + composer). */
    description: string;
}
export declare const VOICE_MODELS: VoiceModelOption[];
export declare const DEFAULT_VOICE_MODEL = "qwen3-asr-flash";
