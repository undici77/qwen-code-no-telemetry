/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { GeminiEventType } from '@qwen-code/qwen-code-core';
import { BaseJsonOutputAdapter, } from './BaseJsonOutputAdapter.js';
/**
 * Stream JSON output adapter that emits messages immediately
 * as they are completed during the streaming process.
 * Supports both main agent and subagent messages through distinct APIs.
 */
export class StreamJsonOutputAdapter extends BaseJsonOutputAdapter {
    includePartialMessages;
    mainTurnMessageStartEmitted = false;
    outputStream;
    constructor(config, includePartialMessages, outputStream) {
        super(config);
        this.includePartialMessages = includePartialMessages;
        this.outputStream = outputStream ?? process.stdout;
    }
    /**
     * Emits message immediately to the output stream (stream mode).
     */
    emitMessageImpl(message) {
        // Track assistant messages for result generation
        if (typeof message === 'object' &&
            message !== null &&
            'type' in message &&
            message.type === 'assistant') {
            this.updateLastAssistantMessage(message);
        }
        // Emit messages immediately in stream mode
        this.outputStream.write(`${JSON.stringify(message)}\n`);
    }
    /**
     * Control-plane messages (control_request / control_response) share the
     * same transport as data messages in stream mode.
     */
    emitControlMessageImpl(message) {
        this.outputStream.write(`${JSON.stringify(message)}\n`);
    }
    /**
     * Stream mode emits stream events when includePartialMessages is enabled.
     */
    shouldEmitStreamEvents() {
        return this.includePartialMessages;
    }
    startAssistantMessage() {
        this.mainTurnMessageStartEmitted = false;
        super.startAssistantMessage();
    }
    finalizeAssistantMessage() {
        const message = this.finalizeAssistantMessageInternal(this.mainAgentMessageState, null);
        if (this.mainTurnMessageStartEmitted && this.includePartialMessages) {
            const partial = {
                type: 'stream_event',
                uuid: randomUUID(),
                session_id: this.getSessionId(),
                parent_tool_use_id: null,
                event: { type: 'message_stop' },
            };
            this.emitMessageImpl(partial);
        }
        this.mainTurnMessageStartEmitted = false;
        return message;
    }
    emitResult(options) {
        const resultMessage = this.buildResultMessage(options, this.lastAssistantMessage);
        this.emitMessageImpl(resultMessage);
    }
    emitMessage(message) {
        // In stream mode, emit immediately
        this.emitMessageImpl(message);
    }
    send(message) {
        this.emitMessage(message);
    }
    processEvent(event) {
        // Active goal updates are session-level metadata, not message content.
        // They intentionally bypass the base finalized guard so late goal state
        // changes can still reach stream consumers.
        if (event.type === GeminiEventType.ActiveGoal) {
            this.emitStreamEventIfEnabled({
                type: 'active_goal',
                active_goal: event.value,
            }, null);
            return;
        }
        super.processEvent(event);
    }
    /**
     * Overrides base class hook to emit stream event when text block is created.
     */
    onTextBlockCreated(state, index, block, parentToolUseId) {
        this.emitStreamEventIfEnabled({
            type: 'content_block_start',
            index,
            content_block: block,
        }, parentToolUseId);
    }
    /**
     * Overrides base class hook to emit stream event when text is appended.
     */
    onTextAppended(state, index, fragment, parentToolUseId) {
        this.emitStreamEventIfEnabled({
            type: 'content_block_delta',
            index,
            delta: { type: 'text_delta', text: fragment },
        }, parentToolUseId);
    }
    /**
     * Overrides base class hook to emit stream event when thinking block is created.
     */
    onThinkingBlockCreated(state, index, block, parentToolUseId) {
        this.emitStreamEventIfEnabled({
            type: 'content_block_start',
            index,
            content_block: block,
        }, parentToolUseId);
    }
    /**
     * Overrides base class hook to emit stream event when thinking is appended.
     */
    onThinkingAppended(state, index, fragment, parentToolUseId) {
        this.emitStreamEventIfEnabled({
            type: 'content_block_delta',
            index,
            delta: { type: 'thinking_delta', thinking: fragment },
        }, parentToolUseId);
    }
    /**
     * Overrides base class hook to emit stream event when tool_use block is created.
     */
    onToolUseBlockCreated(state, index, block, parentToolUseId) {
        this.emitStreamEventIfEnabled({
            type: 'content_block_start',
            index,
            content_block: block,
        }, parentToolUseId);
    }
    /**
     * Overrides base class hook to emit stream event when tool_use input is set.
     */
    onToolUseInputSet(state, index, input, parentToolUseId) {
        this.emitStreamEventIfEnabled({
            type: 'content_block_delta',
            index,
            delta: {
                type: 'input_json_delta',
                partial_json: JSON.stringify(input),
            },
        }, parentToolUseId);
    }
    /**
     * Overrides base class hook to emit stream event when block is closed.
     */
    onBlockClosed(state, index, parentToolUseId) {
        if (this.includePartialMessages) {
            this.emitStreamEventIfEnabled({
                type: 'content_block_stop',
                index,
            }, parentToolUseId);
        }
    }
    /**
     * Overrides base class hook to emit message_start event when message is started.
     * Only emits once per turn for the main agent (guarded by mainTurnMessageStartEmitted),
     * so block-type transitions inside a single turn do not produce spurious message_start events.
     */
    onEnsureMessageStarted(state, parentToolUseId) {
        if (parentToolUseId === null && !this.mainTurnMessageStartEmitted) {
            this.mainTurnMessageStartEmitted = true;
            this.emitStreamEventIfEnabled({
                type: 'message_start',
                message: {
                    id: state.messageId,
                    role: 'assistant',
                    model: this.config.getModel(),
                    content: [],
                },
            }, null);
        }
    }
    /**
     * Emits a tool progress stream event when partial messages are enabled.
     * This overrides the no-op in BaseJsonOutputAdapter.
     */
    emitToolProgress(request, progress) {
        if (!this.includePartialMessages) {
            return;
        }
        const partial = {
            type: 'stream_event',
            uuid: randomUUID(),
            session_id: this.getSessionId(),
            parent_tool_use_id: null,
            event: {
                type: 'tool_progress',
                tool_use_id: request.callId,
                content: progress,
            },
        };
        this.emitMessageImpl(partial);
    }
    /**
     * Emits stream events when partial messages are enabled.
     * This is a private method specific to StreamJsonOutputAdapter.
     * @param event - Stream event to emit
     * @param parentToolUseId - null for main agent, string for subagent
     */
    emitStreamEventIfEnabled(event, parentToolUseId) {
        if (!this.includePartialMessages) {
            return;
        }
        const partial = {
            type: 'stream_event',
            uuid: randomUUID(),
            session_id: this.getSessionId(),
            parent_tool_use_id: parentToolUseId,
            event,
        };
        this.emitMessageImpl(partial);
    }
}
//# sourceMappingURL=StreamJsonOutputAdapter.js.map