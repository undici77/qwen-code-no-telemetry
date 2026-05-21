/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shell tool call component for Execute/Bash/Command
 * Pure UI component - platform interactions via usePlatform hook
 */
import type { FC } from 'react';
import type { BaseToolCallProps } from './shared/index.js';
import './ShellToolCall.css';
/**
 * ShellToolCall - displays bash/execute command tool calls
 * Shows command input and output with IN/OUT cards
 */
export declare const ShellToolCall: FC<BaseToolCallProps>;
