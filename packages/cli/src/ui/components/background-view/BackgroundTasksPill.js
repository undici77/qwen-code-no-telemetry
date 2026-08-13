import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Text } from 'ink';
import { useBackgroundTaskViewState, useBackgroundTaskViewActions, } from '../../contexts/BackgroundTaskViewContext.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
const KIND_NAMES = {
    agent: { singular: 'local agent', plural: 'local agents' },
    shell: { singular: 'shell', plural: 'shells' },
    monitor: { singular: 'monitor', plural: 'monitors' },
    workflow: { singular: 'workflow', plural: 'workflows' },
    dream: { singular: 'dream', plural: 'dreams' },
};
/**
 * True if any background agent or workflow has a tool call parked awaiting user
 * approval (permission bubbling). Drives the pill's "needs approval"
 * marker so the user is nudged to open the dialog and answer.
 */
export function hasPendingApproval(entries) {
    return entries.some((e) => (e.kind === 'agent' || e.kind === 'workflow') &&
        (e.pendingApprovals?.length ?? 0) > 0);
}
/**
 * Pill label: prefer live running counts and active workflows, then paused resumable agent counts;
 * once everything is terminal, switch to a generic "done" form so the pill
 * still invites reopening the dialog to inspect final state.
 */
export function getPillLabel(entries) {
    if (entries.length === 0)
        return '';
    const live = entries.filter((e) => e.status === 'running' ||
        (e.kind === 'workflow' &&
            (e.status === 'pausing' || e.status === 'paused')));
    if (live.length > 0) {
        return groupAndFormat(live);
    }
    const pausedAgents = entries.filter((e) => e.kind === 'agent' && e.status === 'paused');
    if (pausedAgents.length > 0) {
        return pausedAgents.length === 1
            ? '1 local agent paused'
            : `${pausedAgents.length} local agents paused`;
    }
    // All terminal — collapse into a single tally; per-kind detail isn't
    // useful at this point and would clutter the footer.
    return entries.length === 1 ? '1 task done' : `${entries.length} tasks done`;
}
function groupAndFormat(entries) {
    const counts = { agent: 0, shell: 0, monitor: 0, workflow: 0, dream: 0 };
    for (const e of entries)
        counts[e.kind]++;
    const parts = [];
    // Order: shell first (matches Claude Code's pill convention), then
    // agent, then monitor, then workflow (user-initiated multi-phase
    // orchestration), then dream. Dream sits last because it is
    // system-initiated (not user-triggered) and the user is least likely
    // to need it at a glance; workflows are user-triggered so they sit
    // immediately after monitors and before dream.
    if (counts.shell > 0)
        parts.push(formatCount('shell', counts.shell));
    if (counts.agent > 0)
        parts.push(formatCount('agent', counts.agent));
    if (counts.monitor > 0)
        parts.push(formatCount('monitor', counts.monitor));
    if (counts.workflow > 0)
        parts.push(formatCount('workflow', counts.workflow));
    if (counts.dream > 0)
        parts.push(formatCount('dream', counts.dream));
    return parts.join(', ');
}
function formatCount(kind, n) {
    const names = KIND_NAMES[kind];
    return `${n} ${n === 1 ? names.singular : names.plural}`;
}
export const BackgroundTasksPill = () => {
    const { entries, pillFocused } = useBackgroundTaskViewState();
    const { openDialog, setPillFocused } = useBackgroundTaskViewActions();
    const onKeypress = useCallback((key) => {
        // `return`, down, and the readline-style Ctrl+N all open the dialog.
        // This is focus-chain handling rather than selection-list handling
        // (see keyBindings.ts SELECTION_DOWN), so keep the matcher inline.
        // Down completes the focus chain Composer ↓ → AgentTabBar ↓ → Pill ↓ → Dialog,
        // so users can `↓ ↓ (↓)` their way from an empty composer
        // straight into the roster without having to remember the
        // Enter shortcut. The LiveAgentPanel's overflow callout
        // (`↓ to view all`) relies on this; without a Down handler
        // the chain dead-ends at the highlighted pill.
        if (key.name === 'return' ||
            key.name === 'down' ||
            (key.ctrl && key.name === 'n')) {
            openDialog();
        }
        else if (key.name === 'up' ||
            (key.ctrl && key.name === 'p') ||
            key.name === 'escape') {
            setPillFocused(false);
        }
        else if (key.sequence &&
            key.sequence.length === 1 &&
            !key.ctrl &&
            !key.meta) {
            setPillFocused(false);
        }
    }, [openDialog, setPillFocused]);
    useKeypress(onKeypress, { isActive: pillFocused });
    if (entries.length === 0)
        return null;
    const label = getPillLabel(entries);
    const needsApproval = hasPendingApproval(entries);
    return (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: ' · ' }), _jsx(Text, { inverse: pillFocused, wrap: "truncate", children: label }), needsApproval && (_jsx(Text, { color: theme.status.warning, wrap: "truncate", children: ` ⚠ ${t('needs approval')}` }))] }));
};
//# sourceMappingURL=BackgroundTasksPill.js.map