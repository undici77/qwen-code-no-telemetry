import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolCallContainer, groupContent, mapToolStatusToContainerStatus, } from './shared/index.js';
import { FileLink } from '../layout/FileLink.js';
/**
 * Specialized component for Write tool calls
 * Shows: Write filename + error message + content preview
 */
export const WriteToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { content, locations, rawInput, toolCallId } = toolCall;
    // Group content by type
    const { errors, textOutputs } = groupContent(content);
    // Extract content to write from rawInput
    let writeContent = '';
    if (rawInput && typeof rawInput === 'object') {
        const inputObj = rawInput;
        writeContent = inputObj.content || '';
    }
    else if (typeof rawInput === 'string') {
        writeContent = rawInput;
    }
    // Error case: show filename + error message + content preview
    if (errors.length > 0) {
        const path = locations?.[0]?.path || '';
        const errorMessage = errors.join('\n');
        // Truncate content preview
        const truncatedContent = writeContent.length > 200
            ? writeContent.substring(0, 200) + '...'
            : writeContent;
        return (_jsxs(ToolCallContainer, { label: 'WriteFile', status: "error", toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, labelSuffix: path ? (_jsx(FileLink, { path: path, showFullPath: false, className: "text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline" })) : undefined, children: [_jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1", children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsx("span", { className: "flex-shrink-0 w-full", children: errorMessage })] }), truncatedContent && (_jsx("div", { className: "bg-[var(--app-input-background)] border border-[var(--app-input-border)] rounded-md p-3 mt-1", children: _jsx("pre", { className: "font-mono text-[13px] whitespace-pre-wrap break-words text-[var(--app-primary-foreground)] opacity-90", children: truncatedContent }) }))] }));
    }
    // Success case: show filename + line count
    if (locations && locations.length > 0) {
        const path = locations[0].path;
        const lineCount = writeContent.split('\n').length;
        const containerStatus = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx(ToolCallContainer, { label: 'WriteFile', status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, labelSuffix: path ? (_jsx(FileLink, { path: path, showFullPath: false, className: "text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline" })) : undefined, children: _jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-center", children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsxs("span", { className: "flex-shrink-0 w-full", children: [lineCount, " lines"] })] }) }));
    }
    // Fallback: show generic success
    if (textOutputs.length > 0) {
        const containerStatus = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx(ToolCallContainer, { label: "WriteFile", status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: textOutputs.join('\n') }));
    }
    // No output, don't show anything
    return null;
};
//# sourceMappingURL=WriteToolCall.js.map