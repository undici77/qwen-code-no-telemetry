/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../core/authTypes.js';
const AUTH_TYPES = new Set(Object.values(AuthType));
/**
 * Resolve a model selector to the concrete model ID a caller should use.
 *
 * Supported forms:
 * - omitted / inherit -> use parent conversation model
 * - fast -> use the configured fastModel
 * - modelId -> use current authType when available, otherwise the first
 *   configured authType that contains the model
 * - authType:modelId -> use explicit authType and modelId
 */
export function resolveModelId(model, context = {}) {
    return resolveModelIdSelector(parseModelIdSelector(model), context);
}
/**
 * Build a {@link ModelIdResolutionContext} from a {@link Config}, wiring the
 * standard adapter calls (current model, current auth type, configured fast
 * model, configured models per auth type) used by every runtime caller.
 */
export function buildModelIdContext(config) {
    return {
        currentModel: config.getModel?.(),
        currentAuthType: config.getContentGeneratorConfig?.()?.authType,
        fastModel: config.getFastModel?.(),
        getAvailableModels: (authTypes) => config.getAllConfiguredModels?.(authTypes) ?? [],
    };
}
function parseModelIdSelector(model) {
    const trimmed = model?.trim();
    if (!trimmed || trimmed === 'inherit') {
        return { kind: 'inherit' };
    }
    if (trimmed === 'fast') {
        return { kind: 'fast' };
    }
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
        return { kind: 'model', modelId: trimmed };
    }
    const maybeAuthType = trimmed.slice(0, colonIndex).trim();
    const modelId = trimmed.slice(colonIndex + 1).trim();
    // If the prefix isn't a known AuthType, treat the whole string as a bare
    // model ID. Model IDs can legitimately contain colons (e.g. gpt-4o:online).
    if (!AUTH_TYPES.has(maybeAuthType)) {
        return { kind: 'model', modelId: trimmed };
    }
    if (!modelId) {
        throw new Error('Model selector must include a model ID after the authType');
    }
    return {
        kind: 'model',
        authType: maybeAuthType,
        modelId,
    };
}
function resolveAuthTypeForBareModel(modelId, context) {
    if (context.currentAuthType && context.getAvailableModels) {
        const currentModels = context.getAvailableModels([context.currentAuthType]);
        if (currentModels.some((model) => model.id === modelId)) {
            return context.currentAuthType;
        }
    }
    const configuredModel = context.getAvailableModels
        ? context.getAvailableModels().find((model) => model.id === modelId)
        : undefined;
    return configuredModel?.authType ?? context.currentAuthType;
}
function resolveModelIdSelector(selector, context) {
    if (selector.kind === 'model') {
        const authType = selector.authType ??
            resolveAuthTypeForBareModel(selector.modelId, context);
        return {
            ...(authType ? { authType } : {}),
            modelId: selector.modelId,
        };
    }
    if (selector.kind === 'inherit') {
        return context.currentModel
            ? {
                ...(context.currentAuthType
                    ? { authType: context.currentAuthType }
                    : {}),
                modelId: context.currentModel,
            }
            : undefined;
    }
    if (!context.fastModel) {
        return undefined;
    }
    const fastSelector = parseModelIdSelector(context.fastModel);
    if (fastSelector.kind === 'fast') {
        return undefined;
    }
    return resolveModelIdSelector(fastSelector, {
        ...context,
        fastModel: undefined,
    });
}
//# sourceMappingURL=modelId.js.map