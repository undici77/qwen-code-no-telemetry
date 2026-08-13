/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, ServerGeminiStreamEvent, ToolCallRequestInfo, McpToolProgressData, ShellProgressData } from '@qwen-code/qwen-code-core';
import type { CLIAssistantMessage, CLIMessage, ControlMessage, TextBlock, ThinkingBlock, ToolUseBlock } from '../types.js';
import { BaseJsonOutputAdapter, type MessageState, type ResultOptions, type JsonOutputAdapterInterface } from './BaseJsonOutputAdapter.js';
/**
 * Stream JSON output adapter that emits messages immediately
 * as they are completed during the streaming process.
 * Supports both main agent and subagent messages through distinct APIs.
 */
export declare class StreamJsonOutputAdapter extends BaseJsonOutputAdapter implements JsonOutputAdapterInterface {
    private readonly includePartialMessages;
    private mainTurnMessageStartEmitted;
    private lastGoalStateSignature;
    private readonly outputStream;
    constructor(config: Config, includePartialMessages: boolean, outputStream?: NodeJS.WritableStream);
    /**
     * Emits message immediately to the output stream (stream mode).
     */
    protected emitMessageImpl(message: CLIMessage | ControlMessage): void;
    /**
     * Control-plane messages (control_request / control_response) share the
     * same transport as data messages in stream mode.
     */
    protected emitControlMessageImpl(message: ControlMessage): void;
    /**
     * Stream mode emits stream events when includePartialMessages is enabled.
     */
    protected shouldEmitStreamEvents(): boolean;
    startAssistantMessage(): void;
    finalizeAssistantMessage(): CLIAssistantMessage;
    emitResult(options: ResultOptions): void;
    emitMessage(message: CLIMessage | ControlMessage): void;
    send(message: CLIMessage | ControlMessage): void;
    processEvent(event: ServerGeminiStreamEvent): void;
    /**
     * Overrides base class hook to emit stream event when text block is created.
     */
    protected onTextBlockCreated(state: MessageState, index: number, block: TextBlock, parentToolUseId: string | null): void;
    /**
     * Overrides base class hook to emit stream event when text is appended.
     */
    protected onTextAppended(state: MessageState, index: number, fragment: string, parentToolUseId: string | null): void;
    /**
     * Overrides base class hook to emit stream event when thinking block is created.
     */
    protected onThinkingBlockCreated(state: MessageState, index: number, block: ThinkingBlock, parentToolUseId: string | null): void;
    /**
     * Overrides base class hook to emit stream event when thinking is appended.
     */
    protected onThinkingAppended(state: MessageState, index: number, fragment: string, parentToolUseId: string | null): void;
    /**
     * Overrides base class hook to emit stream event when tool_use block is created.
     */
    protected onToolUseBlockCreated(state: MessageState, index: number, block: ToolUseBlock, parentToolUseId: string | null): void;
    /**
     * Overrides base class hook to emit stream event when tool_use input is set.
     */
    protected onToolUseInputSet(state: MessageState, index: number, input: unknown, parentToolUseId: string | null): void;
    /**
     * Overrides base class hook to emit stream event when block is closed.
     */
    protected onBlockClosed(state: MessageState, index: number, parentToolUseId: string | null): void;
    /**
     * Overrides base class hook to emit message_start event when message is started.
     * Only emits once per turn for the main agent (guarded by mainTurnMessageStartEmitted),
     * so block-type transitions inside a single turn do not produce spurious message_start events.
     */
    protected onEnsureMessageStarted(state: MessageState, parentToolUseId: string | null): void;
    /**
     * Emits a tool progress stream event when partial messages are enabled.
     * This overrides the no-op in BaseJsonOutputAdapter.
     */
    emitToolProgress(request: ToolCallRequestInfo, progress: McpToolProgressData | ShellProgressData): void;
    /**
     * Emits stream events when partial messages are enabled.
     * This is a private method specific to StreamJsonOutputAdapter.
     * @param event - Stream event to emit
     * @param parentToolUseId - null for main agent, string for subagent
     */
    private emitStreamEventIfEnabled;
}
