import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Edit tool call component - specialized for file editing operations
 */
import { useMemo } from 'react';
import { groupContent, mapToolStatusToContainerStatus, } from './shared/index.js';
import { FileLink } from '../layout/FileLink.js';
/**
 * Custom ToolCallContainer for EditToolCall with specific styling
 */
const EditToolCallContainer = ({ label, status = 'success', children, toolCallId: _toolCallId, labelSuffix, className: _className, isFirst = false, isLast = false, }) => (_jsx("div", { className: `qwen-message message-item ${_className || ''} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${status}`, "data-first": isFirst, "data-last": isLast, children: _jsxs("div", { className: "EditToolCall toolcall-content-wrapper flex flex-col gap-1 min-w-0 max-w-full", children: [_jsxs("div", { className: "flex items-baseline gap-1.5 relative min-w-0", children: [_jsx("span", { className: "text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]", children: label }), _jsx("span", { className: "text-[11px] text-[var(--app-secondary-foreground)]", children: labelSuffix })] }), children && (_jsx("div", { className: "text-[var(--app-secondary-foreground)]", children: children }))] }) }));
/**
 * Calculate diff summary (added/removed lines)
 */
const getDiffSummary = (oldText, newText) => {
    const oldLines = oldText ? oldText.split('\n').length : 0;
    const newLines = newText ? newText.split('\n').length : 0;
    const diff = newLines - oldLines;
    if (diff > 0) {
        return `+${diff} lines`;
    }
    else if (diff < 0) {
        return `${diff} lines`;
    }
    else {
        return 'Modified';
    }
};
/**
 * Specialized component for Edit tool calls
 * Optimized for displaying file editing operations with diffs
 */
export const EditToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { content, locations, toolCallId } = toolCall;
    // Group content by type; memoize to avoid new array identities on every render
    const { errors, diffs } = useMemo(() => groupContent(content), [content]);
    // Failed case: show explicit failed message and render inline diffs
    if (toolCall.status === 'failed') {
        const firstDiff = diffs[0];
        const path = firstDiff?.path || locations?.[0]?.path || '';
        const containerStatus = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx("div", { className: `qwen-message message-item relative py-2 select-text toolcall-container toolcall-status-${containerStatus}`, "data-first": isFirst, "data-last": isLast, children: _jsxs("div", { className: "toolcall-edit-content flex flex-col gap-1 min-w-0 max-w-full", children: [_jsx("div", { className: "flex items-center justify-between min-w-0", children: _jsxs("div", { className: "flex items-baseline gap-2 min-w-0", children: [_jsx("span", { className: "text-[13px] leading-none font-bold text-[var(--app-primary-foreground)]", children: "Edit" }), path && (_jsx(FileLink, { path: path, showFullPath: false, className: "font-mono text-[var(--app-secondary-foreground)] hover:underline" }))] }) }), _jsx("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-center", children: _jsx("span", { className: "flex-shrink-0 w-full", children: "edit failed" }) })] }) }));
    }
    // Error case: show error
    if (errors.length > 0) {
        const path = diffs[0]?.path || locations?.[0]?.path || '';
        return (_jsx(EditToolCallContainer, { label: 'Edit', status: "error", toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, labelSuffix: path ? (_jsx(FileLink, { path: path, showFullPath: false, className: "text-xs font-mono hover:underline" })) : undefined, children: errors.join('\n') }));
    }
    // Success case with diff: show minimal inline preview
    if (diffs.length > 0) {
        const firstDiff = diffs[0];
        const path = firstDiff.path || (locations && locations[0]?.path) || '';
        const summary = getDiffSummary(firstDiff.oldText, firstDiff.newText);
        const containerStatus = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx("div", { className: `qwen-message message-item relative py-2 select-text toolcall-container toolcall-status-${containerStatus}`, "data-first": isFirst, "data-last": isLast, children: _jsxs("div", { className: "toolcall-edit-content flex flex-col gap-1 min-w-0 max-w-full", children: [_jsx("div", { className: "flex items-center justify-between min-w-0", children: _jsxs("div", { className: "flex items-baseline gap-1.5 min-w-0", children: [_jsx("span", { className: "text-[13px] leading-none font-bold text-[var(--app-primary-foreground)]", children: "Edit" }), path && (_jsx(FileLink, { path: path, showFullPath: false, className: "font-mono text-[var(--app-secondary-foreground)] hover:underline" }))] }) }), _jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-baseline", children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsx("span", { className: "flex-shrink-0 w-full", children: summary })] })] }) }));
    }
    // Success case without diff: show file in compact format
    if (locations && locations.length > 0) {
        const containerStatus = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx(EditToolCallContainer, { label: `Edit`, status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, labelSuffix: _jsx(FileLink, { path: locations[0].path, showFullPath: false, className: "text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline" }), children: _jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-center", children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsx(FileLink, { path: locations[0].path, line: locations[0].line, showFullPath: true })] }) }));
    }
    // No output, don't show anything
    return null;
};
//# sourceMappingURL=EditToolCall.js.map