/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { DefaultOpenAICompatibleProvider } from './default.js';
const MISTRAL_API_HOST = 'api.mistral.ai';
const MISTRAL_MODEL_MARKERS = [
    'mistral',
    'mixtral',
    'codestral',
    'ministral',
    'pixtral',
    'magistral',
    'devstral',
];
function isMistralHostname(config) {
    const baseUrl = config.baseUrl ?? '';
    if (!baseUrl)
        return false;
    try {
        const hostname = new URL(baseUrl).hostname.toLowerCase();
        return (hostname === MISTRAL_API_HOST || hostname.endsWith(`.${MISTRAL_API_HOST}`));
    }
    catch {
        return false;
    }
}
export function isMistralProvider(config) {
    if (isMistralHostname(config))
        return true;
    const model = config.model?.toLowerCase() ?? '';
    return MISTRAL_MODEL_MARKERS.some((marker) => model.includes(marker));
}
/**
 * Mistral's OpenAI-compatible endpoint rejects non-standard
 * `messages[].reasoning_content` fields. Keep shared conversation history
 * intact and remove the field only at the outbound request boundary.
 */
export class MistralOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    static isMistralProvider = isMistralProvider;
    buildRequest(request, userPromptId) {
        const baseRequest = super.buildRequest(request, userPromptId);
        return {
            ...baseRequest,
            messages: baseRequest.messages.map(stripReasoningContent),
        };
    }
}
function stripReasoningContent(message) {
    if (!('reasoning_content' in message)) {
        return message;
    }
    const next = { ...message };
    delete next['reasoning_content'];
    return next;
}
//# sourceMappingURL=mistral.js.map