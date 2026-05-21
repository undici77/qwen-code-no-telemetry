/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CoreToolScheduler, createDebugLogger, isAutoMemPath, } from '@qwen-code/qwen-code-core';
import * as path from 'node:path';
import { useCallback, useState, useMemo } from 'react';
import { ToolCallStatus } from '../types.js';
const debugLogger = createDebugLogger('REACT_TOOL_SCHEDULER');
// Construct so the type-only assertion above isn't dead code.
const _ASSERT_INHERITED_FIELDS_PRESENT = true;
void _ASSERT_INHERITED_FIELDS_PRESENT;
export function useReactToolScheduler(onComplete, config, getPreferredEditor, onEditorClose) {
    const [toolCallsForDisplay, setToolCallsForDisplay] = useState([]);
    const outputUpdateHandler = useCallback((toolCallId, outputChunk) => {
        setToolCallsForDisplay((prevCalls) => prevCalls.map((tc) => {
            if (tc.request.callId === toolCallId && tc.status === 'executing') {
                const executingTc = tc;
                return { ...executingTc, liveOutput: outputChunk };
            }
            return tc;
        }));
    }, []);
    const allToolCallsCompleteHandler = useCallback(async (completedToolCalls) => {
        await onComplete(completedToolCalls);
    }, [onComplete]);
    const toolCallsUpdateHandler = useCallback((updatedCoreToolCalls) => {
        setToolCallsForDisplay((prevTrackedCalls) => updatedCoreToolCalls.map((coreTc) => {
            const existingTrackedCall = prevTrackedCalls.find((ptc) => ptc.request.callId === coreTc.request.callId);
            // Start with the new core state, then layer on the existing UI state
            // to ensure UI-only properties like pid are preserved.
            const responseSubmittedToGemini = existingTrackedCall?.responseSubmittedToGemini ?? false;
            if (coreTc.status === 'executing') {
                // `...coreTc` already spreads `pid` and
                // `promoteAbortController` from the core `ExecutingToolCall`
                // — no need to re-project. `liveOutput` is the only React-
                // side state we need to carry over from the previous tracked
                // version of this call.
                return {
                    ...coreTc,
                    responseSubmittedToGemini,
                    liveOutput: existingTrackedCall
                        ?.liveOutput,
                };
            }
            // For non-executing statuses, explicitly clear liveOutput so
            // it doesn't leak across an executing → completed transition.
            // `pid` / `promoteAbortController` are also explicitly set to
            // `undefined` here as defense-in-depth: today they're not on
            // `coreTc` for non-executing statuses so `...coreTc` doesn't
            // carry them, but if a future core change adds either field
            // to a non-executing status type the explicit clearing
            // prevents stale executing-state leakage into the React tree
            // (which would surface as a stuck PID display or a Ctrl+B
            // handler that incorrectly matches a no-longer-executing
            // tool call).
            return {
                ...coreTc,
                responseSubmittedToGemini,
                liveOutput: undefined,
                pid: undefined,
                promoteAbortController: undefined,
            };
        }));
    }, [setToolCallsForDisplay]);
    const scheduler = useMemo(() => new CoreToolScheduler({
        config,
        chatRecordingService: config.getChatRecordingService(),
        outputUpdateHandler,
        onAllToolCallsComplete: allToolCallsCompleteHandler,
        onToolCallsUpdate: toolCallsUpdateHandler,
        getPreferredEditor,
        onEditorClose,
    }), [
        config,
        outputUpdateHandler,
        allToolCallsCompleteHandler,
        toolCallsUpdateHandler,
        getPreferredEditor,
        onEditorClose,
    ]);
    const schedule = useCallback((request, signal) => {
        void scheduler.schedule(request, signal);
    }, [scheduler]);
    const markToolsAsSubmitted = useCallback((callIdsToMark) => {
        setToolCallsForDisplay((prevCalls) => prevCalls.map((tc) => callIdsToMark.includes(tc.request.callId)
            ? { ...tc, responseSubmittedToGemini: true }
            : tc));
    }, []);
    return [toolCallsForDisplay, schedule, markToolsAsSubmitted];
}
/**
 * Maps a CoreToolScheduler status to the UI's ToolCallStatus enum.
 */
