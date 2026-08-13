import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Box, Text } from 'ink';
import { ToolCallStatus } from '../../types.js';
import { DiffRenderer } from './DiffRenderer.js';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { AnsiOutputText, ShellStatsBar } from '../AnsiOutput.js';
import { MaxSizedBox, MINIMUM_MAX_HEIGHT } from '../shared/MaxSizedBox.js';
import { TodoDisplay } from '../TodoDisplay.js';
import { formatVisionBridgeNoticeDisplay, isTerminalImageDisplay, isVisionBridgeNoticeDisplay, ToolNames, ToolNamesMigration, } from '@qwen-code/qwen-code-core';
import { ToolConfirmationMessage } from './ToolConfirmationMessage.js';
import { PlanSummaryDisplay } from '../PlanSummaryDisplay.js';
import { ShellInputPrompt } from '../ShellInputPrompt.js';
import { SHELL_COMMAND_NAME, SHELL_NAME, ICON } from '../../constants.js';
import { isCollapsibleTool } from './CompactToolGroupDisplay.js';
import { localizeToolDisplayName } from '../../../i18n/index.js';
import { formatDuration, formatTokenCount } from '../../utils/formatters.js';
import { theme } from '../../semantic-colors.js';
import { useSettings } from '../../contexts/SettingsContext.js';
import { escapeAnsiCtrlCodes, sanitizeTerminalText, getCachedStringWidth, sanitizeMultilineForDisplay, toCodePoints, } from '../../utils/textUtils.js';
import { TOOL_DISPLAY_BY_NAME } from '../../utils/tool-display-map.js';
import { ToolStatusIndicator, STATUS_INDICATOR_WIDTH, } from '../shared/ToolStatusIndicator.js';
import { ToolElapsedTime } from '../shared/ToolElapsedTime.js';
import { TerminalImage } from '../TerminalImage.js';
import { formatInlineImageOverflow } from '../../utils/inline-image-parts.js';
// Names that resolve to the agent tool: the canonical name plus whatever
// legacy request aliases core's migration map declares (e.g. 'task').
// Tool-usage stats key on the raw request name, so the scrollback
// sub-agent count must accept all of them.
const AGENT_TOOL_NAMES = new Set([
    ToolNames.AGENT,
    ...Object.entries(ToolNamesMigration)
        .filter(([, canonical]) => canonical === ToolNames.AGENT)
        .map(([legacy]) => legacy),
]);
// How many of the subagent's prior tool calls to list above an approval
// prompt — enough to show what led up to the request without pushing the
// confirmation itself off-screen.
const APPROVAL_CONTEXT_CALLS = 3;
const STATIC_HEIGHT = 1;
const RESERVED_LINE_COUNT = 5; // for tool name, status, padding etc.
const MIN_LINES_SHOWN = 2; // show at least this many lines
const DEFAULT_SHELL_OUTPUT_MAX_LINES = 5;
// Large threshold to ensure we don't cause performance issues for very large
// outputs that will get truncated further MaxSizedBox anyway.
const MAXIMUM_RESULT_DISPLAY_CHARACTERS = 1000000;
function sliceTextForMaxHeight(text, maxHeight, maxWidth) {
    if (maxHeight === undefined) {
        return { text, hiddenLinesCount: 0 };
    }
    const targetMaxHeight = Math.max(Math.round(maxHeight), MINIMUM_MAX_HEIGHT);
    const visibleContentHeight = targetMaxHeight - 1;
    const visualWidth = Math.max(1, Math.floor(maxWidth));
    const visibleLines = [];
    let visualLineCount = 0;
    let currentLine = '';
    let currentLineWidth = 0;
    const appendVisibleLine = (line, breakAfter) => {
        visualLineCount += 1;
        visibleLines.push({ text: line, breakAfter });
        if (visibleLines.length > visibleContentHeight) {
            visibleLines.shift();
        }
    };
    const flushCurrentLine = (breakAfter) => {
        appendVisibleLine(currentLine, breakAfter);
        currentLine = '';
        currentLineWidth = 0;
    };
    for (const char of toCodePoints(text)) {
        if (char === '\n') {
            flushCurrentLine({ kind: 'hard', joiner: '\n' });
            continue;
        }
        const charWidth = Math.max(getCachedStringWidth(char), 1);
        if (currentLineWidth > 0 && currentLineWidth + charWidth > visualWidth) {
            flushCurrentLine({ kind: 'soft', joiner: '' });
        }
        currentLine += char;
        currentLineWidth += charWidth;
    }
    flushCurrentLine(null);
    if (visualLineCount <= targetMaxHeight) {
        return { text, hiddenLinesCount: 0 };
    }
    const hiddenLinesCount = visualLineCount - visibleContentHeight;
    return {
        text: visibleLines.map((line) => line.text).join('\n'),
        hiddenLinesCount,
        sourceBoundaries: visibleLines
            .slice(0, -1)
            .map((line) => line.breakAfter ?? { kind: 'hard', joiner: '\n' }),
    };
}
/**
 * Custom hook to determine the type of result display and return appropriate rendering info
 */
