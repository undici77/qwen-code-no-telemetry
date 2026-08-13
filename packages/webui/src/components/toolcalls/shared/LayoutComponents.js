import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FileLink } from '../../layout/FileLink.js';
import './LayoutComponents.css';
/**
 * ToolCallContainer - Main container for tool call displays
 * Features timeline connector line and status bullet
 */
export const ToolCallContainer = ({ label, status = 'success', children, toolCallId: _toolCallId, labelSuffix, className: _className, isFirst = false, isLast = false, }) => (_jsx("div", { className: `qwen-message message-item ${_className || ''} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${status}`, "data-first": isFirst, "data-last": isLast, children: _jsxs("div", { className: "toolcall-content-wrapper flex flex-col min-w-0 max-w-full", children: [_jsxs("div", { className: "flex items-baseline gap-1.5 relative min-w-0", children: [_jsx("span", { className: "text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]", children: label }), _jsx("span", { className: "text-[11px] text-[var(--app-secondary-foreground)]", children: labelSuffix })] }), children && (_jsx("div", { className: "text-[var(--app-secondary-foreground)]", children: children }))] }) }));
/**
 * ToolCallCard - Legacy card wrapper for complex layouts like diffs
 */
export const ToolCallCard = ({ icon: _icon, children, }) => (_jsx("div", { className: "grid grid-cols-[auto_1fr] gap-medium bg-[var(--app-input-background)] border border-[var(--app-input-border)] rounded-medium p-large my-medium items-start animate-[fadeIn_0.2s_ease-in] toolcall-card", children: _jsx("div", { className: "flex flex-col gap-medium min-w-0", children: children }) }));
/**
 * ToolCallRow - A single row in the tool call grid (legacy - for complex layouts)
 */
export const ToolCallRow = ({ label, children }) => (_jsxs("div", { className: "grid grid-cols-[80px_1fr] gap-medium min-w-0", children: [_jsx("div", { className: "text-xs text-[var(--app-secondary-foreground)] font-medium pt-[2px]", children: label }), _jsx("div", { className: "text-[var(--app-primary-foreground)] min-w-0 break-words", children: children })] }));
/**
 * Get status color class for StatusIndicator
 */
const getStatusColorClass = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-[#ffc107]';
        case 'in_progress':
            return 'bg-[#2196f3]';
        case 'completed':
            return 'bg-[#4caf50]';
        case 'failed':
            return 'bg-[#f44336]';
        default:
            return 'bg-gray-500';
    }
};
/**
 * StatusIndicator - Status indicator with colored dot
 */
export const StatusIndicator = ({ status, text }) => (_jsxs("div", { className: "inline-block font-medium relative", title: status, children: [_jsx("span", { className: `inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${getStatusColorClass(status)}` }), text] }));
/**
 * CodeBlock - Code block for displaying formatted code or output
 */
export const CodeBlock = ({ children }) => (_jsx("pre", { className: "font-mono text-[var(--app-monospace-font-size)] bg-[var(--app-primary-background)] border border-[var(--app-input-border)] rounded-small p-medium overflow-x-auto mt-1 whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto", children: children }));
/**
 * LocationsList - List of file locations with clickable links
 */
export const LocationsList = ({ locations }) => (_jsx("div", { className: "toolcall-locations-list flex flex-col gap-1 max-w-full", children: locations.map((loc, idx) => (_jsx(FileLink, { path: loc.path, line: loc.line, showFullPath: true }, idx))) }));
//# sourceMappingURL=LayoutComponents.js.map