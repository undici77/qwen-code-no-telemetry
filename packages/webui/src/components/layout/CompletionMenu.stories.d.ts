/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompletionMenu } from './CompletionMenu.js';
/**
 * CompletionMenu component displays an autocomplete dropdown menu.
 * Supports keyboard navigation and mouse interaction.
 */
declare const meta: Meta<typeof CompletionMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const WithTitle: Story;
export declare const WithDescriptions: Story;
export declare const ManyItems: Story;
export declare const SingleItem: Story;
export declare const Empty: Story;
