/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolCallData as BaseToolCallData } from '../toolcalls/index.js';
import './ChatViewer.css';
/**
 * Message part containing text content (Qwen format)
 */
export interface MessagePart {
    text: string;
}
/**
 * Claude format content item
 */
export interface ClaudeContentItem {
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    name?: string;
    input?: unknown;
}
/**
 * Tool call data for rendering tool call UI
 */
export type ToolCallData = BaseToolCallData;
/**
 * Single chat message from JSONL format
 * Supports both Qwen format and Claude format
 */
export interface ChatMessageData {
    uuid: string;
    parentUuid?: string | null;
    sessionId?: string;
    timestamp: string;
    type: 'user' | 'assistant' | 'system' | 'tool_call';
    message?: {
        role?: string;
        parts?: MessagePart[];
        content?: string | ClaudeContentItem[];
    };
    model?: string;
    toolCall?: ToolCallData;
    cwd?: string;
    gitBranch?: string;
}
/**
 * ChatViewer ref handle for programmatic control
 */
export interface ChatViewerHandle {
    /** Scroll to the bottom of the messages */
    scrollToBottom: (behavior?: ScrollBehavior) => void;
    /** Scroll to the top of the messages */
    scrollToTop: (behavior?: ScrollBehavior) => void;
    /** Get the scroll container element */
    getScrollContainer: () => HTMLDivElement | null;
}
/**
 * ChatViewer component props
 */
export interface ChatViewerProps {
    /** Array of chat messages in JSONL format */
    messages: ChatMessageData[];
    /** Optional additional CSS class name */
    className?: string;
    /** Optional callback when a file path is clicked */
    onFileClick?: (path: string) => void;
    /** Optional empty state message */
    emptyMessage?: string;
    /** Whether to auto-scroll to bottom when new messages arrive (default: true) */
    autoScroll?: boolean;
    /** Theme variant: 'dark' | 'light' | 'auto' (default: 'auto') */
    theme?: 'dark' | 'light' | 'auto';
    /** Show empty state icon (default: true) */
    showEmptyIcon?: boolean;
}
/**
 * ChatViewer - A standalone component for displaying chat conversations
 *
 * Renders a conversation flow from JSONL-formatted data using existing
 * message components (UserMessage, AssistantMessage, ThinkingMessage).
 * This is a pure UI component without VSCode or external dependencies.
 *
 * @example
 * ```tsx
 * const messages = [
 *   { uuid: '1', type: 'user', message: { role: 'user', parts: [{ text: 'Hello!' }] }, ... },
 *   { uuid: '2', type: 'assistant', message: { role: 'model', parts: [{ text: 'Hi there!' }] }, ... },
 * ];
 *
 * <ChatViewer messages={messages} onFileClick={(path) => console.log(path)} />
 * ```
 *
 * @example With ref for programmatic control
 * ```tsx
 * const chatRef = useRef<ChatViewerHandle>(null);
 *
 * // Scroll to bottom programmatically
 * chatRef.current?.scrollToBottom('smooth');
 *
 * <ChatViewer ref={chatRef} messages={messages} />
 * ```
 */
export declare const ChatViewer: import("react").ForwardRefExoticComponent<ChatViewerProps & import("react").RefAttributes<ChatViewerHandle>>;
export default ChatViewer;
