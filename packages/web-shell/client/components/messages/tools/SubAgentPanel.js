import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useEffect, useRef, useState, useMemo, } from 'react';
import { useWebShellCustomization } from '../../../customization';
import { useI18n } from '../../../i18n';
// Circular import with ToolGroup (agents render tool rows; agent tool
// rows render SubAgentPanel). Safe only while both modules dereference
// each other's exports at render time — never in top-level code.
import { ToolLine } from '../ToolGroup';
import { Markdown } from '../Markdown';
import { formatTimestamp } from '../../MessageTimestamp';
import { formatDurationMs, formatElapsed, StatusIcon, truncateText, } from './toolDisplay';
import { getAgentDisplayStatus, formatTokenCount, getAgentType, getAgentDescription, localizeAgentTypeName, localizeToolDisplayName, } from '../toolFormatting';
import chromeStyles from './ToolChrome.module.css';
import styles from './SubAgentPanel.module.css';
function isTaskExecution(raw) {
    return (!!raw &&
        typeof raw === 'object' &&
        raw.type === 'task_execution');
}
/**
 * Reveals a single sub-tool's wall-clock start time on hover in its top-right
 * corner, mirroring how the main transcript surfaces each message's time —
 * but via a scoped class pair (not MessageTimestamp) so the nested tooltip
 * stays independent of the enclosing message's own time tooltip.
 */
function SubToolTime({ timestamp, children, }) {
    if (timestamp === undefined)
        return _jsx(_Fragment, { children: children });
    return (_jsxs("div", { className: styles.toolTimeRow, children: [children, _jsx("span", { className: styles.toolTimeTip, "aria-hidden": "true", children: formatTimestamp(timestamp) })] }));
}
const SubToolLine = memo(function SubToolLine({ tool }) {
    // Same row as the main transcript: one-line summary, expandable to
    // the full output / diff / file content where the tool has any.
    const body = tool.subTools || tool.subContent ? (_jsx(SubAgentPanel, { tool: tool })) : (_jsx(ToolLine, { tool: tool, forceExpandable: true, hideCollapsedOutput: true }));
    return _jsx(SubToolTime, { timestamp: tool.startTime, children: body });
});
function TaskToolCallLine({ tc }) {
    const { t } = useI18n();
    return (_jsx("div", { className: chromeStyles.line, children: _jsxs("div", { className: chromeStyles.lineMain, children: [_jsx(StatusIcon, { status: tc.status }), _jsx("span", { className: chromeStyles.lineName, children: localizeToolDisplayName(tc.name, t) })] }) }));
}
function getAgentResultText(tool) {
    if (tool.rawOutput && isTaskExecution(tool.rawOutput)) {
        if (tool.rawOutput.result)
            return tool.rawOutput.result;
    }
    if (tool.content) {
        for (const b of tool.content) {
            if (b.type === 'content' && b.content?.text)
                return b.content.text;
        }
    }
    if (tool.rawOutput) {
        if (typeof tool.rawOutput === 'string')
            return tool.rawOutput;
        const raw = tool.rawOutput;
        if (typeof raw.output === 'string')
            return raw.output;
        if (typeof raw.result === 'string')
            return raw.result;
        if (typeof raw.content === 'string')
            return raw.content;
        if (typeof raw.reason === 'string')
            return raw.reason;
        if (typeof raw.terminateReason === 'string' &&
            raw.terminateReason !== 'GOAL') {
            return raw.terminateReason;
        }
        if (typeof raw.error === 'string')
            return raw.error;
        if (typeof raw.text === 'string')
            return raw.text;
    }
    return '';
}
/**
 * Live sub-agent stream (thinking + output) shown while the agent runs.
 * With compactThinking enabled it collapses to a 5-line window pinned to
 * the newest content, with a toggle to the full scrollable view.
 */
