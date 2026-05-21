/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpdatedPlanToolCall } from './UpdatedPlanToolCall.js';
/**
 * UpdatedPlanToolCall displays plan/todo list updates with checkboxes.
 */
declare const meta: Meta<typeof UpdatedPlanToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const MixedStatus: Story;
export declare const AllCompleted: Story;
export declare const AllPending: Story;
export declare const WithError: Story;
