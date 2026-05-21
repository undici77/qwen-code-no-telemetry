/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared tool-call routing — maps ToolCallData to the appropriate
 * specialized component. Used by both ChatViewer and VSCode IDE.
 */
import type { FC } from 'react';
import type { BaseToolCallProps, ToolCallData } from './shared/index.js';
/**
 * Returns the appropriate tool-call component for the given tool call data.
 *
 * Checks for structured agent execution output first, then falls back to
 * kind-based routing.
 */
export declare function getToolCallComponent(toolCall: ToolCallData): FC<BaseToolCallProps>;
