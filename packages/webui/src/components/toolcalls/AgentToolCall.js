import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolCallCard, ToolCallRow, safeTitle } from './shared/index.js';
const MAX_VISIBLE_TOOL_CALLS = 5;
export const isAgentExecutionRawOutput = (value) => Boolean(value &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'task_execution' &&
    'taskDescription' in value &&
    'status' in value);
export const isAgentExecutionToolCall = (toolCall) => isAgentExecutionRawOutput(toolCall.rawOutput);
const STATUS_LABELS = {
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
};
const CHILD_STATUS_LABELS = {
    executing: 'Running',
    awaiting_approval: 'Awaiting approval',
    success: 'Completed',
    failed: 'Failed',
};
const formatDuration = (durationMs) => {
    if (durationMs < 1000) {
        return `${durationMs}ms`;
    }
    if (durationMs < 60_000) {
        return `${(durationMs / 1000).toFixed(durationMs % 1000 === 0 ? 0 : 1)}s`;
    }
    const minutes = Math.floor(durationMs / 60_000);
    const seconds = Math.round((durationMs % 60_000) / 1000);
    return `${minutes}m ${seconds}s`;
};
const getHeaderTitle = (data, fallbackTitle) => data.taskDescription || safeTitle(fallbackTitle) || 'Agent Task';
export const AgentToolCall = ({ toolCall }) => {
    if (!isAgentExecutionToolCall(toolCall)) {
        return null;
    }
    const data = toolCall.rawOutput;
    const visibleToolCalls = data.toolCalls?.slice(-MAX_VISIBLE_TOOL_CALLS) ?? [];
    const hiddenToolCallCount = Math.max(0, (data.toolCalls?.length ?? 0) - visibleToolCalls.length);
    return (_jsxs(ToolCallCard, { icon: "\uD83E\uDD16", children: [_jsx(ToolCallRow, { label: "Agent", children: _jsx("div", { className: "font-medium text-[var(--app-primary-foreground)]", children: getHeaderTitle(data, toolCall.title) }) }), _jsx(ToolCallRow, { label: "Status", children: _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "font-medium", children: data.subagentName }), _jsx("span", { className: "text-[var(--app-secondary-foreground)]", children: STATUS_LABELS[data.status] })] }) }), visibleToolCalls.length > 0 && (_jsx(ToolCallRow, { label: data.status === 'running' ? 'Progress' : 'Tools', children: _jsxs("div", { className: "flex flex-col gap-1", children: [visibleToolCalls.map((childToolCall) => (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "font-mono text-[12px] text-[var(--app-primary-foreground)]", children: childToolCall.name }), _jsx("span", { className: "text-[var(--app-secondary-foreground)]", children: CHILD_STATUS_LABELS[childToolCall.status] }), childToolCall.description && (_jsx("span", { className: "text-[var(--app-secondary-foreground)]", children: childToolCall.description })), childToolCall.error && (_jsx("span", { className: "text-[#c74e39]", children: childToolCall.error }))] }, childToolCall.callId))), hiddenToolCallCount > 0 && (_jsxs("div", { className: "text-[var(--app-secondary-foreground)]", children: ["+", hiddenToolCallCount, " more tool calls"] }))] }) })), data.executionSummary && (_jsx(ToolCallRow, { label: "Summary", children: _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1", children: [_jsxs("span", { children: [data.executionSummary.totalToolCalls, " tool calls"] }), _jsxs("span", { children: [data.executionSummary.totalTokens.toLocaleString(), " tokens"] }), _jsx("span", { children: formatDuration(data.executionSummary.totalDurationMs) })] }) })), (data.status === 'failed' || data.status === 'cancelled') &&
                data.terminateReason && (_jsx(ToolCallRow, { label: "Reason", children: _jsx("div", { className: "text-[#c74e39] font-medium", children: data.terminateReason }) }))] }));
};
//# sourceMappingURL=AgentToolCall.js.map