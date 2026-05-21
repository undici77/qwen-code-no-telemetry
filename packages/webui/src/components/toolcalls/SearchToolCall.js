import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Search tool call component - specialized for search operations
 */
import { useState } from 'react';
import { safeTitle, groupContent, mapToolStatusToContainerStatus, ToolCallContainer, } from './shared/index.js';
import { FileLink } from '../layout/FileLink.js';
import { getToolDisplayLabel } from './labelUtils.js';
/**
 * Collapsible output component for search results
 * Shows a summary line that can be expanded to show full content
 */
const CollapsibleOutput = ({ summary, children, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (_jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1 cursor-pointer hover:opacity-100 transition-opacity", onClick: () => setIsExpanded(!isExpanded), children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsx("span", { className: "flex-shrink-0", children: summary })] }), isExpanded && (_jsx("div", { className: "ml-4 mt-1 text-[var(--app-secondary-foreground)] text-[0.85em]", children: children }))] }));
};
/**
 * Row component for search card layout
 */
const SearchRow = ({ label, children, }) => (_jsxs("div", { className: "grid grid-cols-[80px_1fr] gap-medium min-w-0", children: [_jsx("div", { className: "text-xs text-[var(--app-secondary-foreground)] font-medium pt-[2px]", children: label }), _jsx("div", { className: "text-[var(--app-primary-foreground)] min-w-0 break-words", children: children })] }));
/**
 * Card content wrapper for search results
 */
const SearchCardContent = ({ children }) => (_jsx("div", { className: "bg-[var(--app-input-background)] border border-[var(--app-input-border)] rounded-md p-3 mt-1", children: _jsx("div", { className: "flex flex-col gap-3 min-w-0", children: children }) }));
/**
 * Local locations list component
 */
const LocationsListLocal = ({ locations }) => (_jsx("div", { className: "flex flex-col gap-1 max-w-full", children: locations.map((loc, idx) => (_jsx(FileLink, { path: loc.path, line: loc.line, showFullPath: true }, idx))) }));
/**
 * Specialized component for Search tool calls
 * Optimized for displaying search operations and results
 */
export const SearchToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { kind, title, content, locations } = toolCall;
    const queryText = safeTitle(title);
    const displayLabel = getToolDisplayLabel({ kind, title });
    const containerStatus = mapToolStatusToContainerStatus(toolCall.status);
    // Group content by type
    const { errors, textOutputs } = groupContent(content);
    // Error case: show search query + error in card layout
    if (errors.length > 0) {
        return (_jsx(ToolCallContainer, { label: displayLabel, labelSuffix: queryText, status: "error", isFirst: isFirst, isLast: isLast, children: _jsxs(SearchCardContent, { children: [_jsx(SearchRow, { label: "Query", children: _jsx("div", { className: "font-mono", children: queryText }) }), _jsx(SearchRow, { label: "Error", children: _jsx("div", { className: "text-[#c74e39] font-medium", children: errors.join('\n') }) })] }) }));
    }
    // Success case with results: show search query + file list
    if (locations && locations.length > 0) {
        // Use collapsible output for multiple results
        const summaryText = `${locations.length} ${locations.length === 1 ? 'file' : 'files'} found`;
        return (_jsx(ToolCallContainer, { label: displayLabel, labelSuffix: queryText, status: containerStatus, isFirst: isFirst, isLast: isLast, children: _jsx(CollapsibleOutput, { summary: summaryText, children: _jsx(LocationsListLocal, { locations: locations }) }) }));
    }
    // Show content text if available (e.g., grep output with content)
    if (textOutputs.length > 0) {
        // Count total lines in output
        const totalLines = textOutputs.reduce((acc, text) => acc + text.split('\n').length, 0);
        const summaryText = `${totalLines} ${totalLines === 1 ? 'line' : 'lines'} of output`;
        return (_jsx(ToolCallContainer, { label: displayLabel, labelSuffix: queryText || undefined, status: containerStatus, isFirst: isFirst, isLast: isLast, children: _jsx(CollapsibleOutput, { summary: summaryText, children: _jsx("div", { className: "flex flex-col gap-1 font-mono text-[0.85em] whitespace-pre-wrap break-all", children: textOutputs.map((text, index) => (_jsx("div", { children: text }, index))) }) }) }));
    }
    // No results - show query only
    if (queryText) {
        return (_jsx(ToolCallContainer, { label: displayLabel, labelSuffix: queryText, status: containerStatus, isFirst: isFirst, isLast: isLast }));
    }
    return null;
};
//# sourceMappingURL=SearchToolCall.js.map