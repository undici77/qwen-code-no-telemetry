/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserMessage } from './UserMessage.js';
/**
 * UserMessage component displays messages from the user.
 * Supports file context display with line numbers.
 */
declare const meta: Meta<typeof UserMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const LongMessage: Story;
export declare const WithFileContext: Story;
export declare const WithFileContextAndLines: Story;
export declare const WithSingleLine: Story;
export declare const CodeQuestion: Story;
export declare const SimpleQuery: Story;