function mapCoreStatusToDisplayStatus(coreStatus) {
    switch (coreStatus) {
        case 'validating':
            return ToolCallStatus.Executing;
        case 'awaiting_approval':
            return ToolCallStatus.Confirming;
        case 'executing':
            return ToolCallStatus.Executing;
        case 'success':
            return ToolCallStatus.Success;
        case 'cancelled':
            return ToolCallStatus.Canceled;
        case 'error':
            return ToolCallStatus.Error;
        case 'scheduled':
            return ToolCallStatus.Pending;
        default: {
            const exhaustiveCheck = coreStatus;
            debugLogger.warn(`Unknown core status encountered: ${exhaustiveCheck}`);
            return ToolCallStatus.Error;
        }
    }
}
/**
 * Returns 'read' or 'write' if the tool call operates on a managed-auto-memory
 * file; returns undefined otherwise.
 */
function detectMemoryOp(toolName, args, projectRoot) {
    const WRITE_TOOLS = new Set(['write_file', 'edit']);
    const READ_TOOLS = new Set(['read_file']);
    const filePath = args?.['file_path'];
    if (!filePath)
        return undefined;
    const resolved = path.resolve(filePath);
    if (!isAutoMemPath(resolved, projectRoot))
        return undefined;
    if (WRITE_TOOLS.has(toolName))
        return 'write';
    if (READ_TOOLS.has(toolName))
        return 'read';
    return undefined;
}
/**
 * Transforms `TrackedToolCall` objects into `HistoryItemToolGroup` objects for UI display.
 */
export function mapToDisplay(toolOrTools, projectRoot) {
    const toolCalls = Array.isArray(toolOrTools) ? toolOrTools : [toolOrTools];
    const toolDisplays = toolCalls.map((trackedCall) => {
        let displayName;
        let description;
        let renderOutputAsMarkdown = false;
        if (trackedCall.status === 'error') {
            displayName =
                trackedCall.tool === undefined
                    ? trackedCall.request.name
                    : trackedCall.tool.displayName;
            description = JSON.stringify(trackedCall.request.args);
        }
        else {
            displayName = trackedCall.tool.displayName;
            description = trackedCall.invocation.getDescription();
            renderOutputAsMarkdown = trackedCall.tool.isOutputMarkdown;
        }
        const baseDisplayProperties = {
            callId: trackedCall.request.callId,
            name: displayName,
            description,
            renderOutputAsMarkdown,
            isMemoryOp: projectRoot && trackedCall.status !== 'error'
                ? detectMemoryOp(trackedCall.request.name, trackedCall.request.args, projectRoot)
                : undefined,
        };
        switch (trackedCall.status) {
            case 'success':
                return {
                    ...baseDisplayProperties,
                    status: mapCoreStatusToDisplayStatus(trackedCall.status),
                    resultDisplay: trackedCall.response.resultDisplay,
                    confirmationDetails: undefined,
                };
            case 'error':
                return {
                    ...baseDisplayProperties,
                    status: mapCoreStatusToDisplayStatus(trackedCall.status),
                    resultDisplay: trackedCall.response.resultDisplay,
                    confirmationDetails: undefined,
                };
            case 'cancelled':
                return {
                    ...baseDisplayProperties,
                    status: mapCoreStatusToDisplayStatus(trackedCall.status),
                    resultDisplay: trackedCall.response.resultDisplay,
                    confirmationDetails: undefined,
                };
            case 'awaiting_approval':
                return {
                    ...baseDisplayProperties,
                    status: mapCoreStatusToDisplayStatus(trackedCall.status),
                    resultDisplay: undefined,
                    confirmationDetails: trackedCall.confirmationDetails,
                };
            case 'executing':
                return {
                    ...baseDisplayProperties,
                    status: mapCoreStatusToDisplayStatus(trackedCall.status),
                    resultDisplay: trackedCall.liveOutput ?? undefined,
                    confirmationDetails: undefined,
                    ptyId: trackedCall.pid,
                    executionStartTime: trackedCall
                        .executionStartTime,
                };
            case 'validating': // Fallthrough
            case 'scheduled':
                return {
                    ...baseDisplayProperties,
                    status: mapCoreStatusToDisplayStatus(trackedCall.status),
                    resultDisplay: undefined,
                    confirmationDetails: undefined,
                };
            default: {
                const exhaustiveCheck = trackedCall;
                return {
                    callId: exhaustiveCheck.request.callId,
                    name: 'Unknown Tool',
                    description: 'Encountered an unknown tool call state.',
                    status: ToolCallStatus.Error,
                    resultDisplay: 'Unknown tool call state',
                    confirmationDetails: undefined,
                    renderOutputAsMarkdown: false,
                };
            }
        }
    });
    return {
        type: 'tool_group',
        tools: toolDisplays,
        memoryWriteCount: toolDisplays.filter((t) => t.isMemoryOp === 'write').length || undefined,
        memoryReadCount: toolDisplays.filter((t) => t.isMemoryOp === 'read').length || undefined,
    };
}
//# sourceMappingURL=useReactToolScheduler.js.map