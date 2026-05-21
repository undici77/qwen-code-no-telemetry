import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { formatDuration } from '../../utils/formatters.js';
import { isTerminalGoalStatusKind } from '../../types.js';
const pluralTurns = (n) => (n === 1 ? 'turn' : 'turns');
function assertNeverGoalStatusKind(kind) {
    throw new Error(`Unexpected goal status kind: ${kind}`);
}
const GoalStatusMessageInternal = ({ kind, condition, iterations, durationMs, lastReason, }) => {
    // The "checking" kind is the per-iteration "judge said not met, continuing"
    // marker that replaces the generic `stop_hook_loop` rendering for /goal.
    // Show the active condition and latest judge reason on every iteration so
    // the user can see why the loop is continuing.
    if (kind === 'checking') {
        const reason = lastReason?.trim();
        return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: 2, flexShrink: 0, children: _jsx(Text, { color: theme.text.secondary, children: "\u25CB" }) }), _jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [_jsxs(Text, { color: theme.text.secondary, children: ["Goal check", typeof iterations === 'number' && iterations > 0
                                    ? ` · turn ${iterations}`
                                    : '', ' ', "\u00B7 not yet met"] }), _jsxs(Text, { color: theme.text.secondary, wrap: "wrap", children: ["Goal: ", condition] }), reason ? (_jsxs(Text, { color: theme.text.secondary, wrap: "wrap", children: ["Judge: ", reason] })) : null] })] }));
    }
    const { prefix, prefixColor, title } = (() => {
        switch (kind) {
            case 'set':
                // ◎ matches the footer GoalPill's icon — same visual identity for
                // "goal is on / armed" between the history card and the live pill.
                return {
                    prefix: '◎',
                    prefixColor: theme.text.accent,
                    title: 'Goal set',
                };
            case 'achieved':
                return {
                    prefix: '✓',
                    prefixColor: theme.status.success,
                    title: 'Goal achieved',
                };
            case 'cleared':
                return {
                    prefix: '○',
                    prefixColor: theme.text.secondary,
                    title: 'Goal cleared',
                };
            case 'failed':
                return {
                    prefix: '✖',
                    prefixColor: theme.status.error,
                    title: 'Goal could not be achieved',
                };
            case 'aborted':
                return {
                    prefix: '!',
                    prefixColor: theme.status.warning,
                    title: 'Goal aborted',
                };
            default:
                return assertNeverGoalStatusKind(kind);
        }
    })();
    const stats = [];
    if (typeof iterations === 'number' && iterations > 0) {
        stats.push(`${iterations} ${pluralTurns(iterations)}`);
    }
    if (typeof durationMs === 'number') {
        stats.push(formatDuration(durationMs, { hideTrailingZeros: true }));
    }
    const subtitle = stats.length > 0 ? stats.join(' · ') : null;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: 2, flexShrink: 0, children: _jsx(Text, { color: prefixColor, children: prefix }) }), _jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [_jsxs(Text, { color: prefixColor, children: [title, subtitle ? (_jsxs(Text, { color: theme.text.secondary, children: [" \u00B7 ", subtitle] })) : null] }), _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { flexShrink: 0, marginRight: 1, children: _jsx(Text, { color: theme.text.secondary, children: "Goal:" }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { wrap: "wrap", children: condition }) })] }), isTerminalGoalStatusKind(kind) && lastReason?.trim() ? (_jsxs(Text, { color: theme.text.secondary, wrap: "wrap", children: ["Last check: ", lastReason.trim()] })) : null] })] }));
};
export const GoalStatusMessage = React.memo(GoalStatusMessageInternal);
//# sourceMappingURL=GoalStatusMessage.js.map