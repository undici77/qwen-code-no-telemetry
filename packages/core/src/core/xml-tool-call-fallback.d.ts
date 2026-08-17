/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part } from '@google/genai';
export interface ExtractedToolCall {
  name: string;
  args: Record<string, unknown>;
}
/**
 * Detects whether text contains XML-style tool call patterns.
 */
export declare function containsXmlToolCalls(text: string): boolean;
/**
 * Extracts XML-style tool calls from plain text content.
 * Invoke blocks inside fenced code blocks (``` or ~~~) are skipped:
 * they document the format rather than emitting a tool call. See #8003.
 * Returns an array of extracted tool calls, or an empty array if none found.
 */
export declare function extractXmlToolCalls(text: string): ExtractedToolCall[];
/**
 * Attempts to recover tool calls from XML-formatted text content.
 * If XML tool calls are found and dominate the content, returns
 * functionCall parts and the remaining text (with recovered XML
 * blocks removed). Parameterless invoke blocks are preserved as
 * plain text since extractXmlToolCalls intentionally skips them.
 */
export declare function tryRecoverXmlToolCalls(text: string): {
  recovered: boolean;
  functionCallParts: Part[];
  remainingText: string;
};
