import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { groupContent, safeTitle } from './shared/index.js';
import { CheckboxDisplay } from './CheckboxDisplay.js';
import { getToolDisplayLabel } from './labelUtils.js';
/**
 * Custom container for UpdatedPlanToolCall with specific styling
 */
const PlanToolCallContainer = ({ label, status = 'success', children, toolCallId: _toolCallId, labelSuffix, className: _className, isFirst = false, isLast = false, }) => (_jsx("div", { className: `qwen-message message-item ${_className || ''} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${status}`, "data-first": isFirst, "data-last": isLast, children: _jsxs("div", { className: "UpdatedPlanToolCall toolcall-content-wrapper flex flex-col gap-2 min-w-0 max-w-full", children: [_jsxs("div", { className: "flex items-baseline gap-1 relative min-w-0", children: [_jsx("span", { className: "text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]", children: label }), _jsx("span", { className: "text-[11px] text-[var(--app-secondary-foreground)]", children: labelSuffix })] }), children && (_jsx("div", { className: "text-[var(--app-secondary-foreground)] py-1", children: children }))] }) }));
/**
 * Map tool status to bullet status
 */
const mapToolStatusToBullet = (status) => {
    switch (status) {
        case 'completed':
            return 'success';
        case 'failed':
            return 'error';
        case 'in_progress':
            return 'warning';
        case 'pending':
            return 'loading';
        default:
            return 'default';
    }
};
/**
 * Parse plan entries with - [ ] / - [x] from text
 */
const parsePlanEntries = (textOutputs) => {
    const text = textOutputs.join('\n');
    const lines = text.split(/\r?\n/);
    const entries = [];
    // Accept [ ], [x]/[X] and in-progress markers [-] or [*]
    const todoRe = /^(?:\s{0,10}(?:[-*]|\d{1,3}[.)])\s{0,10})?\[( |x|X|-|\*)\]\s+(.{0,500})$/;
    for (const line of lines) {
        const m = line.match(todoRe);
        if (m) {
            const mark = m[1];
            const title = m[2].trim();
            const status = mark === 'x' || mark === 'X'
                ? 'completed'
                : mark === '-' || mark === '*'
                    ? 'in_progress'
                    : 'pending';
            if (title) {
                entries.push({ content: title, status });
            }
        }
    }
    // Fallback: treat non-empty lines as pending items
    if (entries.length === 0) {
        for (const line of lines) {
            const title = line.trim();
            if (title) {
                entries.push({ content: title, status: 'pending' });
            }
        }
    }
    return entries;
};
/**
 * Specialized component for UpdatedPlan tool calls
 * Optimized for displaying plan update operations
 */
export const UpdatedPlanToolCall = ({ toolCall, isFirst, isLast, }) => {
    const { content, status } = toolCall;
    const { errors, textOutputs } = groupContent(content);
    // Error-first display
    if (errors.length > 0) {
        return (_jsx(PlanToolCallContainer, { label: "TodoWrite", status: "error", isFirst: isFirst, isLast: isLast, children: errors.join('\n') }));
    }
    const entries = parsePlanEntries(textOutputs);
    const label = getToolDisplayLabel({
        kind: toolCall.kind,
        title: safeTitle(toolCall.title),
    });
    return (_jsx(PlanToolCallContainer, { label: label, status: mapToolStatusToBullet(status), className: "update-plan-toolcall", isFirst: isFirst, isLast: isLast, children: _jsx("ul", { className: "Fr list-none p-0 m-0 flex flex-col gap-1", children: entries.map((entry, idx) => {
                const isDone = entry.status === 'completed';
                const isIndeterminate = entry.status === 'in_progress';
                return (_jsxs("li", { className: [
                        'Hr flex items-start gap-2 p-0 rounded text-[var(--app-primary-foreground)]',
                        isDone ? 'fo opacity-70' : '',
                    ].join(' '), children: [_jsx("label", { className: "flex items-start gap-2", children: _jsx(CheckboxDisplay, { checked: isDone, indeterminate: isIndeterminate }) }), _jsx("div", { className: [
                                'vo flex-1 text-xs leading-[1.5] text-[var(--app-primary-foreground)]',
                                isDone
                                    ? 'line-through text-[var(--app-secondary-foreground)] opacity-70'
                                    : 'opacity-85',
                            ].join(' '), children: entry.content })] }, idx));
            }) }) }));
};
//# sourceMappingURL=UpdatedPlanToolCall.js.map