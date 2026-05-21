import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { isSettledStatus, ArenaSessionStatus, DISPLAY_MODE, } from '@qwen-code/qwen-code-core';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { formatDuration } from '../../utils/formatters.js';
import { getArenaStatusLabel } from '../../utils/displayUtils.js';
const STATUS_REFRESH_INTERVAL_MS = 2000;
const IN_PROCESS_REFRESH_INTERVAL_MS = 1000;
function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return str.slice(0, maxLen - 1) + '…';
}
function pad(str, len, align = 'left') {
    if (str.length >= len)
        return str.slice(0, len);
    const padding = ' '.repeat(len - str.length);
    return align === 'right' ? padding + str : str + padding;
}
function getElapsedMs(agent) {
    if (isSettledStatus(agent.status)) {
        return agent.stats.durationMs;
    }
    return Date.now() - agent.startedAt;
}
function getSessionStatusLabel(status) {
    switch (status) {
        case ArenaSessionStatus.RUNNING:
            return { text: 'Running', color: theme.status.success };
        case ArenaSessionStatus.INITIALIZING:
            return { text: 'Initializing', color: theme.status.warning };
        case ArenaSessionStatus.IDLE:
            return { text: 'Idle', color: theme.status.success };
        case ArenaSessionStatus.COMPLETED:
            return { text: 'Completed', color: theme.status.success };
        case ArenaSessionStatus.CANCELLED:
            return { text: 'Cancelled', color: theme.status.warning };
        case ArenaSessionStatus.FAILED:
            return { text: 'Failed', color: theme.status.error };
        default:
            return { text: String(status), color: theme.text.secondary };
    }
}
const MAX_MODEL_NAME_LENGTH = 35;
export function ArenaStatusDialog({ manager, closeArenaDialog, width, }) {
    const [tick, setTick] = useState(0);
    // Detect in-process backend for live stats reading
    const backend = manager.getBackend();
    const isInProcess = backend?.type === DISPLAY_MODE.IN_PROCESS;
    const inProcessBackend = isInProcess ? backend : null;
    useEffect(() => {
        const interval = isInProcess
            ? IN_PROCESS_REFRESH_INTERVAL_MS
            : STATUS_REFRESH_INTERVAL_MS;
        const timer = setInterval(() => {
            setTick((prev) => prev + 1);
        }, interval);
        return () => clearInterval(timer);
    }, [isInProcess]);
    // Force re-read on every tick
    void tick;
    const sessionStatus = manager.getSessionStatus();
    const sessionLabel = getSessionStatusLabel(sessionStatus);
    const agents = manager.getAgentStates();
    const task = manager.getTask() ?? '';
    // For in-process mode, read live stats directly from AgentInteractive
    const liveStats = useMemo(() => {
        if (!inProcessBackend)
            return null;
        const statsMap = new Map();
        for (const agent of agents) {
            const interactive = inProcessBackend.getAgent(agent.agentId);
            if (interactive) {
                statsMap.set(agent.agentId, interactive.getStats());
            }
        }
        return statsMap;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inProcessBackend, agents, tick]);
    const maxTaskLen = 60;
    const displayTask = task.length > maxTaskLen ? task.slice(0, maxTaskLen - 1) + '…' : task;
    const colStatus = 14;
    const colTime = 8;
    const colTokens = 10;
    const colRounds = 8;
    const colTools = 8;
    useKeypress((key) => {
        if (key.name === 'escape' || key.name === 'q' || key.name === 'return') {
            closeArenaDialog();
        }
    }, { isActive: true });
    // Inner content width: total width minus border (2) and paddingX (2*2)
    const innerWidth = (width ?? 80) - 6;
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingX: 2, paddingY: 1, width: "100%", children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, color: theme.text.primary, children: "Arena Status" }), _jsx(Text, { color: theme.text.secondary, children: " \u00B7 " }), _jsx(Text, { color: sessionLabel.color, children: sessionLabel.text })] }), _jsx(Box, { height: 1 }), _jsx(Box, { children: _jsxs(Text, { children: [_jsx(Text, { color: theme.text.secondary, children: "Task: " }), _jsxs(Text, { color: theme.text.primary, children: ["\"", displayTask, "\""] })] }) }), _jsx(Box, { height: 1 }), _jsxs(Box, { children: [_jsx(Box, { flexGrow: 1, children: _jsx(Text, { bold: true, color: theme.text.secondary, children: "Agent" }) }), _jsx(Box, { width: colStatus, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.secondary, children: "Status" }) }), _jsx(Box, { width: colTime, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.secondary, children: "Time" }) }), _jsx(Box, { width: colTokens, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.secondary, children: "Tokens" }) }), _jsx(Box, { width: colRounds, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.secondary, children: "Rounds" }) }), _jsx(Box, { width: colTools, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.secondary, children: "Tools" }) })] }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(innerWidth) }) }), agents.map((agent) => {
                const label = agent.model.modelId;
                const { text: statusText, color } = getArenaStatusLabel(agent.status);
                const elapsed = getElapsedMs(agent);
                // Use live stats from AgentInteractive when in-process, otherwise
                // fall back to the cached ArenaAgentState.stats (file-polled).
                const live = liveStats?.get(agent.agentId);
                const totalTokens = live?.totalTokens ?? agent.stats.totalTokens;
                const rounds = live?.rounds ?? agent.stats.rounds;
                const toolCalls = live?.totalToolCalls ?? agent.stats.toolCalls;
                const successfulToolCalls = live?.successfulToolCalls ?? agent.stats.successfulToolCalls;
                const failedToolCalls = live?.failedToolCalls ?? agent.stats.failedToolCalls;
                return (_jsx(Box, { flexDirection: "column", children: _jsxs(Box, { children: [_jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: theme.text.primary, children: truncate(label, MAX_MODEL_NAME_LENGTH) }) }), _jsx(Box, { width: colStatus, justifyContent: "flex-end", children: _jsx(Text, { color: color, children: statusText }) }), _jsx(Box, { width: colTime, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: pad(formatDuration(elapsed), colTime - 1, 'right') }) }), _jsx(Box, { width: colTokens, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: pad(totalTokens.toLocaleString(), colTokens - 1, 'right') }) }), _jsx(Box, { width: colRounds, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: pad(String(rounds), colRounds - 1, 'right') }) }), _jsx(Box, { width: colTools, justifyContent: "flex-end", children: failedToolCalls > 0 ? (_jsxs(Text, { children: [_jsx(Text, { color: theme.status.success, children: successfulToolCalls }), _jsx(Text, { color: theme.text.secondary, children: "/" }), _jsx(Text, { color: theme.status.error, children: failedToolCalls })] })) : (_jsx(Text, { color: toolCalls > 0 ? theme.status.success : theme.text.primary, children: pad(String(toolCalls), colTools - 1, 'right') })) })] }) }, agent.agentId));
            }), agents.length === 0 && (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: "No agents registered yet." }) }))] }));
}
//# sourceMappingURL=ArenaStatusDialog.js.map