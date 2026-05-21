/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditToolCall } from './EditToolCall.js';
/**
 * EditToolCall displays file editing operations with diff summaries.
 */
declare const meta: Meta<typeof EditToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const WithDiff: Story;
export declare const WithError: Story;
export declare const WithLocation: Story;
export declare const Failed: Story;
