/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useCallback } from 'react';
import { useVSCode } from './useVSCode.js';
import { useImageResolution, } from './useImage.js';
const FORCE_CLEAR_STREAM_END_REASONS = new Set([
    'user_cancelled',
    'cancelled',
    'timeout',
    'error',
    'session_expired',
]);
export function resetConversationState({ handlers, clearImageResolutions, vscode, }) {
    handlers.messageHandling.endStreaming();
    handlers.clearActiveExecToolCalls();
    handlers.messageHandling.clearWaitingForResponse();
    handlers.messageHandling.clearThinking();
    handlers.messageHandling.clearMessages();
    handlers.clearToolCalls();
    handlers.resetUserTurnCounter?.();
    handlers.setPlanEntries([]);
    handlers.handlePermissionRequest(null);
    handlers.handleAskUserQuestion(null);
    handlers.sessionManagement.setCurrentSessionId(null);
    clearImageResolutions();
    handlers.setUsageStats?.(undefined);
    handlers.sessionManagement.setCurrentSessionTitle('Past Conversations');
    // Reset the VS Code tab title to default label
    vscode.postMessage({
        type: 'updatePanelTitle',
        data: { title: 'Qwen Code' },
    });
}
function indexUserMessagesForEditRewind(messages) {
    let nextTurnIndex = 0;
    const indexedMessages = messages.map((entry) => {
        if (entry.role !== 'user') {
            return entry;
        }
        const indexed = { ...entry, turnIndex: nextTurnIndex };
        nextTurnIndex += 1;
        return indexed;
    });
    return { messages: indexedMessages, nextTurnIndex };
}
function restoreMessagesForEditRewind({ messages, materializeMessages, }) {
    // IMPORTANT: indexUserMessagesForEditRewind must be called before
    // materializeMessages. Image message expansion creates additional
    // user-role entries that share the parent's turnIndex.
    const { messages: indexedMessages, nextTurnIndex } = indexUserMessagesForEditRewind(messages);
    return {
        messages: materializeMessages(indexedMessages),
        nextTurnIndex,
    };
}
/**
 * WebView message handling Hook
 * Handles all messages from VSCode Extension uniformly
 */
