/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchToolCall } from './SearchToolCall.js';
/**
 * SearchToolCall displays search operations and results.
 */
declare const meta: Meta<typeof SearchToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const GrepSingleResult: Story;
export declare const GrepMultipleResults: Story;
export declare const GlobSearch: Story;
export declare const WithError: Story;
