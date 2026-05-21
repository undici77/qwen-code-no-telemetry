/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GenericToolCall } from './GenericToolCall.js';
/**
 * GenericToolCall is a fallback component for displaying any tool call type.
 * Used when no specialized component exists for a particular tool kind.
 */
declare const meta: Meta<typeof GenericToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const TaskSuccess: Story;
export declare const WebFetch: Story;
export declare const WithError: Story;
export declare const Loading: Story;
export declare const WithLocations: Story;
