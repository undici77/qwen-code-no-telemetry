/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Accumulates thought and message chunks for a single model turn.
 * A turn ends when tool calls begin or the model stops generating.
 */
export class TurnBuffer {
    thoughts = [];
    messages = [];
    _hasToolCalls = false;
    appendThought(text) {
        if (text)
            this.thoughts.push(text);
    }
    appendMessage(text) {
        if (text)
            this.messages.push(text);
    }
    markToolCall() {
        this._hasToolCalls = true;
    }
    /**
     * Returns accumulated content and resets the buffer.
     * Returns null if buffer is empty.
     */
    flush() {
        const thoughtText = this.thoughts.join('');
        const messageText = this.messages.join('');
        if (!thoughtText.trim() && !messageText.trim()) {
            this.reset();
            return null;
        }
        const content = {
            thoughts: this.thoughts.filter((t) => t.trim()),
            messages: this.messages.filter((m) => m.trim()),
            hasToolCalls: this._hasToolCalls,
        };
        this.reset();
        return content;
    }
    reset() {
        this.thoughts = [];
        this.messages = [];
        this._hasToolCalls = false;
    }
    get isEmpty() {
        return this.thoughts.length === 0 && this.messages.length === 0;
    }
}
//# sourceMappingURL=TurnBuffer.js.map