const useResultDisplayRenderer = (resultDisplay) => React.useMemo(() => {
    if (!resultDisplay) {
        return { type: 'none' };
    }
    if (isTerminalImageDisplay(resultDisplay)) {
        return { type: 'image', data: resultDisplay };
    }
    // Check for TodoResultDisplay
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'todo_list') {
        return {
            type: 'todo',
            data: resultDisplay,
        };
    }
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'plan_summary') {
        return {
            type: 'plan',
            data: resultDisplay,
        };
    }
    // Check for SubagentExecutionResultDisplay (for non-task tools)
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'task_execution') {
        return {
            type: 'task',
            data: resultDisplay,
        };
    }
    // Check for FileDiff
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'fileDiff' in resultDisplay) {
        return {
            type: 'diff',
            data: resultDisplay,
        };
    }
    // Check for McpToolProgressData
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        resultDisplay.type === 'mcp_tool_progress') {
        const progress = resultDisplay;
        const msg = progress.message ?? `Progress: ${progress.progress}`;
        const totalStr = progress.total != null ? `/${progress.total}` : '';
        return {
            type: 'string',
            data: `◌ [${progress.progress}${totalStr}] ${msg}`,
        };
    }
    // Check for AnsiOutput
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'ansiOutput' in resultDisplay) {
        const display = resultDisplay;
        return {
            type: 'ansi',
            data: display.ansiOutput,
            stats: {
                totalLines: display.totalLines,
                totalBytes: display.totalBytes,
            },
        };
    }
    // TeamResultDisplay / TaskListResultDisplay — handled by their tools'
    // returnDisplay text; don't render the structured object inline.
    if (typeof resultDisplay === 'object' &&
        resultDisplay !== null &&
        'type' in resultDisplay &&
        (resultDisplay.type === 'team_result' ||
            resultDisplay.type === 'task_list')) {
        return { type: 'none' };
    }
    // Default to string — safeguard against non-string objects
    return {
        type: 'string',
        data: typeof resultDisplay === 'string'
            ? resultDisplay
            : JSON.stringify(resultDisplay),
    };
}, [resultDisplay]);
/**
 * Component to render todo list results
 */
const TodoResultRenderer = ({ data, }) => _jsx(TodoDisplay, { todos: data.todos });
const PlanResultRenderer = ({ data, availableHeight, childWidth }) => (_jsx(PlanSummaryDisplay, { data: data, availableHeight: availableHeight, childWidth: childWidth }));
/**
 * The subagent's most recent tool calls that lead up to a parked
 * permission request (excluding the call awaiting approval itself,
 * newest last, capped at `APPROVAL_CONTEXT_CALLS`). Each renders as one
 * line above the confirmation prompt, so the caller also uses the count
 * to reserve height for the confirmation.
 */
const priorApprovalCalls = (data) => (data.toolCalls ?? [])
    .filter((call) => call.status !== 'awaiting_approval')
    .slice(-APPROVAL_CONTEXT_CALLS);
