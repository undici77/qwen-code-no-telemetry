/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main ToolCall component - uses factory pattern to route to specialized components
 *
 * This file serves as the public API for tool call rendering.
 * It re-exports the router and types from the toolcalls module.
 */
import type { FC } from 'react';
import type { ToolCallData } from '@qwen-code/webui';
export type { ToolCallData, BaseToolCallProps as ToolCallProps, ToolCallContent, } from '@qwen-code/webui';
export declare const ToolCall: FC<{
    toolCall: ToolCallData;
    isFirst?: boolean;
    isLast?: boolean;
}>;
