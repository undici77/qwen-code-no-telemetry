import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { useActions, useConnection, useDaemonFollowupSuggestion, useStreamingState, useTranscriptHistory, useTranscriptStore, useWorkspace, } from '@qwen-code/webui/daemon-react-sdk';
import {} from '@qwen-code/sdk/daemon';
import { SubagentDetailsProvider } from '../subagentDetailsContext';
import { MonitorDetailsProvider } from '../monitorDetailsContext';
import { useI18n } from '../i18n';
import { useWebShellCustomization } from '../customization';
import { SESSION_MONITOR_TOOL_CORRELATION_FEATURE, SESSION_TRANSCRIPT_PAGINATION_FEATURE, } from '../constants/sessions';
import { useAnimationFrameTranscriptBlocks } from '../hooks/useAnimationFrameTranscriptBlocks';
import { useMessagesFromBlocks } from '../hooks/useMessages';
import { useSessionArtifacts } from '../hooks/useSessionArtifacts';
import { extractPendingPermission } from '../adapters/transcriptAdapter';
import { useQueuedPrompts } from '../hooks/useQueuedPrompts';
import { isAskUserPermission } from '../utils/askUserPermission';
import { isDaemonApprovalMode } from '../utils/sessionPreparation';
import { isVisibleComposerModel } from '../utils/composerModels';
import { shouldBlockComposerSubmit } from '../utils/composerInputState';
import { isDefinitelyRejectedPromptAdmission } from '../utils/promptAdmission';
import { getActiveTodosForPlanRevision, isExitPlanApprovalRequest, } from '../utils/todos';
import { findMonitorTaskForTool } from '../utils/monitorTasks';
import { invokeSlashCommandHandler } from '../utils/slash-command-action';
import { getModelDisplayName } from '../utils/modelDisplay';
import { hasMultipleWorkspaces, workspaceLabelForCwd, } from '../utils/workspace';
import { workspaceAccentColor } from '../utils/workspaceColor';
import { resolveVoiceWorkspaceTarget, } from '../voice/voice-workspace-target';
import { getLocalCommands, localizeBuiltinDescriptions, skillDescriptionKey, } from '../constants/localCommands';
import { mergeCommands } from '../hooks/daemonSessionMappers';
import { useSessionCatalogController } from '../session-catalog/session-catalog-hooks';
import { MessageList } from './MessageList';
import { StreamingStatus } from './StreamingStatus';
import { ChatEditor } from './ChatEditor';
import { QueuedPromptDisplay } from './QueuedPromptDisplay';
import { ToolApproval } from './messages/ToolApproval';
import { AskUserQuestion } from './messages/AskUserQuestion';
import { TURN_OUTPUT_KINDS } from './artifacts/TurnOutputs';
import { getArtifactsByTurn, getFileChangesByTurn, getScheduledTasksByTurn, } from './artifacts/turnOutputSelectors';
import { PaneHeaderActions } from './PaneHeaderActions';
import styles from './ChatPane.module.css';
import accentStyles from './WorkspaceAccent.module.css';
// Split-view panes get the same interactive composer controls as the main chat,
// each scoped to the pane's own session: the approval-mode and model pickers,
// plus voice dictation. The width toggle is omitted (panes size themselves); the
// slash menu is populated from the session's own command list (see below).
const PANE_TOOLBAR_ACTIONS = [
    'approvalMode',
    'model',
    'voice',
];
const EMPTY_VOICE_WORKSPACE_REVISIONS = {};
function OptionalMonitorDetailsProvider({ enabled, onOpen, children, }) {
    return enabled ? (_jsx(MonitorDetailsProvider, { onOpen: onOpen, children: children })) : (children);
}
/**
 * A self-contained interactive chat, scoped to whichever `DaemonSessionProvider`
 * it is nested under. Rendering N of these (each under its own provider) inside
 * one window is the split view: every pane has its own transcript, streaming
 * state, approvals, and composer, and the browser scopes keyboard focus to the
 * pane the user clicks into — so there is no cross-pane approval arbitration.
 */
