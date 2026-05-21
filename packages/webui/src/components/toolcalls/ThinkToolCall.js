import { jsx as _jsx } from "react/jsx-runtime";
import { ToolCallContainer, ToolCallCard, ToolCallRow, groupContent, } from './shared/index.js';
/**
 * Specialized component for Think tool calls
 * Optimized for displaying AI reasoning and thought processes
 * Minimal display: just show the thoughts (no context)
 */
export const ThinkToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { content } = toolCall;
    // Group content by type
    const { textOutputs, errors } = groupContent(content);
    // Error case (rare for thinking)
    if (errors.length > 0) {
        return (_jsx(ToolCallContainer, { label: "Think", status: "error", isFirst: isFirst, isLast: isLast, children: errors.join('\n') }));
    }
    // Show thoughts - use card for long content, compact for short
    if (textOutputs.length > 0) {
        const thoughts = textOutputs.join('\n\n');
        const isLong = thoughts.length > 200;
        if (isLong) {
            const truncatedThoughts = thoughts.length > 500 ? thoughts.substring(0, 500) + '...' : thoughts;
            return (_jsx(ToolCallCard, { icon: "\uD83D\uDCAD", children: _jsx(ToolCallRow, { label: "Think", children: _jsx("div", { className: "italic opacity-90 leading-relaxed", children: truncatedThoughts }) }) }));
        }
        // Short thoughts - compact format
        const status = toolCall.status === 'pending' || toolCall.status === 'in_progress'
            ? 'loading'
            : 'default';
        return (_jsx(ToolCallContainer, { label: "Think", status: status, isFirst: isFirst, isLast: isLast, children: _jsx("span", { className: "italic opacity-90", children: thoughts }) }));
    }
    // Empty thoughts
    return null;
};
//# sourceMappingURL=ThinkToolCall.js.map