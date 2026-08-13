import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Presentational transcript renderer for a single AgentCore. Subscribes
 * to the core's event emitter internally and force-renders on updates,
 * so consumers only pass state props and don't wire their own listeners.
 */
import { Box, Text, Static } from 'ink';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AgentStatus, AgentEventType, getGitBranch, } from '@qwen-code/qwen-code-core';
import { useUIState } from '../../contexts/UIStateContext.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { useAgentViewActions } from '../../contexts/AgentViewContext.js';
import { HistoryItemDisplay } from '../HistoryItemDisplay.js';
import { ToolCallStatus } from '../../types.js';
import { theme } from '../../semantic-colors.js';
import { GeminiRespondingSpinner } from '../GeminiRespondingSpinner.js';
import { agentMessagesToHistoryItems } from './agentHistoryAdapter.js';
import { AgentHeader } from './AgentHeader.js';
import { buildThoughtHeadIdMap } from '../../utils/historyUtils.js';
export const AgentChatContent = ({ core, interactiveAgent, instanceKey, modelName, }) => {
    const readonly = !interactiveAgent;
    const uiState = useUIState();
    const { historyRemountKey, availableTerminalHeight, constrainHeight } = uiState;
    const { columns: terminalWidth } = useTerminalSize();
    const contentWidth = terminalWidth - 4;
    // Force re-render on message updates and status changes.
    // STREAM_TEXT is deliberately excluded — model text is shown only after
    // each round completes (via committed messages), avoiding per-chunk re-renders.
    const [, setRenderTick] = useState(0);
    const tickRef = useRef(0);
    const forceRender = useCallback(() => {
        tickRef.current += 1;
        setRenderTick(tickRef.current);
    }, []);
    useEffect(() => {
        const emitter = core.getEventEmitter();
        const onStatusChange = (_event) => forceRender();
        const onToolCall = () => forceRender();
        const onToolResult = () => forceRender();
        const onRoundEnd = () => forceRender();
        const onApproval = () => forceRender();
        const onOutputUpdate = () => forceRender();
        const onFinish = () => forceRender();
        emitter.on(AgentEventType.STATUS_CHANGE, onStatusChange);
        emitter.on(AgentEventType.TOOL_CALL, onToolCall);
        emitter.on(AgentEventType.TOOL_RESULT, onToolResult);
        emitter.on(AgentEventType.ROUND_END, onRoundEnd);
        emitter.on(AgentEventType.TOOL_WAITING_APPROVAL, onApproval);
        emitter.on(AgentEventType.TOOL_OUTPUT_UPDATE, onOutputUpdate);
        emitter.on(AgentEventType.FINISH, onFinish);
        return () => {
            emitter.off(AgentEventType.STATUS_CHANGE, onStatusChange);
            emitter.off(AgentEventType.TOOL_CALL, onToolCall);
            emitter.off(AgentEventType.TOOL_RESULT, onToolResult);
            emitter.off(AgentEventType.ROUND_END, onRoundEnd);
            emitter.off(AgentEventType.TOOL_WAITING_APPROVAL, onApproval);
            emitter.off(AgentEventType.TOOL_OUTPUT_UPDATE, onOutputUpdate);
            emitter.off(AgentEventType.FINISH, onFinish);
        };
    }, [core, forceRender]);
    const messages = core.getMessages();
    const pendingApprovals = core.getPendingApprovals();
    const liveOutputs = core.getLiveOutputs();
    const shellPids = core.getShellPids();
    // Read status/PTY/timing state fresh on every render — this component
    // re-renders on STATUS_CHANGE/TOOL_CALL/TOOL_OUTPUT_UPDATE so the reads
    // stay current without prop plumbing from a non-subscribed ancestor.
    const status = interactiveAgent?.getStatus() ?? AgentStatus.COMPLETED;
    const executionStartTimes = interactiveAgent?.getExecutionStartTimes();
    const activePtyId = shellPids.size > 0
        ? (shellPids.values().next().value ?? null)
        : null;
    const isRunning = status === AgentStatus.RUNNING || status === AgentStatus.INITIALIZING;
    // Embedded-shell focus (Ctrl+F toggle). Lives here so the auto-reset
    // effect sees a fresh activePtyId — AgentChatView above us doesn't
    // subscribe to agent events, so driving this from there would leave
    // focus stuck on a terminated PTY.
    const [embeddedShellFocused, setEmbeddedShellFocused] = useState(false);
    const { setAgentShellFocused } = useAgentViewActions();
    useEffect(() => {
        if (readonly)
            return;
        setAgentShellFocused(embeddedShellFocused);
        // Intentionally not resetting on unmount: calling setState on a parent
        // context provider during effect cleanup triggers React error #185
        // ("Cannot update a component while rendering a different component")
        // when both child and provider unmount in the same commit phase.
    }, [embeddedShellFocused, readonly, setAgentShellFocused]);
    useEffect(() => {
        if (!activePtyId)
            setEmbeddedShellFocused(false);
    }, [activePtyId]);
    useKeypress((key) => {
        if (readonly)
            return;
        if (key.ctrl && key.name === 'f') {
            if (activePtyId || embeddedShellFocused) {
                setEmbeddedShellFocused((prev) => !prev);
            }
        }
    }, { isActive: !readonly });
    // tickRef.current in deps ensures we rebuild when events fire even if
    // messages.length and pendingApprovals.size haven't changed (e.g. a
    // tool result updates an existing entry in place).
    const allItems = useMemo(() => agentMessagesToHistoryItems(messages, pendingApprovals, liveOutputs, shellPids, executionStartTimes), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        instanceKey,
        messages.length,
        pendingApprovals.size,
        liveOutputs.size,
        shellPids.size,
        executionStartTimes?.size,
        tickRef.current,
    ]);
    // Any tool_group with an Executing or Confirming tool — plus everything
    // after it — stays in the live area so confirmation dialogs remain
    // interactive (Ink's <Static> cannot receive input).
    const splitIndex = useMemo(() => {
        for (let idx = allItems.length - 1; idx >= 0; idx--) {
            const item = allItems[idx];
            if (item.type === 'tool_group' &&
                item.tools.some((t) => t.status === ToolCallStatus.Executing ||
                    t.status === ToolCallStatus.Confirming)) {
                return idx;
            }
        }
        return allItems.length;
    }, [allItems]);
    const committedItems = allItems.slice(0, splitIndex);
    const pendingItems = allItems.slice(splitIndex);
    const thoughtHeadIdByItem = useMemo(() => buildThoughtHeadIdMap(allItems), [allItems]);
    const agentWorkingDir = core.runtimeContext.getTargetDir() ?? '';
    // Cache the branch — it won't change during the agent's lifetime and
    // getGitBranch uses synchronous execSync which blocks the render loop.
    const agentGitBranch = useMemo(() => (agentWorkingDir ? getGitBranch(agentWorkingDir) : ''), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instanceKey]);
    const agentModelId = core.modelConfig.model ?? '';
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Static, { items: [
                    _jsx(AgentHeader, { modelId: agentModelId, modelName: modelName, workingDirectory: agentWorkingDir, gitBranch: agentGitBranch }, "agent-header"),
                    ...committedItems.map((item) => (_jsx(HistoryItemDisplay, { item: item, isPending: false, terminalWidth: terminalWidth, mainAreaWidth: contentWidth, thoughtHeadId: thoughtHeadIdByItem.get(item) }, item.id))),
                ], children: (item) => item }, `agent-${instanceKey}-${historyRemountKey}`), pendingItems.map((item) => (_jsx(HistoryItemDisplay, { item: item, isPending: true, terminalWidth: terminalWidth, mainAreaWidth: contentWidth, availableTerminalHeight: constrainHeight ? availableTerminalHeight : undefined, isFocused: !readonly, activeShellPtyId: activePtyId, embeddedShellFocused: embeddedShellFocused }, item.id))), isRunning && (_jsx(Box, { marginX: 2, marginTop: 1, children: _jsx(GeminiRespondingSpinner, {}) }))] }));
};
// Re-exported helper for consumers that render an error panel when the
// backing agent/core isn't available (e.g. a race where the registry
// entry exists but `core` hasn't been attached yet).
export const AgentChatMissing = ({ label }) => (_jsx(Box, { marginX: 2, children: _jsx(Text, { color: theme.status.error, children: label }) }));
//# sourceMappingURL=AgentChatContent.js.map