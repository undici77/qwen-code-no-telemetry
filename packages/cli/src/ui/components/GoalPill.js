import { jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Text } from 'ink';
import { elapsedActiveTime } from '@qwen-code/qwen-code-core';
import { useConfig } from '../contexts/ConfigContext.js';
import { theme } from '../semantic-colors.js';
import { ICON } from '../constants.js';
const ELAPSED_REFRESH_MS = 1000;
function formatElapsed(ms) {
    if (ms < 1000)
        return '';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}
function getRuntime(config) {
    if (typeof config.getGoalRuntime !== 'function')
        return null;
    try {
        return config.getGoalRuntime();
    }
    catch {
        return null;
    }
}
export function useFooterGoalState() {
    const config = useConfig();
    const sessionId = config.getSessionId();
    const runtime = getRuntime(config);
    const [observed, setObserved] = useState(() => ({
        runtime,
        snapshot: runtime?.getSnapshot(),
    }));
    useEffect(() => {
        if (!runtime) {
            setObserved({ runtime });
            return;
        }
        setObserved({ runtime, snapshot: runtime.getSnapshot() });
        return runtime.subscribe((snapshot) => {
            setObserved({ runtime, snapshot });
        });
    }, [runtime, sessionId]);
    return observed.runtime === runtime
        ? observed.snapshot
        : runtime?.getSnapshot();
}
export function isLiveGoalSnapshot(snapshot) {
    const status = snapshot?.goal?.status;
    return status !== undefined && status !== 'complete';
}
function presentation(snapshot) {
    const goal = snapshot.goal;
    if (!goal || goal.status === 'complete')
        return null;
    if (goal.status === 'active') {
        return snapshot.activity === 'verifying'
            ? {
                icon: ICON.CIRCLE_EMPTY,
                label: 'checking',
                color: theme.text.secondary,
            }
            : { icon: ICON.BULLSEYE, label: 'active', color: theme.text.accent };
    }
    switch (goal.status) {
        case 'paused':
            return { icon: '!', label: 'paused', color: theme.status.warning };
        case 'blocked':
            return { icon: ICON.CROSS, label: 'blocked', color: theme.status.error };
        case 'usage_limited':
            return {
                icon: '!',
                label: 'usage limited',
                color: theme.status.warning,
            };
        default: {
            const exhaustive = goal.status;
            void exhaustive;
            return null;
        }
    }
}
export const GoalPill = ({ snapshot }) => {
    const [, setTick] = useState(0);
    const refreshElapsed = snapshot?.goal?.status === 'active';
    useEffect(() => {
        if (!refreshElapsed)
            return;
        const interval = setInterval(() => {
            setTick((tick) => (tick + 1) % 1_000_000);
        }, ELAPSED_REFRESH_MS);
        return () => clearInterval(interval);
    }, [refreshElapsed]);
    if (!snapshot)
        return null;
    const goal = snapshot.goal;
    if (!goal)
        return null;
    const visible = presentation(snapshot);
    if (!visible)
        return null;
    const elapsed = formatElapsed(elapsedActiveTime(goal, Date.now()));
    const suffix = elapsed ? ` (${elapsed})` : '';
    return (_jsxs(Text, { color: visible.color, children: [visible.icon, " /goal ", visible.label, suffix] }));
};
//# sourceMappingURL=GoalPill.js.map