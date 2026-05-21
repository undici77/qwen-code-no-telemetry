/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type MarkdownSourceCopyIndexOffsets } from '../../utils/MarkdownDisplay.js';
interface UserMessageProps {
    text: string;
}
interface UserShellMessageProps {
    text: string;
}
interface AssistantMessageProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
    sourceCopyIndexOffsets?: MarkdownSourceCopyIndexOffsets;
}
interface AssistantMessageContentProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
    sourceCopyIndexOffsets?: MarkdownSourceCopyIndexOffsets;
}
interface ThinkMessageProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
}
interface ThinkMessageContentProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
}
export declare const UserMessage: React.FC<UserMessageProps>;
export declare const UserShellMessage: React.FC<UserShellMessageProps>;
export declare const AssistantMessage: React.FC<AssistantMessageProps>;
export declare const AssistantMessageContent: React.FC<AssistantMessageContentProps>;
export declare const ThinkMessage: React.FC<ThinkMessageProps>;
export declare const ThinkMessageContent: React.FC<ThinkMessageContentProps>;
export {};
