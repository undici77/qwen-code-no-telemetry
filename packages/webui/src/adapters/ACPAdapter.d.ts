/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapter for ACP protocol messages (used by vscode-ide-companion)
 */
import type { UnifiedMessage, ACPMessage, ACPMessageData, ToolCallData } from './types.js';
/**
 * Adapt ACP messages to unified format
 *
 * @param messages - Array of ACP messages from vscode-ide-companion
 * @returns Array of unified messages with timeline positions calculated
 */
export declare function adaptACPMessages(messages: ACPMessage[]): UnifiedMessage[];
/**
 * Type guard to check if data is a tool call
 */
export declare function isToolCallData(data: unknown): data is ToolCallData;
/**
 * Type guard to check if data is a message
 */
export declare function isMessageData(data: unknown): data is ACPMessageData;
