const BATCH_DESCRIPTION = 'Batch — transcribe on stop';
const REALTIME_DESCRIPTION = 'Realtime — live transcript';
export const VOICE_MODELS = [
    {
        id: 'qwen3-asr-flash',
        label: 'Qwen3 ASR Flash',
        kind: 'batch',
        description: BATCH_DESCRIPTION,
    },
    {
        id: 'qwen3-asr-flash-realtime',
        label: 'Qwen3 ASR Flash (realtime)',
        kind: 'realtime',
        description: REALTIME_DESCRIPTION,
    },
    {
        id: 'paraformer-realtime-v2',
        label: 'Paraformer (realtime)',
        kind: 'realtime',
        description: REALTIME_DESCRIPTION,
    },
    {
        id: 'fun-asr-realtime',
        label: 'Fun ASR (realtime)',
        kind: 'realtime',
        description: REALTIME_DESCRIPTION,
    },
];
export const DEFAULT_VOICE_MODEL = 'qwen3-asr-flash';
//# sourceMappingURL=voiceModels.js.map