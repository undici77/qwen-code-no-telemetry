/**
 * Centralized model registry.
 *
 * Qwen Code reports the live model list through ACP at session startup. The
 * static registry below provides a stable fallback for first-run UI, tests, and
 * utility calls before ACP metadata is available.
 */
export const DEFAULT_MODEL = 'qwen3-coder';
export const MODEL_REGISTRY = [
    {
        id: DEFAULT_MODEL,
        name: 'Qwen3 Coder',
        shortName: 'Qwen',
        description: 'Default Qwen Code model',
        provider: 'qwen',
        contextWindow: 1_000_000,
    },
];
export function getModelsByProvider(provider) {
    return MODEL_REGISTRY.filter((model) => model.provider === provider);
}
export const QWEN_MODELS = getModelsByProvider('qwen');
/** Compatibility export for older imports. */
export const MODELS = QWEN_MODELS;
export function getDefaultSummarizationModel() {
    return DEFAULT_MODEL;
}
export function getModelById(modelId) {
    return MODEL_REGISTRY.find((model) => model.id === modelId);
}
function humanizeModelId(modelId) {
    const id = modelId.includes('/') ? modelId.split('/').pop() || modelId : modelId;
    return id
        .replace(/^qwen[-_]?/i, 'Qwen ')
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => {
        if (/^qwen/i.test(part))
            return part.replace(/^qwen/i, 'Qwen');
        return part.charAt(0).toUpperCase() + part.slice(1);
    })
        .join(' ');
}
export function getModelDisplayName(modelId) {
    return getModelById(modelId)?.name ?? humanizeModelId(modelId);
}
export function getModelShortName(modelId) {
    return getModelById(modelId)?.shortName ?? humanizeModelId(modelId);
}
export function getModelContextWindow(modelId) {
    return getModelById(modelId)?.contextWindow;
}
export function isOpusModel(_modelId) {
    return false;
}
export function isQwenModel(modelId) {
    return modelId.toLowerCase().includes('qwen');
}
export function getModelProvider(modelId) {
    return getModelById(modelId)?.provider ?? (isQwenModel(modelId) ? 'qwen' : undefined);
}
//# sourceMappingURL=models.js.map