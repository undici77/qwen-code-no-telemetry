import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { ToolCallStatus } from '../../types.js';
import { SHELL_COMMAND_NAME, SHELL_NAME } from '../../constants.js';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
import { ToolStatusIndicator } from '../shared/ToolStatusIndicator.js';
import { ToolElapsedTime } from '../shared/ToolElapsedTime.js';
// Priority: Confirming > Executing > Error > Canceled > Pending > Success
function getOverallStatus(toolCalls) {
    if (toolCalls.some((t) => t.status === ToolCallStatus.Confirming))
        return ToolCallStatus.Confirming;
    if (toolCalls.some((t) => t.status === ToolCallStatus.Executing))
        return ToolCallStatus.Executing;
    if (toolCalls.some((t) => t.status === ToolCallStatus.Error))
        return ToolCallStatus.Error;
    if (toolCalls.some((t) => t.status === ToolCallStatus.Canceled))
        return ToolCallStatus.Canceled;
    if (toolCalls.some((t) => t.status === ToolCallStatus.Pending))
        return ToolCallStatus.Pending;
    return ToolCallStatus.Success;
}
// Active tool priority: Confirming > Executing > last in array
function getActiveTool(toolCalls) {
    return (toolCalls.find((t) => t.status === ToolCallStatus.Confirming) ??
        toolCalls.find((t) => t.status === ToolCallStatus.Executing) ??
        toolCalls[toolCalls.length - 1]);
}
// Pull the configured shell timeout off an AnsiOutputDisplay result so
// ToolElapsedTime can surface it inline (matches the expanded
// ToolMessage path). Non-ansi resultDisplay → undefined → legacy
// quiet-then-elapsed behavior.
function getShellTimeoutMs(tool) {
    const display = tool.resultDisplay;
    if (typeof display === 'object' &&
        display !== null &&
        'ansiOutput' in display) {
        return display.timeoutMs;
    }
    return undefined;
}
/**
 * Summary-label header: bold label + " · N tools" count when there are 2+
 * tools in the batch. The count is intentionally suppressed for N=1 so
 * single-tool batches don't read as `Read config.json · 1 tools`. Future
 * edits: keep the `length > 1` guard, not `>= 1`.
 */
function renderSummaryHeader(label, count) {
    return (_jsxs(_Fragment, { children: [_jsx(Text, { bold: true, children: label }), count > 1 ? (_jsxs(Text, { color: theme.text.secondary, children: ['  · ', count, " tools"] })) : null] }));
}
/**
 * Default header: active tool name + " × N" count + first-line description.
 * Same N=1 suffix suppression as `renderSummaryHeader`.
 */
function renderDefaultHeader(activeToolName, activeToolDescription, count) {
    return (_jsxs(_Fragment, { children: [_jsx(Text, { bold: true, children: activeToolName }), count > 1 ? (_jsxs(Text, { color: theme.text.secondary, children: [' × ', count] })) : null, activeToolDescription ? (_jsxs(Text, { color: theme.text.secondary, children: ['  ', activeToolDescription] })) : null] }));
}
export const CompactToolGroupDisplay = ({ toolCalls, contentWidth, compactLabel }) => {
    if (toolCalls.length === 0)
        return null;
    const overallStatus = getOverallStatus(toolCalls);
    const activeTool = getActiveTool(toolCalls);
    const isShellCommand = toolCalls.some((t) => t.name === SHELL_COMMAND_NAME || t.name === SHELL_NAME);
    const hasPending = !toolCalls.every((t) => t.status === ToolCallStatus.Success);
    const borderColor = isShellCommand
        ? theme.ui.symbol
        : hasPending
            ? theme.status.warning
            : theme.border.default;
    // Take only the first line of description to prevent multi-line shell scripts
    // from expanding the compact view (wrap="truncate-end" only handles width overflow,
    // not literal \n characters in the content)
    const activeToolDescription = activeTool.description
        ? activeTool.description.split('\n')[0]
        : '';
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", width: contentWidth, borderDimColor: hasPending, borderColor: borderColor, gap: 0, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(ToolStatusIndicator, { status: overallStatus, name: activeTool.name }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { wrap: "truncate-end", children: compactLabel
                                ? renderSummaryHeader(compactLabel, toolCalls.length)
                                : renderDefaultHeader(activeTool.name, activeToolDescription, toolCalls.length) }) }), _jsx(ToolElapsedTime, { status: overallStatus, executionStartTime: activeTool.executionStartTime, timeoutMs: getShellTimeoutMs(activeTool) })] }), _jsx(Text, { color: theme.text.secondary, children: t('Press Ctrl+O to show full tool output') })] }));
};
//# sourceMappingURL=CompactToolGroupDisplay.js.map