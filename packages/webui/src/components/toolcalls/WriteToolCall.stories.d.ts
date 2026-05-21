/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { WriteToolCall } from './WriteToolCall.js';
/**
 * WriteToolCall displays file writing operations with line counts.
 */
declare const meta: Meta<typeof WriteToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Success: Story;
export declare const WithError: Story;
export declare const Loading: Story;
