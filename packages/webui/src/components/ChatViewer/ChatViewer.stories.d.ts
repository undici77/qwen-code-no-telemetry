/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatViewer } from './ChatViewer.js';
/**
 * ChatViewer component displays a read-only conversation flow.
 * It accepts JSONL-formatted chat messages and renders them using
 * UserMessage and AssistantMessage components with timeline styling.
 *
 * Features:
 * - Auto-scroll to bottom when new messages arrive
 * - Programmatic scroll control via ref
 * - Light/dark/auto theme support
 * - Empty state with customizable message
 */
declare const meta: Meta<typeof ChatViewer>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const MultiTurn: Story;
export declare const WithCodeBlocks: Story;
export declare const LongConversation: Story;
export declare const Empty: Story;
export declare const CustomEmptyMessage: Story;
export declare const SingleUserMessage: Story;
export declare const SingleAssistantMessage: Story;
export declare const RealConversation: Story;
export declare const WithToolCalls: Story;
export declare const WithShellCommands: Story;
export declare const WithSearchAndRead: Story;
export declare const WithPlanUpdates: Story;
export declare const LightTheme: Story;
export declare const AutoScrollDisabled: Story;
export declare const EmptyWithoutIcon: Story;
export declare const WithRefControl: Story;
export declare const Playground: Story;
