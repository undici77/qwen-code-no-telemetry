/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { DEFAULT_QWEN_MODEL } from '../config/models.js';
import { SchemaValidator } from './schemaValidator.js';
function buildDefaultPromptId(purpose) {
    return purpose ? `side-query:${purpose}` : 'side-query';
}
function resolveDefaultModel(config, override) {
    return (override ??
        config.getFastModel?.() ??
        config.getModel() ??
        DEFAULT_QWEN_MODEL);
}
function applyThinkingDefault(callerConfig) {
    const thinkingOverride = callerConfig?.thinkingConfig;
    return {
        ...(callerConfig ?? {}),
        thinkingConfig: thinkingOverride
            ? { includeThoughts: false, ...thinkingOverride }
            : { includeThoughts: false },
    };
}
function isJsonOptions(options) {
    return (options.schema !== undefined &&
        options.schema !== null);
}
export async function runSideQuery(config, options) {
    const model = resolveDefaultModel(config, options.model);
    const promptId = options.promptId ?? buildDefaultPromptId(options.purpose);
    const requestConfig = applyThinkingDefault(options.config);
    if (isJsonOptions(options)) {
        const response = (await config.getBaseLlmClient().generateJson({
            contents: options.contents,
            schema: options.schema,
            abortSignal: options.abortSignal,
            model,
            systemInstruction: options.systemInstruction,
            promptId,
            config: requestConfig,
            ...(options.maxAttempts !== undefined && {
                maxAttempts: options.maxAttempts,
            }),
        }));
        const schemaError = SchemaValidator.validate(options.schema, response);
        if (schemaError) {
            throw new Error(`Invalid side query response: ${schemaError}`);
        }
        const customError = options.validate?.(response);
        if (customError) {
            throw new Error(customError);
        }
        return response;
    }
    const result = await config.getBaseLlmClient().generateText({
        contents: options.contents,
        model,
        systemInstruction: options.systemInstruction,
        abortSignal: options.abortSignal,
        promptId,
        config: requestConfig,
        ...(options.maxAttempts !== undefined && {
            maxAttempts: options.maxAttempts,
        }),
    });
    const customError = options.validate?.(result.text);
    if (customError) {
        throw new Error(customError);
    }
    return result;
}
//# sourceMappingURL=sideQuery.js.map