export const useWebViewMessages = ({ sessionManagement, fileContext, messageHandling, handleToolCallUpdate, clearToolCalls, rewindToolCallsToTimestamp, setPlanEntries, handlePermissionRequest, handleAskUserQuestion, inputFieldRef, setInputText, setEditMode, setIsAuthenticated, setUsageStats, setModelInfo, setAvailableCommands, setAvailableSkills, setAvailableModels, setAccountInfo, setInsightReportPath, setInsightProgress, }) => {
    // VS Code API for posting messages back to the extension host
    const vscode = useVSCode();
    // Image resolution handling
    const { materializeMessages, materializeMessage, mergeResolvedImages, clearImageResolutions, } = useImageResolution({
        vscode,
    });
    // Track active long-running tool calls (execute/bash/command) so we can
    // keep the bottom "waiting" message visible until all of them complete.
    const activeExecToolCallsRef = useRef(new Set());
    const activeInsightRunRef = useRef(false);
    const modelInfoRef = useRef(null);
    // Track the active requestId from the latest streamStart so we can
    // discard stale streamEnd events from cancelled/previous requests.
    const activeRequestIdRef = useRef(null);
    const userTurnCounterRef = useRef(0);
    // Use ref to store callbacks to avoid useEffect dependency issues
    const handlersRef = useRef({
        sessionManagement,
        fileContext,
        messageHandling,
        handleToolCallUpdate,
        clearToolCalls,
        rewindToolCallsToTimestamp,
        setPlanEntries,
        handlePermissionRequest,
        handleAskUserQuestion,
        setIsAuthenticated,
        setUsageStats,
        setModelInfo,
        setAvailableCommands,
        setAvailableSkills,
        setAvailableModels,
        setAccountInfo,
        setInsightReportPath,
        setInsightProgress,
    });
    // Track last "Updated Plan" snapshot toolcall to support merge/dedupe
    const lastPlanSnapshotRef = useRef(null);
    const buildPlanLines = (entries) => entries.map((e) => {
        const mark = e.status === 'completed' ? 'x' : e.status === 'in_progress' ? '-' : ' ';
        return `- [${mark}] ${e.content}`.trim();
    });
    const isSupplementOf = (prevLines, nextLines) => {
        // Consider "supplement" = old content text collection (ignoring status) is contained in new content
        const key = (line) => {
            const idx = line.indexOf('] ');
            return idx >= 0 ? line.slice(idx + 2).trim() : line.trim();
        };
        const nextSet = new Set(nextLines.map(key));
        for (const pl of prevLines) {
            if (!nextSet.has(key(pl))) {
                return false;
            }
        }
        return true;
    };
    const clearInsightState = () => {
        activeInsightRunRef.current = false;
        handlersRef.current.setInsightProgress?.(null);
        handlersRef.current.setInsightReportPath?.(null);
    };
    const setInsightProgressState = (progress) => {
        activeInsightRunRef.current = true;
        handlersRef.current.setInsightReportPath?.(null);
        handlersRef.current.messageHandling.clearWaitingForResponse();
        handlersRef.current.setInsightProgress?.(progress);
    };
    const setInsightReportReadyState = (path) => {
        activeInsightRunRef.current = false;
        handlersRef.current.setInsightProgress?.(null);
        handlersRef.current.setInsightReportPath?.(path);
    };
    // Update refs
    useEffect(() => {
        handlersRef.current = {
            sessionManagement,
            fileContext,
            messageHandling,
            handleToolCallUpdate,
            clearToolCalls,
            rewindToolCallsToTimestamp,
            setPlanEntries,
            handlePermissionRequest,
            handleAskUserQuestion,
            setIsAuthenticated,
            setUsageStats,
            setModelInfo,
            setAvailableCommands,
            setAvailableSkills,
            setAvailableModels,
            setAccountInfo,
            setInsightReportPath,
            setInsightProgress,
        };
    });
    const handleMessage = useCallback((event) => {
        const message = event.data;
        const handlers = handlersRef.current;
        switch (message.type) {
            case 'modeInfo': {
                // Initialize UI mode from ACP initialize
                try {
                    const current = (message.data?.currentModeId ||
                        'default');
                    setEditMode?.(current);
                }
                catch (_error) {
                    // best effort
                }
                break;
            }
            case 'modeChanged': {
                try {
                    const modeId = (message.data?.modeId ||
                        'default');
                    setEditMode?.(modeId);
                }
                catch (_error) {
                    // Ignore error when setting mode
                }
                break;
            }
            case 'modelChanged': {
                try {
                    const model = message.data?.model;
                    if (model) {
                        handlers.setModelInfo?.(model);
                    }
                }
                catch (_error) {
                    // Ignore error when setting model
                }
                break;
            }
            case 'availableCommands': {
                try {
                    const commands = message.data?.commands;
                    if (commands) {
                        handlers.setAvailableCommands?.(commands);
                    }
                }
                catch (_error) {
                    // Ignore error when setting available commands
                }
                break;
            }
            case 'availableSkills': {
                try {
                    const skills = message.data?.skills;
                    if (skills) {
                        handlers.setAvailableSkills?.(skills);
                    }
                }
                catch (_error) {
                    // Ignore error when setting available skills
                }
                break;
            }
            case 'availableModels': {
                try {
                    const models = message.data?.models;
                    console.log('[useWebViewMessages] availableModels message received:', models);
                    if (models) {
                        handlers.setAvailableModels?.(models);
                        console.log('[useWebViewMessages] setAvailableModels called with:', models);
                    }
                }
                catch (_error) {
                    // Ignore error when setting available models
                    console.error('[useWebViewMessages] Error setting available models:', _error);
                }
                break;
            }
            case 'usageStats': {
                const stats = message.data;
                handlers.setUsageStats?.(stats);
                break;
            }
            case 'modelInfo': {
                const info = message.data;
                if (info &&
                    typeof info.name === 'string' &&
                    info.name.trim().length > 0) {
                    const modelId = typeof info.modelId === 'string' && info.modelId.trim().length > 0
                        ? info.modelId.trim()
                        : info.name.trim();
                    const normalized = {
                        modelId,
                        name: info.name.trim(),
                        ...(typeof info.description !== 'undefined'
                            ? { description: info.description ?? null }
                            : {}),
                        ...(typeof info._meta !== 'undefined'
                            ? { _meta: info._meta }
                            : {}),
                    };
                    modelInfoRef.current = normalized;
                    handlers.setModelInfo?.(normalized);
                }
                else {
                    modelInfoRef.current = null;
                    handlers.setModelInfo?.(null);
                }
                break;
            }
            case 'authSuccess': {
                handlers.messageHandling.clearWaitingForResponse();
                handlers.setIsAuthenticated?.(true);
                break;
            }
            case 'agentConnected': {
                // Agent connected successfully; clear any pending spinner
                handlers.messageHandling.clearWaitingForResponse();
                // Set authentication state to true
                handlers.setIsAuthenticated?.(true);
                break;
            }
            case 'agentConnectionError': {
                // Agent connection failed; surface the error and unblock the UI
                handlers.messageHandling.clearWaitingForResponse();
                const errorMsg = message?.data?.message ||
                    'Failed to connect to Qwen agent.';
                handlers.messageHandling.addMessage({
                    role: 'assistant',
                    content: `Failed to connect to Qwen agent: ${errorMsg}\nYou can still use the chat UI, but messages won't be sent to AI.`,
                    timestamp: Date.now(),
                });
                // Set authentication state to false
                handlers.setIsAuthenticated?.(false);
                break;
            }
            case 'authError': {
                // Clear loading state and show error notice
                handlers.messageHandling.clearWaitingForResponse();
                const errorMsg = message?.data?.message ||
                    'Auth failed. Please try again.';
                handlers.messageHandling.addMessage({
                    role: 'assistant',
                    content: errorMsg,
                    timestamp: Date.now(),
                });
                // Set authentication state to false
                handlers.setIsAuthenticated?.(false);
                break;
            }
            case 'authCancelled': {
                // User dismissed the auth picker — clear loading state so the
                // input is not left disabled.
                handlers.messageHandling.clearWaitingForResponse();
                break;
            }
            case 'authState': {
                const state = message?.data?.authenticated;
                if (typeof state === 'boolean') {
                    handlers.setIsAuthenticated?.(state);
                }
                else {
                    handlers.setIsAuthenticated?.(null);
                }
                break;
            }
            case 'accountInfo': {
                const info = message?.data;
                handlers.setAccountInfo?.(info ?? null);
                break;
            }
            case 'conversationLoaded': {
                const conversation = message.data;
                const { messages: restoredMessages, nextTurnIndex } = restoreMessagesForEditRewind({
                    messages: conversation.messages,
                    materializeMessages,
                });
                userTurnCounterRef.current = nextTurnIndex;
                clearInsightState();
                clearImageResolutions();
                handlers.messageHandling.setMessages(restoredMessages);
                break;
            }
            case 'message': {
                const msg = message.data;
                const baseMessage = msg;
                if (baseMessage.role === 'user') {
                    baseMessage.turnIndex = userTurnCounterRef.current;
                    userTurnCounterRef.current += 1;
                }
                materializeMessage(baseMessage).forEach((entry) => handlers.messageHandling.addMessage(entry));
                // Robustness: if an assistant message arrives outside the normal stream
                // pipeline (no explicit streamEnd), ensure we clear streaming/waiting states
                if (msg.role === 'assistant') {
                    try {
                        handlers.messageHandling.endStreaming();
                    }
                    catch (_error) {
                        // no-op: stream might not have been started
                        console.warn('[PanelManager] Failed to end streaming:', _error);
                    }
                    // Important: Do NOT blindly clear the waiting message if there are
                    // still active tool calls running. We keep the waiting indicator
                    // tied to tool-call lifecycle instead.
                    if (activeExecToolCallsRef.current.size === 0) {
                        try {
                            handlers.messageHandling.clearWaitingForResponse();
                        }
                        catch (_error) {
                            // no-op: already cleared
                            console.warn('[PanelManager] Failed to clear waiting for response:', _error);
                        }
                    }
                }
                break;
            }
            case 'conversationRewound': {
                const targetTurnIndex = typeof message.data?.targetTurnIndex === 'number'
                    ? message.data.targetTurnIndex
                    : -1;
                if (targetTurnIndex < 0) {
                    break;
                }
                const currentMessages = handlers.messageHandling.messages;
                let fallbackUserTurnIndex = 0;
                let truncateAt = currentMessages.length;
                let cutoffTimestamp = Date.now();
                let foundTargetTurn = false;
                for (let i = 0; i < currentMessages.length; i++) {
                    const msg = currentMessages[i];
                    if (msg?.role !== 'user') {
                        continue;
                    }
                    const turnIndex = typeof msg.turnIndex === 'number'
                        ? msg.turnIndex
                        : fallbackUserTurnIndex;
                    fallbackUserTurnIndex = Math.max(fallbackUserTurnIndex, turnIndex + 1);
                    if (turnIndex === targetTurnIndex) {
                        truncateAt = i;
                        cutoffTimestamp = msg.timestamp;
                        foundTargetTurn = true;
                        break;
                    }
                }
                if (!foundTargetTurn) {
                    console.warn('[useWebViewMessages] conversationRewound target turn not found:', targetTurnIndex);
                    break;
                }
                userTurnCounterRef.current = targetTurnIndex;
                handlers.messageHandling.setMessages(currentMessages.slice(0, truncateAt));
                handlers.rewindToolCallsToTimestamp?.(cutoffTimestamp);
                activeExecToolCallsRef.current.clear();
                clearInsightState();
                clearImageResolutions();
                handlers.setPlanEntries([]);
                lastPlanSnapshotRef.current = null;
                handlers.setUsageStats?.(undefined);
                handlers.handlePermissionRequest(null);
                handlers.handleAskUserQuestion(null);
                handlers.messageHandling.clearWaitingForResponse();
                handlers.messageHandling.clearThinking();
                break;
            }
            case 'streamStart': {
                const startData = message.data;
                // Store the requestId so we can validate streamEnd events
                activeRequestIdRef.current = startData?.requestId ?? null;
                handlers.messageHandling.startStreaming(startData?.timestamp);
                break;
            }
            case 'streamChunk': {
                handlers.messageHandling.appendStreamChunk(message.data.chunk);
                break;
            }
            case 'thoughtChunk': {
                const chunk = message.data.content || message.data.chunk || '';
                handlers.messageHandling.appendThinkingChunk(chunk);
                break;
            }
            case 'streamEnd': {
                const endData = message.data;
                const endRequestId = endData?.requestId ?? null;
                // Drop stale or untagged streamEnd when a tagged stream is active.
                if (activeRequestIdRef.current) {
                    if (endRequestId !== activeRequestIdRef.current) {
                        console.log('[useWebViewMessages] Ignoring stale/untagged streamEnd:', endRequestId, 'active:', activeRequestIdRef.current);
                        break;
                    }
                }
                // Always end local streaming state and clear thinking state
                handlers.messageHandling.endStreaming();
                handlers.messageHandling.clearThinking();
                // If stream ended due to explicit user cancellation, proactively clear
                // waiting indicator and reset tracked execution calls.
                // This avoids UI getting stuck with Stop button visible after
                // rejecting a permission request.
                try {
                    const reason = (endData?.reason || '').toLowerCase();
                    /**
                     * Handle different types of stream end reasons that require a full reset:
                     * - 'user_cancelled' / 'cancelled': user explicitly cancelled
                     * - 'timeout' / 'error' / 'session_expired': request failed unexpectedly
                     * For these cases, immediately clear all active states.
                     */
                    if (FORCE_CLEAR_STREAM_END_REASONS.has(reason)) {
                        // Clear active execution tool call tracking, reset state
                        activeExecToolCallsRef.current.clear();
                        if (activeInsightRunRef.current) {
                            clearInsightState();
                        }
                        // Clear waiting response state to ensure UI returns to normal
                        handlers.messageHandling.clearWaitingForResponse();
                        break;
                    }
                }
                catch (_error) {
                    // Best-effort handling, errors don't affect main flow
                }
                /**
                 * For other types of stream end (non-user cancellation):
                 * Only clear generic waiting indicator when there are no active
                 * long-running tool calls. If there are still active execute/bash/command
                 * calls, keep the hint visible.
                 */
                if (activeExecToolCallsRef.current.size === 0) {
                    handlers.messageHandling.clearWaitingForResponse();
                }
                break;
            }
            case 'error': {
                handlers.messageHandling.endStreaming();
                handlers.messageHandling.clearThinking();
                activeExecToolCallsRef.current.clear();
                if (activeInsightRunRef.current) {
                    clearInsightState();
                }
                handlers.messageHandling.clearWaitingForResponse();
                handlers.sessionManagement.setIsSwitchingSession(false);
                // Display error message to user so they know what went wrong
                const errorMessage = message?.data?.message ||
                    'An unexpected error occurred.';
                handlers.messageHandling.addMessage({
                    role: 'assistant',
                    content: errorMessage,
                    timestamp: Date.now(),
                });
                break;
            }
            case 'permissionRequest': {
                handlers.handlePermissionRequest(message.data);
                const permToolCall = message.data?.toolCall;
                if (permToolCall?.toolCallId) {
                    // Infer kind more robustly for permission preview:
                    // - If content contains a diff entry, force 'edit' so the EditToolCall can handle it properly
                    // - Else try title-based hints; fall back to provided kind or 'execute'
                    let kind = permToolCall.kind || 'execute';
                    const contentArr = permToolCall.content || [];
                    const hasDiff = Array.isArray(contentArr)
                        ? contentArr.some((c) => !!c &&
                            typeof c === 'object' &&
                            c.type === 'diff')
                        : false;
                    if (hasDiff) {
                        kind = 'edit';
                        // Auto-open diff view for edit operations with diff content
                        // This replaces the useEffect auto-trigger in EditToolCall component
                        const diffContent = contentArr.find((c) => !!c &&
                            typeof c === 'object' &&
                            c.type === 'diff');
                        if (diffContent?.path &&
                            diffContent?.oldText !== undefined &&
                            diffContent?.newText !== undefined) {
                            vscode.postMessage({
                                type: 'openDiff',
                                data: {
                                    path: diffContent.path,
                                    oldText: diffContent.oldText,
                                    newText: diffContent.newText,
                                },
                            });
                        }
                    }
                    else if (permToolCall.title) {
                        const title = permToolCall.title.toLowerCase();
                        if (title.includes('touch') || title.includes('echo')) {
                            kind = 'execute';
                        }
                        else if (title.includes('read') || title.includes('cat')) {
                            kind = 'read';
                        }
                        else if (title.includes('write') || title.includes('edit')) {
                            kind = 'edit';
                        }
                    }
                    const normalizedStatus = (permToolCall.status === 'pending' ||
                        permToolCall.status === 'in_progress' ||
                        permToolCall.status === 'completed' ||
                        permToolCall.status === 'failed'
                        ? permToolCall.status
                        : 'pending');
                    handlers.handleToolCallUpdate({
                        type: 'tool_call',
                        toolCallId: permToolCall.toolCallId,
                        kind,
                        title: permToolCall.title,
                        status: normalizedStatus,
                        content: permToolCall.content,
                        locations: permToolCall.locations,
                    });
                    // Split assistant stream so subsequent chunks start a new assistant message
                    handlers.messageHandling.breakAssistantSegment();
                    handlers.messageHandling.breakThinkingSegment();
                }
                break;
            }
            case 'permissionResolved': {
                // Extension proactively resolved a pending permission; close drawer.
                try {
                    handlers.handlePermissionRequest(null);
                }
                catch (_error) {
                    console.warn('[useWebViewMessages] failed to close permission UI:', _error);
                }
                break;
            }
            case 'askUserQuestion': {
                // Handle ask user question request from extension
                const questionsData = message.data;
                handlers.handleAskUserQuestion(questionsData);
                break;
            }
            case 'plan':
                if (message.data.entries && Array.isArray(message.data.entries)) {
                    const entries = message.data.entries;
                    handlers.setPlanEntries(entries);
                    // Generate new snapshot text
                    const lines = buildPlanLines(entries);
                    const text = lines.join('\n');
                    const prev = lastPlanSnapshotRef.current;
                    // 1) Identical -> Skip
                    if (prev && prev.text === text) {
                        break;
                    }
                    try {
                        const ts = Date.now();
                        // 2) Supplement or status update -> Merge to previous (use tool_call_update to override content)
                        if (prev && isSupplementOf(prev.lines, lines)) {
                            handlers.handleToolCallUpdate({
                                type: 'tool_call_update',
                                toolCallId: prev.id,
                                kind: 'todo_write',
                                title: 'Updated Plan',
                                status: 'completed',
                                content: [
                                    {
                                        type: 'content',
                                        content: { type: 'text', text },
                                    },
                                ],
                                timestamp: ts,
                            });
                            lastPlanSnapshotRef.current = { id: prev.id, text, lines };
                        }
                        else {
                            // 3) Other cases -> Add a new history card
                            const toolCallId = `plan-snapshot-${ts}`;
                            handlers.handleToolCallUpdate({
                                type: 'tool_call',
                                toolCallId,
                                kind: 'todo_write',
                                title: 'Updated Plan',
                                status: 'completed',
                                content: [
                                    {
                                        type: 'content',
                                        content: { type: 'text', text },
                                    },
                                ],
                                timestamp: ts,
                            });
                            lastPlanSnapshotRef.current = { id: toolCallId, text, lines };
                        }
                        // Split assistant message segments, keep rendering blocks independent
                        handlers.messageHandling.breakAssistantSegment?.();
                        handlers.messageHandling.breakThinkingSegment?.();
                    }
                    catch (_error) {
                        console.warn('[useWebViewMessages] failed to push/merge plan snapshot toolcall:', _error);
                    }
                }
                break;
            case 'toolCall':
            case 'toolCallUpdate': {
                const toolCallData = message.data;
                if (toolCallData.sessionUpdate && !toolCallData.type) {
                    toolCallData.type = toolCallData.sessionUpdate;
                }
                handlers.handleToolCallUpdate(toolCallData);
                // Split assistant stream
                const status = (toolCallData.status || '').toString();
                const isStart = toolCallData.type === 'tool_call';
                const isFinalUpdate = toolCallData.type === 'tool_call_update' &&
                    (status === 'completed' || status === 'failed');
                if (isStart || isFinalUpdate) {
                    handlers.messageHandling.breakAssistantSegment();
                    handlers.messageHandling.breakThinkingSegment();
                }
                // While long-running tools (e.g., execute/bash/command) are in progress,
                // surface a lightweight loading indicator and expose the Stop button.
                try {
                    const id = (toolCallData.toolCallId || '').toString();
                    const kind = (toolCallData.kind || '').toString().toLowerCase();
                    const isExecKind = kind === 'execute' || kind === 'bash' || kind === 'command';
                    // CLI sometimes omits kind in tool_call_update payloads; fall back to
                    // whether we've already tracked this ID as an exec tool.
                    const wasTrackedExec = activeExecToolCallsRef.current.has(id);
                    const isExec = isExecKind || wasTrackedExec;
                    if (!isExec || !id) {
                        break;
                    }
                    if (status === 'pending' || status === 'in_progress') {
                        if (isExecKind) {
                            activeExecToolCallsRef.current.add(id);
                            // Build a helpful hint from rawInput
                            const rawInput = toolCallData.rawInput;
                            let cmd = '';
                            if (typeof rawInput === 'string') {
                                cmd = rawInput;
                            }
                            else if (rawInput && typeof rawInput === 'object') {
                                const maybe = rawInput;
                                cmd = maybe.command || '';
                            }
                            const hint = cmd ? `Running: ${cmd}` : 'Running command...';
                            handlers.messageHandling.setWaitingForResponse(hint);
                        }
                    }
                    else if (status === 'completed' || status === 'failed') {
                        activeExecToolCallsRef.current.delete(id);
                    }
                    // If no active exec tool remains, clear the waiting message.
                    if (activeExecToolCallsRef.current.size === 0) {
                        handlers.messageHandling.clearWaitingForResponse();
                    }
                }
                catch (_error) {
                    // Best-effort UI hint; ignore errors
                }
                break;
            }
            case 'qwenSessionList': {
                const sessions = message.data.sessions || [];
                const append = Boolean(message.data.append);
                const nextCursor = message.data.nextCursor;
                const hasMore = Boolean(message.data.hasMore);
                handlers.sessionManagement.setQwenSessions((prev) => append ? [...prev, ...sessions] : sessions);
                handlers.sessionManagement.setNextCursor(nextCursor);
                handlers.sessionManagement.setHasMore(hasMore);
                handlers.sessionManagement.setIsLoading(false);
                if (handlers.sessionManagement.currentSessionId &&
                    sessions.length > 0) {
                    const currentSession = sessions.find((s) => s.id ===
                        handlers.sessionManagement.currentSessionId ||
                        s.sessionId ===
                            handlers.sessionManagement.currentSessionId);
                    if (currentSession) {
                        const title = currentSession.title ||
                            currentSession.name ||
                            'Past Conversations';
                        handlers.sessionManagement.setCurrentSessionTitle(title);
                    }
                }
                break;
            }
            case 'qwenSessionSwitched':
                handlers.sessionManagement.setShowSessionSelector(false);
                clearInsightState();
                if (message.data.sessionId) {
                    handlers.sessionManagement.setCurrentSessionId(message.data.sessionId);
                }
                if (message.data.session) {
                    const session = message.data.session;
                    const title = session.title ||
                        session.name ||
                        'Past Conversations';
                    handlers.sessionManagement.setCurrentSessionTitle(title);
                    // Update the VS Code webview tab title as well
                    vscode.postMessage({ type: 'updatePanelTitle', data: { title } });
                }
                if (message.data.messages) {
                    clearImageResolutions();
                    const { messages: restoredMessages, nextTurnIndex } = restoreMessagesForEditRewind({
                        messages: message.data.messages,
                        materializeMessages,
                    });
                    userTurnCounterRef.current = nextTurnIndex;
                    handlers.messageHandling.setMessages(restoredMessages);
                }
                else {
                    userTurnCounterRef.current = 0;
                    handlers.messageHandling.clearMessages();
                }
                // Clear any waiting message that might be displayed from previous session
                handlers.messageHandling.clearWaitingForResponse();
                // Clear active tool calls tracking
                activeExecToolCallsRef.current.clear();
                // Clear and restore tool calls if provided in session data
                handlers.clearToolCalls();
                if (message.data.toolCalls && Array.isArray(message.data.toolCalls)) {
                    message.data.toolCalls.forEach((toolCall) => {
                        if (toolCall && typeof toolCall === 'object') {
                            handlers.handleToolCallUpdate(toolCall);
                        }
                    });
                }
                // Restore plan entries if provided
                if (message.data.planEntries &&
                    Array.isArray(message.data.planEntries)) {
                    handlers.setPlanEntries(message.data.planEntries);
                }
                else {
                    handlers.setPlanEntries([]);
                }
                lastPlanSnapshotRef.current = null;
                break;
            case 'sessionLoadComplete':
            case 'sessionExpired':
                handlers.sessionManagement.setIsSwitchingSession(false);
                break;
            case 'conversationCleared':
                clearInsightState();
                resetConversationState({
                    handlers: {
                        ...handlers,
                        clearActiveExecToolCalls: () => {
                            activeExecToolCallsRef.current.clear();
                        },
                        resetUserTurnCounter: () => {
                            userTurnCounterRef.current = 0;
                        },
                    },
                    clearImageResolutions,
                    vscode,
                });
                lastPlanSnapshotRef.current = null;
                break;
            case 'sessionTitleUpdated': {
                const sessionId = message.data?.sessionId;
                const title = message.data?.title;
                if (sessionId && title) {
                    handlers.sessionManagement.setCurrentSessionId(sessionId);
                    handlers.sessionManagement.setCurrentSessionTitle(title);
                    // Ask extension host to reflect this title in the tab label
                    vscode.postMessage({ type: 'updatePanelTitle', data: { title } });
                }
                break;
            }
            case 'sessionDeleted': {
                const deletedId = message.data?.sessionId;
                if (deletedId) {
                    handlers.sessionManagement.setQwenSessions((prev) => prev.filter((s) => s.sessionId !== deletedId && s.id !== deletedId));
                }
                break;
            }
            case 'sessionRenamed': {
                const renamedId = message.data?.sessionId;
                const newTitle = message.data?.title;
                if (renamedId && newTitle) {
                    handlers.sessionManagement.setQwenSessions((prev) => prev.map((s) => s.sessionId === renamedId || s.id === renamedId
                        ? { ...s, title: newTitle, name: newTitle }
                        : s));
                }
                break;
            }
            case 'activeEditorChanged': {
                const fileName = message.data?.fileName;
                const filePath = message.data?.filePath;
                const selection = message.data?.selection;
                handlers.fileContext.setActiveFileName(fileName);
                handlers.fileContext.setActiveFilePath(filePath);
                handlers.fileContext.setActiveSelection(selection);
                break;
            }
            case 'fileAttached': {
                const attachment = message.data;
                handlers.fileContext.addFileReference(attachment.name, attachment.value);
                if (inputFieldRef.current) {
                    const currentText = inputFieldRef.current.textContent || '';
                    const newText = currentText
                        ? `${currentText} @${attachment.name} `
                        : `@${attachment.name} `;
                    inputFieldRef.current.textContent = newText;
                    setInputText(newText);
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(inputFieldRef.current);
                    range.collapse(false);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }
                break;
            }
            case 'workspaceFiles': {
                const files = message.data?.files;
                const requestId = message.data?.requestId;
                if (files) {
                    console.log('[WebView] Received workspaceFiles:', files.length);
                    handlers.fileContext.setWorkspaceFilesFromResponse(files, requestId);
                }
                break;
            }
            case 'imagePathsResolved': {
                const resolved = message.data?.resolved ?? [];
                handlers.messageHandling.setMessages((prevMessages) => mergeResolvedImages(prevMessages, resolved));
                break;
            }
            case 'insightProgress': {
                const stage = message.data?.stage;
                const progress = message.data?.progress;
                const detail = message.data?.detail;
                if (typeof stage === 'string' && typeof progress === 'number') {
                    setInsightProgressState({
                        stage,
                        progress,
                        detail,
                    });
                }
                break;
            }
            case 'insightProgressCleared': {
                clearInsightState();
                break;
            }
            case 'insightReportReady': {
                const path = message.data?.path;
                setInsightReportReadyState(path ?? null);
                break;
            }
            case 'cancelStreaming':
                // Handle cancel streaming response from extension
                // Note: The "Interrupted" message is already added by handleCancel in App.tsx
                // to provide immediate UI feedback. We only need to ensure streaming states
                // are properly cleaned up here.
                if (activeInsightRunRef.current) {
                    clearInsightState();
                }
                handlers.messageHandling.endStreaming();
                handlers.messageHandling.clearWaitingForResponse();
                break;
            default:
                break;
        }
    }, [
        inputFieldRef,
        setInputText,
        vscode,
        setEditMode,
        materializeMessages,
        materializeMessage,
        mergeResolvedImages,
        clearImageResolutions,
    ]);
    useEffect(() => {
        window.addEventListener('message', handleMessage);
        // Notify extension that the webview is ready to receive initialization state.
        vscode.postMessage({ type: 'webviewReady', data: {} });
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage, vscode]);
};
//# sourceMappingURL=useWebViewMessages.js.map