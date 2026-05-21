/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolCallCard } from './LayoutComponents.js';
/**
 * ToolCallCard is a card-style container for displaying detailed tool call results.
 * Used when there's more content to show than fits in a compact container.
 */
declare const meta: Meta<typeof ToolCallCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const WithMultipleRows: Story;
export declare const WithError: Story;
export declare const ThinkingCard: Story;
