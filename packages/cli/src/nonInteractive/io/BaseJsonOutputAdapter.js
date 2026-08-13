/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { formatVisionBridgeNoticeDisplay, GeminiEventType, isVisionBridgeNoticeDisplay, ToolErrorType, parseAndFormatApiError, } from '@qwen-code/qwen-code-core';
import { functionResponsePartsToString } from '../../utils/nonInteractiveHelpers.js';
import { projectHeadlessToolResultContent } from './headless-tool-result-text-projection.js';
/**
 * Abstract base class for JSON output adapters.
 * Contains shared logic for message building, state management, and content block handling.
 */
export class BaseJsonOutputAdapter {
    config;
    // Main agent message state
    mainAgentMessageState;
    // Subagent message states keyed by parentToolUseId
    subagentMessageStates = new Map();
    // Last assistant message for result generation
    lastAssistantMessage = null;
    // Track permission denials (execution denied tool calls)
    permissionDenials = [];
    constructor(config) {
        this.config = config;
        this.mainAgentMessageState = this.createMessageState();
    }
    /**
     * Creates a new message state with default values.
     */
    createMessageState() {
        return {
            messageId: null,
            blocks: [],
            openBlocks: new Set(),
            usage: this.createUsage(),
            messageStarted: false,
            finalized: false,
            currentBlockType: null,
        };
    }
    /**
     * Gets or creates message state for a given context.
     *
     * @param parentToolUseId - null for main agent, string for subagent
     * @returns MessageState for the context
     */
    getMessageState(parentToolUseId) {
        if (parentToolUseId === null) {
            return this.mainAgentMessageState;
        }
        let state = this.subagentMessageStates.get(parentToolUseId);
        if (!state) {
            state = this.createMessageState();
            this.subagentMessageStates.set(parentToolUseId, state);
        }
        return state;
    }
    /**
     * Creates a Usage object from metadata.
     *
     * @param metadata - Optional usage metadata from Gemini API
     * @returns Usage object
     */
    createUsage(metadata) {
        const usage = {
            input_tokens: 0,
            output_tokens: 0,
        };
        if (!metadata) {
            return usage;
        }
        if (typeof metadata.promptTokenCount === 'number') {
            usage.input_tokens = metadata.promptTokenCount;
        }
        if (typeof metadata.candidatesTokenCount === 'number') {
            usage.output_tokens = metadata.candidatesTokenCount;
        }
        if (typeof metadata.cachedContentTokenCount === 'number') {
            usage.cache_read_input_tokens = metadata.cachedContentTokenCount;
        }
        if (typeof metadata.totalTokenCount === 'number') {
            usage.total_tokens = metadata.totalTokenCount;
        }
        return usage;
    }
    /**
     * Builds a CLIAssistantMessage from the current message state.
     *
     * @param parentToolUseId - null for main agent, string for subagent
     * @returns CLIAssistantMessage
     */
    buildMessage(parentToolUseId) {
        const state = this.getMessageState(parentToolUseId);
        if (!state.messageId) {
            throw new Error('Message not started');
        }
        // Enforce constraint: assistant message must contain only a single type of ContentBlock
        if (state.blocks.length > 0) {
            const blockTypes = new Set(state.blocks.map((block) => block.type));
            if (blockTypes.size > 1) {
                throw new Error(`Assistant message must contain only one type of ContentBlock, found: ${Array.from(blockTypes).join(', ')}`);
            }
        }
        // Determine stop_reason based on content block types
        // If the message contains only tool_use blocks, set stop_reason to 'tool_use'
        const stopReason = state.blocks.length > 0 &&
            state.blocks.every((block) => block.type === 'tool_use')
            ? 'tool_use'
            : null;
        return {
            type: 'assistant',
            uuid: state.messageId,
            session_id: this.config.getSessionId(),
            parent_tool_use_id: parentToolUseId,
            message: {
                id: state.messageId,
                type: 'message',
                role: 'assistant',
                model: this.config.getModel(),
                content: state.blocks,
                stop_reason: stopReason,
                usage: state.usage,
            },
        };
    }
    /**
     * Finalizes pending blocks (text or thinking) by closing them.
     *
     * @param state - Message state to finalize blocks for
     * @param parentToolUseId - null for main agent, string for subagent (optional, defaults to null)
     */
    finalizePendingBlocks(state, parentToolUseId) {
        const actualParentToolUseId = parentToolUseId ?? null;
        const lastBlock = state.blocks[state.blocks.length - 1];
        if (!lastBlock) {
            return;
        }
        const index = state.blocks.length - 1;
        if (!state.openBlocks.has(index)) {
            return;
        }
        if (lastBlock.type === 'text' || lastBlock.type === 'thinking') {
            this.onBlockClosed(state, index, actualParentToolUseId);
            this.closeBlock(state, index);
        }
    }
    /**
     * Opens a block (adds to openBlocks set).
     *
     * @param state - Message state
     * @param index - Block index
     * @param _block - Content block
     */
    openBlock(state, index, _block) {
        state.openBlocks.add(index);
    }
    /**
     * Closes a block (removes from openBlocks set).
     *
     * @param state - Message state
     * @param index - Block index
     */
    closeBlock(state, index) {
        if (!state.openBlocks.has(index)) {
            return;
        }
        state.openBlocks.delete(index);
    }
    /**
     * Guarantees that a single assistant message aggregates only one
     * content block category (text, thinking, or tool use). When a new
     * block type is requested, the current message is finalized and a fresh
     * assistant message is started to honour the single-type constraint.
     *
     * @param state - Message state
     * @param targetType - Target block type
     * @param parentToolUseId - null for main agent, string for subagent
     */
    ensureBlockTypeConsistency(state, targetType, parentToolUseId) {
        if (state.currentBlockType === targetType) {
            return;
        }
        if (state.currentBlockType === null) {
            state.currentBlockType = targetType;
            return;
        }
        // Finalize current message and start new one
        this.finalizeAssistantMessageInternal(state, parentToolUseId);
        this.startAssistantMessageInternal(state);
        state.currentBlockType = targetType;
    }
    /**
     * Starts a new assistant message, resetting state.
     *
     * @param state - Message state to reset
     */
    startAssistantMessageInternal(state) {
        state.messageId = randomUUID();
        state.blocks = [];
        state.openBlocks = new Set();
        state.usage = this.createUsage();
        state.messageStarted = false;
        state.finalized = false;
        state.currentBlockType = null;
    }
    /**
     * Finalizes an assistant message.
     *
     * @param state - Message state to finalize
     * @param parentToolUseId - null for main agent, string for subagent
     * @returns CLIAssistantMessage
     */
    finalizeAssistantMessageInternal(state, parentToolUseId) {
        if (state.finalized) {
            return this.buildMessage(parentToolUseId);
        }
        state.finalized = true;
        this.finalizePendingBlocks(state, parentToolUseId);
        const orderedOpenBlocks = Array.from(state.openBlocks).sort((a, b) => a - b);
        for (const index of orderedOpenBlocks) {
            this.onBlockClosed(state, index, parentToolUseId);
            this.closeBlock(state, index);
        }
        const message = this.buildMessage(parentToolUseId);
        if (state.messageStarted) {
            this.emitMessageImpl(message);
        }
        return message;
    }
    /**
     * Emits a control-plane message (control_request / control_response).
     * Only meaningful in streaming adapters; batch adapters inherit this
     * no-op since control messages are not collected into the final array.
     */
    emitControlMessageImpl(_message) {
        // Default: no-op for non-streaming / batch adapters.
    }
    /**
     * Hook method called when a text block is created.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param block - Text block that was created
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onTextBlockCreated(_state, _index, _block, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Hook method called when text content is appended.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param fragment - Text fragment that was appended
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onTextAppended(_state, _index, _fragment, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Hook method called when a thinking block is created.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param block - Thinking block that was created
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onThinkingBlockCreated(_state, _index, _block, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Hook method called when thinking content is appended.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param fragment - Thinking fragment that was appended
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onThinkingAppended(_state, _index, _fragment, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Hook method called when a tool_use block is created.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param block - Tool use block that was created
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onToolUseBlockCreated(_state, _index, _block, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Hook method called when tool_use input is set.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param input - Tool use input that was set
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onToolUseInputSet(_state, _index, _input, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Hook method called when a block is closed.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onBlockClosed(_state, _index, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Hook method called to ensure message is started.
     * Subclasses can override this to emit message_start events.
     *
     * @param state - Message state
     * @param parentToolUseId - null for main agent, string for subagent
     */
    onEnsureMessageStarted(_state, _parentToolUseId) {
        // Default implementation does nothing
    }
    /**
     * Gets the session ID from config.
     *
     * @returns Session ID
     */
    getSessionId() {
        return this.config.getSessionId();
    }
    /**
     * Gets the model name from config.
     *
     * @returns Model name
     */
    getModel() {
        return this.config.getModel();
    }
    // ========== Main Agent APIs ==========
    /**
     * Starts a new assistant message for the main agent.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     */
    startAssistantMessage() {
        this.startAssistantMessageInternal(this.mainAgentMessageState);
    }
    /**
     * Processes a stream event from the Gemini API.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param event - Stream event from Gemini API
     */
    processEvent(event) {
        const state = this.mainAgentMessageState;
        if (state.finalized) {
            return;
        }
        switch (event.type) {
            case GeminiEventType.Content:
                this.appendText(state, event.value, null);
                break;
            case GeminiEventType.Citation:
                if (typeof event.value === 'string') {
                    this.appendText(state, `\n${event.value}`, null);
                }
                break;
            case GeminiEventType.Thought:
                this.appendThinking(state, event.value.subject, event.value.description, null);
                break;
            case GeminiEventType.ToolCallRequest:
                this.appendToolUse(state, event.value, null);
                break;
            case GeminiEventType.Finished:
                if (event.value?.usageMetadata) {
                    state.usage = this.createUsage(event.value.usageMetadata);
                }
                this.finalizePendingBlocks(state, null);
                break;
            case GeminiEventType.Error: {
                // Format the error message using parseAndFormatApiError for consistency
                // with interactive mode error display
                const errorText = parseAndFormatApiError(event.value.error, this.config.getContentGeneratorConfig()?.authType);
                this.appendText(state, errorText, null);
                break;
            }
            case GeminiEventType.ModelFallback:
                // Surface model fallback transitions so non-interactive consumers
                // (CI pipelines, SDK clients) can observe capacity-driven model
                // switches without parsing assistant content.
                this.emitSystemMessage('model_fallback', {
                    fromModel: event.fromModel,
                    toModel: event.toModel,
                    statusCode: event.statusCode,
                    fallbackIndex: event.fallbackIndex,
                });
                break;
            default:
                break;
        }
    }
    // ========== Subagent APIs ==========
    /**
     * Starts a new assistant message for a subagent.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param parentToolUseId - Parent tool use ID
     */
    startSubagentAssistantMessage(parentToolUseId) {
        const state = this.getMessageState(parentToolUseId);
        this.startAssistantMessageInternal(state);
    }
    /**
     * Finalizes a subagent assistant message.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param parentToolUseId - Parent tool use ID
     * @returns CLIAssistantMessage
     */
    finalizeSubagentAssistantMessage(parentToolUseId) {
        const state = this.getMessageState(parentToolUseId);
        return this.finalizeAssistantMessageInternal(state, parentToolUseId);
    }
    /**
     * Emits a subagent error result message.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param errorMessage - Error message
     * @param numTurns - Number of turns
     * @param parentToolUseId - Parent tool use ID
     */
    emitSubagentErrorResult(errorMessage, numTurns, parentToolUseId) {
        const state = this.getMessageState(parentToolUseId);
        // Finalize any pending assistant message
        if (state.messageStarted && !state.finalized) {
            this.finalizeSubagentAssistantMessage(parentToolUseId);
        }
        const errorResult = this.buildSubagentErrorResult(errorMessage, numTurns);
        this.emitMessageImpl(errorResult);
    }
    /**
     * Processes a subagent tool call.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     * Uses template method pattern with hooks for stream events.
     *
     * @param toolCall - Tool call information
     * @param parentToolUseId - Parent tool use ID
     */
    processSubagentToolCall(toolCall, parentToolUseId) {
        const state = this.getMessageState(parentToolUseId);
        // Finalize any pending text message before starting tool_use
        const hasText = state.blocks.some((b) => b.type === 'text') ||
            (state.currentBlockType === 'text' && state.blocks.length > 0);
        if (hasText) {
            this.finalizeSubagentAssistantMessage(parentToolUseId);
            this.startSubagentAssistantMessage(parentToolUseId);
        }
        // Ensure message is started before appending tool_use
        if (!state.messageId || !state.messageStarted) {
            this.startAssistantMessageInternal(state);
        }
        this.ensureBlockTypeConsistency(state, 'tool_use', parentToolUseId);
        this.ensureMessageStarted(state, parentToolUseId);
        this.finalizePendingBlocks(state, parentToolUseId);
        const { index } = this.createSubagentToolUseBlock(state, toolCall, parentToolUseId);
        // Process tool use block creation and closure
        // Subclasses can override hook methods to emit stream events
        this.processSubagentToolUseBlock(state, index, toolCall, parentToolUseId);
        // Finalize tool_use message immediately
        this.finalizeSubagentAssistantMessage(parentToolUseId);
        this.startSubagentAssistantMessage(parentToolUseId);
    }
    /**
     * Processes a tool use block for subagent.
     * This method is called by processSubagentToolCall to handle tool use block creation,
     * input setting, and closure. Subclasses can override this to customize behavior.
     *
     * @param state - Message state
     * @param index - Block index
     * @param toolCall - Tool call information
     * @param parentToolUseId - Parent tool use ID
     */
    processSubagentToolUseBlock(state, index, toolCall, parentToolUseId) {
        // Emit tool_use block creation event (with empty input)
        const startBlock = {
            type: 'tool_use',
            id: toolCall.callId,
            name: toolCall.name,
            input: {},
        };
        this.onToolUseBlockCreated(state, index, startBlock, parentToolUseId);
        this.onToolUseInputSet(state, index, toolCall.args ?? {}, parentToolUseId);
        this.onBlockClosed(state, index, parentToolUseId);
        this.closeBlock(state, index);
    }
    /**
     * Updates the last assistant message.
     * Subclasses can override this to customize tracking behavior.
     *
     * @param message - Assistant message to track
     */
    updateLastAssistantMessage(message) {
        this.lastAssistantMessage = message;
    }
    // ========== Shared Content Block Methods ==========
    /**
     * Appends text content to the current message.
     * Uses template method pattern with hooks for stream events.
     *
     * @param state - Message state
     * @param fragment - Text fragment to append
     * @param parentToolUseId - null for main agent, string for subagent
     */
    appendText(state, fragment, parentToolUseId) {
        if (fragment.length === 0) {
            return;
        }
        this.ensureBlockTypeConsistency(state, 'text', parentToolUseId);
        this.ensureMessageStarted(state, parentToolUseId);
        let current = state.blocks[state.blocks.length - 1];
        const isNewBlock = !current || current.type !== 'text';
        if (isNewBlock) {
            current = { type: 'text', text: '' };
            const index = state.blocks.length;
            state.blocks.push(current);
            this.openBlock(state, index, current);
            this.onTextBlockCreated(state, index, current, parentToolUseId);
        }
        // current is guaranteed to be defined here (either existing or newly created)
        current.text += fragment;
        const index = state.blocks.length - 1;
        this.onTextAppended(state, index, fragment, parentToolUseId);
    }
    /**
     * Appends thinking content to the current message.
     * Uses template method pattern with hooks for stream events.
     *
     * @param state - Message state
     * @param subject - Thinking subject
     * @param description - Thinking description
     * @param parentToolUseId - null for main agent, string for subagent
     */
    appendThinking(state, subject, description, parentToolUseId) {
        const actualParentToolUseId = parentToolUseId ?? null;
        // Build fragment without trimming to preserve whitespace in streaming content
        // Only filter out null/undefined/empty values
        const parts = [];
        if (subject && subject.length > 0) {
            parts.push(subject);
        }
        if (description && description.length > 0) {
            parts.push(description);
        }
        const fragment = parts.join(': ');
        if (!fragment) {
            return;
        }
        this.ensureBlockTypeConsistency(state, 'thinking', actualParentToolUseId);
        this.ensureMessageStarted(state, actualParentToolUseId);
        let current = state.blocks[state.blocks.length - 1];
        const isNewBlock = !current || current.type !== 'thinking';
        if (isNewBlock) {
            current = {
                type: 'thinking',
                thinking: '',
                signature: subject,
            };
            const index = state.blocks.length;
            state.blocks.push(current);
            this.openBlock(state, index, current);
            this.onThinkingBlockCreated(state, index, current, actualParentToolUseId);
        }
        // current is guaranteed to be defined here (either existing or newly created)
        current.thinking = `${current.thinking ?? ''}${fragment}`;
        const index = state.blocks.length - 1;
        this.onThinkingAppended(state, index, fragment, actualParentToolUseId);
    }
    /**
     * Appends a tool_use block to the current message.
     * Uses template method pattern with hooks for stream events.
     *
     * @param state - Message state
     * @param request - Tool call request info
     * @param parentToolUseId - null for main agent, string for subagent
     */
    appendToolUse(state, request, parentToolUseId) {
        this.ensureBlockTypeConsistency(state, 'tool_use', parentToolUseId);
        this.ensureMessageStarted(state, parentToolUseId);
        this.finalizePendingBlocks(state, parentToolUseId);
        const index = state.blocks.length;
        const block = {
            type: 'tool_use',
            id: request.callId,
            name: request.name,
            input: request.args,
        };
        state.blocks.push(block);
        this.openBlock(state, index, block);
        // Emit tool_use block creation event (with empty input)
        const startBlock = {
            type: 'tool_use',
            id: request.callId,
            name: request.name,
            input: {},
        };
        this.onToolUseBlockCreated(state, index, startBlock, parentToolUseId);
        this.onToolUseInputSet(state, index, request.args ?? {}, parentToolUseId);
        this.onBlockClosed(state, index, parentToolUseId);
        this.closeBlock(state, index);
    }
    /**
     * Ensures that a message has been started.
     * Calls hook method for subclasses to emit message_start events.
     *
     * @param state - Message state
     * @param parentToolUseId - null for main agent, string for subagent
     */
    ensureMessageStarted(state, parentToolUseId) {
        if (state.messageStarted) {
            return;
        }
        state.messageStarted = true;
        this.onEnsureMessageStarted(state, parentToolUseId);
    }
    /**
     * Creates and adds a tool_use block to the state.
     * This is a shared helper method used by processSubagentToolCall implementations.
     *
     * @param state - Message state
     * @param toolCall - Tool call information
     * @param parentToolUseId - Parent tool use ID
     * @returns The created block and its index
     */
    createSubagentToolUseBlock(state, toolCall, _parentToolUseId) {
        const index = state.blocks.length;
        const block = {
            type: 'tool_use',
            id: toolCall.callId,
            name: toolCall.name,
            input: toolCall.args || {},
        };
        state.blocks.push(block);
        this.openBlock(state, index, block);
        return { block, index };
    }
    /**
     * Emits a user message.
     * @param parts - Array of Part objects
     * @param parentToolUseId - Optional parent tool use ID for subagent messages
     */
    emitUserMessage(parts, parentToolUseId) {
        const content = partsToContentBlock(parts);
        const message = {
            type: 'user',
            uuid: randomUUID(),
            session_id: this.getSessionId(),
            parent_tool_use_id: parentToolUseId ?? null,
            message: {
                role: 'user',
                content,
            },
        };
        this.emitMessageImpl(message);
    }
    /**
     * Checks if responseParts contain any functionResponse with an error.
     * This handles cancelled responses and other error cases where the error
     * is embedded in responseParts rather than the top-level error field.
     * @param responseParts - Array of Part objects
     * @returns Error message if found, undefined otherwise
     */
    checkResponsePartsForError(responseParts) {
        // Use the shared helper function defined at file level
        return checkResponsePartsForError(responseParts);
    }
    /**
     * Emits a tool result message.
     * Collects execution denied tool calls for inclusion in result messages.
     * Handles both explicit errors (response.error) and errors embedded in
     * responseParts (e.g., cancelled responses).
     * @param request - Tool call request info
     * @param response - Tool call response info
     * @param parentToolUseId - Parent tool use ID (null for main agent)
     */
    emitToolResult(request, response, parentToolUseId = null) {
        // Check for errors in responseParts (e.g., cancelled responses)
        const responsePartsError = this.checkResponsePartsForError(response.responseParts);
        // Determine if this is an error response
        const hasError = Boolean(response.error) || Boolean(responsePartsError);
        // Track permission denials (execution denied errors)
        if (response.error &&
            response.errorType === ToolErrorType.EXECUTION_DENIED) {
            const denial = {
                tool_name: request.name,
                tool_use_id: request.callId,
                tool_input: request.args,
            };
            this.permissionDenials.push(denial);
        }
        const block = {
            type: 'tool_result',
            tool_use_id: request.callId,
            is_error: hasError,
        };
        const content = toolResultContent(response);
        if (content !== undefined) {
            block.content = projectHeadlessToolResultContent(content);
        }
        const message = {
            type: 'user',
            uuid: randomUUID(),
            session_id: this.getSessionId(),
            parent_tool_use_id: parentToolUseId,
            message: {
                role: 'user',
                content: [block],
            },
        };
        this.emitMessageImpl(message);
    }
    /**
     * Emits a system message.
     * @param subtype - System message subtype
     * @param data - Optional data payload
     */
    emitSystemMessage(subtype, data) {
        const systemMessage = {
            type: 'system',
            subtype,
            uuid: randomUUID(),
            session_id: this.getSessionId(),
            parent_tool_use_id: null,
            data,
        };
        this.emitMessageImpl(systemMessage);
    }
    /**
     * Emits a `can_use_tool` permission control_request so an external consumer
     * can approve or deny the tool call. Pairs with {@link emitControlResponse}.
     */
    emitPermissionRequest(requestId, toolName, toolUseId, input, blockedPath = null, permissionSuggestions = null) {
        const message = {
            type: 'control_request',
            request_id: requestId,
            request: {
                subtype: 'can_use_tool',
                tool_name: toolName,
                tool_use_id: toolUseId,
                input,
                permission_suggestions: permissionSuggestions,
                blocked_path: blockedPath,
            },
        };
        this.emitControlMessageImpl(message);
    }
    /**
     * Emits a control_response carrying a permission approval result.
     * Used both to mirror TUI-native resolutions back to external consumers
     * and to acknowledge externally-supplied confirmation_responses.
     */
    emitControlResponse(requestId, allowed) {
        const message = {
            type: 'control_response',
            response: {
                subtype: 'success',
                request_id: requestId,
                response: { allowed },
            },
        };
        this.emitControlMessageImpl(message);
    }
    /**
     * Emits a control_response with subtype `error`. Used to reject an
     * external confirmation_response that cannot be honored (unknown
     * request_id, tool call already resolved, etc.) so the consumer can
     * surface or retry, instead of waiting forever for an implicit ack.
     */
    emitControlError(requestId, errorMessage) {
        const message = {
            type: 'control_response',
            response: {
                subtype: 'error',
                request_id: requestId,
                error: errorMessage,
            },
        };
        this.emitControlMessageImpl(message);
    }
    /**
     * Emits a tool progress stream event.
     * Default implementation is a no-op. StreamJsonOutputAdapter overrides this
     * to emit stream events when includePartialMessages is enabled.
     *
     * @param _request - Tool call request info
     * @param _progress - Structured MCP progress data or shell liveness heartbeat
     */
    emitToolProgress(_request, _progress) {
        // No-op in base class. Only StreamJsonOutputAdapter emits tool progress
        // as stream events when includePartialMessages is enabled.
    }
    /**
     * Builds a result message from options.
     * Helper method used by both emitResult implementations.
     * Includes permission denials collected from execution denied tool calls.
     * @param options - Result options
     * @param lastAssistantMessage - Last assistant message for text extraction
     * @returns CLIResultMessage
     */
    buildResultMessage(options, lastAssistantMessage) {
        const usage = options.usage ?? createExtendedUsage();
        const resultText = options.summary ??
            (lastAssistantMessage
                ? extractTextFromBlocks(lastAssistantMessage.message.content)
                : '');
        const baseUuid = randomUUID();
        const baseSessionId = this.getSessionId();
        if (options.isError) {
            const errorMessage = options.errorMessage ?? 'Unknown error';
            return {
                type: 'result',
                subtype: options.subtype ??
                    'error_during_execution',
                uuid: baseUuid,
                session_id: baseSessionId,
                is_error: true,
                duration_ms: options.durationMs,
                duration_api_ms: options.apiDurationMs,
                num_turns: options.numTurns,
                usage,
                permission_denials: [...this.permissionDenials],
                error: { message: errorMessage },
            };
        }
        else {
            // Track presence by property existence — `runNonInteractive` may
            // legitimately pass `structuredResult: undefined` (e.g. the model
            // called structured_output with no args under an empty schema).
            // A `!== undefined` sentinel would silently fall back to the
            // free-text `resultText` path and drop the `structured_result`
            // field, breaking the structured-output contract.
            //
            // Normalize an `undefined` submission to `null` so both
            // `JSON.stringify` (for `result`) and the top-level
            // `structured_result` field render as a JSON-safe `null` instead
            // of being silently omitted.
            const hasStructured = 'structuredResult' in options;
            const normalizedStructured = hasStructured
                ? (options.structuredResult ?? null)
                : undefined;
            const finalResult = hasStructured
                ? JSON.stringify(normalizedStructured)
                : resultText;
            const success = {
                type: 'result',
                subtype: options.subtype ?? 'success',
                uuid: baseUuid,
                session_id: baseSessionId,
                is_error: false,
                duration_ms: options.durationMs,
                duration_api_ms: options.apiDurationMs,
                num_turns: options.numTurns,
                result: finalResult,
                usage,
                permission_denials: [...this.permissionDenials],
            };
            if (options.stats) {
                success.stats = options.stats;
            }
            if (hasStructured) {
                success.structured_result = normalizedStructured;
            }
            return success;
        }
    }
    /**
     * Builds a subagent error result message.
     * Helper method used by both emitSubagentErrorResult implementations.
     * Note: Subagent permission denials are not included here as they are tracked
     * separately and would be included in the main agent's result message.
     * @param errorMessage - Error message
     * @param numTurns - Number of turns
     * @returns CLIResultMessageError
     */
    buildSubagentErrorResult(errorMessage, numTurns) {
        const usage = {
            input_tokens: 0,
            output_tokens: 0,
        };
        return {
            type: 'result',
            subtype: 'error_during_execution',
            uuid: randomUUID(),
            session_id: this.getSessionId(),
            is_error: true,
            duration_ms: 0,
            duration_api_ms: 0,
            num_turns: numTurns,
            usage,
            permission_denials: [],
            error: { message: errorMessage },
        };
    }
}
/**
 * Converts Part array to ContentBlock array.
 * Handles various Part types including text, functionResponse, and other types.
 * For functionResponse parts, extracts the output content.
 * For other non-text parts, converts them to text representation.
 *
 * @param parts - Array of Part objects
 * @returns Array of ContentBlock objects (primarily TextBlock)
 */