/**
 * The last few tool calls the subagent made before parking a permission
 * request — rendered between the "Approval requested by" header and the
 * confirmation prompt so the user can judge WHY the agent wants to run
 * this call instead of approving an isolated command blind (the
 * permission-context ask of issue #6569).
 */
const SubagentApprovalContext = ({ data }) => {
    const priorCalls = priorApprovalCalls(data);
    if (priorCalls.length === 0)
        return null;
    return (_jsx(Box, { flexDirection: "column", children: priorCalls.map((call) => {
            const glyph = call.status === 'failed'
                ? '✖'
                : call.status === 'success'
                    ? '✔'
                    : ICON.CIRCLE_EMPTY;
            const displayName = localizeToolDisplayName(TOOL_DISPLAY_BY_NAME[call.name] ?? call.name);
            const desc = (call.description ?? '').replace(/\s*\n\s*/g, ' ').trim();
            const label = desc ? `${displayName} ${desc}` : displayName;
            return (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate-end", children: `  ${glyph} ${sanitizeMultilineForDisplay(label)}` }) }, call.callId));
        }) }));
};
/**
 * Component to render subagent execution results.
 *
 * The verbose inline frame has been retired. Three surfaces remain:
 *
 * - **Running**: nothing inline — `LiveAgentPanel` (the always-on
 *   bottom roster) and `BackgroundTasksDialog` (Down-arrow detail
 *   view) own progress reporting. `ToolGroupMessage` filters
 *   running task entries out of the live phase entirely so the
 *   group container doesn't even attempt to render this renderer.
 * - **Approval prompt (focus-locked)**: full inline approval banner
 *   so the user can answer without context-switching into the dialog;
 *   sibling subagents render a queued marker.
 * - **Terminal (completed / failed / cancelled)**: a single-line
 *   scrollback summary so the conversation history retains a
 *   permanent record after the panel evicts. Fires regardless of
 *   `isPending` — `unregisterForeground`'s post-delete emit drops
 *   the panel snapshot row immediately, so the inline summary is
 *   the only surface that bridges the moment a foreground subagent
 *   finishes mid-parent-turn until the parent commits.
 *   Format: `<icon> <type>: <description> · N tools · Xs · Yk tokens`.
 *
 * `isPending` is no longer used as a render gate here; the live-phase
 * filter in `ToolGroupMessage` handles the running case before this
 * renderer is reached. The prop is kept on the signature for future
 * needs and parity with sibling renderers.
 */
const SubagentExecutionRenderer = ({ data, availableHeight, childWidth, config, isFocused }) => {
    if (data.pendingConfirmation && isFocused) {
        // `subagentName` is user-authored / model-chosen and may carry
        // ANSI control sequences; escape before rendering into Ink Text
        // (matches LiveAgentPanel + SubagentScrollbackSummary).
        const agentLabel = escapeAnsiCtrlCodes(data.subagentName || 'agent');
        // Reserve height for everything this component renders above the
        // confirmation prompt — the "Approval requested by" header (1 line)
        // plus one sibling line per prior call — out of the confirmation's
        // budget, so the question and its options never get clipped off-screen
        // in a short terminal. Approving blind is the exact failure this context
        // is meant to prevent, so the confirmation prompt must always win.
        const HEADER_LINES = 1;
        const contextLines = priorApprovalCalls(data).length;
        const confirmationHeight = availableHeight !== undefined
            ? Math.max(MINIMUM_MAX_HEIGHT, availableHeight - contextLines - HEADER_LINES)
            : availableHeight;
        return (_jsxs(Box, { flexDirection: "column", paddingLeft: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: theme.text.secondary, children: "Approval requested by " }), _jsx(Text, { bold: true, color: theme.text.accent, children: agentLabel }), _jsx(Text, { color: theme.text.secondary, children: ":" })] }), _jsx(SubagentApprovalContext, { data: data }), _jsx(ToolConfirmationMessage, { confirmationDetails: data.pendingConfirmation, isFocused: isFocused, availableTerminalHeight: confirmationHeight, contentWidth: childWidth - 2, compactMode: true, config: config })] }));
    }
    if (data.pendingConfirmation) {
        // `subagentName` is user-authored / model-chosen and may carry
        // ANSI control sequences; escape before rendering into Ink Text
        // (matches LiveAgentPanel + SubagentScrollbackSummary).
        const agentLabel = escapeAnsiCtrlCodes(data.subagentName || 'agent');
        return (_jsxs(Box, { paddingLeft: 1, children: [_jsxs(Text, { color: theme.text.secondary, dimColor: true, children: ["\u25CC Queued approval:", ' '] }), _jsx(Text, { dimColor: true, children: agentLabel })] }));
    }
    // Terminal phase: render a single-line scrollback summary so the
    // conversation history keeps a permanent record. Fires in BOTH
    // live and committed phases — `unregisterForeground`'s post-delete
    // emit drops the panel snapshot row immediately, so without an
    // inline render here a foreground subagent that finishes
    // mid-parent-turn would simply disappear from screen until commit.
    // No duplication risk because the panel never re-resurrects a
    // dropped foreground entry. Skip `running` / `background` since the
    // panel + dialog cover those.
    if (data.status === 'completed' ||
        data.status === 'failed' ||
        data.status === 'cancelled') {
        return _jsx(SubagentScrollbackSummary, { data: data });
    }
    return null;
};
/**
 * One-line summary that lands in scrollback when a subagent reaches a
 * terminal state. The verbose 15-row frame is retired (it caused
 * scrollback flicker); this single line preserves the persistent
 * record without re-introducing the flicker.
 *
 *   ✔ researcher: investigate import order · 5 tools · 12s · 2.4k tokens
 */
