/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tool call component factory - routes to specialized components by kind
 * All UI components are now imported from @qwen-code/webui
 */
import type { FC } from 'react';
import type { BaseToolCallProps } from '@qwen-code/webui';
/**
 * Main tool call component that routes to specialized implementations
 */
export declare const ToolCallRouter: FC<BaseToolCallProps>;
export type { BaseToolCallProps, ToolCallData } from '@qwen-code/webui';
