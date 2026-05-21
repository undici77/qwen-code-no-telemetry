/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapter for JSONL format messages (used by ChatViewer)
 */
/**
 * Extract text content from different message formats
 */
function extractContent(message) {
    if (!message)
        return '';
    // Qwen format: parts array
    if (message.parts?.length) {
        return message.parts.map((p) => p.text).join('');
    }
    // Claude format: string content
    if (typeof message.content === 'string') {
        return message.content;
    }
    // Claude format: content array
    if (Array.isArray(message.content)) {
        return message.content
            .filter((item) => typeof item === 'object' &&
            item !== null &&
            'type' in item &&
            item.type === 'text')
            .map((item) => item.text)
            .join('');
    }
    return '';
}
/**
 * Parse timestamp string to milliseconds
 */
function parseTimestamp(timestamp) {
    const parsed = Date.parse(timestamp);
    return isNaN(parsed) ? Date.now() : parsed;
}
/**
 * Determine the unified message type from JSONL message
 */
function getMessageType(msg) {
    if (msg.type === 'tool_call') {
        return 'tool_call';
    }
    if (msg.type === 'user') {
        return 'user';
    }
    if (msg.message?.role === 'thinking') {
        return 'thinking';
    }
    return 'assistant';
}
/**
 * Check if a message is a user type (breaks AI sequence)
 */
function isUserType(msg) {
    return !msg || msg.type === 'user';
}
/**
 * Adapt JSONL messages to unified format
 *
 * @param messages - Array of JSONL messages
 * @returns Array of unified messages with timeline positions calculated
 */
export function adaptJSONLMessages(messages) {
    // Sort by timestamp
    const sorted = [...messages].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
    return sorted.map((msg, index, arr) => {
        const prev = arr[index - 1];
        const next = arr[index + 1];
        // Calculate timeline position
        const isFirst = isUserType(prev);
        const isLast = isUserType(next);
        const type = getMessageType(msg);
        return {
            id: msg.uuid,
            type,
            timestamp: parseTimestamp(msg.timestamp),
            content: type !== 'tool_call' ? extractContent(msg.message) : undefined,
            toolCall: msg.toolCall,
            isFirst,
            isLast,
        };
    });
}
/**
 * Filter out empty messages (except tool calls)
 */
export function filterEmptyMessages(messages) {
    return messages.filter((msg) => {
        if (msg.type === 'tool_call')
            return true;
        return msg.content && msg.content.trim().length > 0;
    });
}
//# sourceMappingURL=JSONLAdapter.js.map