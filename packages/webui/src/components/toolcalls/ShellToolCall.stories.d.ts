/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShellToolCall } from './ShellToolCall.js';
/**
 * ShellToolCall displays bash/execute command operations.
 * Shows command input (IN) and output (OUT) in a card layout.
 */
declare const meta: Meta<typeof ShellToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Bash command with successful output
 */
export declare const BashWithOutput: Story;
/**
 * Bash command without output (just ran successfully)
 */
export declare const BashNoOutput: Story;
/**
 * Bash command with error
 */
export declare const BashWithError: Story;
/**
 * Bash command in progress (loading state)
 */
export declare const BashLoading: Story;
/**
 * Execute variant with description
 */
export declare const ExecuteWithDescription: Story;
/**
 * Execute variant with long output (truncated)
 */
export declare const ExecuteLongOutput: Story;
/**
 * Command variant (alias for bash)
 */
export declare const CommandVariant: Story;
