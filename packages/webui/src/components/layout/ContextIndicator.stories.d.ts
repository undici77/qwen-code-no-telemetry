/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextIndicator } from './ContextIndicator.js';
/**
 * ContextIndicator component shows context usage as a circular progress indicator.
 * Displays token usage information with tooltip on hover.
 */
declare const meta: Meta<typeof ContextIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const HalfUsed: Story;
export declare const AlmostFull: Story;
export declare const Full: Story;
export declare const LowUsage: Story;
export declare const Hidden: Story;
