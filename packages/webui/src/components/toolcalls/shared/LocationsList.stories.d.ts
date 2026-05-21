/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LocationsList } from './LayoutComponents.js';
/**
 * LocationsList displays a list of file locations with clickable links.
 */
declare const meta: Meta<typeof LocationsList>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const SingleFile: Story;
export declare const MultipleFiles: Story;
export declare const WithoutLineNumbers: Story;
