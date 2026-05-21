/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from './LayoutComponents.js';
/**
 * CodeBlock displays formatted code or command output.
 */
declare const meta: Meta<typeof CodeBlock>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const ShortCode: Story;
export declare const MultilineCode: Story;
export declare const CommandOutput: Story;
