/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThinkingMessage } from './ThinkingMessage.js';
/**
 * ThinkingMessage component displays the AI's internal thinking process.
 * Supports collapse/expand functionality, collapsed by default, click to expand and view details.
 *
 * Style reference from Claude Code's thinking message design:
 * - Collapsed: gray dot + "Thinking" + down arrow
 * - Expanded: solid dot + "Thinking" + up arrow + thinking content
 * - Aligned with other message items, with status icon and connector line
 */
declare const meta: Meta<typeof ThinkingMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default state - collapsed
 */
export declare const Default: Story;
/**
 * Default expanded state
 */
export declare const Expanded: Story;
/**
 * Thinking in progress - with pulse animation
 */
export declare const Loading: Story;
/**
 * Thinking in progress - expanded
 */
export declare const LoadingExpanded: Story;
/**
 * Long thinking content - multiline text
 */
export declare const LongThought: Story;
/**
 * Thinking content with file path
 */
export declare const WithFilePath: Story;
