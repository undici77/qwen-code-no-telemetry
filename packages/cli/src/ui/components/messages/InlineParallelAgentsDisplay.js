import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import {} from '@qwen-code/qwen-code-core';
import { ConfigContext } from '../../contexts/ConfigContext.js';
import { theme } from '../../semantic-colors.js';
import { formatDuration, formatTokenCount } from '../../utils/formatters.js';
import { escapeAnsiCtrlCodes, sanitizeMultilineForDisplay, } from '../../utils/textUtils.js';
import { TOOL_DISPLAY_BY_NAME } from '../../utils/tool-display-map.js';
import { localizeToolDisplayName } from '../../../i18n/index.js';
import { ICON } from '../../constants.js';
/**
 * `agentId` in the registry is `${subagentName}-${parentToolCallId}` —
 * see `AgentTool.executeImpl` in core/src/tools/agent/agent.ts where the
 * id is constructed as `${subagentConfig.name}-${this.callId}`.
 * Reconstructing it here is the cheapest way to correlate a
 * `IndividualToolCallDisplay` with its live registry entry without
 * having to thread the id through the tool-result pipeline.
 */
function deriveAgentId(toolCall, resultDisplay) {
    return `${resultDisplay.subagentName}-${toolCall.callId}`;
}
function isAgentResult(rd) {
    return (typeof rd === 'object' &&
        rd !== null &&
        'type' in rd &&
        rd.type === 'task_execution');
}
function activityLabel(row) {
    // `row.recentActivity` was snapshotted in the rows useMemo by reading
    // `registry.get(agentId).recentActivities.at(-1)`. The registry
    // intentionally mutates that array in place via `appendActivity`,
    // not by replacing the reference — the rows memo's `now`-keyed
    // re-read is what surfaces the latest entry on each tick. Treat the
    // value here as a tick-snapshot only; do NOT close over the
    // registry's live array.
    const last = row.recentActivity;
    if (!last)
        return '';
    const display = localizeToolDisplayName(TOOL_DISPLAY_BY_NAME[last.name] ?? last.name);
    const desc = last.description?.replace(/\s*\n\s*/g, ' ').trim();
    return desc ? `${display} ${desc}` : display;
}
function statusGlyph(status) {
    switch (status) {
        case 'running':
        case 'background':
            return { glyph: ICON.CIRCLE_EMPTY, color: theme.status.warning };
        case 'completed':
            return { glyph: '✔', color: theme.status.success };
        case 'failed':
            return { glyph: '✖', color: theme.status.error };
        case 'cancelled':
            return { glyph: '✖', color: theme.status.warning };
        default:
            return { glyph: '·', color: theme.text.secondary };
    }
}
function elapsedLabel(row, now) {
    // Prefer live registry timing while the agent is still tracked, fall
    // back to the terminal `executionSummary.totalDurationMs` so the
    // elapsed column survives `unregisterForeground` (otherwise completed
    // rows lose their duration the moment they finish — visible as the
    // "✔ Agent 2: Security review  8.1k tok" gap in real runs).
    let ms;
    if (row.startTime !== undefined) {
        const end = row.endTime ?? now;
        ms = Math.max(0, end - row.startTime);
    }
    else if (row.fallbackElapsedMs !== undefined) {
        ms = Math.max(0, row.fallbackElapsedMs);
    }
    if (ms === undefined)
        return '';
    return formatDuration(Math.floor(ms / 1000) * 1000, {
        hideTrailingZeros: true,
    });
}
// Width budget for the agent-name column. Sized to fit /review's
// labels like `Agent 6c: Maintainer` and `Agent 7: Build & Test` at
// their full length while leaving room for the activity column on a
// typical 100-col content width. Names longer than this truncate in
// the middle (`Agent 1: Corr…tness review`) so both the agent number
// and the trailing suffix stay readable.
const NAME_COL_WIDTH = 26;
function truncateMiddle(input, max) {
    if (input.length <= max)
        return input;
    if (max <= 1)
        return input.slice(0, max);
    const keep = max - 1;
    const head = Math.ceil(keep / 2);
    const tail = Math.floor(keep / 2);
    return `${input.slice(0, head)}…${input.slice(input.length - tail)}`;
}
export const InlineParallelAgentsDisplay = ({ toolCalls, contentWidth, totalAgentCount, availableTerminalHeight }) => {
    const config = useContext(ConfigContext);
    // Static slice of agent calls for this group. The caller already
    // determined this group qualifies, but we re-filter defensively so
    // the component is robust to mixed groups (e.g. a sibling Shell call
    // accidentally landing in the same toolCalls payload).
    const agentEntries = useMemo(() => {
        const out = [];
        for (const tc of toolCalls) {
            if (isAgentResult(tc.resultDisplay)) {
                out.push({ toolCall: tc, result: tc.resultDisplay });
            }
        }
        return out;
    }, [toolCalls]);
    // 1s wall-clock tick to refresh elapsed / activity columns while
    // any agent in the batch is still live. Gating prevents the
    // interval from firing forever after the batch settles.
    const [now, setNow] = useState(() => Date.now());
    // `AgentResultDisplay.status` is exhaustively
    // `'running' | 'completed' | 'failed' | 'cancelled' | 'background'`
    // (see core/src/tools/tools.ts). The two arms below cover every
    // non-terminal value; the remaining three are terminal and don't
    // need a tick. If a new non-terminal status is ever added upstream,
    // the interval will stop early and elapsed/activity will freeze for
    // that row — add the new value here to keep the tick alive.
    const hasLiveAgent = useMemo(() => agentEntries.some((e) => e.result.status === 'running' || e.result.status === 'background'), [agentEntries]);
    useEffect(() => {
        if (!hasLiveAgent)
            return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [hasLiveAgent]);
    // Reconcile static toolCall snapshot with live registry data so
    // activity / elapsed / tokens stay fresh. `now` participates in the
    // dependency so each tick re-reads the registry — `appendActivity`
    // mutates `recentActivities` in place, so without a tick the
    // component would freeze on the first row of activity.
    const rows = useMemo(() => {
        const registry = config?.getBackgroundTaskRegistry();
        // Touch `now` so a future "remove dead dep" cleanup can't silently
        // freeze the panel — the registry mutates in place and we need to
        // re-read on every tick to surface fresh activity.
        void now;
        return agentEntries.map(({ toolCall, result }) => {
            const agentId = deriveAgentId(toolCall, result);
            const live = registry?.get(agentId);
            const recent = live?.recentActivities?.at(-1);
            return {
                agentId,
                callId: toolCall.callId,
                name: result.taskDescription || result.subagentName,
                status: result.status,
                startTime: live?.startTime,
                endTime: live?.endTime,
                fallbackElapsedMs: result.executionSummary?.totalDurationMs,
                recentActivity: recent
                    ? { name: recent.name, description: recent.description }
                    : undefined,
                tokenCount: result.tokenCount ??
                    live?.stats?.outputTokens ??
                    result.executionSummary?.outputTokens,
            };
        });
    }, [agentEntries, config, now]);
    if (rows.length === 0)
        return null;
    const doneCount = rows.filter((r) => r.status === 'completed' ||
        r.status === 'failed' ||
        r.status === 'cancelled').length;
    const total = totalAgentCount ?? rows.length;
    const headerLabel = `Parallel agents · ${total} · ${doneCount}/${total} done`;
    // Height backstop: the panel lives in the non-`<Static>` live frame, so its
    // total height must stay within budget or ink clears the whole terminal on
    // every repaint (scroll snap-back). The header always costs 1 row; when rows
    // overflow, the "+N more" indicator costs another. Window to the most recent
    // rows that still fit AFTER reserving those lines, so the rendered height
    // (header + optional indicator + visibleRows) never exceeds the budget — even
    // at degenerate budgets ≤ 2, where we drop all rows (and at a budget of 1 the
    // indicator too, leaving just the header whose label still states the total).
    // A budget ≤ 0 / undefined means "no cap" (committed phase — already in
    // `<Static>`).
    const hasBudget = availableTerminalHeight != null && availableTerminalHeight > 0;
    let overflowCount = 0;
    let visibleRows = rows;
    if (hasBudget && rows.length + 1 > availableTerminalHeight) {
        // header (1) + all rows would exceed the budget → window.
        if (availableTerminalHeight >= 2) {
            // Reserve 1 row for the header and 1 for the "+N more" indicator; the
            // remainder is for rows.
            const rowsFit = availableTerminalHeight - 2;
            overflowCount = rows.length - rowsFit;
            visibleRows = rowsFit > 0 ? rows.slice(rows.length - rowsFit) : [];
        }
        else {
            // Budget of 1: only the header fits — drop every row and the indicator
            // too. The header label still states the total agent count.
            visibleRows = [];
        }
    }
    return (_jsxs(Box, { flexDirection: "column", width: contentWidth, paddingX: 1, children: [_jsx(Box, { children: _jsx(Text, { bold: true, color: theme.text.accent, wrap: "truncate-end", children: headerLabel }) }), overflowCount > 0 && (_jsx(Box, { children: _jsxs(Text, { color: theme.text.secondary, wrap: "truncate-end", children: ["\u2026 +", overflowCount, " more ", overflowCount === 1 ? 'agent' : 'agents'] }) })), visibleRows.map((row) => (_jsx(AgentRow, { row: row, now: now }, row.agentId)))] }));
};
// INVARIANT: must render exactly ONE terminal line. The parent's height
// backstop (rowsFit = availableTerminalHeight - 2) assumes one line per row;
// all Text elements below use wrap="truncate-end" to hold that. Do not add
// wrapping/multi-line content here without revisiting that windowing math.
const AgentRow = ({ row, now }) => {
    const { glyph, color } = statusGlyph(row.status);
    const safeName = escapeAnsiCtrlCodes(row.name);
    const displayName = truncateMiddle(safeName, NAME_COL_WIDTH);
    // sanitizeMultilineForDisplay: LLM-generated descriptions can carry bare
    // C0 controls that escapeAnsiCtrlCodes passes through — matches the
    // hardened dialog Progress rows and ToolMessage approval context.
    const activity = sanitizeMultilineForDisplay(activityLabel(row));
    const elapsed = elapsedLabel(row, now);
    const tokens = row.tokenCount && row.tokenCount > 0
        ? formatTokenCount(row.tokenCount)
        : '';
    const trailingParts = [];
    if (elapsed)
        trailingParts.push(elapsed);
    if (tokens)
        trailingParts.push(`${tokens} tok`);
    const trailing = trailingParts.join(' · ');
    // Right-align `trailing` (elapsed · tokens) by giving the activity
    // column flexGrow:1 — it consumes all remaining horizontal space,
    // pinning the trailing column to the right edge. Without flexGrow
    // the trailing column hugs the activity text, so each row's
    // trailing sits at a different x position and the panel reads as
    // visually noisy.
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { flexShrink: 0, marginRight: 1, children: _jsx(Text, { color: color, wrap: "truncate-end", children: glyph }) }), _jsx(Box, { flexShrink: 0, marginRight: 1, width: NAME_COL_WIDTH, children: _jsx(Text, { wrap: "truncate-end", children: displayName }) }), _jsx(Box, { flexShrink: 1, flexGrow: 1, marginRight: 1, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate-end", children: activity }) }), _jsx(Box, { flexShrink: 0, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate-end", children: trailing }) })] }));
};
//# sourceMappingURL=InlineParallelAgentsDisplay.js.map