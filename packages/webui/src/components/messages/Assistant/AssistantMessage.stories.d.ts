/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AssistantMessage } from './AssistantMessage.js';
/**
 * AssistantMessage displays AI responses with markdown formatting.
 * Supports different status states for timeline bullet coloring.
 */
declare const meta: Meta<typeof AssistantMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const Success: Story;
export declare const Error: Story;
export declare const Warning: Story;
export declare const Loading: Story;
export declare const WithMarkdown: Story;
export declare const LongContent: Story;
export declare const HiddenStatusIcon: Story;
export declare const TimelineFirst: Story;
export declare const TimelineMiddle: Story;
export declare const TimelineLast: Story;
