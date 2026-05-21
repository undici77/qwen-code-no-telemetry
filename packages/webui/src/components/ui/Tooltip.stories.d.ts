/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import Tooltip from './Tooltip';
/**
 * Tooltip component for displaying contextual information on hover.
 * Supports four positions: top, right, bottom, left.
 */
declare const meta: Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Top: Story;
export declare const Right: Story;
export declare const Bottom: Story;
export declare const Left: Story;
