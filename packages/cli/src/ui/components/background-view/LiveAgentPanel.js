import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { DEFAULT_BUILTIN_SUBAGENT_TYPE as CORE_DEFAULT_SUBAGENT_TYPE } from '@qwen-code/qwen-code-core';
import { localizeToolDisplayName } from '../../../i18n/index.js';
import { useBackgroundTaskViewActions, useBackgroundTaskViewState, } from '../../contexts/BackgroundTaskViewContext.js';
import { ConfigContext } from '../../contexts/ConfigContext.js';
import { theme } from '../../semantic-colors.js';
import { formatDuration, formatTokenCount } from '../../utils/formatters.js';
import { escapeAnsiCtrlCodes, sanitizeMultilineForDisplay, } from '../../utils/textUtils.js';
import { TOOL_DISPLAY_BY_NAME } from '../../utils/tool-display-map.js';
import { isLiveAgentPanelVisibleEntry, LIVE_AGENT_PANEL_MAX_ROWS, } from './liveAgentPanelVisibility.js';
import { computeAgentTreeInfo, panelDisplayOrder, statusGlyph, treeRowPrefix, } from './agent-forest.js';
// Sourced from liveAgentPanelVisibility so the composer's panel-focus
// keyboard handler windows its candidate list identically — see the
// constant's doc for the lockstep contract.
const DEFAULT_MAX_ROWS = LIVE_AGENT_PANEL_MAX_ROWS;
// Re-export under a panel-local alias so the source of truth stays
// in `subagents/builtin-agents.ts` (a backend rename of the default
// type would otherwise silently re-introduce the redundant
// `general-purpose:` prefix on every row). Specialized subagents
// (other builtins or user-authored types) still get their type
// rendered as a bold anchor.
const DEFAULT_SUBAGENT_TYPE = CORE_DEFAULT_SUBAGENT_TYPE;
function isAgentEntry(entry) {
    return entry.kind === 'agent';
}
// Glyph vocabulary lives in agent-forest's statusGlyph (shared with the
// dialog's Sub-agents roster so the two surfaces can't drift); this adds
// the panel's color mapping plus the synthesized-row special case on top.
function statusIcon(entry) {
    if (entry.synthesized) {
        // Outcome unknown — registry forgot the entry without going
        // through complete / fail / cancel. Use a neutral marker so
        // we don't lie about success.
        return { glyph: '·', color: theme.text.secondary };
    }
    const glyph = statusGlyph(entry.status);
    switch (entry.status) {
        case 'running':
        case 'paused':
        case 'cancelled':
            return { glyph, color: theme.status.warning };
        case 'completed':
            return { glyph, color: theme.status.success };
        case 'failed':
            return { glyph, color: theme.status.error };
        default:
            return { glyph, color: theme.text.secondary };
    }
}
function activityLabel(entry) {
    const last = entry.recentActivities?.at(-1);
    if (!last)
        return '';
    const display = localizeToolDisplayName(TOOL_DISPLAY_BY_NAME[last.name] ?? last.name);
    const desc = last.description?.replace(/\s*\n\s*/g, ' ').trim();
    return desc ? `${display} ${desc}` : display;
}
/**
 * Strip the leading `subagentType:` prefix from `entry.description` if
 * present so the row doesn't render `editor · editor: tighten…`. We
 * intentionally do NOT call `buildBackgroundEntryLabel` here: the shared
 * helper also caps at 40 chars + appends `…`, which then collides with
 * the row-level `truncate-end` and produces a double-ellipsis on narrow
 * terminals (e.g. `… FIXME ……`). The row's own truncation has the full
 * width budget and is the right place to decide where to cut.
 */
