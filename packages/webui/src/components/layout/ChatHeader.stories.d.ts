/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatHeader } from './ChatHeader.js';
/**
 * ChatHeader component for displaying chat session information.
 * Shows current session title with navigation controls.
 */
declare const meta: Meta<typeof ChatHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const LongTitle: Story;
export declare const ShortTitle: Story;
export declare const UntitledSession: Story;
