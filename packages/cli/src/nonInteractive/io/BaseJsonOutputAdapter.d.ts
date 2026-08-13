/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, ToolCallRequestInfo, ToolCallResponseInfo, SessionMetrics, ServerGeminiStreamEvent, AgentResultDisplay, McpToolProgressData, ShellProgressData } from '@qwen-code/qwen-code-core';
import type { Part, GenerateContentResponseUsageMetadata } from '@google/genai';
import type { CLIAssistantMessage, CLIMessage, CLIPermissionDenial, CLIResultMessage, CLIResultMessageError, ContentBlock, ControlMessage, ExtendedUsage, PermissionSuggestion, TextBlock, ThinkingBlock, ToolUseBlock, Usage } from '../types.js';
/**
 * Internal state for managing a single message context (main agent or subagent).
 */
export interface MessageState {
    messageId: string | null;
    blocks: ContentBlock[];
    openBlocks: Set<number>;
    usage: Usage;
    messageStarted: boolean;
    finalized: boolean;
    currentBlockType: ContentBlock['type'] | null;
}
/**
 * Options for building result messages.
 * Used by both streaming and non-streaming JSON output adapters.
 */
export interface ResultOptions {
    readonly isError: boolean;
    readonly errorMessage?: string;
    readonly durationMs: number;
    readonly apiDurationMs: number;
    readonly numTurns: number;
    readonly usage?: ExtendedUsage;
    readonly stats?: SessionMetrics;
    readonly summary?: string;
    readonly subtype?: string;
    /**
     * Payload that the model submitted via the synthetic `structured_output`
     * tool. When set, `result` is forced to the JSON-stringified form and a
     * top-level `structured_result` field is added to the result message.
     */
    readonly structuredResult?: unknown;
}
/**
 * Interface for message emission strategies.
 * Implementations decide whether to emit messages immediately (streaming)
 * or collect them for batch emission (non-streaming).
 * This interface defines the common message emission methods that
 * all JSON output adapters should implement.
 */
export interface MessageEmitter {
    emitMessage(message: CLIMessage): void;
    emitUserMessage(parts: Part[], parentToolUseId?: string | null): void;
    emitToolResult(request: ToolCallRequestInfo, response: ToolCallResponseInfo, parentToolUseId?: string | null): void;
    emitSystemMessage(subtype: string, data?: unknown): void;
    /**
     * Emits a tool progress stream event.
     * Only emits when the adapter supports partial messages (stream mode).
     * In non-streaming mode, this is a no-op.
     *
     * @param request - Tool call request info
     * @param progress - Structured MCP progress data or shell liveness heartbeat
     */
    emitToolProgress(request: ToolCallRequestInfo, progress: McpToolProgressData | ShellProgressData): void;
}
/**
 * JSON-focused output adapter interface.
 * Handles structured JSON output for both streaming and non-streaming modes.
 * This interface defines the complete API that all JSON output adapters must implement.
 */
export interface JsonOutputAdapterInterface extends MessageEmitter {
    startAssistantMessage(): void;
    processEvent(event: ServerGeminiStreamEvent): void;
    finalizeAssistantMessage(): CLIAssistantMessage;
    emitResult(options: ResultOptions): void;
    startSubagentAssistantMessage?(parentToolUseId: string): void;
    processSubagentToolCall?(toolCall: NonNullable<AgentResultDisplay['toolCalls']>[number], parentToolUseId: string): void;
    finalizeSubagentAssistantMessage?(parentToolUseId: string): CLIAssistantMessage;
    emitSubagentErrorResult?(errorMessage: string, numTurns: number, parentToolUseId: string): void;
    getSessionId(): string;
    getModel(): string;
}
/**
 * Abstract base class for JSON output adapters.
 * Contains shared logic for message building, state management, and content block handling.
 */
