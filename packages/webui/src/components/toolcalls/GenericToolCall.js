import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generic tool call component - handles all tool call types as fallback
 */
import { useState } from 'react';
import { ToolCallContainer, ToolCallCard, ToolCallRow, LocationsList, safeTitle, groupContent, } from './shared/index.js';
import { getToolDisplayLabel } from './labelUtils.js';
import { MarkdownRenderer } from '../messages/MarkdownRenderer/MarkdownRenderer.js';
const COLLAPSED_HEIGHT = 200;
const EXPAND_THRESHOLD = 400;
const CollapsibleOutput = ({ content }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongContent = content.length > EXPAND_THRESHOLD;
    return (_jsxs("div", { className: "flex flex-col gap-[3px]", children: [_jsx("div", { className: "text-[13px] opacity-90 overflow-hidden", style: !isExpanded && isLongContent
                    ? {
                        maxHeight: `${COLLAPSED_HEIGHT}px`,
                        maskImage: `linear-gradient(to bottom, var(--app-primary-background) 140px, transparent ${COLLAPSED_HEIGHT}px)`,
                        WebkitMaskImage: `linear-gradient(to bottom, var(--app-primary-background) 140px, transparent ${COLLAPSED_HEIGHT}px)`,
                    }
                    : undefined, children: _jsx(MarkdownRenderer, { content: content, enableFileLinks: false }) }), isLongContent && (_jsx("div", { className: "flex justify-center border-t border-[var(--app-input-border)] pt-1", children: _jsx("button", { type: "button", onClick: () => setIsExpanded(!isExpanded), className: "text-[var(--app-secondary-foreground)] text-[0.8em] hover:text-[var(--app-primary-foreground)] cursor-pointer bg-transparent border-none px-2 py-1 rounded hover:bg-[var(--app-input-background)] transition-colors", children: isExpanded ? '▲ Collapse' : '▼ Show more' }) }))] }));
};
/**
 * Generic tool call component that can display any tool call type
 * Used as fallback for unknown tool call kinds
 * Minimal display: show description and outcome
 */
export const GenericToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { kind, title, content, locations, toolCallId } = toolCall;
    const operationText = safeTitle(title);
    const displayLabel = getToolDisplayLabel({ kind, title });
    // Group content by type
    const { textOutputs, errors } = groupContent(content);
    // Error case: show operation + error in card layout
    if (errors.length > 0) {
        return (_jsxs(ToolCallCard, { icon: "\uD83D\uDD27", children: [_jsx(ToolCallRow, { label: displayLabel, children: _jsx("div", { children: operationText }) }), _jsx(ToolCallRow, { label: "Error", children: _jsx("div", { className: "text-[#c74e39] font-medium", children: errors.join('\n') }) })] }));
    }
    // Success with output: use card for long output, compact for short
    if (textOutputs.length > 0) {
        const output = textOutputs.join('\n');
        const isLong = output.length > 150;
        if (isLong) {
            return (_jsxs(ToolCallCard, { icon: "\uD83D\uDD27", children: [_jsx(ToolCallRow, { label: displayLabel, children: _jsx("div", { children: operationText }) }), _jsx(ToolCallRow, { label: "Output", children: _jsx(CollapsibleOutput, { content: output }) })] }));
        }
        // Short output - compact format
        const statusFlag = toolCall.status === 'in_progress' || toolCall.status === 'pending'
            ? 'loading'
            : 'success';
        return (_jsx(ToolCallContainer, { label: displayLabel, status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: operationText || output }));
    }
    // Success with files: show operation + file list in compact format
    if (locations && locations.length > 0) {
        const statusFlag = toolCall.status === 'in_progress' || toolCall.status === 'pending'
            ? 'loading'
            : 'success';
        return (_jsx(ToolCallContainer, { label: displayLabel, status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: _jsx(LocationsList, { locations: locations }) }));
    }
    // No output - show just the operation
    if (operationText) {
        const statusFlag = toolCall.status === 'in_progress' || toolCall.status === 'pending'
            ? 'loading'
            : 'success';
        return (_jsx(ToolCallContainer, { label: displayLabel, status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: operationText }));
    }
    return null;
};
//# sourceMappingURL=GenericToolCall.js.map