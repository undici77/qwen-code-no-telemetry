/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThinkToolCall } from './ThinkToolCall.js';
/**
 * ThinkToolCall displays AI reasoning and thought processes.
 * Shows thoughts in compact or card format based on content length.
 */
declare const meta: Meta<typeof ThinkToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const ShortThought: Story;
export declare const LongThought: Story;
export declare const Loading: Story;
export declare const WithError: Story;
