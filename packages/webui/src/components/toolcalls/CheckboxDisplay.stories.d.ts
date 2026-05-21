/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxDisplay } from './CheckboxDisplay.js';
/**
 * CheckboxDisplay is a read-only checkbox for displaying plan entry status.
 */
declare const meta: Meta<typeof CheckboxDisplay>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Unchecked: Story;
export declare const Checked: Story;
export declare const Indeterminate: Story;
export declare const AllStates: Story;
