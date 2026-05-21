/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Onboarding } from './Onboarding.js';
/**
 * Onboarding is the welcome screen shown to new users.
 * It displays the app logo, welcome message, and a get started button.
 */
declare const meta: Meta<typeof Onboarding>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default onboarding screen
 */
export declare const Default: Story;
/**
 * With custom icon URL
 */
export declare const WithIcon: Story;
/**
 * Custom app name and messages
 */
export declare const CustomBranding: Story;
/**
 * Minimal (no icon)
 */
export declare const NoIcon: Story;
