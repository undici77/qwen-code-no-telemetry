/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseJsonOutputAdapter, } from './BaseJsonOutputAdapter.js';
/**
 * JSON output adapter that collects all messages and emits them
 * as a single JSON array at the end of the turn.
 * Supports both main agent and subagent messages through distinct APIs.
 */
export class JsonOutputAdapter extends BaseJsonOutputAdapter {
    messages = [];
    constructor(config) {
        super(config);
    }
    /**
     * Emits message to the messages array (batch mode).
     * Tracks the last assistant message for efficient result text extraction.
     */
    emitMessageImpl(message) {
        this.messages.push(message);
        // Track assistant messages for result generation
        if (typeof message === 'object' &&
            message !== null &&
            'type' in message &&
            message.type === 'assistant') {
            this.updateLastAssistantMessage(message);
        }
    }
    /**
     * JSON mode does not emit stream events.
     */
    shouldEmitStreamEvents() {
        return false;
    }
    finalizeAssistantMessage() {
        return this.finalizeAssistantMessageInternal(this.mainAgentMessageState, null);
    }
    emitResult(options) {
        const resultMessage = this.buildResultMessage(options, this.lastAssistantMessage);
        this.messages.push(resultMessage);
        if (this.config.getOutputFormat() === 'text') {
            if (resultMessage.is_error) {
                process.stderr.write(`${resultMessage.error?.message || ''}\n`);
            }
            else {
                process.stdout.write(`${resultMessage.result}\n`);
            }
        }
        else {
            // Emit the entire messages array as JSON (includes all main agent + subagent messages)
            const json = JSON.stringify(this.messages);
            process.stdout.write(`${json}\n`);
        }
    }
    emitMessage(message) {
        // In JSON mode, messages are collected in the messages array
        // This is called by the base class's finalizeAssistantMessageInternal
        // but can also be called directly for user/tool/system messages
        this.messages.push(message);
    }
}
//# sourceMappingURL=JsonOutputAdapter.js.map