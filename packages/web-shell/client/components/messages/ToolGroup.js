import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useContext, useEffect, useMemo, useRef, useState, } from 'react';
import { hasActiveAgents, isBackgroundSubAgentToolCall, isSubAgentToolCall, } from '../../adapters/toolClassification';
// Circular import with SubAgentPanel (its SubToolLine renders ToolLine
// from this module). Safe only while both modules dereference each
// other's exports at render time — never in top-level code.
import { SubAgentPanel } from './tools/SubAgentPanel';
import { DiffView } from './tools/DiffView';
import { parseAnsi, hasAnsi } from '../../utils/ansi';
import { extractTodosFromToolCall, isTodoWriteToolName, } from '../../utils/todos';
import { useSharedNow } from '../../hooks/useSharedNow';
import { useSubagentDetails } from '../../subagentDetailsContext';
import { useMonitorDetails } from '../../monitorDetailsContext';
import { TodoEventSummary, TodoFullList } from './TodoView';
import { Markdown } from './Markdown';
import { formatDurationMs, formatElapsed, localizeToolDisplayName, StatusIcon, truncateText, } from './tools/toolDisplay';
import { extractText, formatTokenCount, getAgentCancellationReason, getAgentDescription, getAgentDisplayStatus, getAgentType, getTaskExecutionRecord, getShellToolSemanticDescription, getToolDescription, getToolSummaryDescription, getToolResultSummary, isAskUserQuestionToolName, isActiveToolStatus, isSkillToolName, isShellToolName, localizeAgentTypeName, toolContainsCallId, } from './toolFormatting';
import { useI18n } from '../../i18n';
import { useTranscriptRenderMode } from '../../transcriptRenderMode';
import { TodoTimelineContext } from '../../App';
import { useWebShellCustomization, } from '../../customization';
import flashStyles from '../MessageLocateFlash.module.css';
import styles from './tools/ToolChrome.module.css';
function openMonitorDetailsOnce(requestRef, open, fallback) {
    if (requestRef.current)
        return;
    const request = {};
    requestRef.current = request;
    void open()
        .then((opened) => {
        if (requestRef.current === request && !opened)
            fallback();
    }, () => {
        if (requestRef.current === request)
            fallback();
    })
        .finally(() => {
        if (requestRef.current === request)
            requestRef.current = null;
    });
}
export function hasExpandableContent(tool) {
    const name = tool.toolName.toLowerCase();
    if (isAskUserQuestionToolName(tool.toolName))
        return !!extractText(tool);
    // write_file shows content from args even before completion
    if (name === 'write_file' || name === 'writefile') {
        return !!getWriteContent(tool) || hasEditContent(tool);
    }
    if (tool.status !== 'completed' && tool.status !== 'failed')
        return false;
    if (isShellToolName(name)) {
        const text = extractText(tool);
        return !!text && text.trim().length > 0 && text.split('\n').length > 1;
    }
    if (isSkillToolName(name)) {
        return !!getFirstToolContentText(tool);
    }
    if (name === 'edit' || name === 'write' || name === 'editfile') {
        return hasEditContent(tool);
    }
    if (name === 'read' || name === 'read_file' || name === 'readfile') {
        const text = extractText(tool);
        return !!text && text.split('\n').length > 3;
    }
    return false;
}
// Tools whose expanded row renders a kind-specific detail view (shell output /
// diff / file content / Q&A). Must stay in sync with the renderers in
// ToolLine's lineDetail block below. Tools NOT in this set have nothing extra
// to show when expanded, so they keep their one-line result summary instead of
// hiding it behind an empty detail area.
function hasDetailView(tool) {
    const name = tool.toolName.toLowerCase();
    return (isShellToolName(name) ||
        name === 'write_file' ||
        name === 'writefile' ||
        name === 'edit' ||
        name === 'write' ||
        name === 'editfile' ||
        name === 'read' ||
        name === 'read_file' ||
        name === 'readfile' ||
        isSkillToolName(name) ||
        isAskUserQuestionToolName(tool.toolName));
}
function hasDiffContent(tool) {
    if (tool.content?.some((b) => b.type === 'diff'))
        return true;
    return !!getRawFileDiff(tool);
}
function hasEditContent(tool) {
    return hasDiffContent(tool) || !!extractText(tool);
}
export function extractDiff(tool) {
    const rawFileDiff = getRawFileDiff(tool);
    if (rawFileDiff)
        return rawFileDiff;
    if (tool.content) {
        const diffBlock = tool.content.find((b) => b.type === 'diff');
        if (diffBlock && diffBlock.type === 'diff') {
            return buildUnifiedDiff(diffBlock.oldText || '', diffBlock.newText || '');
        }
    }
    return '';
}
export function getRawFileDiff(tool) {
    if (tool.rawOutput && typeof tool.rawOutput === 'object') {
        const raw = tool.rawOutput;
        if (isTruncatedSessionDiff(raw))
            return '';
        if (typeof raw.fileDiff === 'string')
            return raw.fileDiff;
    }
    return '';
}
function isTruncatedSessionDiff(raw) {
    return (raw.truncatedForSession === true && 'fileName' in raw && 'newContent' in raw);
}
const MAX_DIFF_PRODUCT = 250_000;
export function buildUnifiedDiff(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const n = oldLines.length;
    const m = newLines.length;
    if (n * m > MAX_DIFF_PRODUCT) {
        const removed = oldLines.map((l) => (l ? `-${l}` : '-'));
        const added = newLines.map((l) => (l ? `+${l}` : '+'));
        return [...removed, ...added].join('\n');
    }
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            dp[i][j] =
                oldLines[i - 1] === newLines[j - 1]
                    ? dp[i - 1][j - 1] + 1
                    : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    const result = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            result.push(` ${oldLines[i - 1]}`);
            i--;
            j--;
        }
        else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.push(`+${newLines[j - 1]}`);
            j--;
        }
        else {
            result.push(`-${oldLines[i - 1]}`);
            i--;
        }
    }
    return result.reverse().join('\n');
}
// A description longer than this is likely ellipsised on a normal-width row, so
// the row becomes expandable to re-flow the full text into a wrapped block.
const DESCRIPTION_EXPAND_THRESHOLD = 60;
const MAX_MARKDOWN_READ_CHARS = 200_000;
const MAX_MARKDOWN_READ_LINES = 1000;
const READ_LANGUAGE_ALIASES = {
    cjs: 'javascript',
    cts: 'typescript',
    h: 'c',
    hpp: 'cpp',
    js: 'javascript',
    jsx: 'jsx',
    mjs: 'javascript',
    mts: 'typescript',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    ts: 'typescript',
    tsx: 'tsx',
    yml: 'yaml',
};
function ExpandedBashOutput({ tool }) {
    const output = useMemo(() => extractText(tool) || '', [tool]);
    const ansiSegments = useMemo(() => (hasAnsi(output) ? parseAnsi(output) : null), [output]);
    return (_jsx("div", { className: styles.expandedBash, children: _jsx("pre", { className: styles.expandedOutput, children: ansiSegments
                ? ansiSegments.map((seg, i) => (_jsx("span", { style: {
                        color: seg.color,
                        fontWeight: seg.bold ? 'bold' : undefined,
                        opacity: seg.dim ? 0.6 : undefined,
                    }, children: seg.text }, i)))
                : output }) }));
}
function ExpandedReadContent({ tool }) {
    const content = useMemo(() => extractText(tool) || '', [tool]);
    const language = languageForPath(getReadFilePath(tool));
    const plainText = language === 'text' ||
        content.length > MAX_MARKDOWN_READ_CHARS ||
        exceedsLineLimit(content, MAX_MARKDOWN_READ_LINES);
    return (_jsx("div", { className: styles.expandedRead, children: plainText ? (_jsx("pre", { className: styles.expandedOutput, children: content })) : (_jsx(Markdown, { content: fencedCodeBlock(language, content) })) }));
}
function getReadFilePath(tool) {
    const filePath = tool.args?.file_path ?? tool.args?.path;
    return typeof filePath === 'string' ? filePath : '';
}
function exceedsLineLimit(text, maxLines) {
    let lines = 1;
    for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) === 10 && ++lines > maxLines)
            return true;
    }
    return false;
}
export function languageForPath(filePath) {
    const ext = filePath.split(/[?#]/, 1)[0]?.split('.').pop()?.toLowerCase();
    if (!ext || ext === filePath.toLowerCase())
        return 'text';
    if (ext === 'mermaid' || ext === 'mmd')
        return 'text';
    const language = READ_LANGUAGE_ALIASES[ext] ?? ext;
    return /^[\w+.#-]+$/.test(language) ? language : 'text';
}
export function fencedCodeBlock(language, code) {
    const longestFence = code
        .match(/~{3,}/g)
        ?.reduce((max, fence) => Math.max(max, fence.length), 0) ?? 0;
    const fence = '~'.repeat(Math.max(3, longestFence + 1));
    return `${fence}${language}\n${code}\n${fence}`;
}
function ExpandedEditContent({ tool }) {
    const diff = useMemo(() => extractDiff(tool), [tool]);
    const text = useMemo(() => extractText(tool) || '', [tool]);
    if (!diff && !text)
        return null;
    return (_jsx("div", { className: styles.expandedEdit, children: diff ? (_jsx(DiffView, { diff: diff })) : (_jsx("pre", { className: styles.expandedOutput, children: text })) }));
}
function ToolExpandedCard({ title, detail, children, }) {
    return (_jsxs("div", { className: styles.expandedCard, children: [_jsxs("div", { className: styles.expandedCardHeader, children: [_jsx("span", { className: styles.expandedCardTitle, children: title }), detail && _jsx("span", { className: styles.expandedCardDetail, children: detail })] }), children && _jsx("div", { className: styles.expandedCardBody, children: children })] }));
}
function getWriteContent(tool) {
    if (tool.args?.content)
        return tool.args.content;
    if (tool.args?.new_string)
        return tool.args.new_string;
    const text = extractText(tool);
    if (text)
        return text;
    if (tool.rawOutput && typeof tool.rawOutput === 'object') {
        const raw = tool.rawOutput;
        if (typeof raw.content === 'string')
            return raw.content;
        if (typeof raw.newContent === 'string')
            return raw.newContent;
    }
    return '';
}
// Collapsed by default: the diff of this todo_write call (just-completed and
// just-started items), expanding to the full list on click. The per-snapshot
// diff comes from the timeline context, so this is isolated in its own
// component — only todo rows subscribe and re-render when the timeline changes,
// not every tool row.
function TodoToolBody({ tool, todos, expanded, title, }) {
    const timeline = useContext(TodoTimelineContext);
    const events = timeline.get(tool.callId)?.events ?? [];
    return expanded ? (_jsx(ToolExpandedCard, { title: title, children: _jsx("div", { className: styles.todoBody, children: _jsx(TodoFullList, { todos: todos }) }) })) : (_jsx("div", { className: styles.todoBody, children: _jsx(TodoEventSummary, { todos: todos, events: events }) }));
}
function getAgentDisplayInfo(tool, now) {
    const taskExec = getTaskExecutionRecord(tool.rawOutput);
    const reason = getAgentCancellationReason(tool);
    const status = getAgentDisplayStatus(tool);
    const agentType = getAgentType(tool);
    const explicitAgentType = getExplicitAgentType(tool);
    const description = getAgentDescription(tool);
    const subToolCount = tool.subTools?.length ||
        taskExec?.['toolCalls']?.length ||
        0;
    const stats = taskExec?.['executionSummary'];
    const elapsed = stats && typeof stats['totalDurationMs'] === 'number'
        ? formatDurationMs(stats['totalDurationMs'])
        : formatElapsed(tool.startTime, tool.endTime ??
            (tool.status === 'in_progress' && now ? now : undefined));
    const outputTokens = taskExec &&
        typeof taskExec['tokenCount'] === 'number' &&
        taskExec['tokenCount'] > 0
        ? taskExec['tokenCount']
        : stats &&
            typeof stats['outputTokens'] === 'number' &&
            stats['outputTokens'] > 0
            ? stats['outputTokens']
            : 0;
    const tokens = outputTokens > 0 ? formatTokenCount(outputTokens) : '';
    return {
        agentType,
        explicitAgentType,
        description,
        subToolCount,
        elapsed,
        tokens,
        status,
        reason,
    };
}
function getExplicitAgentType(tool) {
    const taskExec = getTaskExecutionRecord(tool.rawOutput);
    const name = taskExec?.['subagentName'];
    if (typeof name === 'string' && name.trim())
        return name.trim();
    const subagentType = tool.args?.subagent_type;
    if (typeof subagentType === 'string' && subagentType.trim()) {
        return subagentType.trim();
    }
    return '';
}
export function shouldAutoExpand(tool) {
    // Only the verbose tool kinds below (shell/edit/write/ask) auto-expand, and
    // only while pending/in-progress or after failing: a successful completion
    // collapses them to a one-line summary so the transcript stays scannable
    // (click to reopen), while a failure of those kinds stays expanded so its
    // error output is visible without a click. Every other tool kind is collapsed
    // by default regardless of status — its summary line already shows the
    // outcome and it stays click-to-expand.
    if (tool.status === 'completed')
        return false;
    const name = tool.toolName.toLowerCase();
    if (isAskUserQuestionToolName(tool.toolName))
        return true;
    if (name === 'write_file' || name === 'writefile')
        return true;
    if (name === 'edit' || name === 'editfile')
        return true;
    if (isShellToolName(name))
        return true;
    return false;
}
function ExpandedAskUserQuestionOutput({ tool }) {
    const text = extractText(tool) || '';
    return _jsx("pre", { className: styles.expandedOutput, children: text });
}
function ExpandedSkillOutput({ tool }) {
    const content = getFirstToolContentText(tool) ||
        (typeof tool.args?.args === 'string' && tool.args.args.trim()
            ? tool.args.args.trim()
            : (tool.title ?? ''));
    return _jsx("pre", { className: styles.expandedOutput, children: content });
}
function getFirstToolContentText(tool) {
    const block = tool.content?.[0];
    if (block?.type !== 'content')
        return '';
    return typeof block.content?.text === 'string' ? block.content.text : '';
}
export function getToolHeaderKind(tool) {
    const name = tool.toolName.toLowerCase();
    if (isSubAgentToolCall(tool))
        return 'agent';
    if (isAskUserQuestionToolName(tool.toolName))
        return 'ask';
    if (isShellToolName(name))
        return 'shell';
    if (isWebFetchToolName(name))
        return 'fetch';
    if (isTodoWriteToolName(name))
        return 'todo';
    if (name === 'read' || name === 'read_file' || name === 'readfile')
        return 'read';
    if (name === 'edit' || name === 'editfile')
        return 'edit';
    if (name === 'write' || name === 'write_file' || name === 'writefile')
        return 'write';
    return 'other';
}
function DefaultToolHeaderExtra({ description, elapsed, }) {
    return (_jsxs(_Fragment, { children: [description && _jsx("span", { className: styles.lineArg, children: description }), elapsed && _jsx("span", { className: styles.lineElapsed, children: elapsed })] }));
}
function ToolHeaderExtra({ info }) {
    const { renderToolHeaderExtra } = useWebShellCustomization();
    const customExtra = renderToolHeaderExtra?.(info);
    if (customExtra)
        return _jsx(_Fragment, { children: customExtra });
    return (_jsx(DefaultToolHeaderExtra, { description: info.description, elapsed: info.kind === 'agent' || isActiveToolStatus(info.tool.status)
            ? info.elapsed
            : '' }));
}
function isDescriptionExpandable(description) {
    return (description.length > DESCRIPTION_EXPAND_THRESHOLD ||
        description.includes('\n'));
}
export function getActiveTool(tools) {
    return (tools.find((tool) => isActiveToolStatus(tool.status)) ??
        tools[tools.length - 1]);
}
export function formatToolGroupSummary(tools, t, workspaceCwd) {
    if (hasActiveAgents(tools)) {
        const foregroundActiveTools = tools.filter((tool) => isActiveToolStatus(tool.status) && !isBackgroundSubAgentToolCall(tool));
        if (foregroundActiveTools.length === 0) {
            return t('subagent.background');
        }
        if (foregroundActiveTools.length === 1 &&
            isAskUserQuestionToolName(foregroundActiveTools[0].toolName)) {
            return t('toolGroup.summary.provideInformation');
        }
        const activeSummaries = foregroundActiveTools.map((tool) => isAskUserQuestionToolName(tool.toolName)
            ? t('toolGroup.summary.provideInformation')
            : formatSingleToolSummary(tool, t, workspaceCwd));
        return t('toolGroup.running', {
            name: activeSummaries.join(' · '),
            count: foregroundActiveTools.length,
        });
    }
    const summary = formatCompletedToolSummary(tools, t);
    if (summary)
        return summary;
    return t('toolGroup.summary', {
        count: tools.length,
    });
}
export function formatSingleToolSummary(tool, t, workspaceCwd) {
    if (isTodoWriteToolName(tool.toolName)) {
        return t('toolGroup.summary.updatedTodos', { count: 1 });
    }
    if (isAskUserQuestionToolName(tool.toolName)) {
        return isActiveToolStatus(tool.status)
            ? t('toolGroup.summary.provideInformation')
            : t('toolGroup.summary.askedQuestions', {
                count: getAskUserQuestionCount(tool),
            });
    }
    const { displayName, description, hideDisplayName } = getSingleToolSummaryInfo(tool, t, workspaceCwd);
    return [hideDisplayName ? '' : displayName, description]
        .filter(Boolean)
        .join(' ');
}
function getSingleToolSummaryInfo(tool, t, workspaceCwd) {
    const displayName = localizeToolDisplayName(tool.toolName, t);
    const description = truncateText(getToolSummaryDescription(tool, workspaceCwd), 120);
    return {
        kind: getToolHeaderKind(tool),
        tool,
        displayName,
        description,
        elapsed: '',
        workspaceCwd,
        hideDisplayName: !!getShellToolSemanticDescription(tool),
    };
}
function SingleToolSummary({ tool, workspaceCwd, }) {
    const { t } = useI18n();
    const isAskUserQuestion = isAskUserQuestionToolName(tool.toolName);
    const isActive = isActiveToolStatus(tool.status);
    const runningPrefix = !isAskUserQuestion && isActive
        ? isBackgroundSubAgentToolCall(tool)
            ? t('subagent.background')
            : t('toolGroup.runningPrefix').trim()
        : '';
    if (isTodoWriteToolName(tool.toolName) || isAskUserQuestion) {
        return (_jsxs(_Fragment, { children: [runningPrefix && _jsxs("span", { children: [runningPrefix, " "] }), formatSingleToolSummary(tool, t, workspaceCwd)] }));
    }
    const info = getSingleToolSummaryInfo(tool, t, workspaceCwd);
    return (_jsxs(_Fragment, { children: [runningPrefix && _jsxs("span", { children: [runningPrefix, " "] }), _jsxs("span", { className: styles.chatSummaryInline, children: [!info.hideDisplayName && (_jsx("span", { className: styles.lineName, children: info.displayName })), _jsx(ToolHeaderExtra, { info: info })] })] }));
}
function formatCompletedToolSummary(tools, t) {
    let edited = 0;
    let commands = 0;
    let read = 0;
    let searched = 0;
    let todos = 0;
    let askedQuestions = 0;
    let other = 0;
    for (const tool of tools) {
        const name = tool.toolName.toLowerCase();
        if (isShellToolName(name)) {
            commands++;
        }
        else if (name === 'edit' ||
            name === 'editfile' ||
            name === 'write' ||
            name === 'write_file' ||
            name === 'writefile') {
            edited++;
        }
        else if (name === 'read' || name === 'read_file' || name === 'readfile') {
            read++;
        }
        else if (name === 'grep' ||
            name === 'grep_search' ||
            name === 'search' ||
            name === 'glob' ||
            name === 'web_search' ||
            name === 'websearch') {
            searched++;
        }
        else if (isTodoWriteToolName(name)) {
            todos++;
        }
        else if (isAskUserQuestionToolName(name)) {
            askedQuestions += getAskUserQuestionCount(tool);
        }
        else {
            other++;
        }
    }
    const parts = [
        edited ? t('toolGroup.summary.editedFiles', { count: edited }) : '',
        commands ? t('toolGroup.summary.ranCommands', { count: commands }) : '',
        read ? t('toolGroup.summary.readFiles', { count: read }) : '',
        searched ? t('toolGroup.summary.searched', { count: searched }) : '',
        todos ? t('toolGroup.summary.updatedTodos', { count: todos }) : '',
        askedQuestions
            ? t('toolGroup.summary.askedQuestions', { count: askedQuestions })
            : '',
        other ? t('toolGroup.summary.otherTools', { count: other }) : '',
    ].filter(Boolean);
    return parts.join(' ');
}
function getAskUserQuestionCount(tool) {
    const questions = tool.args?.questions;
    return Array.isArray(questions) && questions.length > 0
        ? questions.length
        : 1;
}
function PencilIcon() {
    return (_jsxs("svg", { className: styles.chatSummaryToolIcon, width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M12 20h9" }), _jsx("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" })] }));
}
function ToolGroupIcon() {
    return (_jsxs("svg", { className: styles.chatSummaryToolIcon, width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "data-testid": "chat-summary-tool-icon", "aria-hidden": "true", children: [_jsx("rect", { x: "2", y: "2", width: "10", height: "10", rx: "2.4", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M4.6 5.2 6 6.6 4.6 8", stroke: "currentColor", strokeWidth: "1.05", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M7.3 8.1h2.1", stroke: "currentColor", strokeWidth: "1.05", strokeLinecap: "round" })] }));
}
function WebFetchIcon() {
    return (_jsxs("svg", { className: styles.chatSummaryToolIcon, width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: [_jsx("circle", { cx: "7", cy: "7", r: "5.5", stroke: "currentColor", strokeWidth: "1.25" }), _jsx("path", { d: "M1.8 7h10.4M7 1.5c1.3 1.5 2 3.3 2 5.5s-.7 4-2 5.5M7 1.5C5.7 3 5 4.8 5 7s.7 4 2 5.5", stroke: "currentColor", strokeWidth: "1.05", strokeLinecap: "round" })] }));
}
function FileIcon() {
    return (_jsxs("svg", { className: styles.chatSummaryToolIcon, width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: [_jsx("rect", { x: "2", y: "1.6", width: "10", height: "10.8", rx: "2.2", stroke: "currentColor", strokeWidth: "1.25" }), _jsx("path", { d: "M4.5 5.2h5M4.5 7h5M4.5 8.8h5", stroke: "currentColor", strokeWidth: "1.15", strokeLinecap: "round" })] }));
}
function TodoIcon() {
    return (_jsx("svg", { className: styles.chatSummaryToolIcon, width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M3 4.2 4.2 5.4 6.1 3.3M7.5 4.5h3.6M3 9.1l1.2 1.2 1.9-2.1M7.5 9.4h3.6", stroke: "currentColor", strokeWidth: "1.25", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
function AskUserIcon() {
    return (_jsx("svg", { className: styles.chatSummaryToolIcon, width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M3.4 3.2h7.2c.7 0 1.25.55 1.25 1.25v3.4c0 .7-.55 1.25-1.25 1.25H7.5L4.5 11V9.1H3.4c-.7 0-1.25-.55-1.25-1.25v-3.4c0-.7.55-1.25 1.25-1.25Z", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
function AgentIcon() {
    return (_jsx("svg", { className: styles.chatSummaryToolIcon, width: "14", height: "14", viewBox: "0 0 1024 1024", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M770.08 96.32c1.728.64 3.072 1.984 3.712 3.712l38.848 107.584c.64 1.728 1.984 3.104 3.712 3.712l107.584 38.848a6.144 6.144 0 0 1 0 11.584l-107.584 38.848a6.144 6.144 0 0 0-3.712 3.712l-38.848 107.584a6.144 6.144 0 0 1-11.584 0L723.36 304.32a6.144 6.144 0 0 0-3.712-3.712L612.064 261.76a6.144 6.144 0 0 1 0-11.584l107.584-38.848a6.144 6.144 0 0 0 3.712-3.712l38.848-107.584c1.184-3.2 4.704-4.8 7.872-3.68zM576 160H384q-119.296 0-203.648 84.352Q96 328.704 96 448v192q0 119.296 84.352 203.648Q264.704 928 384 928h256q119.296 0 203.648-84.352Q928 759.296 928 640V512h-64v128q0 92.8-65.6 158.4Q732.8 864 640 864H384q-92.8 0-158.4-65.6Q160 732.8 160 640V448q0-92.8 65.6-158.4Q291.2 224 384 224h192v-64zm96 248.224L568.224 512 672 615.776l45.248-45.28L658.752 512l58.496-58.496L672 408.224zM320 608V448h64v160h-64z", stroke: "currentColor", strokeWidth: "28", strokeLinejoin: "round" }) }));
}
function ToolSummaryIcon({ tool }) {
    const kind = getToolHeaderKind(tool);
    if (kind === 'agent')
        return _jsx(AgentIcon, {});
    if (kind === 'ask')
        return _jsx(AskUserIcon, {});
    if (kind === 'edit' || kind === 'write')
        return _jsx(PencilIcon, {});
    if (kind === 'fetch')
        return _jsx(WebFetchIcon, {});
    if (kind === 'read')
        return _jsx(FileIcon, {});
    if (kind === 'todo')
        return _jsx(TodoIcon, {});
    return _jsx(ToolGroupIcon, {});
}
export function isWebFetchToolName(toolName) {
    const name = toolName.toLowerCase();
    return name === 'web_fetch' || name === 'webfetch' || name === 'fetch';
}
function areToolLinePropsEqual(prev, next) {
    if (prev.approval?.id !== next.approval?.id)
        return false;
    if (prev.workspaceCwd !== next.workspaceCwd)
        return false;
    if (prev.summaryOnly !== next.summaryOnly)
        return false;
    if (prev.forceExpanded !== next.forceExpanded)
        return false;
    if (prev.forceExpandable !== next.forceExpandable)
        return false;
    if (prev.hideHeader !== next.hideHeader)
        return false;
    if (prev.hideCollapsedOutput !== next.hideCollapsedOutput)
        return false;
    const a = prev.tool;
    const b = next.tool;
    return (a.callId === b.callId &&
        a.toolName === b.toolName &&
        a.status === b.status &&
        a.startTime === b.startTime &&
        a.endTime === b.endTime &&
        a.subContent === b.subContent &&
        a.rawOutput === b.rawOutput &&
        a.args === b.args &&
        a.content === b.content &&
        a.title === b.title &&
        areSubToolsEqual(a.subTools, b.subTools));
}
function areSubToolsEqual(prev, next) {
    if (prev === next)
        return true;
    if (!prev || !next)
        return false;
    if (prev.length !== next.length)
        return false;
    for (let i = 0; i < prev.length; i++) {
        const a = prev[i];
        const b = next[i];
        if (a.callId !== b.callId ||
            a.toolName !== b.toolName ||
            a.status !== b.status ||
            a.endTime !== b.endTime ||
            a.rawOutput !== b.rawOutput ||
            a.args !== b.args ||
            a.subContent !== b.subContent ||
            a.title !== b.title) {
            return false;
        }
    }
    return true;
}
/** Parse `[text](qwen-session://id)` links in plain-text tool output and
 * replace them with clickable `<a>` elements that dispatch a DOM event.
 * Keeps the rendering pipeline plain-text-compatible for all other tools. */
const SESSION_LINK_RE = /\[([^\]]+)\]\(qwen-session:\/\/([^)]+)\)/g;
function renderWithSessionLinks(text, renderMode) {
    if (!text || !text.includes('qwen-session://'))
        return text;
    const parts = [];
    let lastIndex = 0;
    let match;
    SESSION_LINK_RE.lastIndex = 0;
    while ((match = SESSION_LINK_RE.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const sessionId = match[2];
        parts.push(renderMode === 'readonly' ? (_jsx("span", { style: { textDecoration: 'underline' }, children: match[1] }, match.index)) : (_jsx("a", { href: "#", role: "button", style: { textDecoration: 'underline', cursor: 'pointer' }, onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('qwen:open-session', { detail: sessionId }));
            }, children: match[1] }, match.index)));
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length)
        parts.push(text.slice(lastIndex));
    return parts.length === 1 ? parts[0] : _jsx(_Fragment, { children: parts });
}
export const ToolLine = memo(function ToolLine({ tool, approval, workspaceCwd, summaryOnly = false, forceExpanded = false, forceExpandable = false, hideHeader = false, hideCollapsedOutput = false, }) {
    const { t } = useI18n();
    const transcriptRenderMode = useTranscriptRenderMode();
    const subagentDetails = useSubagentDetails();
    const monitorDetails = useMonitorDetails();
    const monitorDetailsAvailable = monitorDetails !== undefined;
    const [monitorDetailsUnavailable, setMonitorDetailsUnavailable] = useState(false);
    const [expanded, setExpanded] = useState(() => forceExpanded || shouldAutoExpand(tool));
    const monitorDetailsRequestRef = useRef(null);
    // Set once the user explicitly toggles this row, so auto-collapse-on-
    // completion never silently overrides their choice.
    const userToggledRef = useRef(false);
    useEffect(() => {
        setExpanded(forceExpanded || shouldAutoExpand(tool));
        setMonitorDetailsUnavailable(false);
        monitorDetailsRequestRef.current = null;
        // A new tool identity resets the manual latch.
        userToggledRef.current = false;
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [forceExpanded, monitorDetailsAvailable, tool.callId, tool.toolName]);
    const isAgent = isSubAgentToolCall(tool);
    const hasApproval = approval && approval.toolCallId === tool.callId;
    const hasSubToolApproval = !hasApproval &&
        approval?.toolCallId &&
        isAgent &&
        toolContainsCallId(tool, approval.toolCallId);
    const isRunningTool = isActiveToolStatus(tool.status);
    const showsLiveElapsed = isRunningTool &&
        !isShellToolName(tool.toolName) &&
        !isWebFetchToolName(tool.toolName);
    const now = useSharedNow(showsLiveElapsed);
    // Collapse a regular tool to its one-line summary once it completes
    // successfully — unless the user explicitly toggled this row, in which case
    // their choice wins. Agents are excluded (they keep whatever expand state the
    // user chose, driven from their own panel) and failures stay open so the
    // error output remains visible.
    useEffect(() => {
        if (!forceExpanded &&
            !isAgent &&
            tool.status === 'completed' &&
            !userToggledRef.current) {
            setExpanded(false);
        }
    }, [forceExpanded, isAgent, tool.status]);
    if (isAgent) {
        const info = getAgentDisplayInfo(tool, now);
        const displayName = info.explicitAgentType
            ? `${t('agent.label')} (${localizeAgentTypeName(info.explicitAgentType, t)})`
            : t('agent.label');
        const isComplete = tool.status === 'completed' || tool.status === 'failed';
        const isBackground = isBackgroundSubAgentToolCall(tool);
        const progressLabel = isBackground && !isComplete
            ? t('subagent.background')
            : tool.status === 'pending'
                ? t('subagent.pending')
                : t('subagent.running');
        const runningMeta = [
            progressLabel,
            isBackground && !isComplete ? '' : info.elapsed,
        ]
            .filter(Boolean)
            .join(' · ');
        const completeMeta = [
            info.subToolCount > 0
                ? t('subagent.toolsCount', { count: info.subToolCount })
                : '',
            info.elapsed,
            info.tokens,
            info.reason ? truncateText(info.reason, 80) : '',
        ]
            .filter(Boolean)
            .join(' · ');
        const showExpanded = forceExpanded || expanded || !!hasApproval || !!hasSubToolApproval;
        const panel = (_jsx(SubAgentPanel, { tool: tool, hideHeader: true, defaultExpanded: true, inline: true }));
        if (subagentDetails && !hideHeader) {
            return (_jsx("div", { className: styles.line, children: _jsxs("button", { type: "button", className: `${styles.lineMain} ${styles.lineExpandable} ${styles.lineButton}`, onClick: () => subagentDetails.onOpen(tool), children: [_jsx(AgentIcon, {}), _jsx(StatusIcon, { status: isComplete ? info.status : tool.status }), _jsx("span", { className: styles.lineName, children: displayName }), _jsx(ToolHeaderExtra, { info: {
                                kind: 'agent',
                                tool,
                                displayName,
                                description: info.description
                                    ? truncateText(info.description, 60)
                                    : '',
                                elapsed: isComplete ? completeMeta : runningMeta,
                                workspaceCwd,
                            } }), _jsx("span", { className: styles.lineChevronRight, "aria-hidden": "true" })] }) }));
        }
        return (_jsxs("div", { className: styles.line, children: [!hideHeader && (_jsxs("div", { className: `${styles.lineMain} ${styles.lineExpandable}`, onClick: () => setExpanded(!expanded), children: [_jsx(AgentIcon, {}), _jsx(StatusIcon, { status: isComplete ? info.status : tool.status }), _jsx("span", { className: styles.lineName, children: displayName }), _jsx(ToolHeaderExtra, { info: {
                                kind: 'agent',
                                tool,
                                displayName,
                                description: info.description
                                    ? truncateText(info.description, 60)
                                    : '',
                                elapsed: isComplete ? completeMeta : runningMeta,
                                workspaceCwd,
                            } }), _jsx("span", { className: expanded ? styles.lineChevronDown : styles.lineChevronRight, "aria-hidden": "true" })] })), showExpanded && (_jsx("div", { className: styles.lineDetail, children: hideHeader ? (_jsx("div", { className: styles.expandedAgentCard, children: panel })) : (panel) }))] }));
    }
    const fullDescription = getToolDescription(tool, workspaceCwd);
    const result = getToolResultSummary(tool);
    const summaryShell = summaryOnly && isShellToolName(tool.toolName);
    const description = summaryShell
        ? getToolSummaryDescription(tool, workspaceCwd)
        : fullDescription;
    const displayName = localizeToolDisplayName(tool.toolName, t);
    const elapsed = isShellToolName(tool.toolName) || isWebFetchToolName(tool.toolName)
        ? ''
        : formatElapsed(tool.startTime, isRunningTool ? now : tool.endTime);
    const name = tool.toolName.toLowerCase();
    const opensMonitorDetails = name === 'monitor' &&
        monitorDetailsAvailable &&
        !monitorDetailsUnavailable &&
        !hideHeader;
    const isTodo = isTodoWriteToolName(name);
    const todoItems = isTodo ? extractTodosFromToolCall(tool) : undefined;
    const hasTodoList = !!todoItems && todoItems.length > 0;
    const todoCompleted = todoItems
        ? todoItems.filter((td) => td.status === 'completed').length
        : 0;
    const isShell = isShellToolName(name);
    const isSearch = name === 'grep' ||
        name === 'grep_search' ||
        name === 'search' ||
        name === 'glob';
    const isRead = name === 'read' || name === 'read_file' || name === 'readfile';
    // A row expands when it has a todo list to reveal, detail output
    // (bash/diff/read content), or a description long enough to be ellipsised.
    // When a long description is expanded we move it out of the header into a
    // wrapped block below, so the header drops its single-line copy.
    const descExpandable = !isTodo && isDescriptionExpandable(description);
    const expandable = !forceExpanded &&
        (forceExpandable ||
            (isTodo ? hasTodoList : hasExpandableContent(tool) || descExpandable));
    const interactive = opensMonitorDetails || expandable;
    const fallbackToMonitorInline = () => {
        setMonitorDetailsUnavailable(true);
        if (!expandable)
            return;
        userToggledRef.current = true;
        setExpanded((value) => !value);
    };
    const tryOpenMonitorDetails = () => {
        if (!monitorDetails)
            return;
        openMonitorDetailsOnce(monitorDetailsRequestRef, () => monitorDetails.onOpen(tool), fallbackToMonitorInline);
    };
    // Whether the expanded row renders a kind-specific detail view. When it does
    // not (e.g. grep/glob/web_fetch with a long description), keep the result
    // summary visible instead of replacing it with an empty detail area.
    const detailView = hasDetailView(tool);
    const showDescriptionInDetail = expanded && descExpandable;
    const useMarkdownDetail = isRead;
    const hideDescriptionInHeader = showDescriptionInDetail && !isShell && !isSearch && !isRead;
    const expandedCardDetail = fullDescription;
    const showExpandedSummaryPanel = !isTodo && expanded && !detailView && (showDescriptionInDetail || result);
    return (_jsxs("div", { className: styles.line, children: [hideHeader && isRunningTool && elapsed && (_jsx("div", { className: styles.lineMain, children: _jsx(ToolHeaderExtra, { info: {
                        kind: getToolHeaderKind(tool),
                        tool,
                        displayName,
                        description: '',
                        elapsed,
                        workspaceCwd,
                    } }) })), !hideHeader && (_jsxs("div", { className: `${styles.lineMain} ${interactive ? styles.lineExpandable : ''}`, title: opensMonitorDetails
                    ? undefined
                    : expandable
                        ? expanded
                            ? t('tool.collapseHint')
                            : t('tool.expand')
                        : undefined, "aria-expanded": opensMonitorDetails ? undefined : expandable ? expanded : undefined, role: interactive ? 'button' : undefined, tabIndex: interactive ? 0 : undefined, onClick: interactive
                    ? () => {
                        if (opensMonitorDetails) {
                            tryOpenMonitorDetails();
                            return;
                        }
                        userToggledRef.current = true;
                        setExpanded((value) => !value);
                    }
                    : undefined, onKeyDown: interactive
                    ? (event) => {
                        if (event.key !== 'Enter' && event.key !== ' ')
                            return;
                        event.preventDefault();
                        if (opensMonitorDetails) {
                            tryOpenMonitorDetails();
                            return;
                        }
                        userToggledRef.current = true;
                        setExpanded((value) => !value);
                    }
                    : undefined, children: [_jsx(ToolSummaryIcon, { tool: tool }), _jsx(StatusIcon, { status: tool.status }), _jsx("span", { className: styles.lineName, children: displayName }), isTodo && hasTodoList && (_jsxs("span", { className: styles.todoProgress, children: [todoCompleted, "/", todoItems.length] })), _jsx(ToolHeaderExtra, { info: {
                            kind: getToolHeaderKind(tool),
                            tool,
                            displayName,
                            // A todo row carries its checklist in the body below; a redundant
                            // "Update Todos" description and the instant write duration would
                            // only clutter the header next to the progress count.
                            description: isTodo || hideDescriptionInHeader ? '' : description,
                            elapsed: isTodo ? '' : elapsed,
                            workspaceCwd,
                        } }), interactive && (_jsx("span", { className: !opensMonitorDetails && expanded
                            ? styles.lineChevronDown
                            : styles.lineChevronRight, "aria-hidden": "true" }))] })), (!summaryOnly || expanded) && isTodo && hasTodoList && (_jsx(TodoToolBody, { tool: tool, todos: todoItems, expanded: expanded, title: displayName })), (!summaryOnly || expanded) && isTodo && !hasTodoList && result && (_jsx("div", { className: styles.lineOutput, children: renderWithSessionLinks(result, transcriptRenderMode) })), showExpandedSummaryPanel && (_jsx(ToolExpandedCard, { title: displayName, detail: expandedCardDetail, children: result && (_jsx("div", { className: `${styles.lineOutput} ${styles.expandedLineOutput}`, children: renderWithSessionLinks(result, transcriptRenderMode) })) })), !isTodo &&
                !hideCollapsedOutput &&
                result &&
                !showExpandedSummaryPanel &&
                (!expanded || !detailView) &&
                (!summaryOnly || expanded) && (_jsx("div", { className: expanded
                    ? `${styles.lineOutput} ${styles.expandedLineOutput}`
                    : styles.lineOutput, children: renderWithSessionLinks(result, transcriptRenderMode) })), !isTodo && expanded && detailView && (_jsx("div", { className: useMarkdownDetail
                    ? `${styles.lineDetail} ${styles.markdownLineDetail}`
                    : styles.lineDetail, children: isRead ? (_jsx(ExpandedReadContent, { tool: tool })) : (_jsxs(ToolExpandedCard, { title: displayName, detail: expandedCardDetail, children: [isShellToolName(name) && _jsx(ExpandedBashOutput, { tool: tool }), (name === 'write_file' || name === 'writefile') && (_jsx(ExpandedEditContent, { tool: tool })), (name === 'edit' || name === 'write' || name === 'editfile') && (_jsx(ExpandedEditContent, { tool: tool })), isAskUserQuestionToolName(tool.toolName) && (_jsx(ExpandedAskUserQuestionOutput, { tool: tool })), isSkillToolName(name) && _jsx(ExpandedSkillOutput, { tool: tool })] })) }))] }));
}, areToolLinePropsEqual);
export const ToolGroup = memo(function ToolGroup({ tools, pendingApproval, workspaceCwd, isLocateFlashing = false, }) {
    const { t } = useI18n();
    const subagentDetails = useSubagentDetails();
    const monitorDetails = useMonitorDetails();
    const monitorDetailsAvailable = monitorDetails !== undefined;
    const [monitorDetailsUnavailable, setMonitorDetailsUnavailable] = useState(false);
    const [chatExpanded, setChatExpanded] = useState(false);
    const monitorDetailsRequestRef = useRef(null);
    const hasRunningTool = hasActiveAgents(tools);
    const hasFailedTool = tools.some((tool) => tool.status === 'failed');
    const activeTool = tools.find((tool) => isActiveToolStatus(tool.status) && !isBackgroundSubAgentToolCall(tool)) ?? (tools.length > 0 ? getActiveTool(tools) : undefined);
    const singleTool = tools.length === 1 ? tools[0] : undefined;
    const singleSubagent = singleTool && isSubAgentToolCall(singleTool) ? singleTool : undefined;
    const singleMonitor = singleTool && singleTool.toolName.toLowerCase() === 'monitor'
        ? singleTool
        : undefined;
    const hasForegroundActiveTool = tools.some((tool) => isActiveToolStatus(tool.status) && !isBackgroundSubAgentToolCall(tool));
    const animateSummary = hasRunningTool && hasForegroundActiveTool;
    const opensSubagentDetails = Boolean(singleSubagent && subagentDetails);
    const opensMonitorDetails = Boolean(singleMonitor && monitorDetailsAvailable && !monitorDetailsUnavailable);
    const opensToolDetails = opensSubagentDetails || opensMonitorDetails;
    const summaryIconTool = hasRunningTool ? (activeTool ?? tools[0]) : tools[0];
    const hasApprovalTool = pendingApproval?.toolCallId &&
        tools.some((t) => toolContainsCallId(t, pendingApproval.toolCallId));
    useEffect(() => {
        setMonitorDetailsUnavailable(false);
        setChatExpanded(false);
        monitorDetailsRequestRef.current = null;
    }, [monitorDetailsAvailable, singleMonitor?.callId]);
    const tryOpenMonitorDetails = () => {
        if (!singleMonitor || !monitorDetails)
            return;
        openMonitorDetailsOnce(monitorDetailsRequestRef, () => monitorDetails.onOpen(singleMonitor), () => {
            setMonitorDetailsUnavailable(true);
            setChatExpanded((value) => !value);
        });
    };
    if (!hasApprovalTool) {
        return (_jsxs("div", { className: isLocateFlashing ? flashStyles.flash : undefined, children: [_jsxs("button", { type: "button", className: styles.chatSummary, onClick: () => {
                        if (singleSubagent && subagentDetails) {
                            subagentDetails.onOpen(singleSubagent);
                            return;
                        }
                        if (opensMonitorDetails && singleMonitor && monitorDetails) {
                            tryOpenMonitorDetails();
                            return;
                        }
                        setChatExpanded((value) => !value);
                    }, "aria-expanded": opensToolDetails ? undefined : chatExpanded, title: opensToolDetails
                        ? undefined
                        : chatExpanded
                            ? t('tool.collapseHint')
                            : t('tool.expand'), children: [_jsx("span", { className: styles.chatSummaryIcon, "aria-hidden": "true", children: summaryIconTool ? (_jsx(ToolSummaryIcon, { tool: summaryIconTool })) : (_jsx(ToolGroupIcon, {})) }), hasFailedTool && _jsx(StatusIcon, { status: "failed" }), _jsx("span", { className: animateSummary
                                ? `${styles.chatSummaryText} ${styles.chatSummaryTextActive}`
                                : styles.chatSummaryText, children: singleTool ? (_jsx(SingleToolSummary, { tool: singleTool, workspaceCwd: workspaceCwd })) : (formatToolGroupSummary(tools, t, workspaceCwd)) }), _jsx("span", { className: chatExpanded ? styles.chatChevronDown : styles.chatChevronRight, "aria-hidden": "true" })] }), _jsx("div", { className: chatExpanded
                        ? styles.chatSummaryContentClip
                        : `${styles.chatSummaryContentClip} ${styles.chatSummaryContentCollapsed}`, children: _jsx("div", { className: styles.chatSummaryContentInner, children: _jsx("div", { className: `${styles.group} ${styles.chatSummaryGroup}`, children: tools.map((tool) => (_jsx(ToolLine, { tool: tool, approval: pendingApproval, workspaceCwd: workspaceCwd, summaryOnly: !singleTool, forceExpanded: !!singleTool, hideHeader: !!singleTool }, tool.callId))) }) }) })] }));
    }
    return (_jsx("div", { className: `${styles.group}${isLocateFlashing ? ` ${flashStyles.flash}` : ''}`, children: tools.map((tool) => (_jsx(ToolLine, { tool: tool, approval: pendingApproval, workspaceCwd: workspaceCwd }, tool.callId))) }));
});
//# sourceMappingURL=ToolGroup.js.map