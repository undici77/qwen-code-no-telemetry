/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapter for JSONL format messages (used by ChatViewer)
 */
import type { UnifiedMessage, JSONLMessage } from './types.js';
/**
 * Adapt JSONL messages to unified format
 *
 * @param messages - Array of JSONL messages
 * @returns Array of unified messages with timeline positions calculated
 */
export declare function adaptJSONLMessages(messages: JSONLMessage[]): UnifiedMessage[];
/**
 * Filter out empty messages (except tool calls)
 */
export declare function filterEmptyMessages(messages: UnifiedMessage[]): UnifiedMessage[];
