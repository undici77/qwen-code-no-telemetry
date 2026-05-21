/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyButton } from './copyUtils.js';
/**
 * CopyButton displays a copy icon that copies text to clipboard.
 * Note: Parent element needs 'group' class for hover effect.
 */
declare const meta: Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const WithLongText: Story;