export function ChatPane({ title, workspaceCwd, renderHeaderActions, onClose, onToggleMaximize, isMaximized = false, onError, onImageIngestionNotice, onSlashCommand, onRightPanelOpen, onOpenMonitor, onPaneArtifactsChange, messageTurnOutputs, restartSseOnPrompt = false, embedded = false, onFirstPromptAdmitted, reportCatalogTurnCompletion = true, hidden = false, voiceUserRevision = 0, voiceWorkspaceRevisions = EMPTY_VOICE_WORKSPACE_REVISIONS, voiceWorkspaces, sessionWorkflowEnabled = false, }) {
    const { t } = useI18n();
    const { renderComposerFooter: CustomComposerFooter } = useWebShellCustomization();
    const connection = useConnection();
    const actions = useActions();
    const workspace = useWorkspace();
    const sessionCatalogController = useSessionCatalogController(workspace.client);
    const blocks = useAnimationFrameTranscriptBlocks();
    const messages = useMessagesFromBlocks(t, blocks);
    const transcriptHistory = useTranscriptHistory();
    const store = useTranscriptStore();
    const streamingState = useStreamingState();
    const { artifacts } = useSessionArtifacts();
    const openSubagentDetails = useCallback((tool) => {
        if (!connection.sessionId || !onRightPanelOpen)
            return;
        const rawOutput = tool.rawOutput && typeof tool.rawOutput === 'object'
            ? tool.rawOutput
            : undefined;
        const subagentType = (typeof tool.args?.subagent_type === 'string'
            ? tool.args.subagent_type
            : undefined) ??
            (typeof rawOutput?.['subagentName'] === 'string'
                ? rawOutput['subagentName']
                : undefined);
        onRightPanelOpen({
            id: `subagent:${connection.sessionId}:${tool.callId}`,
            kind: 'subagent',
            title: tool.title || subagentType || t('agent.label'),
            turnId: tool.callId,
            tool,
            sessionId: connection.sessionId,
            workspaceCwd: connection.workspaceCwd ?? workspaceCwd,
        });
    }, [
        connection.sessionId,
        connection.workspaceCwd,
        onRightPanelOpen,
        t,
        workspaceCwd,
    ]);
    const monitorSessionIdRef = useRef(connection.sessionId);
    monitorSessionIdRef.current = connection.sessionId;
    const monitorDetailsSupported = connection.capabilities?.features.includes(SESSION_MONITOR_TOOL_CORRELATION_FEATURE) === true && onOpenMonitor !== undefined;
    const openMonitorDetails = useCallback(async (tool) => {
        const sessionId = monitorSessionIdRef.current;
        if (!sessionId || !onOpenMonitor)
            return false;
        try {
            const snapshot = await actions.getTasks();
            if (monitorSessionIdRef.current !== sessionId ||
                snapshot.sessionId !== sessionId) {
                return false;
            }
            const task = findMonitorTaskForTool(snapshot.tasks, tool);
            if (!task)
                return false;
            onOpenMonitor(task, sessionId, actions);
            return true;
        }
        catch {
            return false;
        }
    }, [actions, onOpenMonitor]);
    useEffect(() => {
        const sessionId = connection.sessionId;
        if (!sessionId)
            return;
        onPaneArtifactsChange?.(sessionId, artifacts);
        return () => {
            onPaneArtifactsChange?.(sessionId, []);
        };
    }, [artifacts, connection.sessionId, onPaneArtifactsChange]);
    const streamingStateRef = useRef(streamingState);
    streamingStateRef.current = streamingState;
    const catalogOwnerCwd = connection.workspaceCwd &&
        workspaceCwd &&
        connection.workspaceCwd !== workspaceCwd
        ? undefined
        : (connection.workspaceCwd ?? workspaceCwd);
    const previousCatalogStreamingStateRef = useRef(streamingState);
    const catalogStreamingSessionIdRef = useRef(streamingState !== 'idle' ? connection.sessionId : undefined);
    const catalogStreamingWorkspaceCwdRef = useRef(streamingState !== 'idle' ? catalogOwnerCwd : undefined);
    useEffect(() => {
        const previous = previousCatalogStreamingStateRef.current;
        previousCatalogStreamingStateRef.current = streamingState;
        if (streamingState !== 'idle' &&
            (previous === 'idle' ||
                catalogStreamingSessionIdRef.current === undefined)) {
            catalogStreamingSessionIdRef.current = connection.sessionId;
            catalogStreamingWorkspaceCwdRef.current = catalogOwnerCwd;
        }
        else if (streamingState !== 'idle' &&
            connection.sessionId === catalogStreamingSessionIdRef.current &&
            catalogStreamingWorkspaceCwdRef.current === undefined) {
            catalogStreamingWorkspaceCwdRef.current = catalogOwnerCwd;
        }
        if (previous !== 'idle' &&
            streamingState === 'idle' &&
            connection.sessionId &&
            connection.sessionId === catalogStreamingSessionIdRef.current &&
            catalogOwnerCwd &&
            catalogOwnerCwd === catalogStreamingWorkspaceCwdRef.current &&
            reportCatalogTurnCompletion) {
            sessionCatalogController.turnCompleted(catalogOwnerCwd);
        }
    }, [
        catalogOwnerCwd,
        connection.sessionId,
        reportCatalogTurnCompletion,
        sessionCatalogController,
        streamingState,
    ]);
    const firstPromptAdmittedRef = useRef(false);
    const [unknownPromptAdmission, setUnknownPromptAdmission] = useState(null);
    const admissionOwnerRef = useRef({ sessionId: connection.sessionId });
    if (admissionOwnerRef.current.sessionId !== connection.sessionId) {
        admissionOwnerRef.current = { sessionId: connection.sessionId };
    }
    useEffect(() => {
        firstPromptAdmittedRef.current = false;
        setUnknownPromptAdmission(null);
    }, [connection.sessionId]);
    const admissionPayloadLocked = unknownPromptAdmission?.payloadAvailable === true;
    const discardUnknownPromptPayload = useCallback(() => {
        const current = unknownPromptAdmission;
        if (!current?.payloadAvailable)
            return;
        if (admissionOwnerRef.current !== current.owner) {
            setUnknownPromptAdmission(null);
            return;
        }
        current.commitAccepted?.();
        setUnknownPromptAdmission({
            owner: current.owner,
            payloadAvailable: false,
        });
    }, [unknownPromptAdmission]);
    const continueEditingUnknownPrompt = useCallback(() => {
        if (!window.confirm(t('queue.continueEditingConfirm')))
            return;
        const current = unknownPromptAdmission;
        if (!current?.payloadAvailable)
            return;
        if (admissionOwnerRef.current !== current.owner) {
            setUnknownPromptAdmission(null);
            return;
        }
        setUnknownPromptAdmission({
            owner: current.owner,
            payloadAvailable: false,
        });
    }, [t, unknownPromptAdmission]);
    const reloadTranscript = useCallback(async (signal) => {
        if (!connection.sessionId)
            return;
        await actions.reloadSession(signal);
    }, [actions, connection.sessionId]);
    const transcriptReloadSupported = connection.capabilities?.features.includes(SESSION_TRANSCRIPT_PAGINATION_FEATURE) === true;
    const editorRef = useRef(null);
    const { followupState, onAcceptFollowup, onDismissFollowup, clear: clearFollowup, } = useDaemonFollowupSuggestion({
        onAccept: (suggestion) => {
            editorRef.current?.insertText(suggestion);
        },
    });
    const reportError = useCallback((error, fallback) => {
        if (onError)
            onError(error, fallback);
        else
            console.error(fallback, error);
    }, [onError]);
    const onSlashCommandRef = useRef(onSlashCommand);
    onSlashCommandRef.current = onSlashCommand;
    const pendingApproval = useMemo(() => extractPendingPermission(blocks), [blocks]);
    const isAskUser = isAskUserPermission(pendingApproval);
    const pendingToolApproval = pendingApproval && !isAskUser ? pendingApproval : null;
    const pendingAskUserApproval = pendingApproval && isAskUser ? pendingApproval : null;
    const isExitPlanApproval = isExitPlanApprovalRequest(pendingToolApproval);
    const planTodos = useMemo(() => sessionWorkflowEnabled && isExitPlanApproval
        ? getActiveTodosForPlanRevision(messages, pendingToolApproval?.todoPlan)
        : [], [isExitPlanApproval, messages, pendingToolApproval, sessionWorkflowEnabled]);
    // Tracked in a ref so an async approval-mode switch (handleSelectMode) reads
    // the approval current when setApprovalMode *resolves*, not a stale one
    // captured at click time — mirrors App's pendingApprovalRef.
    const pendingToolApprovalRef = useRef(pendingToolApproval);
    pendingToolApprovalRef.current = pendingToolApproval;
    const approvalActive = pendingToolApproval !== null || pendingAskUserApproval !== null;
    const paneVoiceCwd = connection.sessionId &&
        connection.workspaceCwd &&
        (!workspaceCwd || workspaceCwd === connection.workspaceCwd)
        ? connection.workspaceCwd
        : undefined;
    const voiceTarget = useMemo(() => resolveVoiceWorkspaceTarget({
        capabilities: workspace.capabilities,
        intendedCwd: paneVoiceCwd,
        sessionId: connection.sessionId,
        workspaces: voiceWorkspaces,
    }), [
        connection.sessionId,
        paneVoiceCwd,
        voiceWorkspaces,
        workspace.capabilities,
    ]);
    const voiceStatusRevision = useMemo(() => ({
        user: voiceUserRevision,
        workspace: voiceTarget
            ? (voiceWorkspaceRevisions[voiceTarget.workspaceKey] ?? 0)
            : 0,
    }), [voiceTarget, voiceUserRevision, voiceWorkspaceRevisions]);
    const isResponding = streamingState !== 'idle';
    const artifactsByTurn = useMemo(() => getArtifactsByTurn(messages, artifacts, connection.workspaceCwd || ''), [messages, artifacts, connection.workspaceCwd]);
    const fileChangesByTurn = useMemo(() => getFileChangesByTurn(messages, artifactsByTurn, connection.workspaceCwd || ''), [messages, artifactsByTurn, connection.workspaceCwd]);
    const scheduledTasksByTurn = useMemo(() => getScheduledTasksByTurn(messages), [messages]);
    const visibleTurnOutputKinds = useMemo(() => new Set(messageTurnOutputs ?? TURN_OUTPUT_KINDS), [messageTurnOutputs]);
    const canMutateMidTurn = connection.capabilities?.features.includes('session_mid_turn_message_mutation') === true;
    const canQueryMidTurn = connection.capabilities?.features.includes('session_mid_turn_message_query') === true;
    const { queuedPrompts, queuedTexts, enqueuePrompt, removeQueuedPrompt, editQueuedPrompt, editLastQueuedPrompt, clearQueuedPrompts, restoreUnknownQueuedPrompt, discardUnknownQueuedPrompt, } = useQueuedPrompts({
        connected: connection.status === 'connected',
        sessionId: connection.sessionId,
        workspaceCwd: connection.workspaceCwd,
        clientId: connection.clientId,
        canMutateMidTurn,
        canQueryMidTurn,
        streamingState,
        sessionActions: actions,
        store,
        editorRef,
        reportError,
        t,
    });
    // Anchor the streaming timer to the turn's own start (the last user message's
    // timestamp) rather than letting StreamingStatus fall back to "now" — so a
    // pane opened mid-turn shows the real elapsed time, not a reset-to-zero clock.
    const activeTurnStartedAt = useMemo(() => {
        if (!isResponding)
            return undefined;
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            if (message?.role === 'user')
                return message.timestamp;
        }
        return undefined;
    }, [messages, isResponding]);
    const handleSubmit = useCallback((text, images, commitAccepted, metadata) => {
        const trimmed = text.trim();
        if (!trimmed && (images?.length ?? 0) === 0)
            return false;
        if (admissionPayloadLocked)
            return false;
        if (trimmed &&
            invokeSlashCommandHandler(text, onSlashCommandRef.current, reportError)) {
            return true;
        }
        if (shouldBlockComposerSubmit({
            connectionStatus: connection.status,
            hasSession: Boolean(connection.sessionId),
            restartSseOnPrompt,
        })) {
            return false;
        }
        const inputAnnotations = metadata?.inputAnnotations;
        const notifyFirstPromptAdmitted = () => {
            if (trimmed &&
                !firstPromptAdmittedRef.current &&
                onFirstPromptAdmitted) {
                firstPromptAdmittedRef.current = true;
                onFirstPromptAdmitted(trimmed);
            }
        };
        if (streamingStateRef.current === 'idle') {
            const admissionOwner = admissionOwnerRef.current;
            let admissionStarted = false;
            let admitted = false;
            actions
                .sendPrompt(trimmed, {
                ...(images && images.length ? { images } : {}),
                ...(inputAnnotations ? { inputAnnotations } : {}),
                onAdmissionStarted: () => {
                    admissionStarted = true;
                },
                onAdmitted: () => {
                    if (admissionOwnerRef.current !== admissionOwner)
                        return;
                    if (connection.sessionId && catalogOwnerCwd) {
                        sessionCatalogController.promptAdmitted(catalogOwnerCwd, connection.sessionId);
                    }
                    admitted = true;
                    notifyFirstPromptAdmitted();
                    clearFollowup();
                    commitAccepted?.();
                },
            })
                .catch((error) => {
                if (admissionOwnerRef.current !== admissionOwner)
                    return;
                const definitelyRejected = isDefinitelyRejectedPromptAdmission(error);
                if (admitted || !admissionStarted || definitelyRejected) {
                    reportError(error, 'Failed to send prompt');
                    return;
                }
                if (catalogOwnerCwd) {
                    sessionCatalogController.promptAdmissionUncertain(catalogOwnerCwd);
                }
                setUnknownPromptAdmission({
                    owner: admissionOwner,
                    commitAccepted,
                    payloadAvailable: true,
                });
                onImageIngestionNotice?.('warning', t('queue.admissionUnknown'));
                console.warn('[ChatPane] prompt admission outcome is unknown', error);
            });
            return false;
        }
        const queued = !trimmed && !inputAnnotations
            ? enqueuePrompt(trimmed, images)
            : enqueuePrompt(trimmed, images, undefined, inputAnnotations, notifyFirstPromptAdmitted);
        if (queued !== false && catalogOwnerCwd) {
            sessionCatalogController.invalidateWorkspace(catalogOwnerCwd);
        }
        return queued;
    }, [
        actions,
        admissionPayloadLocked,
        catalogOwnerCwd,
        clearFollowup,
        connection.sessionId,
        connection.status,
        enqueuePrompt,
        onFirstPromptAdmitted,
        onImageIngestionNotice,
        reportError,
        restartSseOnPrompt,
        sessionCatalogController,
        t,
    ]);
    const handleConfirm = useCallback((id, selectedOption, answers) => {
        actions
            .submitPermission(id, selectedOption, answers)
            .catch((error) => reportError(error, 'Failed to submit permission choice'));
    }, [actions, reportError]);
    const handleAskUserConfirm = useCallback((id, selectedOption, answers) => actions.submitPermission(id, selectedOption, answers), [actions]);
    const handleCancel = useCallback(() => {
        actions
            .cancel()
            .catch((error) => reportError(error, 'Failed to cancel request'));
    }, [actions, reportError]);
    const handleRightPanelOpen = useCallback((request) => {
        if (!onRightPanelOpen)
            return;
        onRightPanelOpen({
            ...request,
            sourceSessionId: connection.sessionId,
        });
    }, [connection.sessionId, onRightPanelOpen]);
    const handleImagePreview = useCallback((src, alt) => {
        if (!connection.sessionId)
            return;
        handleRightPanelOpen({
            id: 'image',
            kind: 'image',
            title: t('turnOutputs.imagePreview'),
            turnId: connection.sessionId,
            src,
            ...(alt ? { alt } : {}),
        });
    }, [connection.sessionId, handleRightPanelOpen, t]);
    // Composer wiring, all scoped to THIS pane's own DaemonSession context. The
    // slash menu lists the session's daemon commands — they run server-side when
    // submitted (via sendPrompt), so e.g. `/clear` clears this pane's session, not
    // the outer one. The approval-mode and model pickers likewise drive this
    // session's own actions; the SDK reflects the change back on `connection`.
    const commands = useMemo(() => {
        return localizeBuiltinDescriptions(mergeCommands(connection.commands ?? [], getLocalCommands(t)), t).map((command) => {
            const skillKey = skillDescriptionKey(command.name);
            if (!skillKey)
                return command;
            return {
                ...command,
                displayCategory: 'skill',
                description: t(skillKey),
            };
        });
    }, [connection.commands, t]);
    const availableModels = useMemo(() => (connection.models ?? []).filter(isVisibleComposerModel).map((model) => ({
        id: model.id,
        label: getModelDisplayName(model.label || model.id),
    })), [connection.models]);
    const handleSelectMode = useCallback((modeId) => {
        // Modes always arrive from the toolbar's own picker, but narrow anyway so
        // the daemon action gets a well-typed value (mirrors App's handleSetMode).
        if (!isDaemonApprovalMode(modeId)) {
            reportError(new Error(`Unsupported approval mode: ${modeId}`), 'Failed to set approval mode');
            return;
        }
        actions
            .setApprovalMode(modeId)
            .then(() => {
            // Mirror App's handleSetMode: switching THIS pane to yolo (or
            // auto-edit for an edit tool) auto-approves a tool call already
            // awaiting approval in this pane, so the shortcut behaves the same as
            // in the single-session chat.
            const approval = pendingToolApprovalRef.current;
            if (!approval)
                return;
            const autoApprove = modeId === 'yolo' ||
                (modeId === 'auto-edit' && approval.toolKind === 'edit');
            if (!autoApprove)
                return;
            const allowOnce = approval.options.find((option) => option.kind === 'allow_once');
            if (!allowOnce)
                return;
            actions
                .submitPermission(approval.id, allowOnce.id)
                .catch((error) => reportError(error, 'Failed to auto-approve tool call'));
        })
            .catch((error) => reportError(error, 'Failed to set approval mode'));
    }, [actions, reportError]);
    const handleSelectModel = useCallback((modelId) => {
        actions
            .setModel(modelId)
            .catch((error) => reportError(error, 'Failed to switch model'));
    }, [actions, reportError]);
    const handleSelectReasoningEffort = useCallback((value) => actions
        .setReasoningEffort(value)
        .catch((error) => reportError(error, t('reasoning.updateFailed'))), [actions, reportError, t]);
    const headerLabel = title || connection.displayName || connection.sessionId?.slice(0, 8) || '';
    // On a multi-workspace daemon, surface this pane's workspace as a composer-
    // toolbar chip (next to where the git-branch chip sits), so it's clear which
    // workspace a message goes to. Multi-workspace-ness comes from the shared
    // workspace provider (the pane's own session connection may not carry it).
    const paneWorkspaceCwd = workspaceCwd ?? connection.workspaceCwd;
    const showWorkspaceChip = hasMultipleWorkspaces(workspace.capabilities) && !!paneWorkspaceCwd;
    // Memoized so the array identity is stable across renders — `ChatEditor` is
    // `React.memo`, and a fresh `[...]` each render would defeat it.
    const paneToolbarActions = useMemo(() => showWorkspaceChip
        ? [...PANE_TOOLBAR_ACTIONS, 'workspace']
        : PANE_TOOLBAR_ACTIONS, [showWorkspaceChip]);
    const headerActions = connection.sessionId && renderHeaderActions
        ? renderHeaderActions({
            sessionId: connection.sessionId,
            workspaceCwd: paneWorkspaceCwd || undefined,
        })
        : null;
    // Also surface the workspace in the pane HEADER (always visible at the top),
    // not just the composer chip at the bottom — on a narrow split the composer
    // chip collapses to a bare folder icon, so the header is where you tell panes
    // apart. A stable per-workspace accent color (same palette as the sidebar
    // session-group dots) lets same-workspace panes read as a group at a glance,
    // and keeps them distinguishable even when the header name ellipsizes.
    const workspaceLabel = showWorkspaceChip && paneWorkspaceCwd
        ? workspaceLabelForCwd(paneWorkspaceCwd, workspace.capabilities?.workspaces)
        : undefined;
    const workspaceAccent = showWorkspaceChip
        ? workspaceAccentColor(paneWorkspaceCwd, workspace.capabilities)
        : undefined;
    const workspaceAccentClass = workspaceAccent
        ? accentStyles[workspaceAccent]
        : undefined;
    return (_jsxs("section", { className: `${styles.pane} ${embedded ? styles.paneEmbedded : ''}`.trim(), "data-testid": "chat-pane", "aria-label": headerLabel, children: [!embedded && (_jsxs("header", { className: `${styles.header} ${workspaceAccentClass ?? ''}`.trim(), children: [workspaceLabel && (_jsxs("span", { 
                        // role="img" so the whole dot+name badge is announced as its
                        // aria-label ("Workspace: <name>"); aria-label on a bare <span>
                        // (generic role) isn't reliably surfaced by screen readers.
                        role: "img", className: styles.workspaceTag, title: paneWorkspaceCwd, "aria-label": t('workspace.paneLabel', { name: workspaceLabel }), "data-web-shell-pane-workspace": true, children: [_jsx("span", { className: styles.workspaceTagDot, "aria-hidden": "true" }), _jsx("span", { className: styles.workspaceTagText, children: workspaceLabel })] })), _jsx("span", { className: styles.title, title: headerLabel, children: headerLabel }), _jsx(PaneHeaderActions, { trailing: onToggleMaximize || onClose ? (_jsxs(_Fragment, { children: [onToggleMaximize && (_jsx("button", { type: "button", className: styles.maximizeButton, onClick: onToggleMaximize, "aria-pressed": isMaximized, "aria-label": t(isMaximized
                                        ? 'splitView.restorePane'
                                        : 'splitView.maximizePane'), title: t(isMaximized
                                        ? 'splitView.restorePane'
                                        : 'splitView.maximizePane'), children: isMaximized ? (_jsx(Minimize2Icon, { size: 16, "aria-hidden": true })) : (_jsx(Maximize2Icon, { size: 16, "aria-hidden": true })) })), onClose && (_jsx("button", { type: "button", className: styles.closeButton, onClick: onClose, "aria-label": t('splitView.closePane'), title: t('splitView.closePane'), "data-testid": "pane-close", children: _jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6L6 18", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) }))] })) : null, children: headerActions })] })), connection.error && (_jsx("div", { className: styles.connectionError, role: "alert", children: _jsxs("span", { className: styles.connectionErrorText, children: [t('splitView.paneConnectionError'), ": ", connection.error] }) })), _jsx("div", { className: styles.body, children: _jsx(OptionalMonitorDetailsProvider, { enabled: monitorDetailsSupported, onOpen: openMonitorDetails, children: _jsx(SubagentDetailsProvider, { onOpen: openSubagentDetails, children: _jsx(MessageList, { messages: messages, pendingApproval: pendingToolApproval, loadingTranscript: connection.loadingTranscript, catchingUp: connection.catchingUp, hasOlderHistory: transcriptHistory.hasMore, loadingOlderHistory: transcriptHistory.loading, historyCapacityReached: transcriptHistory.capacityReached, historyPaginationError: transcriptHistory.paginationError, onLoadOlderHistory: transcriptHistory.loadMore, transcriptBlockCount: blocks.length, transcriptActivity: store, onReloadTranscript: transcriptReloadSupported ? reloadTranscript : undefined, isResponding: isResponding, workspaceCwd: connection.workspaceCwd || '', hideSessionTimeline: true, turnFileChanges: visibleTurnOutputKinds.has('file')
                                ? fileChangesByTurn
                                : undefined, turnArtifacts: visibleTurnOutputKinds.has('artifact')
                                ? artifactsByTurn
                                : undefined, turnScheduledTasks: visibleTurnOutputKinds.has('scheduled_task')
                                ? scheduledTasksByTurn
                                : undefined, onTurnOutputOpen: handleRightPanelOpen, onImagePreview: handleImagePreview, onError: reportError, generateContent: connection.capabilities?.features.includes('session_generation')
                                ? actions.generateSessionContent
                                : undefined }) }) }) }), _jsxs("div", { className: styles.footer, children: [pendingToolApproval && (_jsx("div", { className: styles.approval, "data-testid": "pane-approval", children: _jsx(ToolApproval, { request: pendingToolApproval, onConfirm: handleConfirm, variant: "floating", planTodos: planTodos, 
                            // Several panes can show approvals at once; don't auto-focus one
                            // pane's approval (it would steal focus from the pane the user is
                            // in). Keyboard handling is focus-scoped, so each pane's approval
                            // is still fully keyboard-operable once clicked/tabbed into.
                            keyboardActive: false }) })), pendingAskUserApproval && (_jsx("div", { className: styles.approval, "data-testid": "pane-approval", children: _jsx(AskUserQuestion, { request: pendingAskUserApproval, onConfirm: handleAskUserConfirm, onError: reportError, variant: "floating", keyboardActive: false }) })), _jsx(StreamingStatus, { startedAt: activeTurnStartedAt, showPhrase: false }), _jsx(QueuedPromptDisplay, { prompts: queuedPrompts, t: t, canMutateMidTurn: canMutateMidTurn, onDelete: removeQueuedPrompt, onEdit: editQueuedPrompt, onRestoreUnknown: restoreUnknownQueuedPrompt, onDiscardUnknown: discardUnknownQueuedPrompt }), unknownPromptAdmission && (_jsxs("div", { className: styles.admissionUnknown, role: "status", "data-testid": "pane-prompt-admission-unknown", children: [_jsx("span", { children: t('queue.admissionUnknown') }), unknownPromptAdmission.payloadAvailable && (_jsxs("span", { className: styles.admissionUnknownActions, children: [_jsx("button", { type: "button", onClick: continueEditingUnknownPrompt, children: t('queue.continueEditing') }), _jsx("button", { type: "button", onClick: discardUnknownPromptPayload, children: t('queue.discardUnknown') })] }))] })), _jsx(ChatEditor, { ref: editorRef, onSubmit: handleSubmit, onCancel: handleCancel, isRunning: isResponding, commands: commands, queuedMessages: queuedTexts, onPopQueuedMessages: editLastQueuedPrompt, onClearQueuedMessages: clearQueuedPrompts, visibleToolbarActions: paneToolbarActions, workspaceName: showWorkspaceChip ? workspaceLabel : undefined, workspaceTitle: paneWorkspaceCwd, workspaceColor: workspaceAccent, currentMode: connection.currentMode ?? 'default', sessionWorkflowEnabled: sessionWorkflowEnabled, currentModel: connection.currentModel ?? '', availableModels: availableModels, onSelectMode: handleSelectMode, onSelectModel: handleSelectModel, reasoning: connection.reasoning, onSelectReasoningEffort: handleSelectReasoningEffort, dialogOpen: approvalActive, disabled: approvalActive || admissionPayloadLocked, voiceTarget: hidden ? undefined : voiceTarget, voiceStatusRevision: voiceStatusRevision, followupState: followupState, onAcceptFollowup: onAcceptFollowup, onDismissFollowup: onDismissFollowup, onImageIngestionNotice: onImageIngestionNotice, sessionId: connection.sessionId, onImagePreview: handleImagePreview, atWorkspaceCwd: paneWorkspaceCwd, placeholderText: t('splitView.composerPlaceholder'), animatePlaceholder: false }), CustomComposerFooter && (_jsx(CustomComposerFooter, { disabled: approvalActive || admissionPayloadLocked, isRunning: isResponding, currentMode: connection.currentMode ?? 'default', currentModel: connection.currentModel ?? '', sessionName: connection.displayName }))] })] }));
}
//# sourceMappingURL=ChatPane.js.map