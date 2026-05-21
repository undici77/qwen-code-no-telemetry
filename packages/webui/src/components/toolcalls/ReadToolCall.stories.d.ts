/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReadToolCall } from './ReadToolCall.js';
/**
 * ReadToolCall displays file reading operations.
 * Shows the file name being read with appropriate status indicators.
 */
declare const meta: Meta<typeof ReadToolCall>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Successfully read a file
 */
export declare const Success: Story;
/**
 * Reading file in progress (loading state)
 */
export declare const Loading: Story;
/**
 * Read file with error
 */
export declare const WithError: Story;
/**
 * Failed status without explicit error content
 */
export declare const FailedStatusFallback: Story;
/**
 * Read multiple files
 */
export declare const ReadManyFiles: Story;
/**
 * List directory operation
 */
export declare const ListDirectory: Story;
/**
 * Read with diff content
 */
export declare const WithDiff: Story;
/**
 * Long file path
 */
export declare const LongFilePath: Story;
