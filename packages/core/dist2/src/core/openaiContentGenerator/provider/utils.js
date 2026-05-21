/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
// Some thinking-mode OpenAI-compatible APIs require `reasoning_content` to be
// replayed on every prior assistant turn, even when the model returned no
// visible reasoning text for that turn.
export function ensureReasoningContentOnAssistantMessage(message) {
    if (message.role !== 'assistant') {
        return message;
    }
    const assistant = message;
    if (typeof assistant.reasoning_content === 'string') {
        return message;
    }
    return {
        ...assistant,
        reasoning_content: '',
    };
}
//# sourceMappingURL=utils.js.map