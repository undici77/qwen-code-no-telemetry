/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
/**
 * Marker thrown when a producer has already formatted the error message and
 * written it to stderr — the downstream `handleError` should propagate the
 * exit code without printing or reformatting again.
 *
 * The non-interactive runner uses this when an upstream API error event
 * arrives mid-stream: it formats with parseAndFormatApiError, writes once,
 * and then throws. Without this marker, handleError would call
 * parseAndFormatApiError a second time on the (now formatted) Error.message,
 * yielding "[API Error: [API Error: ...]]" plus a duplicate stderr line.
 */
export declare class AlreadyReportedError extends Error {
    /** Exit code to surface — defaults to 1 for generic upstream failures. */
    exitCode: number;
    constructor(message: string, exitCode?: number);
}
export declare function getErrorMessage(error: unknown): string;
/** Test-only — reset the exit-once latch between cases. */
export declare function _resetExitLatchForTest(): void;
/**
 * Handles errors consistently for both JSON and text output formats.
 * In JSON mode, outputs formatted JSON error and exits.
 * In text mode, outputs error message and re-throws.
 */
export declare function handleError(error: unknown, config: Config, customErrorCode?: string | number): Promise<never>;
/**
 * Handles tool execution errors specifically.
 * In JSON/STREAM_JSON mode, outputs error message to stderr only and does not exit.
 * The error will be properly formatted in the tool_result block by the adapter,
 * allowing the session to continue so the LLM can decide what to do next.
 * In text mode, outputs error message to stderr only.
 *
 * @param toolName - Name of the tool that failed
 * @param toolError - The error that occurred during tool execution
 * @param config - Configuration object
 * @param errorCode - Optional error code
 * @param resultDisplay - Optional display message for the error
 */
export declare function handleToolError(toolName: string, toolError: Error, config: Config, errorCode?: string | number, resultDisplay?: string): void;
/**
 * Handles cancellation/abort signals consistently.
 */
export declare function handleCancellationError(config: Config): Promise<never>;
/**
 * Handles max session turns exceeded consistently.
 *
 * When `--json-schema` is active the error gets an extra hint pointing at the
 * common reasons a structured-output run never terminated: the model never
 * called `structured_output`, the tool was denied by `permissions.deny` /
 * `--exclude-tools`, or the schema is unsatisfiable. Without this, all three
 * failure modes surface as the same generic "increase maxSessionTurns" line
 * even though the fix is a permissions / schema change, not a turns bump.
 */
export declare function handleMaxTurnsExceededError(config: Config): Promise<never>;