export declare abstract class BaseJsonOutputAdapter {
    protected readonly config: Config;
    protected mainAgentMessageState: MessageState;
    protected subagentMessageStates: Map<string, MessageState>;
    protected lastAssistantMessage: CLIAssistantMessage | null;
    protected permissionDenials: CLIPermissionDenial[];
    constructor(config: Config);
    /**
     * Creates a new message state with default values.
     */
    protected createMessageState(): MessageState;
    /**
     * Gets or creates message state for a given context.
     *
     * @param parentToolUseId - null for main agent, string for subagent
     * @returns MessageState for the context
     */
    protected getMessageState(parentToolUseId: string | null): MessageState;
    /**
     * Creates a Usage object from metadata.
     *
     * @param metadata - Optional usage metadata from Gemini API
     * @returns Usage object
     */
    protected createUsage(metadata?: GenerateContentResponseUsageMetadata | null): Usage;
    /**
     * Builds a CLIAssistantMessage from the current message state.
     *
     * @param parentToolUseId - null for main agent, string for subagent
     * @returns CLIAssistantMessage
     */
    protected buildMessage(parentToolUseId: string | null): CLIAssistantMessage;
    /**
     * Finalizes pending blocks (text or thinking) by closing them.
     *
     * @param state - Message state to finalize blocks for
     * @param parentToolUseId - null for main agent, string for subagent (optional, defaults to null)
     */
    protected finalizePendingBlocks(state: MessageState, parentToolUseId?: string | null): void;
    /**
     * Opens a block (adds to openBlocks set).
     *
     * @param state - Message state
     * @param index - Block index
     * @param _block - Content block
     */
    protected openBlock(state: MessageState, index: number, _block: ContentBlock): void;
    /**
     * Closes a block (removes from openBlocks set).
     *
     * @param state - Message state
     * @param index - Block index
     */
    protected closeBlock(state: MessageState, index: number): void;
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
    protected ensureBlockTypeConsistency(state: MessageState, targetType: ContentBlock['type'], parentToolUseId: string | null): void;
    /**
     * Starts a new assistant message, resetting state.
     *
     * @param state - Message state to reset
     */
    protected startAssistantMessageInternal(state: MessageState): void;
    /**
     * Finalizes an assistant message.
     *
     * @param state - Message state to finalize
     * @param parentToolUseId - null for main agent, string for subagent
     * @returns CLIAssistantMessage
     */
    protected finalizeAssistantMessageInternal(state: MessageState, parentToolUseId: string | null): CLIAssistantMessage;
    /**
     * Abstract method for emitting messages. Implementations decide whether
     * to emit immediately (streaming) or collect for batch emission.
     * Note: The message object already contains parent_tool_use_id field,
     * so it doesn't need to be passed as a separate parameter.
     *
     * @param message - Message to emit (already contains parent_tool_use_id if applicable)
     */
    protected abstract emitMessageImpl(message: CLIMessage): void;
    /**
     * Emits a control-plane message (control_request / control_response).
     * Only meaningful in streaming adapters; batch adapters inherit this
     * no-op since control messages are not collected into the final array.
     */
    protected emitControlMessageImpl(_message: ControlMessage): void;
    /**
     * Abstract method to determine if stream events should be emitted.
     *
     * @returns true if stream events should be emitted
     */
    protected abstract shouldEmitStreamEvents(): boolean;
    /**
     * Hook method called when a text block is created.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param block - Text block that was created
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onTextBlockCreated(_state: MessageState, _index: number, _block: TextBlock, _parentToolUseId: string | null): void;
    /**
     * Hook method called when text content is appended.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param fragment - Text fragment that was appended
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onTextAppended(_state: MessageState, _index: number, _fragment: string, _parentToolUseId: string | null): void;
    /**
     * Hook method called when a thinking block is created.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param block - Thinking block that was created
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onThinkingBlockCreated(_state: MessageState, _index: number, _block: ThinkingBlock, _parentToolUseId: string | null): void;
    /**
     * Hook method called when thinking content is appended.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param fragment - Thinking fragment that was appended
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onThinkingAppended(_state: MessageState, _index: number, _fragment: string, _parentToolUseId: string | null): void;
    /**
     * Hook method called when a tool_use block is created.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param block - Tool use block that was created
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onToolUseBlockCreated(_state: MessageState, _index: number, _block: ToolUseBlock, _parentToolUseId: string | null): void;
    /**
     * Hook method called when tool_use input is set.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param input - Tool use input that was set
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onToolUseInputSet(_state: MessageState, _index: number, _input: unknown, _parentToolUseId: string | null): void;
    /**
     * Hook method called when a block is closed.
     * Subclasses can override this to emit stream events.
     *
     * @param state - Message state
     * @param index - Block index
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onBlockClosed(_state: MessageState, _index: number, _parentToolUseId: string | null): void;
    /**
     * Hook method called to ensure message is started.
     * Subclasses can override this to emit message_start events.
     *
     * @param state - Message state
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected onEnsureMessageStarted(_state: MessageState, _parentToolUseId: string | null): void;
    /**
     * Gets the session ID from config.
     *
     * @returns Session ID
     */
    getSessionId(): string;
    /**
     * Gets the model name from config.
     *
     * @returns Model name
     */
    getModel(): string;
    /**
     * Starts a new assistant message for the main agent.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     */
    startAssistantMessage(): void;
    /**
     * Processes a stream event from the Gemini API.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param event - Stream event from Gemini API
     */
    processEvent(event: ServerGeminiStreamEvent): void;
    /**
     * Starts a new assistant message for a subagent.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param parentToolUseId - Parent tool use ID
     */
    startSubagentAssistantMessage(parentToolUseId: string): void;
    /**
     * Finalizes a subagent assistant message.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param parentToolUseId - Parent tool use ID
     * @returns CLIAssistantMessage
     */
    finalizeSubagentAssistantMessage(parentToolUseId: string): CLIAssistantMessage;
    /**
     * Emits a subagent error result message.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     *
     * @param errorMessage - Error message
     * @param numTurns - Number of turns
     * @param parentToolUseId - Parent tool use ID
     */
    emitSubagentErrorResult(errorMessage: string, numTurns: number, parentToolUseId: string): void;
    /**
     * Processes a subagent tool call.
     * This is a shared implementation used by both streaming and non-streaming adapters.
     * Uses template method pattern with hooks for stream events.
     *
     * @param toolCall - Tool call information
     * @param parentToolUseId - Parent tool use ID
     */
    processSubagentToolCall(toolCall: NonNullable<AgentResultDisplay['toolCalls']>[number], parentToolUseId: string): void;
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
    protected processSubagentToolUseBlock(state: MessageState, index: number, toolCall: NonNullable<AgentResultDisplay['toolCalls']>[number], parentToolUseId: string): void;
    /**
     * Updates the last assistant message.
     * Subclasses can override this to customize tracking behavior.
     *
     * @param message - Assistant message to track
     */
    protected updateLastAssistantMessage(message: CLIAssistantMessage): void;
    /**
     * Appends text content to the current message.
     * Uses template method pattern with hooks for stream events.
     *
     * @param state - Message state
     * @param fragment - Text fragment to append
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected appendText(state: MessageState, fragment: string, parentToolUseId: string | null): void;
    /**
     * Appends thinking content to the current message.
     * Uses template method pattern with hooks for stream events.
     *
     * @param state - Message state
     * @param subject - Thinking subject
     * @param description - Thinking description
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected appendThinking(state: MessageState, subject?: string, description?: string, parentToolUseId?: string | null): void;
    /**
     * Appends a tool_use block to the current message.
     * Uses template method pattern with hooks for stream events.
     *
     * @param state - Message state
     * @param request - Tool call request info
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected appendToolUse(state: MessageState, request: ToolCallRequestInfo, parentToolUseId: string | null): void;
    /**
     * Ensures that a message has been started.
     * Calls hook method for subclasses to emit message_start events.
     *
     * @param state - Message state
     * @param parentToolUseId - null for main agent, string for subagent
     */
    protected ensureMessageStarted(state: MessageState, parentToolUseId: string | null): void;
    /**
     * Creates and adds a tool_use block to the state.
     * This is a shared helper method used by processSubagentToolCall implementations.
     *
     * @param state - Message state
     * @param toolCall - Tool call information
     * @param parentToolUseId - Parent tool use ID
     * @returns The created block and its index
     */
    protected createSubagentToolUseBlock(state: MessageState, toolCall: NonNullable<AgentResultDisplay['toolCalls']>[number], _parentToolUseId: string): {
        block: ToolUseBlock;
        index: number;
    };
    /**
     * Emits a user message.
     * @param parts - Array of Part objects
     * @param parentToolUseId - Optional parent tool use ID for subagent messages
     */
    emitUserMessage(parts: Part[], parentToolUseId?: string | null): void;
    /**
     * Checks if responseParts contain any functionResponse with an error.
     * This handles cancelled responses and other error cases where the error
     * is embedded in responseParts rather than the top-level error field.
     * @param responseParts - Array of Part objects
     * @returns Error message if found, undefined otherwise
     */
    private checkResponsePartsForError;
    /**
     * Emits a tool result message.
     * Collects execution denied tool calls for inclusion in result messages.
     * Handles both explicit errors (response.error) and errors embedded in
     * responseParts (e.g., cancelled responses).
     * @param request - Tool call request info
     * @param response - Tool call response info
     * @param parentToolUseId - Parent tool use ID (null for main agent)
     */
    emitToolResult(request: ToolCallRequestInfo, response: ToolCallResponseInfo, parentToolUseId?: string | null): void;
    /**
     * Emits a system message.
     * @param subtype - System message subtype
     * @param data - Optional data payload
     */
    emitSystemMessage(subtype: string, data?: unknown): void;
    /**
     * Emits a `can_use_tool` permission control_request so an external consumer
     * can approve or deny the tool call. Pairs with {@link emitControlResponse}.
     */
    emitPermissionRequest(requestId: string, toolName: string, toolUseId: string, input: unknown, blockedPath?: string | null, permissionSuggestions?: PermissionSuggestion[] | null): void;
    /**
     * Emits a control_response carrying a permission approval result.
     * Used both to mirror TUI-native resolutions back to external consumers
     * and to acknowledge externally-supplied confirmation_responses.
     */
    emitControlResponse(requestId: string, allowed: boolean): void;
    /**
     * Emits a control_response with subtype `error`. Used to reject an
     * external confirmation_response that cannot be honored (unknown
     * request_id, tool call already resolved, etc.) so the consumer can
     * surface or retry, instead of waiting forever for an implicit ack.
     */
    emitControlError(requestId: string, errorMessage: string): void;
    /**
     * Emits a tool progress stream event.
     * Default implementation is a no-op. StreamJsonOutputAdapter overrides this
     * to emit stream events when includePartialMessages is enabled.
     *
     * @param _request - Tool call request info
     * @param _progress - Structured MCP progress data or shell liveness heartbeat
     */
    emitToolProgress(_request: ToolCallRequestInfo, _progress: McpToolProgressData | ShellProgressData): void;
    /**
     * Builds a result message from options.
     * Helper method used by both emitResult implementations.
     * Includes permission denials collected from execution denied tool calls.
     * @param options - Result options
     * @param lastAssistantMessage - Last assistant message for text extraction
     * @returns CLIResultMessage
     */
    protected buildResultMessage(options: ResultOptions, lastAssistantMessage: CLIAssistantMessage | null): CLIResultMessage;
    /**
     * Builds a subagent error result message.
     * Helper method used by both emitSubagentErrorResult implementations.
     * Note: Subagent permission denials are not included here as they are tracked
     * separately and would be included in the main agent's result message.
     * @param errorMessage - Error message
     * @param numTurns - Number of turns
     * @returns CLIResultMessageError
     */
    protected buildSubagentErrorResult(errorMessage: string, numTurns: number): CLIResultMessageError;
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
export declare function partsToContentBlock(parts: Part[]): ContentBlock[];
/**
 * Converts Part array to string representation.
 * This is a legacy function kept for backward compatibility.
 * For new code, prefer using partsToContentBlock.
 *
 * @param parts - Array of Part objects
 * @returns String representation
 */
export declare function partsToString(parts: Part[]): string;
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
export declare function toolResultContent(response: ToolCallResponseInfo): string | undefined;
/**
 * Extracts text from content blocks.
 *
 * @param blocks - Array of content blocks
 * @returns Extracted text
 */
export declare function extractTextFromBlocks(blocks: ContentBlock[]): string;
/**
 * Creates an extended usage object with default values.
 *
 * @returns ExtendedUsage object
 */
export declare function createExtendedUsage(): ExtendedUsage;
