/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { partToString, sanitizeUserPromptExpansionAdditionalContext, } from '@qwen-code/qwen-code-core';
export function appendUserPromptExpansionAdditionalContext(content, additionalContext) {
    if (!additionalContext) {
        return content;
    }
    const suffix = `\n\n${additionalContext}`;
    if (typeof content === 'string') {
        return `${content}${suffix}`;
    }
    if (Array.isArray(content)) {
        return [...content, { text: suffix }];
    }
    return [content, { text: suffix }];
}
export function serializeUserPromptExpansionPrompt(content) {
    // Hook inputs should see the same verbose text form the model receives after
    // slash-command expansion, including non-text parts that would otherwise be
    // hidden by the compact serializer.
    return partToString(content, { verbose: true });
}
export function formatUserPromptExpansionBlockedMessage(reason) {
    const sanitizedReason = sanitizeUserPromptExpansionAdditionalContext(reason);
    return `UserPromptExpansion blocked: ${sanitizedReason}`;
}
//# sourceMappingURL=userPromptExpansionHook.js.map