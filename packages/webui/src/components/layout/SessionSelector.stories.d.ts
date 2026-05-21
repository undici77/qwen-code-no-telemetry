/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SessionSelector } from './SessionSelector.js';
/**
 * SessionSelector component displays a session list dropdown.
 * Shows sessions grouped by date with search and infinite scroll support.
 */
declare const meta: Meta<typeof SessionSelector>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const WithSearch: Story;
export declare const Empty: Story;
export declare const NoSearchResults: Story;
export declare const Loading: Story;
export declare const Hidden: Story;
export declare const ManySessions: Story;
