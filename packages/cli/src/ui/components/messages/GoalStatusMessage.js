import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { ICON } from '../../constants.js';
import { formatDuration } from '../../utils/formatters.js';
import { isTerminalGoalStatusKind } from '../../types.js';
const pluralTurns = (n) => (n === 1 ? 'turn' : 'turns');
function assertNeverGoalStatusKind(kind) {
    throw new Error(`Unexpected goal status kind: ${kind}`);
}
const GoalStateCard = ({ snapshot, cause, }) => {
    const goal = snapshot.goal;
    if (!goal) {
        if (cause !== 'clear')
            return null;
        return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: 2, flexShrink: 0, children: _jsx(Text, { color: theme.text.secondary, children: ICON.CIRCLE_EMPTY }) }), _jsx(Text, { color: theme.text.secondary, children: "Goal cleared" })] }));
    }
    const lifecycle = (() => {
        switch (goal.status) {
            case 'active':
                if (snapshot.activity === 'verifying') {
                    return {
                        prefix: ICON.CIRCLE_EMPTY,
                        color: theme.text.secondary,
                        title: 'Goal checking',
                    };
                }
                return {
                    prefix: ICON.BULLSEYE,
                    color: theme.text.accent,
                    title: snapshot.activity === 'running' ? 'Goal running' : 'Goal active',
                };
            case 'paused':
                return {
                    prefix: '!',
                    color: theme.status.warning,
                    title: 'Goal paused',
                };
            case 'blocked':
                return {
                    prefix: ICON.CROSS,
                    color: theme.status.error,
                    title: 'Goal blocked',
                };
            case 'usage_limited':
                return {
                    prefix: '!',
                    color: theme.status.warning,
                    title: 'Goal usage limited',
                };
            case 'complete':
                return {
                    prefix: ICON.CHECK,
                    color: theme.status.success,
                    title: 'Goal complete',
                };
            default: {
                const exhaustive = goal.status;
                void exhaustive;
                throw new Error('Unexpected Goal status');
            }
        }
    })();
    const stats = [];
    if (goal.turnCount > 0) {
        stats.push(`${goal.turnCount} ${pluralTurns(goal.turnCount)}`);
    }
    if (goal.activeTimeMs > 0) {
        stats.push(formatDuration(goal.activeTimeMs, { hideTrailingZeros: true }));
    }
    const subtitle = stats.length > 0 ? stats.join(' · ') : null;
    const reason = goal.status !== 'active' || snapshot.activity === 'verifying'
        ? goal.lastReason?.trim()
        : undefined;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: 2, flexShrink: 0, children: _jsx(Text, { color: lifecycle.color, children: lifecycle.prefix }) }), _jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [_jsxs(Text, { color: lifecycle.color, children: [lifecycle.title, subtitle ? (_jsxs(Text, { color: theme.text.secondary, children: [" \u00B7 ", subtitle] })) : null] }), _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { flexShrink: 0, marginRight: 1, children: _jsx(Text, { color: theme.text.secondary, children: "Goal:" }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { wrap: "wrap", children: goal.objective }) })] }), reason ? (_jsxs(Text, { color: theme.text.secondary, wrap: "wrap", children: ["Reason: ", reason] })) : null] })] }));
};
const GoalStatusMessageInternal = (props) => {
    if (props.snapshot)
        return _jsx(GoalStateCard, { ...props });
    const { kind, condition, iterations, durationMs, lastReason } = props;
    if (kind === 'checking') {
        const reason = lastReason?.trim();
        return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: 2, flexShrink: 0, children: _jsx(Text, { color: theme.text.secondary, children: ICON.CIRCLE_EMPTY }) }), _jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [_jsxs(Text, { color: theme.text.secondary, children: ["Goal check", typeof iterations === 'number' && iterations > 0
                                    ? ` · turn ${iterations}`
                                    : '', ' ', "\u00B7 not yet met"] }), _jsxs(Text, { color: theme.text.secondary, wrap: "wrap", children: ["Goal: ", condition] }), reason ? (_jsxs(Text, { color: theme.text.secondary, wrap: "wrap", children: ["Judge: ", reason] })) : null] })] }));
    }
    const { prefix, prefixColor, title } = (() => {
        switch (kind) {
            case 'set':
                return {
                    prefix: ICON.BULLSEYE,
                    prefixColor: theme.text.accent,
                    title: 'Goal set',
                };
            case 'achieved':
                return {
                    prefix: ICON.CHECK,
                    prefixColor: theme.status.success,
                    title: 'Goal achieved',
                };
            case 'cleared':
                return {
                    prefix: ICON.CIRCLE_EMPTY,
                    prefixColor: theme.text.secondary,
                    title: 'Goal cleared',
                };
            case 'failed':
                return {
                    prefix: ICON.CROSS,
                    prefixColor: theme.status.error,
                    title: 'Goal could not be achieved',
                };
            case 'aborted':
                return {
                    prefix: '!',
                    prefixColor: theme.status.warning,
                    title: 'Goal aborted',
                };
            case 'paused':
                return {
                    prefix: '!',
                    prefixColor: theme.status.warning,
                    title: 'Goal paused',
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