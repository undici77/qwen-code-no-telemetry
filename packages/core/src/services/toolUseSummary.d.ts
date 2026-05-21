/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
/**
 * Message emitted into the stream after a tool batch completes with a
 * successful summary. Mirrors Claude Code's `ToolUseSummaryMessage` so SDK
 * clients consuming either stream see a compatible shape.
 */
export interface ToolUseSummaryMessage {
    type: 'tool_use_summary';
    summary: string;
    /** Tool-use call IDs this summary describes. */
    precedingToolUseIds: string[];
    uuid: string;
    timestamp: string;
}
/**
 * Creates a `tool_use_summary` message. The UUID and timestamp are generated
 * here so the message is immediately serializable for recording/SDK emission.
 */
export declare function createToolUseSummaryMessage(summary: string, precedingToolUseIds: string[]): ToolUseSummaryMessage;
export declare const TOOL_USE_SUMMARY_SYSTEM_PROMPT = "Write a short summary label describing what these tool calls accomplished. It appears as a single-line row in a mobile app and truncates around 30 characters, so think git-commit-subject, not sentence.\n\nKeep the verb in past tense and the most distinctive noun. Drop articles, connectors, and long location context first.\n\nExamples:\n- Searched in auth/\n- Fixed NPE in UserService\n- Created signup endpoint\n- Read config.json\n- Ran failing tests";
export interface ToolInfo {
    name: string;
    input: unknown;
    output: unknown;
}
export interface GenerateToolUseSummaryParams {
    config: Config;
    tools: ToolInfo[];
    signal: AbortSignal;
    /**
     * Trailing text from the assistant's last message, used as intent prefix
     * so the summarizer knows what the user was trying to accomplish.
     */
    lastAssistantText?: string;
}
/**
 * Generates a short label for a completed tool batch.
 *
 * @returns The summary string, or null when skipped (no tools, no fast model,
 * aborted, or model failure). Non-critical: callers should not surface errors.
 */
export declare function generateToolUseSummary(params: GenerateToolUseSummaryParams): Promise<string | null>;
/**
 * Truncates a JSON value to a maximum length for the prompt. Mirrors
 * Claude Code's `truncateJson` behavior (including the `...` suffix).
 *
 * For large string inputs, pre-truncates BEFORE serialization to avoid
 * allocating the full JSON representation on the interactive turn path —
 * a 10MB ReadFile result would otherwise be fully stringified just to be
 * sliced down to 300 chars and discarded.
 *
 * For object/array inputs, recursively pre-truncates string fields one
 * level deep before serialization. Tool inputs (`args`) and outputs
 * (functionResponse content) are typically shallow objects with the
 * dominant cost in a small number of long string fields.
 */
export declare function truncateJson(value: unknown, maxLength: number): string;
export declare function cleanSummary(raw: string): string;
