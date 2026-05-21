/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState.js';
/**
 * EmptyState component displays a welcome screen when no conversation is active.
 * Shows logo and welcome message based on authentication state.
 */
declare const meta: Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Authenticated: Story;
export declare const NotAuthenticated: Story;
export declare const Loading: Story;
export declare const WithCustomLogo: Story;
export declare const CustomAppName: Story;