export function partsToContentBlock(parts) {
    const blocks = [];
    let currentTextBlock = null;
    for (const part of parts) {
        let textContent = null;
        // Handle text parts
        if ('text' in part && typeof part.text === 'string') {
            textContent = part.text;
        }
        // Handle functionResponse parts - extract output content
        else if ('functionResponse' in part && part.functionResponse) {
            const output = part.functionResponse.response?.['output'] ??
                part.functionResponse.response?.['content'] ??
                '';
            textContent =
                typeof output === 'string' ? output : JSON.stringify(output);
        }
        // Handle other part types - convert to JSON string
        else {
            textContent = JSON.stringify(part);
        }
        // If we have text content, add it to the current text block or create a new one
        if (textContent !== null && textContent.length > 0) {
            if (currentTextBlock === null) {
                currentTextBlock = {
                    type: 'text',
                    text: textContent,
                };
                blocks.push(currentTextBlock);
            }
            else {
                // Append to existing text block
                currentTextBlock.text += textContent;
            }
        }
    }
    // Return blocks array, or empty array if no content
    return blocks;
}
/**
 * Converts Part array to string representation.
 * This is a legacy function kept for backward compatibility.
 * For new code, prefer using partsToContentBlock.
 *
 * @param parts - Array of Part objects
 * @returns String representation
 */
