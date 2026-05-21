/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { DefaultOpenAICompatibleProvider } from './default.js';
import { ensureReasoningContentOnAssistantMessage } from './utils.js';
export function isMiMoProvider(contentGeneratorConfig) {
    const baseUrl = contentGeneratorConfig.baseUrl ?? '';
    if (baseUrl) {
        try {
            const hostname = new URL(baseUrl).hostname.toLowerCase();
            if (hostname === 'xiaomimimo.com' ||
                hostname.endsWith('.xiaomimimo.com')) {
                return true;
            }
        }
        catch {
            // Non-MiMo URLs fall through to model-name detection.
        }
    }
    const model = contentGeneratorConfig.model ?? '';
    return model.toLowerCase().startsWith('mimo-');
}
export class MiMoOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    constructor(contentGeneratorConfig, cliConfig) {
        super(contentGeneratorConfig, cliConfig);
    }
    static isMiMoProvider = isMiMoProvider;
    buildRequest(request, userPromptId) {
        const baseRequest = super.buildRequest(request, userPromptId);
        if (!baseRequest.messages?.length) {
            return baseRequest;
        }
        return {
            ...baseRequest,
            messages: baseRequest.messages.map(ensureReasoningContentOnAssistantMessage),
        };
    }
    getRequestContextOverrides() {
        // Respect explicit user configuration; default to true for MiMo compatibility.
        return {
            splitToolMedia: this.contentGeneratorConfig.splitToolMedia ?? true,
        };
    }
}
//# sourceMappingURL=mimo.js.map