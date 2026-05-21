/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from './Button';
/**
 * Button component for user interactions.
 * Supports multiple variants and sizes.
 */
declare const meta: Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Primary: Story;
export declare const Secondary: Story;
export declare const Danger: Story;
export declare const Small: Story;
export declare const Large: Story;
export declare const Disabled: Story;