const SubagentScrollbackSummary = ({ data }) => {
    const { glyph, color } = (() => {
        switch (data.status) {
            case 'completed':
                return { glyph: '✔', color: theme.status.success };
            case 'failed':
                return { glyph: '✖', color: theme.status.error };
            case 'cancelled':
                return { glyph: '✖', color: theme.status.warning };
            default:
                return { glyph: '·', color: theme.text.secondary };
        }
    })();
    const stats = data.executionSummary;
    const parts = [];
    if (stats?.totalToolCalls !== undefined) {
        parts.push(`${stats.totalToolCalls} tool${stats.totalToolCalls === 1 ? '' : 's'}`);
    }
    // Direct children this agent spawned = its successful AgentTool calls
    // (per-tool usage already rides in executionSummary — no extra
    // plumbing). Blocked spawns (depth/fork guards) return an error result
    // and land in `failure`, so they don't count.
    const subagentSpawns = (stats?.toolUsage ?? [])
        .filter((tu) => AGENT_TOOL_NAMES.has(tu.name))
        .reduce((sum, tu) => sum + tu.success, 0);
    if (subagentSpawns > 0) {
        parts.push(`${subagentSpawns} sub-agent${subagentSpawns === 1 ? '' : 's'}`);
    }
    if (stats?.totalDurationMs !== undefined) {
        parts.push(formatDuration(stats.totalDurationMs, { hideTrailingZeros: true }));
    }
    if (stats?.outputTokens && stats.outputTokens > 0) {
        parts.push(`${formatTokenCount(stats.outputTokens)} tokens`);
    }
    // Sanitize every user/LLM-controlled string before it reaches Ink.
    // `subagentName` is subagent config (user-authored or model-chosen),
    // `taskDescription` is LLM-generated, `terminateReason` is whatever
    // the agent emitted on failure. All can carry terminal control
    // sequences that would otherwise bleed through Ink's `<Text>` and
    // corrupt scrollback chrome — same threat model as the panel rows
    // and HistoryItemDisplay's user-facing content.
    const tail = parts.length > 0 ? ` · ${parts.join(' · ')}` : '';
    const typePrefix = data.subagentName
        ? `${escapeAnsiCtrlCodes(data.subagentName)}: `
        : '';
    const safeDescription = escapeAnsiCtrlCodes(data.taskDescription ?? '');
    const reason = data.status !== 'completed' && data.terminateReason
        ? ` · ${escapeAnsiCtrlCodes(data.terminateReason)}`
        : '';
    return (_jsx(Box, { paddingLeft: 1, children: _jsxs(Text, { wrap: "truncate-end", children: [_jsx(Text, { color: color, children: `${glyph} ` }), _jsx(Text, { bold: true, children: typePrefix }), _jsx(Text, { color: theme.text.secondary, children: safeDescription }), _jsx(Text, { color: theme.text.secondary, children: tail }), _jsx(Text, { color: theme.text.secondary, children: reason })] }) }));
};
/**
 * Component to render string results (markdown or plain text)
 */
