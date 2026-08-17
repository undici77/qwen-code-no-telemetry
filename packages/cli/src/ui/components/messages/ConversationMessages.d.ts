/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type MarkdownSourceCopyIndexOffsets } from '../../utils/MarkdownDisplay.js';
import type { InlineImageData } from '../../types.js';
export declare const THINKING_ICON: string;
export declare const THINKING_ICON_PENDING: string;
export declare const toggleKeyHint = 'ctrl+o';
interface UserMessageProps {
  text: string;
}
interface UserShellMessageProps {
  text: string;
}
interface AssistantMessageProps {
  text: string;
  images?: InlineImageData[];
  omittedImageCount?: number;
  isPending: boolean;
  availableTerminalHeight?: number;
  contentWidth: number;
  sourceCopyIndexOffsets?: MarkdownSourceCopyIndexOffsets;
}
interface AssistantMessageContentProps {
  text: string;
  images?: InlineImageData[];
  omittedImageCount?: number;
  isPending: boolean;
  availableTerminalHeight?: number;
  contentWidth: number;
  sourceCopyIndexOffsets?: MarkdownSourceCopyIndexOffsets;
}
interface ThinkMessageProps {
  text: string;
  isPending: boolean;
  /** When committed (not pending), whether to show the full reasoning. */
  expanded?: boolean;
  availableTerminalHeight?: number;
  contentWidth: number;
  durationMs?: number;
  /**
   * VP mode only: the collapsed line is mouse-clickable, so the hint advertises
   * "click" in addition to the keyboard toggle. Non-VP has no click handler.
   */
  clickable?: boolean;
}
interface ThinkMessageContentProps {
  text: string;
  isPending: boolean;
  expanded?: boolean;
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