function descriptionWithoutPrefix(entry) {
    const raw = entry.description ?? '';
    if (!entry.subagentType)
        return raw;
    const lowerRaw = raw.toLowerCase();
    const prefix = entry.subagentType.toLowerCase() + ':';
    if (lowerRaw.startsWith(prefix)) {
        return raw.slice(prefix.length).trimStart();
    }
    return raw;
}
function elapsedLabel(entry, now) {
    const startedAt = entry.startTime;
    const endedAt = entry.endTime ?? now;
    const ms = Math.max(0, endedAt - startedAt);
    // Whole-second precision keeps the row stable between paint frames —
    // a stopwatch ticking sub-seconds in a footer panel is a distraction.
    const wholeSeconds = Math.floor(ms / 1000);
    return formatDuration(wholeSeconds * 1000, { hideTrailingZeros: true });
}
export const LiveAgentPanel = ({ maxRows = DEFAULT_MAX_ROWS, width, }) => {
    const { entries, dialogOpen, livePanelFocused, livePanelSelectedIndex } = useBackgroundTaskViewState();
    const { setLivePanelFocused } = useBackgroundTaskViewActions();
    // Reach for Config via the raw context (NOT useConfig) so the panel
    // can degrade to snapshot-only when no provider is mounted — e.g.
    // unit tests that render the component in isolation. useConfig
    // throws in that case, which would force every consumer to provide
    // a stub Config just to satisfy the panel's "live registry re-pull".
    const config = useContext(ConfigContext);
    // Wall-clock tick. Drives elapsed-time refresh, terminal-row eviction,
    // AND the live registry re-pull below. The gate must consider:
    //   - `dialogOpen` — when the bg-tasks dialog is up, the panel
    //     renders null (`if (dialogOpen) return null` below), so any
    //     ticks the interval fires are wasted re-renders.
    //   - live agents (running / paused) — always need elapsed updates.
    //   - terminal agents still inside the 8s visibility window — need
    //     ticks to drive their eviction.
    // `BackgroundTaskRegistry.getAll()` retains terminal entries up to
    // its cap (MAX_RETAINED_TERMINAL_AGENTS), so a naive
    // `entries.some(isAgentEntry)` gate would keep ticking until those
    // older entries finally evict — far longer than the panel actually
    // needs to render them. The `dialogOpen` arm closes the
    // corresponding gap on the dialog side.
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (dialogOpen)
            return;
        const needsTick = (whenMs) => entries.some((e) => isLiveAgentPanelVisibleEntry(e, whenMs));
        if (!needsTick(Date.now()))
            return;
        const id = setInterval(() => {
            const wallNow = Date.now();
            // Always advance `now` first so the final render reflects the
            // latest expiry state; THEN check if there's still work to do
            // and clear the interval if not. Without the up-front update
            // the row that just expired would linger one extra second.
            setNow(wallNow);
            if (!needsTick(wallNow))
                clearInterval(id);
        }, 1000);
        return () => clearInterval(id);
    }, [entries, dialogOpen]);
    // Re-pull each agent from the live registry on every tick so the row
    // shows the latest `recentActivities` — `useBackgroundTaskView`
    // intentionally only refreshes its snapshot on `statusChange` to keep
    // the footer pill / AppContainer quiet under heavy tool traffic, but
    // a glance roster MUST surface "what is this agent doing right now"
    // or it stops being a glance surface. Mirrors the pattern in
    // BackgroundTasksDialog's detail body, which re-reads the registry
    // on its own activity tick.
    //
    // Four reconciliation paths between the snapshot and the registry:
    //   1. Both agree → use live (newest `recentActivities`).
    //   2. Snap says still-live (running / paused) but registry forgot
    //      → most commonly a foreground subagent that finished:
    //      `unregisterForeground` fires `emitStatusChange(entry)` BEFORE
    //      it deletes the entry, so the snapshot captures the old
    //      "still running" state and the next render's `registry.get`
    //      returns undefined. Synthesize a terminal version with
    //      `endTime = first-seen-missing` (pinned so subsequent ticks
    //      don't re-stamp it) and `synthesized: true` so the 8s
    //      visibility window gives the user a "the agent finished"
    //      beat without claiming a green ✔ on a run we can't
    //      actually verify (foreground subagents don't transition
    //      through complete / fail / cancel before unregister, so the
    //      true outcome is unknowable here).
    //   3. Snap is already terminal AND has `endTime` → keep the snap
    //      as-is. Canonical case: a foreground subagent that was
    //      cancelled / failed (which stamps `endTime` and emits
    //      statusChange) and then `unregisterForeground`'d. The snap
    //      carries the real terminal state and timestamp, so the row
    //      reads accurately; the visibleAgents filter evicts it once
    //      `now - endTime > TERMINAL_VISIBLE_MS` like any other
    //      terminal entry.
    //   4. Snap is terminal but has NO `endTime` → drop. This is an
    //      upstream invariant violation (`complete`/`fail`/`cancel`
    //      always stamp endTime); rendering would leave a row the
    //      visibility window has no way to evict.
    //
    // When `config` itself is undefined (test fixtures that render
    // without ConfigContext) the panel degrades to snapshot-only —
    // there's no live source of truth to reconcile against.
    //
    // NOTE: this useMemo MUST come before the `if (dialogOpen) return null`
    // early-return below — React's rules of hooks require hook calls in
    // identical order each render, so a conditional early-return that
    // skips a subsequent hook is a violation.
    // First-seen-missing timestamps for synthesized terminal entries.
    // We need this to survive across useMemo recomputes — without it,
    // each tick would re-synthesize the entry with a fresh `now` as
    // `endTime`, the visibility-window check (`now - endTime > 8000`)
    // would always evaluate to 0, and the row would never expire. The
    // ref outlives both the snapshot and the tick state.
    const missingSinceRef = useRef(new Map());
    const liveAgentSnapshots = useMemo(() => {
        const snapshots = entries.filter(isAgentEntry);
        if (!config)
            return snapshots;
        const registry = config.getBackgroundTaskRegistry();
        // `now` participates in the dependency array so the memo recomputes
        // each tick and picks up `recentActivities` the registry mutated in
        // place via appendActivity. Reading it here makes the dependency
        // semantically honest — without this read a future "remove dead
        // dep" cleanup would silently freeze the panel on the first
        // tool-call after a snapshot refresh.
        const reconcileAt = now;
        const seenIds = new Set();
        const next = snapshots
            .map((snap) => {
            seenIds.add(snap.agentId);
            const live = registry.get(snap.agentId);
            if (live) {
                // Recovered (or never went missing) — drop any stale
                // missing-since record so a future re-disappearance
                // gets a fresh timestamp.
                missingSinceRef.current.delete(snap.agentId);
                return { ...live, kind: 'agent' };
            }
            if (snap.status === 'running' || snap.status === 'paused') {
                // Pin the disappearance time on first observation so
                // subsequent ticks don't keep resetting endTime to `now`.
                let missingSince = missingSinceRef.current.get(snap.agentId);
                if (missingSince === undefined) {
                    missingSince = reconcileAt;
                    missingSinceRef.current.set(snap.agentId, missingSince);
                }
                // Mark synthesized so the row renders with a neutral glyph
                // — we know the agent is no longer running but cannot tell
                // whether it succeeded, failed, or was cancelled (foreground
                // subagents are unregistered without transitioning through
                // complete / fail / cancel on the registry). Status stays
                // `'completed'` purely so the visibility-window filter
                // treats the row as terminal; `synthesized` overrides the
                // glyph + color in `statusIcon`.
                return {
                    ...snap,
                    status: 'completed',
                    endTime: snap.endTime ?? missingSince,
                    synthesized: true,
                };
            }
            // Snap is already terminal but the registry forgot. Canonical
            // case: a foreground subagent that was cancelled / failed
            // (`cancel` / `fail` set `endTime` and emit statusChange) and
            // then `unregisterForeground`'d. The snap carries the real
            // `endTime`, so keep showing it — the visibleAgents filter
            // below evicts it once `now - endTime > TERMINAL_VISIBLE_MS`.
            // Without this branch cancelled / failed foreground tasks
            // would disappear instantly, contradicting the panel's "brief
            // terminal visibility" contract the synthesized-completion
            // path relies on.
            if (snap.endTime !== undefined)
                return snap;
            // Defensive fallback: terminal snap with no endTime is an
            // invariant violation upstream (complete / fail / cancel
            // always stamp endTime). Drop rather than render an entry
            // the visibility window has no way to evict.
            return null;
        })
            .filter((e) => e !== null);
        // GC: drop missing-since records for agents that are no longer
        // even in the snapshot (e.g. statusChange refreshed and the
        // entry left useBackgroundTaskView's view entirely).
        for (const id of missingSinceRef.current.keys()) {
            if (!seenIds.has(id))
                missingSinceRef.current.delete(id);
        }
        return next;
    }, [entries, config, now]);
    const hasVisibleAgent = liveAgentSnapshots.some((entry) => isLiveAgentPanelVisibleEntry(entry, now));
    useEffect(() => {
        if (livePanelFocused && !hasVisibleAgent) {
            setLivePanelFocused(false);
        }
    }, [hasVisibleAgent, livePanelFocused, setLivePanelFocused]);
    // Defense in depth: don't compete with the dialog. Under
    // DefaultAppLayout this branch is unreachable because the layout
    // already gates the panel on `!uiState.dialogsVisible` (which folds
    // in `bgTasksDialogOpen`), but we keep the internal gate so callers
    // mounting the panel outside that layout still get the right
    // behavior.
    //
    // The early-return is the LAST statement of this component on
    // purpose — pure rendering moves to LiveAgentPanelBody so that
    // future refactors which add a hook can't accidentally drop it
    // below the `dialogOpen` guard (`Rendered fewer hooks than
    // expected` is the canonical bug shape this guards against).
    if (dialogOpen)
        return null;
    return (_jsx(LiveAgentPanelBody, { snapshots: liveAgentSnapshots, now: now, maxRows: maxRows, width: width, focused: livePanelFocused, selectedIndex: livePanelSelectedIndex }));
};
const LiveAgentPanelBody = ({ snapshots, now, maxRows, width, focused, selectedIndex }) => {
    const visibleAgents = snapshots
        .map((entry) => ({
        ...entry,
        expired: !isLiveAgentPanelVisibleEntry(entry, now),
    }))
        .filter((entry) => !entry.expired);
    if (visibleAgents.length === 0)
        return null;
    // Snapshot order is newest-first (dialog convention); panelDisplayOrder
    // renders oldest-first with each nested agent grouped under its parent
    // (and keeps the composer's panel-focus keyboard handler in lockstep).
    // Tree metadata is computed on the full visible set (not the maxRows
    // window) so a row's indent doesn't shift when the window scrolls past
    // its parent.
    const visibleAgentsAsc = panelDisplayOrder(visibleAgents);
    const treeInfo = computeAgentTreeInfo(visibleAgentsAsc);
    const overflow = Math.max(0, visibleAgentsAsc.length - maxRows);
    const visible = overflow > 0 ? visibleAgentsAsc.slice(-maxRows) : visibleAgentsAsc;
    const totalItems = 1 + visible.length;
    const clampedIndex = Math.min(selectedIndex, totalItems - 1);
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, width: width, paddingX: 2, children: [_jsxs(Box, { children: [_jsx(Text, { color: focused ? theme.text.accent : theme.text.secondary, children: focused && clampedIndex === 0 ? '▸ ' : '  ' }), _jsx(Text, { bold: true, color: theme.text.accent, children: "main" })] }), overflow > 0 && (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: `    ^ ${overflow} more above (↓ to view all)` }) })), visible.map((entry, idx) => (_jsx(AgentRow, { entry: entry, now: now, selected: focused && clampedIndex === idx + 1, tree: treeInfo.get(entry.agentId) }, entry.agentId))), focused && (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: '  ↑↓ navigate · Enter detail · Esc back' }) }))] }));
};
const AgentRow = ({ entry, now, selected = false, tree }) => {
    const { glyph, color } = statusIcon(entry);
    // ANSI sanitize every user-controlled string before it reaches Ink.
    // `subagentType` comes from subagent config (user-authored or model-
    // chosen) and `recentActivities[].description` is LLM-generated;
    // both can carry terminal control sequences that would otherwise
    // bleed through Ink's `<Text>` and corrupt the panel chrome.
    // `sanitizeMultilineForDisplay` (not just `escapeAnsiCtrlCodes`): the
    // task description is model-generated and bare C0 controls (\r, BS, BEL)
    // pass through the ANSI-sequence escape — matches the `activity` line
    // below and the hardened dialog Progress rows.
    const label = sanitizeMultilineForDisplay(descriptionWithoutPrefix(entry));
    // Note: foreground vs background is intentionally not surfaced here.
    // BackgroundTasksDialog tags foreground rows with `[blocking]`
    // (formerly `[in turn]`) to warn that cancelling will end the
    // current turn — useful in the dialog where `x` triggers a real
    // cancel. The glance panel has no cancel surface, so the marker
    // reads as ambient noise. Keep the dialog as the place that
    // surfaces the flavor distinction.
    // `sanitizeMultilineForDisplay` (not just `escapeAnsiCtrlCodes`): the
    // activity description is LLM-generated and bare C0 controls (\r, BS,
    // BEL) pass through the ANSI-sequence escape — matches the hardened
    // dialog Progress rows and ToolMessage approval context.
    const activity = sanitizeMultilineForDisplay(activityLabel(entry));
    const elapsed = elapsedLabel(entry, now);
    const showType = entry.subagentType !== undefined &&
        entry.subagentType !== DEFAULT_SUBAGENT_TYPE;
    const safeSubagentType = showType
        ? escapeAnsiCtrlCodes(entry.subagentType ?? '')
        : '';
    const tokenSuffix = entry.stats?.outputTokens && entry.stats.outputTokens > 0
        ? ` · ${formatTokenCount(entry.stats.outputTokens)} tokens`
        : '';
    // Layout (Claude Code's CoordinatorTaskPanel visual + our
    // right-pin to keep elapsed / tokens from being clipped):
    //
    //   [○ type: desc (activity)]   [▶ 13s · 2.4k tokens]
    //         ^ flex-shrink:1              ^ flex-shrink:0
    //         truncate-end                 always intact
    //
    // - Status glyph at the left (`○` for live slots, ✔/✖/⏸ for
    //   terminal — see `statusIcon`).
    // - `type:` prefix when not the default `general-purpose`.
    // - Activity wrapped in parentheses so it reads as an annotation
    //   on the description rather than a sibling field.
    // - `▶` separates the description from elapsed / tokens, mirroring
    //   the leaked CoordinatorTaskPanel pattern (`PLAY_ICON`).
    // - The left column has flex-shrink:1 (no flex-grow) so the two
    //   columns sit side by side at intrinsic widths; empty slack
    //   falls off the row tail rather than opening a visual gap
    //   between the description and the right-pinned elapsed.
    const tail = ` ▶ ${elapsed}${tokenSuffix}`;
    const prefix = selected ? '▸ ' : '  ';
    // Tree gutter (indent + ↳) comes from the shared agent-forest helper so
    // the panel and the dialog list can't drift; the orphan additionally
    // says who launched it.
    const treePrefix = treeRowPrefix(entry, tree);
    const orphanNote = tree?.orphaned
        ? entry.parentName
            ? ` · from ${escapeAnsiCtrlCodes(entry.parentName)}`
            : ' · nested'
        : '';
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { flexShrink: 0, children: _jsx(Text, { color: selected ? theme.text.accent : theme.text.secondary, children: prefix }) }), _jsx(Box, { flexShrink: 1, children: _jsxs(Text, { wrap: "truncate-end", children: [treePrefix !== '' && (_jsx(Text, { color: theme.text.secondary, children: treePrefix })), _jsx(Text, { color: color, children: `${glyph} ` }), showType && (_jsxs(_Fragment, { children: [_jsx(Text, { bold: true, children: safeSubagentType }), _jsx(Text, { color: theme.text.secondary, children: ': ' })] })), _jsx(Text, { color: theme.text.secondary, children: label }), activity && (_jsx(Text, { color: theme.text.secondary, children: ` (${activity})` })), orphanNote && _jsx(Text, { color: theme.text.secondary, children: orphanNote })] }) }), _jsx(Box, { flexShrink: 0, children: _jsx(Text, { color: theme.text.secondary, children: tail }) })] }));
};
//# sourceMappingURL=LiveAgentPanel.js.map