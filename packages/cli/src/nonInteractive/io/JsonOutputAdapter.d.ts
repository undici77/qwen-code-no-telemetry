/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { CLIAssistantMessage, CLIMessage } from '../types.js';
import { BaseJsonOutputAdapter, type JsonOutputAdapterInterface, type ResultOptions } from './BaseJsonOutputAdapter.js';
/**
 * JSON output adapter that collects all messages and emits them
 * as a single JSON array at the end of the turn.
 * Supports both main agent and subagent messages through distinct APIs.
 */
export declare class JsonOutputAdapter extends BaseJsonOutputAdapter implements JsonOutputAdapterInterface {
    private readonly messages;
    constructor(config: Config);
    /**
     * Emits message to the messages array (batch mode).
     * Tracks the last assistant message for efficient result text extraction.
     */
    protected emitMessageImpl(message: CLIMessage): void;
    /**
     * JSON mode does not emit stream events.
     */
    protected shouldEmitStreamEvents(): boolean;
    finalizeAssistantMessage(): CLIAssistantMessage;
    emitResult(options: ResultOptions): void;
    emitMessage(message: CLIMessage): void;
}
