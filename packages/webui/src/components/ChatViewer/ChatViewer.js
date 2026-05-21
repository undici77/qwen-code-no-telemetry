import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, } from 'react';
import { UserMessage } from '../messages/UserMessage.js';
import { AssistantMessage } from '../messages/Assistant/AssistantMessage.js';
import { ThinkingMessage } from '../messages/ThinkingMessage.js';
import { shouldShowToolCall, getToolCallComponent, } from '../toolcalls/index.js';
import './ChatViewer.css';
/**
 * Extract text content from message (supports both Qwen and Claude formats)
 */
function extractContent(message) {
    if (!message)
        return '';
    // Qwen format: message.parts[].text
    if (message.parts && Array.isArray(message.parts)) {
        return message.parts.map((part) => part.text || '').join('');
    }
    // Claude format: message.content as string
    if (typeof message.content === 'string') {
        return message.content;
    }
    // Claude format: message.content as array of content items
    if (Array.isArray(message.content)) {
        return message.content
            .filter((item) => item.type === 'text' && item.text)
            .map((item) => item.text || '')
            .join('');
    }
    return '';
}
/**
 * Convert ISO timestamp string to numeric timestamp
 */
function parseTimestamp(isoString) {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? Date.now() : date.getTime();
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
export const ChatViewer = forwardRef(({ messages, className = '', onFileClick, emptyMessage = 'No messages to display', autoScroll = true, theme = 'auto', showEmptyIcon = true, }, ref) => {
    const scrollContainerRef = useRef(null);
    const scrollAnchorRef = useRef(null);
    const prevMessageCountRef = useRef(0);
    // Sort messages by timestamp and filter out system messages and hidden tool calls
    const sortedMessages = useMemo(() => messages
        .filter((msg) => {
        if (msg.type === 'system')
            return false;
        // Filter out hidden tool calls
        if (msg.type === 'tool_call' && msg.toolCall) {
            return shouldShowToolCall(msg.toolCall.kind);
        }
        return true;
    })
        .sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)), [messages]);
    // Expose imperative handle for programmatic control
    useImperativeHandle(ref, () => ({
        scrollToBottom: (behavior = 'smooth') => {
            const container = scrollContainerRef.current;
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior,
                });
            }
        },
        scrollToTop: (behavior = 'smooth') => {
            const container = scrollContainerRef.current;
            if (container) {
                container.scrollTo({
                    top: 0,
                    behavior,
                });
            }
        },
        getScrollContainer: () => scrollContainerRef.current,
    }), []);
    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (!autoScroll)
            return;
        const currentCount = sortedMessages.length;
        const prevCount = prevMessageCountRef.current;
        // Only auto-scroll when new messages are added
        if (currentCount > prevCount && scrollAnchorRef.current) {
            scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessageCountRef.current = currentCount;
    }, [sortedMessages.length, autoScroll]);
    // Determine if previous/next is a user message (breaks the AI sequence)
    const isUserType = (msg) => !msg || msg.type === 'user';
    // Render individual message based on type
    const renderMessage = (msg, index, allMsgs) => {
        const key = msg.uuid || `msg-${index}`;
        const prev = allMsgs[index - 1];
        const next = allMsgs[index + 1];
        // Calculate timeline position for AI responses
        const isFirst = isUserType(prev);
        const isLast = isUserType(next);
        // Handle tool calls
        if (msg.type === 'tool_call' && msg.toolCall) {
            const ToolCallComponent = getToolCallComponent(msg.toolCall);
            if (!ToolCallComponent) {
                return null;
            }
            return (_jsx(ToolCallComponent, { toolCall: msg.toolCall, isFirst: isFirst, isLast: isLast }, key));
        }
        const content = extractContent(msg.message);
        const timestamp = parseTimestamp(msg.timestamp);
        // Skip empty messages (but not tool calls)
        if (!content.trim()) {
            return null;
        }
        switch (msg.type) {
            case 'user':
                return (_jsx(UserMessage, { content: content, timestamp: timestamp, onFileClick: onFileClick }, key));
            case 'assistant':
                // Check if this is a thinking message based on role
                if (msg.message?.role === 'thinking') {
                    return (_jsx(ThinkingMessage, { content: content, timestamp: timestamp, onFileClick: onFileClick }, key));
                }
                return (_jsx(AssistantMessage, { content: content, timestamp: timestamp, onFileClick: onFileClick, isFirst: isFirst, isLast: isLast }, key));
            default:
                return null;
        }
    };
    // Build container class names
    const containerClasses = [
        'chat-viewer-container',
        theme === 'light' ? 'light-theme' : '',
        theme === 'auto' ? 'auto-theme' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsx("div", { className: containerClasses, children: _jsx("div", { ref: scrollContainerRef, className: "chat-viewer-messages chat-messages", children: sortedMessages.length === 0 ? (_jsxs("div", { className: "chat-viewer-empty", children: [showEmptyIcon && (_jsx("div", { className: "chat-viewer-empty-icon", "aria-hidden": "true", children: "\uD83D\uDCAC" })), _jsx("div", { className: "chat-viewer-empty-text", children: emptyMessage })] })) : (_jsxs(_Fragment, { children: [sortedMessages.map((msg, index) => renderMessage(msg, index, sortedMessages)), _jsx("div", { ref: scrollAnchorRef, className: "chat-viewer-scroll-anchor" })] })) }) }));
});
ChatViewer.displayName = 'ChatViewer';
export default ChatViewer;
//# sourceMappingURL=ChatViewer.js.map