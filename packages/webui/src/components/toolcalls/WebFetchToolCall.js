import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * WebFetch/WebSearch tool call component
 * Displays web fetch and search operations with URL/query and output
 */
import { useState } from 'react';
import { ToolCallContainer, safeTitle, groupContent, mapToolStatusToContainerStatus, } from './shared/index.js';
import { getToolDisplayLabel } from './labelUtils.js';
import { MarkdownRenderer } from '../messages/MarkdownRenderer/MarkdownRenderer.js';
/** Default collapsed height in pixels */
const COLLAPSED_HEIGHT = 120;
/** Threshold for showing expand button (content longer than this will be collapsible) */
const EXPAND_THRESHOLD = 300;
/**
 * Get the URL or query from tool call data
 * @param variant - 'fetch' or 'search'
 * @param title - Tool call title
 * @param rawInput - Raw input object
 * @returns URL or query string
 */
const getWebTarget = (variant, title, rawInput) => {
    // Try to extract URL or query from rawInput
    if (rawInput && typeof rawInput === 'object') {
        const input = rawInput;
        if (variant === 'fetch' && input['url']) {
            return String(input['url']);
        }
        if (variant === 'search' && input['query']) {
            return String(input['query']);
        }
    }
    return safeTitle(title);
};
/**
 * Output card component with expand/collapse functionality
 * @param props - Component props
 * @returns JSX element
 */
const OutputCard = ({ content, isError = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongContent = content.length > EXPAND_THRESHOLD;
    return (_jsx("div", { className: "border-[0.5px] border-[var(--app-input-border)] rounded-[5px] bg-[var(--app-tool-background)] my-2 max-w-full text-[1em] items-start", children: _jsxs("div", { className: "flex flex-col gap-[3px] p-1", children: [_jsxs("div", { className: "grid grid-cols-[max-content_1fr] p-1", children: [_jsx("div", { className: "text-[var(--app-secondary-foreground)] text-left opacity-50 py-1 px-2 pl-1 font-mono text-[0.85em]", children: "OUT" }), _jsx("div", { className: `break-words m-0 p-1 overflow-hidden ${isError ? 'whitespace-pre-wrap' : ''}`, style: !isExpanded && isLongContent
                                ? {
                                    maxHeight: `${COLLAPSED_HEIGHT}px`,
                                    maskImage: `linear-gradient(to bottom, var(--app-primary-background) 80px, transparent ${COLLAPSED_HEIGHT}px)`,
                                    WebkitMaskImage: `linear-gradient(to bottom, var(--app-primary-background) 80px, transparent ${COLLAPSED_HEIGHT}px)`,
                                }
                                : undefined, children: isError ? (_jsx("pre", { className: "m-0 overflow-hidden font-mono text-[0.85em] text-[#c74e39]", children: content })) : (_jsx("div", { className: "text-[0.85em]", children: _jsx(MarkdownRenderer, { content: content, enableFileLinks: false }) })) })] }), isLongContent && (_jsx("div", { className: "flex justify-center border-t border-[var(--app-input-border)] pt-1", children: _jsx("button", { type: "button", onClick: () => setIsExpanded(!isExpanded), className: "text-[var(--app-secondary-foreground)] text-[0.8em] hover:text-[var(--app-primary-foreground)] cursor-pointer bg-transparent border-none px-2 py-1 rounded hover:bg-[var(--app-input-background)] transition-colors", children: isExpanded ? '▲ Collapse' : '▼ Show more' }) }))] }) }));
};
/**
 * WebFetch/WebSearch tool call implementation
 * @param props - Component props including toolCall, variant, isFirst, isLast
 * @returns JSX element
 */
const WebFetchToolCallImpl = ({ toolCall, variant, isFirst, isLast, }) => {
    const { title, content, rawInput, toolCallId } = toolCall;
    const webTarget = getWebTarget(variant, title, rawInput);
    const label = getToolDisplayLabel({ kind: toolCall.kind, title });
    // Group content by type
    const { textOutputs, errors } = groupContent(content);
    // Map tool status to container status
    const containerStatus = errors.length > 0
        ? 'error'
        : mapToolStatusToContainerStatus(toolCall.status);
    // Error case
    if (errors.length > 0) {
        return (_jsx(ToolCallContainer, { label: label, status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, labelSuffix: webTarget, children: _jsx(OutputCard, { content: errors.join('\n'), isError: true }) }));
    }
    // Success with output
    if (textOutputs.length > 0) {
        const output = textOutputs.join('\n');
        return (_jsx(ToolCallContainer, { label: label, status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, labelSuffix: webTarget, children: _jsx(OutputCard, { content: output }) }));
    }
    // No output yet - show just the URL/query (loading state)
    return (_jsx(ToolCallContainer, { label: label, status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, labelSuffix: webTarget }));
};
/**
 * WebFetchToolCall - displays web fetch/search tool calls
 * Shows URL/query and output with OUT card
 * @param props - Component props
 * @returns JSX element
 */
export const WebFetchToolCall = (props) => (_jsx(WebFetchToolCallImpl, { ...props, variant: 'fetch' }));
//# sourceMappingURL=WebFetchToolCall.js.map