export function partsToString(parts) {
    return parts
        .map((part) => {
        if ('text' in part && typeof part.text === 'string') {
            return part.text;
        }
        return JSON.stringify(part);
    })
        .join('');
}
/**
 * Checks if responseParts contain any functionResponse with an error.
 * Helper function for extracting error messages from responseParts.
 * @param responseParts - Array of Part objects
 * @returns Error message if found, undefined otherwise
 */
function checkResponsePartsForError(responseParts) {
    if (!responseParts || responseParts.length === 0) {
        return undefined;
    }
    for (const part of responseParts) {
        if ('functionResponse' in part &&
            part.functionResponse?.response &&
            typeof part.functionResponse.response === 'object' &&
            'error' in part.functionResponse.response &&
            part.functionResponse.response['error']) {
            const error = part.functionResponse.response['error'];
            return typeof error === 'string' ? error : String(error);
        }
    }
    return undefined;
}
/**
 * Extracts content from tool response.
 * Uses functionResponsePartsToString to properly handle functionResponse parts,
 * which correctly extracts output content from functionResponse objects rather
 * than simply concatenating text or JSON.stringify.
 * Also handles errors embedded in responseParts (e.g., cancelled responses).
 *
 * @param response - Tool call response
 * @returns String content or undefined
 */
