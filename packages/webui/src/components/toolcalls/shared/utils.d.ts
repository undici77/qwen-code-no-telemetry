/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared utility functions for tool call components
 * Platform-agnostic utilities that can be used across different platforms
 */
import type { ToolCallContent, GroupedContent, ToolCallData, ToolCallStatus, ContainerStatus } from './types.js';
/**
 * Extract output from command execution result text
 * Handles both JSON format and structured text format
 *
 * Example structured text:
 * ```
 * Command: lsof -i :5173
 * Directory: (root)
 * Output: COMMAND   PID    USER...
 * Error: (none)
 * Exit Code: 0
 * ```
 */
export declare const extractCommandOutput: (text: string) => string;
/**
 * Format any value to a string for display
 */
export declare const formatValue: (value: unknown) => string;
/**
 * Safely convert title to string, handling object types
 * Returns empty string if no meaningful title
 * Uses try/catch to handle circular references safely
 */
export declare const safeTitle: (title: unknown) => string;
/**
 * Check if a tool call should be displayed
 * Hides internal tool calls
 */
export declare const shouldShowToolCall: (kind: string) => boolean;
/**
 * Group tool call content by type to avoid duplicate labels
 * Error detection logic:
 * - If contentObj.error is set (not null/undefined), treat as error
 * - If contentObj.type === 'error' AND has content (text or error), treat as error
 * This avoids false positives from empty error markers while not missing real errors
 */
export declare const groupContent: (content?: ToolCallContent[]) => GroupedContent;
/**
 * Check if a tool call has actual output to display
 * Returns false for tool calls that completed successfully but have no visible output
 */
export declare const hasToolCallOutput: (toolCall: ToolCallData) => boolean;
/**
 * Map a tool call status to a ToolCallContainer status (bullet color)
 * - pending/in_progress -> loading
 * - completed -> success
 * - failed -> error
 * - default fallback
 */
export declare const mapToolStatusToContainerStatus: (status: ToolCallStatus) => ContainerStatus;
