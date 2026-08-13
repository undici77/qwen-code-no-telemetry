/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FunctionCall, GenerateContentResponse } from '@google/genai';
import type { ToolCallEmitter } from './emitters/tool-call-emitter.js';
/**
 * Tracks preparations exposed to ACP before their complete function calls are
 * parsed. Each model stream gets its own instance so retries, fallbacks, and
 * cancellation cannot leak pending calls into a later attempt.
 */
export declare class ToolCallPreparationTracker {
    private readonly emitter;
    /** Contains only calls whose start frame was emitted successfully. */
    private readonly pending;
    /** Contains calls whose start frame was intentionally suppressed. */
    private readonly suppressed;
    /** Calls parsed completely but not yet handed to tool execution. */
    private readonly resolved;
    constructor(emitter: ToolCallEmitter);
    /**
     * Emits at most one preparing frame per call ID before the full call arrives.
     */
    observe(response: GenerateContentResponse): Promise<void>;
    /** Resolves preparations once their complete function calls arrive. */
    resolve(functionCalls: readonly FunctionCall[]): void;
    /**
     * Terminates unresolved preparations. The map is cleared first so repeated
     * cleanup, including re-entry after an emission failure, cannot emit twice.
     */
    discard(includeResolved?: boolean): Promise<void>;
}
