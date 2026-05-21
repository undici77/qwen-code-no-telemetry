/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolCallContainer } from './LayoutComponents.js';
/**
 * ToolCallContainer is the base container for displaying tool call results.
 * It shows a status indicator bullet and supports various status states.
 */
declare const meta: Meta<typeof ToolCallContainer>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Success: Story;
export declare const Error: Story;
export declare const Warning: Story;
export declare const Loading: Story;
export declare const Default: Story;
export declare const WithLabelSuffix: Story;
