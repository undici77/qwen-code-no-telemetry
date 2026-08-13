import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CollapsibleOutput, ToolCallContainer, ToolCallCard, ToolCallRow, LocationsList, safeTitle, groupContent, mapToolStatusToContainerStatus, } from './shared/index.js';
import { getToolDisplayLabel } from './labelUtils.js';
import { MarkdownRenderer } from '../messages/MarkdownRenderer/MarkdownRenderer.js';
const EXPAND_THRESHOLD = 400;
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
            return (_jsxs(ToolCallCard, { icon: "\uD83D\uDD27", children: [_jsx(ToolCallRow, { label: displayLabel, children: _jsx("div", { children: operationText }) }), _jsx(ToolCallRow, { label: "Output", children: _jsx(CollapsibleOutput, { isCollapsible: output.length > EXPAND_THRESHOLD, className: "text-[13px] opacity-90", children: _jsx(MarkdownRenderer, { content: output, enableFileLinks: false }) }) })] }));
        }
        // Short output - compact format
        const statusFlag = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx(ToolCallContainer, { label: displayLabel, status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: operationText || output }));
    }
    // Success with files: show operation + file list in compact format
    if (locations && locations.length > 0) {
        const statusFlag = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx(ToolCallContainer, { label: displayLabel, status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: _jsx(LocationsList, { locations: locations }) }));
    }
    // No output - show just the operation
    if (operationText) {
        const statusFlag = mapToolStatusToContainerStatus(toolCall.status);
        return (_jsx(ToolCallContainer, { label: displayLabel, status: statusFlag, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: operationText }));
    }
    return null;
};
//# sourceMappingURL=GenericToolCall.js.map