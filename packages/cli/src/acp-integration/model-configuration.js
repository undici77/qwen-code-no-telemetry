/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
const MODEL_CONFIGURATIONS = {
    'qwen3.8-max': {
        reasoning: {
            thinking: true,
            efforts: ['low', 'medium', 'xhigh'],
            defaultEffort: 'xhigh',
        },
    },
};
export function getModelConfiguration(modelId) {
    return modelId === 'qwen3.8-max' ? MODEL_CONFIGURATIONS[modelId] : undefined;
}
//# sourceMappingURL=model-configuration.js.map