export function toolResultContent(response) {
    if (response.visionBridgeNotice) {
        const content = toolResultContent({
            ...response,
            visionBridgeNotice: undefined,
        });
        return content
            ? `${response.visionBridgeNotice}\n${content}`
            : response.visionBridgeNotice;
    }
    if (isVisionBridgeNoticeDisplay(response.resultDisplay)) {
        const notice = formatVisionBridgeNoticeDisplay(response.resultDisplay);
        if (response.error) {
            return `${notice}\n${response.error.message}`;
        }
        const responsePartsError = checkResponsePartsForError(response.responseParts);
        if (responsePartsError) {
            return `${notice}\n${responsePartsError}`;
        }
        if (response.responseParts && response.responseParts.length > 0) {
            return `${notice}\n${functionResponsePartsToString(response.responseParts)}`;
        }
        return notice;
    }
    // Prefer model-facing detail over the short operational error summary.
    const responsePartsError = checkResponsePartsForError(response.responseParts);
    if (responsePartsError) {
        return responsePartsError;
    }
    if (response.error) {
        return response.error.message;
    }
    if (typeof response.resultDisplay === 'string' &&
        response.resultDisplay.trim().length > 0) {
        return response.resultDisplay;
    }
    if (response.responseParts && response.responseParts.length > 0) {
        // Always use functionResponsePartsToString to properly handle
        // functionResponse parts that contain output content
        return functionResponsePartsToString(response.responseParts);
    }
    return undefined;
}
/**
 * Extracts text from content blocks.
 *
 * @param blocks - Array of content blocks
 * @returns Extracted text
 */
export function extractTextFromBlocks(blocks) {
    return blocks
        .filter((block) => block.type === 'text')
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('');
}
/**
 * Creates an extended usage object with default values.
 *
 * @returns ExtendedUsage object
 */
export function createExtendedUsage() {
    return {
        input_tokens: 0,
        output_tokens: 0,
    };
}
//# sourceMappingURL=BaseJsonOutputAdapter.js.map