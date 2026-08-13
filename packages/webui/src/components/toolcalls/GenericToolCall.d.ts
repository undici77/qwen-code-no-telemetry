/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generic tool call component - handles all tool call types as fallback
 */
import type { FC } from 'react';
import type { BaseToolCallProps } from './shared/index.js';
/**
 * Generic tool call component that can display any tool call type
 * Used as fallback for unknown tool call kinds
 * Minimal display: show description and outcome
 */
export declare const GenericToolCall: FC<BaseToolCallProps>;