function SubAgentStream({ text }) {
    const { compactThinking } = useWebShellCustomization();
    const { t } = useI18n();
    const [streamExpanded, setStreamExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);
    const streamRef = useRef(null);
    const collapsed = compactThinking && !streamExpanded;
    useEffect(() => {
        const el = streamRef.current;
        if (!el || !collapsed)
            return;
        setOverflowing(el.scrollHeight > el.clientHeight);
        // Pin the newest line into view while the stream grows.
        el.scrollTop = el.scrollHeight;
    }, [collapsed, text]);
    useEffect(() => {
        const el = streamRef.current;
        if (!el || !collapsed)
            return;
        const check = () => setOverflowing(el.scrollHeight > el.clientHeight);
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [collapsed]);
    return (_jsxs("div", { children: [_jsx("pre", { ref: streamRef, className: collapsed
                    ? `${styles.stream} ${styles.streamCollapsed}`
                    : styles.stream, children: text }), compactThinking && (overflowing || streamExpanded) && (_jsx("button", { className: styles.expandToggle, onClick: () => setStreamExpanded((v) => !v), "aria-expanded": streamExpanded, "aria-label": t('subagent.toggleStream'), children: streamExpanded ? '▲' : '▼' }))] }));
}
/**
 * Final agent result. The result is only on screen after the user
 * explicitly opened the enclosing agent (tool row, accordion entry or
 * panel header), so it renders in full straight away — capped to the
 * same scrollable window as the live stream with compactThinking
 * enabled, which keeps the opener within reach to collapse it again.
 */
function SubAgentResult({ content }) {
    const { compactThinking } = useWebShellCustomization();
    return (_jsx("div", { className: compactThinking ? styles.scrollWindow : undefined, children: _jsx(Markdown, { content: content, source: "assistant" }) }));
}
/**
 * Step timeline: the sub-tool list in execution order, always capped to
 * its own scrollable window — with the conclusion rendered above it (no
 * tabs), an uncapped list would grow the panel past a screen. While the
 * agent is still running the window follows the newest call; once it
 * completes it snaps back to the top for reading.
 */
function SubAgentTools({ pinTail, itemCount, children, }) {
    const windowRef = useRef(null);
    useEffect(() => {
        const el = windowRef.current;
        if (!el)
            return;
        el.scrollTop = pinTail ? el.scrollHeight : 0;
    }, [pinTail, itemCount]);
    return (_jsx("div", { ref: windowRef, className: `${styles.tools} ${styles.scrollWindow}`, children: children }));
}
export function SubAgentPanel({ tool, defaultExpanded, hideHeader, inline, }) {
    const { t } = useI18n();
    const isComplete = tool.status === 'completed' || tool.status === 'failed';
    const displayStatus = getAgentDisplayStatus(tool);
    const [expanded, setExpanded] = useState(defaultExpanded ?? false);
    const taskExec = isTaskExecution(tool.rawOutput) ? tool.rawOutput : null;
    const subToolCount = tool.subTools?.length || taskExec?.toolCalls?.length || 0;
    const description = getAgentDescription(tool);
    const agentType = getAgentType(tool);
    const elapsed = formatElapsed(tool.startTime, tool.endTime) ||
        formatDurationMs(taskExec?.executionSummary?.totalDurationMs);
    const tokenCount = taskExec?.tokenCount && taskExec.tokenCount > 0
        ? taskExec.tokenCount
        : taskExec?.executionSummary?.outputTokens;
    const tokens = tokenCount ? formatTokenCount(tokenCount) : '';
    const resultText = isComplete ? getAgentResultText(tool) : '';
    const taskToolCalls = useMemo(() => {
        if (tool.subTools && tool.subTools.length > 0)
            return null;
        return taskExec?.toolCalls || null;
    }, [tool.subTools, taskExec]);
    const hasResult = !!(tool.subContent || resultText);
    const hasTools = !!((tool.subTools && tool.subTools.length > 0) ||
        (taskToolCalls && taskToolCalls.length > 0));
    // Captions only where they disambiguate: a completed agent showing both
    // its conclusion and the steps that produced it. A single section — or
    // the live steps+stream flow while running — reads on its own.
    const showSectionCaps = isComplete && hasResult && hasTools;
    return (_jsxs("div", { className: inline ? undefined : styles.panel, children: [!hideHeader && (_jsxs("div", { className: styles.header, onClick: () => setExpanded(!expanded), children: [_jsx(StatusIcon, { status: displayStatus }), _jsxs("span", { className: chromeStyles.lineName, children: [localizeAgentTypeName(agentType, t), ":"] }), description && (_jsx("span", { className: styles.desc, children: truncateText(description, 50) })), isComplete && subToolCount > 0 && (_jsxs("span", { className: styles.meta, children: ["\u00B7 ", t('subagent.toolsCount', { count: subToolCount })] })), elapsed && _jsxs("span", { className: styles.meta, children: ["\u00B7 ", elapsed] }), tokens && _jsxs("span", { className: styles.meta, children: ["\u00B7 ", tokens] }), !isComplete && (_jsx("span", { className: styles.toggle, children: expanded ? '▼' : '▶' }))] })), (expanded || hideHeader) && (_jsxs("div", { className: styles.body, children: [isComplete && hasResult && (_jsxs("div", { className: styles.content, children: [showSectionCaps && (_jsx("div", { className: styles.sectionCap, children: t('subagent.result') })), _jsx(SubAgentResult, { content: tool.subContent || resultText })] })), showSectionCaps && (_jsx("div", { className: styles.sectionCap, children: t('subagent.tools', { count: subToolCount }) })), tool.subTools && tool.subTools.length > 0 && (_jsx(SubAgentTools, { pinTail: !isComplete, itemCount: tool.subTools.length, children: tool.subTools.map((sub) => (_jsx("div", { className: styles.step, "data-status": sub.status, children: _jsx(SubToolLine, { tool: sub }) }, sub.callId))) })), taskToolCalls && taskToolCalls.length > 0 && (_jsx(SubAgentTools, { pinTail: !isComplete, itemCount: taskToolCalls.length, children: taskToolCalls.map((tc) => (_jsx("div", { className: styles.step, "data-status": tc.status, children: _jsx(TaskToolCallLine, { tc: tc }) }, tc.callId))) })), !isComplete && tool.subContent && (_jsx("div", { className: styles.content, children: _jsx(SubAgentStream, { text: tool.subContent }) }))] }))] }));
}
//# sourceMappingURL=SubAgentPanel.js.map