const StringResultRenderer = ({ data, renderAsMarkdown, availableHeight, childWidth }) => {
    let displayData = data;
    // Truncate if too long
    if (displayData.length > MAXIMUM_RESULT_DISPLAY_CHARACTERS) {
        displayData = '...' + displayData.slice(-MAXIMUM_RESULT_DISPLAY_CHARACTERS);
    }
    if (renderAsMarkdown) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(MarkdownDisplay, { text: displayData, isPending: false, availableTerminalHeight: availableHeight, contentWidth: childWidth }) }));
    }
    const sliced = sliceTextForMaxHeight(displayData, availableHeight, childWidth);
    return (_jsx(MaxSizedBox, { maxHeight: availableHeight, maxWidth: childWidth, additionalHiddenLinesCount: sliced.hiddenLinesCount, sourceBoundaries: sliced.sourceBoundaries, children: _jsx(Box, { children: _jsx(Text, { wrap: "wrap", color: theme.text.primary, children: sliced.text }) }) }));
};
/**
 * Component to render diff results
 */
const DiffResultRenderer = ({ data, availableHeight, childWidth, settings }) => {
    const diffHeight = data.truncatedForSession && availableHeight !== undefined
        ? Math.max(1, availableHeight - 1)
        : availableHeight;
    return (_jsxs(Box, { flexDirection: "column", children: [data.truncatedForSession && (_jsxs(Text, { color: theme.status.warning, wrap: "wrap", children: [data.fileDiffTruncated
                        ? 'Saved session preview only; full diff omitted from JSONL'
                        : 'Saved session preview only; full file contents truncated in JSONL', data.fileDiffTruncated && typeof data.fileDiffLength === 'number'
                        ? ` (${data.fileDiffLength} chars).`
                        : '.'] })), _jsx(DiffRenderer, { diffContent: data.fileDiff, filename: data.fileName, availableTerminalHeight: diffHeight, contentWidth: childWidth, settings: settings })] }));
};
export const ToolMessage = ({ name, description, resultDisplay, confirmationDetails, images, omittedImageCount, visionBridgeNotice, detailedDisplay, status, availableTerminalHeight, contentWidth, emphasis = 'medium', renderOutputAsMarkdown = true, activeShellPtyId, embeddedShellFocused, ptyId, config, forceShowResult, fullDetail, isFocused, isPending, executionStartTime, }) => {
    const settings = useSettings();
    const isThisShellFocused = (name === SHELL_COMMAND_NAME || name === SHELL_NAME) &&
        status === ToolCallStatus.Executing &&
        ptyId === activeShellPtyId &&
        embeddedShellFocused;
    const [lastUpdateTime, setLastUpdateTime] = React.useState(null);
    const [userHasFocused, setUserHasFocused] = React.useState(false);
    const [showFocusHint, setShowFocusHint] = React.useState(false);
    React.useEffect(() => {
        if (resultDisplay) {
            setLastUpdateTime(new Date());
        }
    }, [resultDisplay]);
    // Shell tools surface their configured timeout via AnsiOutputDisplay as
    // soon as streaming starts. Feed it into ToolElapsedTime so the budget is
    // shown inline (`(elapsed · timeout N)`) instead of in a separate stats
    // row.
    const shellTimeoutMs = React.useMemo(() => {
        if (typeof resultDisplay === 'object' &&
            resultDisplay !== null &&
            'ansiOutput' in resultDisplay) {
            return resultDisplay.timeoutMs;
        }
        return undefined;
    }, [resultDisplay]);
    React.useEffect(() => {
        if (!lastUpdateTime) {
            return;
        }
        const timer = setTimeout(() => {
            setShowFocusHint(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [lastUpdateTime]);
    React.useEffect(() => {
        if (isThisShellFocused) {
            setUserHasFocused(true);
        }
    }, [isThisShellFocused]);
    const isThisShellFocusable = (name === SHELL_COMMAND_NAME || name === SHELL_NAME) &&
        status === ToolCallStatus.Executing &&
        config?.getShouldUseNodePtyShell();
    const shouldShowFocusHint = isThisShellFocusable && (showFocusHint || userHasFocused);
    const availableHeight = availableTerminalHeight
        ? Math.max(availableTerminalHeight - STATIC_HEIGHT - RESERVED_LINE_COUNT, MIN_LINES_SHOWN + 1)
        : undefined;
    const inlineImageHeight = availableHeight !== undefined && images?.length
        ? Math.max(1, Math.floor(availableHeight / (images.length + 1)))
        : availableHeight;
    // Cap inline shell output. Applies to both the streaming ANSI display and
    // the completed string display (shell.ts emits the final result as a plain
    // string via `returnDisplayMessage = result.output`). ShellStatsBar surfaces
    // hidden lines via `+N lines` for ANSI; MaxSizedBox handles overflow for string.
    const isShellTool = name === SHELL_COMMAND_NAME || name === SHELL_NAME;
    const rawShellCap = settings.merged.ui?.shellOutputMaxLines ?? DEFAULT_SHELL_OUTPUT_MAX_LINES;
    // Defensive: clamp non-negative integers; treat negatives / NaN / fractions
    // as the user's clear intent (0 = disable, otherwise floor to whole rows).
    const shellOutputMaxLines = Math.max(0, Math.floor(rawShellCap || 0));
    const isCappingShell = isShellTool &&
        shellOutputMaxLines > 0 &&
        !forceShowResult &&
        !isThisShellFocused;
    const shellCapHeight = isCappingShell
        ? Math.min(availableHeight ?? shellOutputMaxLines, shellOutputMaxLines)
        : availableHeight;
    // String path: MaxSizedBox reserves one row for its overflow banner when
    // content overflows (see MaxSizedBox.tsx visibleContentHeight = max - 1),
    // so passing the bare cap shows N-1 content rows. ANSI pre-slices to N
    // (no MaxSizedBox overflow) and renders N rows + the ShellStatsBar line.
    // +1 keeps the two paths visually symmetric at N visible content rows.
    const shellStringCapHeight = isCappingShell && shellCapHeight !== undefined
        ? shellCapHeight + 1
        : availableHeight;
    const innerWidth = contentWidth - STATUS_INDICATOR_WIDTH;
    // Long tool call response in MarkdownDisplay doesn't respect availableTerminalHeight properly,
    // we're forcing it to not render as markdown when the response is too long, it will fallback
    // to render as plain text, which is contained within the terminal using MaxSizedBox
    if (availableHeight) {
        renderOutputAsMarkdown = false;
    }
    // §4.9: in full-detail mode, collapsible tools (read/search/list)
    // swap the summary `resultDisplay` for the complete `detailedDisplay` derived
    // from the persisted functionResponse. Only a non-empty string detail
    // qualifies; everything else (and all main-view rendering) keeps the summary.
    const usingDetailedDisplay = fullDetail &&
        isCollapsibleTool(name) &&
        typeof detailedDisplay === 'string' &&
        detailedDisplay.length > 0;
    // `detailedDisplay` is RAW, un-sanitized tool output (file contents, grep
    // hits, directory listings). A malicious repo could embed terminal control
    // codes that execute when the transcript renders the full content unfiltered.
    // Run it through the shared `sanitizeTerminalText` pipeline (ANSI escape + C0
    // strip + bidi strip), memoized since the content can be ~25K chars and this
    // runs on every render.
    const sanitizedDetailedDisplay = React.useMemo(() => usingDetailedDisplay && typeof detailedDisplay === 'string'
        ? sanitizeTerminalText(detailedDisplay)
        : detailedDisplay, [detailedDisplay, usingDetailedDisplay]);
    const visionBridgeNoticeDisplay = isVisionBridgeNoticeDisplay(resultDisplay)
        ? resultDisplay
        : undefined;
    const visionBridgeNoticeText = [
        visionBridgeNoticeDisplay
            ? formatVisionBridgeNoticeDisplay(visionBridgeNoticeDisplay)
            : undefined,
        visionBridgeNotice,
    ]
        .filter((notice) => notice !== undefined)
        .map((notice) => sanitizeTerminalText(notice))
        .join('\n');
    const effectiveResultDisplay = usingDetailedDisplay
        ? sanitizedDetailedDisplay
        : visionBridgeNoticeDisplay
            ? undefined
            : resultDisplay;
    // detailedDisplay is RAW tool output (file content, grep hits, directory
    // listings). Render it as plain text — Markdown formatting would turn the
    // file's own `#`/`*`/`-`/`>` characters into headings/bold/lists. The usual
    // `if (availableHeight)` guard above doesn't catch this because fullDetail
    // lifts the height cap (availableTerminalHeight is undefined in transcript).
    if (usingDetailedDisplay) {
        renderOutputAsMarkdown = false;
    }
    const effectiveDisplayRenderer = useResultDisplayRenderer(effectiveResultDisplay);
    // Collapse text/ANSI output for completed collapsible tools (read/search/list)
    // to reduce scrollback noise. Non-collapsible tools (command/edit/agent/MCP/etc.)
    // always show results — their output IS the answer. Canceled tools keep partial
    // output visible. Diff, plan, todo, task results always render regardless.
    const shouldCollapseResult = !forceShowResult &&
        status === ToolCallStatus.Success &&
        isCollapsibleTool(name) &&
        (effectiveDisplayRenderer.type === 'string' ||
            effectiveDisplayRenderer.type === 'ansi');
    return (_jsxs(Box, { paddingY: 0, flexDirection: "column", children: [_jsxs(Box, { minHeight: 1, children: [_jsx(ToolStatusIndicator, { status: status, name: name }), _jsx(ToolInfo, { name: name, status: status, description: description, emphasis: emphasis, hideDescription: status === ToolCallStatus.Confirming &&
                            confirmationDetails?.type === 'info' &&
                            confirmationDetails.renderPromptAsPlainText === true &&
                            isDescriptionRepeatedInPrompt(description, confirmationDetails.prompt) }), shouldShowFocusHint && (_jsx(Box, { marginLeft: 1, flexShrink: 0, children: _jsx(Text, { color: theme.text.accent, children: isThisShellFocused ? '(Focused)' : '(ctrl+f to focus)' }) })), _jsx(ToolElapsedTime, { status: status, executionStartTime: executionStartTime, timeoutMs: shellTimeoutMs }), emphasis === 'high' && _jsx(TrailingIndicator, {})] }), visionBridgeNoticeText && (_jsx(Box, { paddingLeft: STATUS_INDICATOR_WIDTH, width: "100%", children: _jsx(StringResultRenderer, { data: visionBridgeNoticeText, renderAsMarkdown: false, childWidth: innerWidth }) })), effectiveDisplayRenderer.type !== 'none' && !shouldCollapseResult && (_jsx(Box, { paddingLeft: STATUS_INDICATOR_WIDTH, width: "100%", children: _jsxs(Box, { flexDirection: "column", children: [effectiveDisplayRenderer.type === 'todo' && (_jsx(TodoResultRenderer, { data: effectiveDisplayRenderer.data })), effectiveDisplayRenderer.type === 'plan' && (_jsx(PlanResultRenderer, { data: effectiveDisplayRenderer.data, availableHeight: availableHeight, childWidth: innerWidth })), effectiveDisplayRenderer.type === 'task' && config && (_jsx(SubagentExecutionRenderer, { data: effectiveDisplayRenderer.data, availableHeight: availableHeight, childWidth: innerWidth, config: config, isFocused: isFocused, isPending: isPending })), effectiveDisplayRenderer.type === 'diff' && (_jsx(DiffResultRenderer, { data: effectiveDisplayRenderer.data, availableHeight: availableHeight, childWidth: innerWidth, settings: settings })), effectiveDisplayRenderer.type === 'ansi' && (_jsxs(_Fragment, { children: [_jsx(AnsiOutputText, { data: effectiveDisplayRenderer.data, availableTerminalHeight: shellCapHeight, maxWidth: innerWidth }), effectiveDisplayRenderer.stats && (_jsx(ShellStatsBar, { ...effectiveDisplayRenderer.stats, displayHeight: shellCapHeight }))] })), effectiveDisplayRenderer.type === 'image' && config && (_jsx(TerminalImage, { data: effectiveDisplayRenderer.data, config: config, contentWidth: innerWidth, availableTerminalHeight: availableHeight })), effectiveDisplayRenderer.type === 'string' && (_jsx(StringResultRenderer, { data: effectiveDisplayRenderer.data, renderAsMarkdown: renderOutputAsMarkdown, availableHeight: shellStringCapHeight, childWidth: innerWidth }))] }) })), ((images?.length ?? 0) > 0 ||
                (omittedImageCount !== undefined && omittedImageCount > 0)) && (_jsxs(Box, { paddingLeft: STATUS_INDICATOR_WIDTH, width: "100%", flexDirection: "column", children: [images?.map((image, index) => (_jsx(TerminalImage, { image: image, contentWidth: innerWidth, availableTerminalHeight: inlineImageHeight }, index))), omittedImageCount !== undefined && omittedImageCount > 0 && (_jsx(Text, { dimColor: true, children: formatInlineImageOverflow(omittedImageCount) }))] })), isThisShellFocused && config && (_jsx(Box, { paddingLeft: STATUS_INDICATOR_WIDTH, marginTop: 1, children: _jsx(ShellInputPrompt, { activeShellPtyId: activeShellPtyId ?? null, focus: embeddedShellFocused }) }))] }));
};
function isDescriptionRepeatedInPrompt(description, prompt) {
    try {
        const parsed = JSON.parse(description);
        if (parsed === null ||
            typeof parsed !== 'object' ||
            Array.isArray(parsed)) {
            return false;
        }
        const values = Object.values(parsed);
        if (values.length === 0 ||
            !values.every((value) => typeof value === 'string')) {
            return false;
        }
        const promptValues = prompt.split('\n').flatMap((line) => {
            try {
                const value = JSON.parse(line);
                return typeof value === 'string' ? [value] : [];
            }
            catch {
                return [];
            }
        });
        return values.every((value) => promptValues.includes(value));
    }
    catch {
        return false;
    }
}
const ToolInfo = ({ name, description, status, emphasis, hideDescription, }) => {
    const nameColor = React.useMemo(() => {
        switch (emphasis) {
            case 'high':
                return theme.text.primary;
            case 'medium':
                return theme.text.primary;
            case 'low':
                return theme.text.secondary;
            default: {
                const exhaustiveCheck = emphasis;
                return exhaustiveCheck;
            }
        }
    }, [emphasis]);
    return (_jsx(Box, { flexGrow: 1, children: _jsxs(Text, { wrap: "wrap", strikethrough: status === ToolCallStatus.Canceled, children: [_jsx(Text, { color: nameColor, bold: true, children: localizeToolDisplayName(name) }), !hideDescription && (_jsxs(_Fragment, { children: [' ', _jsx(Text, { color: theme.text.secondary, children: description })] }))] }) }));
};
const TrailingIndicator = () => (_jsxs(Text, { color: theme.text.primary, wrap: "truncate", children: [' ', "\u2190"] }));
//# sourceMappingURL=ToolMessage.js.map