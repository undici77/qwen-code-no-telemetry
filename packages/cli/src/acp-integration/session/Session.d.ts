/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Config, ChatRecord, HistoryGap, AutoModeDecision, AutoModeOutcome, GoalTurnPermit, InvocationContextV1 } from '@qwen-code/qwen-code-core';
import { type ActiveWorkHoldV1 } from '@qwen-code/acp-bridge/bridgeTypes';
import type { AvailableCommand, PromptRequest, PromptResponse, RequestPermissionRequest, RequestPermissionResponse, SessionUpdate, SetSessionModeRequest, SetSessionModeResponse, SetSessionModelRequest, SetSessionModelResponse, AgentSideConnection } from '@agentclientprotocol/sdk';
import { type LoadedSettings } from '../../config/settings.js';
import type { CumulativeUsage, SessionContext } from './types.js';
import { MessageRewriteMiddleware } from './rewrite/index.js';
import { type RepeatedToolFailureGuardMode, type RepeatedToolFailureGuardState } from './repeated-tool-failure-guard.js';
interface AcpGoalTurn {
    permit: GoalTurnPermit;
    turnKey: string;
    controller: AbortController;
    origin: 'runtime' | 'user';
    continuationContext: string;
    verifierFeedback?: string;
    modelStarted: boolean;
}
export type DaemonToolLoopState = {
    totalToolCalls: number;
    invalidToolParamErrors: Map<string, number>;
    /** Per-turn counts of identical (tool, args) calls, by repeat key. */
    toolCallKeyCounts: Map<string, number>;
    /** Highest repeat count of any single (tool, args) pair this turn. */
    maxToolCallKeyRepeat: number;
    loopDetected: boolean;
    repeatedToolFailureMode: RepeatedToolFailureGuardMode;
    repeatedToolFailureState: RepeatedToolFailureGuardState;
};
export interface BackgroundNotificationQueueItem {
    displayText: string;
    modelText: string;
    taskId: string;
    status: string;
    kind: 'agent' | 'monitor' | 'shell';
    toolUseId?: string;
    todoWorkChainId?: string;
    /** Structured fields for i18n rendering on the frontend. */
    structured?: {
        description?: string;
        commandLabel?: string;
        eventCount?: number;
        droppedLines?: number;
    };
}
export declare function resolveExistingFile(resolved: string, resolveRealPath?: (path: string) => string, statFile?: (path: string) => {
    isFile(): boolean;
    isDirectory?(): boolean;
}): string | undefined;
export declare function resolveHomeLoopResolverRoots({ homeQwenDir, homeDir, qwenHome, }?: {
    homeQwenDir?: string;
    homeDir?: string;
    qwenHome?: string;
}): {
    homeConfineRoot: string;
    homeQwenDir: string;
};
export declare function computeInitialTurnFromHistory(records: ChatRecord[], sessionId: string): number;
export declare function fireSessionPermissionDeniedForAutoMode(config: Config, decision: AutoModeDecision, outcome: AutoModeOutcome, toolName: string, toolParams: Record<string, unknown>, callId: string, signal?: AbortSignal): Promise<void>;
export interface AvailableCommandsSnapshot {
    availableCommands: AvailableCommand[];
    availableSkills?: string[];
    availableSkillDetails?: Array<{
        name: string;
        description?: string;
        body?: string;
        filePath?: string;
        level?: string;
        modelInvocable?: boolean;
    }>;
}
export declare function buildAvailableCommandsSnapshot(config: Config, abortSignal?: AbortSignal, settings?: LoadedSettings): Promise<AvailableCommandsSnapshot>;
/**
 * Session represents an active conversation session with the AI model.
 * It uses modular components for consistent event emission:
 * - HistoryReplayer for replaying past conversations
 * - ToolCallEmitter for tool-related session updates
 * - PlanEmitter for todo/plan updates
 * - SubAgentTracker for tracking sub-agent tool calls
 */
export declare class Session implements SessionContext {
    #private;
    readonly config: Config;
    private readonly client;
    private readonly settings;
    /**
     * Invoked whenever work this Session owns may have started or finished.
     * The owner (one reporter per ACP channel) coalesces these and republishes
     * a full snapshot; the Session itself keeps no reporting state.
     */
    private readonly onActiveWorkChanged?;
    private pendingPrompt;
    /**
     * Tracks the completion of the current prompt so that the next prompt
     * can await it.  This prevents a new prompt from reading chat history
     * before the previous prompt's tool results have been added —
     * a race condition that causes malformed history on Windows where
     * process termination is slow.
     */
    private pendingPromptCompletion;
    private automaticDrainRetry;
    /**
     * Per-turn AbortController for the fire-and-forget follow-up suggestion
     * generation. Aborted on the top of the next `prompt()` and on
     * `cancelPendingPrompt()` so a stale suggestion never lands after the
     * user has moved on. Null when no suggestion generation is in flight.
     */
    private followupAbort;
    private turn;
    private refreshContextFilesOnWrite;
    private activeTodoWorkChainPromptId;
    private readonly createdAt;
    /**
     * Running cumulative usage for this session, snapshotted onto each todo/plan
     * update by PlanEmitter so the web-shell can show per-task token/API spend.
     */
    readonly cumulativeUsage: CumulativeUsage;
    private readonly runtimeBaseDir;
    private cronQueue;
    private cronProcessing;
    private cronAbortController;
    private loopTickResolver;
    private loopTickResolverRoot;
    private cronCompletion;
    private cronDisabledByTokenLimit;
    private lastPromptTokenCount;
    private lastPromptTokenCountChat;
    private midTurnDrainUnavailable;
    private midTurnDrainTimeoutStrikes;
    private readonly duplicateProviderToolCallResponseIds;
    private midTurnRecoveredMessages;
    private readonly todoStopGuard;
    private readonly repeatedToolFailureGuardMode;
    private todoStopGuardBackgroundBaseline;
    private readonly relatedAgentIds;
    private readonly provisionalRelatedAgentCounts;
    private todoStopGuardQueuedPromptPriority;
    private todoStopGuardQueuedPromptOwnerPromptId?;
    private readonly todoStopGuardClaimOwnerCounts;
    private readonly todoStopGuardReleasedDuringClaim;
    private todoStopGuardDrainAutomaticQueuesWhenIdle;
    private notificationQueue;
    private notificationProcessing;
    private notificationAbortController;
    private notificationCompletion;
    private currentAgentNotificationTaskId;
    private readonly persistedBackgroundNotificationTaskIds;
    private readonly backgroundNotificationAcceptances;
    private readonly activeAgentNotificationAcceptances;
    private readonly goalQueue;
    private goalProcessing;
    private activeGoalTurn;
    private goalHostUnbind?;
    private goalRuntimeUnsubscribe?;
    private lastGoalSnapshot?;
    private lastGoalPublicationKey?;
    private goalPublicationTail;
    private disposed;
    private closing;
    private closeGateCompletion;
    private resolveCloseGate;
    private unsubscribeChatRecordingFailure?;
    private readonly workflowApprovalAbortController;
    private activeTodoPlanRevision?;
    private readonly historyReplayer;
    private readonly toolCallEmitter;
    private readonly planEmitter;
    private readonly messageEmitter;
    private liveScreenContextTool?;
    private liveTaskTools;
    private liveSpeakToUserTool?;
    private liveConversationActive;
    private liveEndInstructionPending;
    messageRewriter?: MessageRewriteMiddleware;
    /**
     * Phase C worktree restore notice. Set by acpAgent.loadSession when a
     * resumed session has a live worktree sidecar; prepended to the next
     * #executePrompt call as a <system-reminder>, then cleared.
     *
     * One-shot by design — after the first prompt the worktree path is
     * already in the conversation context (the reminder we just sent + any
     * subsequent tool calls), so re-injecting on every turn would clutter
     * the history without adding signal. TUI uses historyManager.addItem(INFO)
     * for the equivalent UX hint and headless prepends to the single shot
     * prompt; all three modes share the `restoreWorktreeContext` helper
     * that produces this string.
     */
    pendingWorktreeNotice: string | null;
    /** One-shot model notice for background agents restored with the session. */
    pendingRecoveredAgentsNotice: string | null;
    readonly sessionId: string;
    constructor(id: string, config: Config, client: AgentSideConnection, settings: LoadedSettings, 
    /**
     * Invoked whenever work this Session owns may have started or finished.
     * The owner (one reporter per ACP channel) coalesces these and republishes
     * a full snapshot; the Session itself keeps no reporting state.
     */
    onActiveWorkChanged?: (() => void) | undefined);
    /**
     * Re-attach this session to the Goal runtime after `/clear`.
     *
     * `Config.startNewSession()` disposes the old runtime and builds a fresh
     * one, so the `subscribe` callback installed by `#bindGoalRuntime` — the
     * only path that reaches `MessageEmitter.emitGoalState` — would stay
     * registered on the abandoned instance and the client would never receive
     * another `_meta.goalState` update. The retained turn host survives the
     * switch, but the subscription and the publication de-duplication state
     * belong to the old runtime and have to be rebuilt.
     */
    rebindGoalRuntimeForNewSession(): void;
    /**
     * Publish the recovered Goal state once, after history replay.
     *
     * Goal recovery runs from the `Config` constructor, long before this
     * Session exists, so `restore()`'s correction broadcast reaches zero
     * listeners — and replay streams the pre-migration records, emitting the
     * legacy `set` card. Clients that derive the live goal from goal cards
     * (both web-shell and the daemon provider do) are therefore left showing a
     * goal as running when the migrated goal is `paused` and nothing drives
     * it; only a second reload self-corrected. Republishing here puts the
     * authoritative state *after* the replayed card, which is the ordering
     * that matters. `#publishGoalState` de-duplicates on `(cause, snapshot)`,
     * so this is a no-op when the subscription already delivered it.
     *
     * When recovery failed outright — a malformed or future-schema
     * `goal_state` record makes `recoverGoalFromRecords` return `unsupported`
     * — there is no state to publish and no in-session command can correct the
     * stream, because a degraded `/goal` answers without a cause. That case
     * gets the same trailing `cleared` card the replay-time
     * `supersedeUnrestorableGoal` used to emit.
     */
    publishRecoveredGoalState(replayedRecords?: readonly ChatRecord[]): Promise<void>;
    /**
     * Render the recovered-Goal cards instead of streaming them.
     *
     * The bulk load-replay path (`historyReplay: 'response'`) does not stream
     * its replay: `loadSession` collects the page into the `LOAD_REPLAY`
     * envelope and the bridge seeds those updates onto the session's event bus
     * *after* the ACP `session/load` call returns. A card streamed from inside
     * that call therefore lands on the bus **before** the replayed
     * pre-migration `set` card — the reverse of the ordering
     * {@link publishRecoveredGoalState} exists to produce, leaving the phantom
     * running goal exactly as it was. Returning the cards lets the caller
     * append them to the envelope, after the replay page.
     *
     * Appending after a truncated page (`hasMore`) is still correct: paging
     * drops the oldest records, so the authoritative state belongs last either
     * way.
     *
     * Marks the publication as delivered, so the runtime subscription cannot
     * emit a duplicate card for the same `(cause, snapshot)` once the session
     * goes live.
     */
    renderRecoveredGoalUpdates(replayedRecords?: readonly ChatRecord[]): Promise<SessionUpdate[]>;
    releaseTodoStopGuardQueuedPromptWait(promptId: string): boolean;
    clearTodoStopGuardTrust(): void;
    clearActiveTodoPlanRevision(): void;
    hardSuspendTodoStopGuard(): void;
    enableLiveScreenContext(): Promise<void>;
    setLiveConversationActive(active: boolean): Promise<void>;
    appendLiveConversationTranscript(entries: ReadonlyArray<{
        role: 'user' | 'assistant';
        text: string;
    }>, model: string): Promise<void>;
    getId(): string;
    /**
     * Starts the cron scheduler at session creation. Durable tasks live on
     * disk; waiting for the end of the first prompt (the in-turn start at
     * the bottom of prompt()) would leave them invisible to cron_list /
     * cron_delete for the whole first turn and unfired while the session
     * idles before any prompt — the TUI equivalent enables durable cron on
     * mount.
     */
    startCronScheduler(): void;
    getConfig(): Config;
    assertCanStartTurn(): Promise<void>;
    isIdle(): boolean;
    /**
     * The Session's current active-work holds, derived on every call.
     *
     * Nothing here is bookkeeping kept in parallel with the real work: agent
     * holds come straight out of the registry's unfinalized set, notification
     * holds out of the queue and the in-flight acceptance/continuation state.
     * A hold therefore cannot leak past the work it names, and the daemon's
     * cached copy converges on whatever these owners actually say.
     *
     * `hasUnfinalizedTasks()`'s predicate — not `hasRunningTasks()`' — backs the
     * agent category on purpose: an agent that has been cancelled still owes its
     * terminal task-notification, and treating it as finished would let the
     * daemon reap the Session inside the cancel → finalizeCancelled() window and
     * strand that notification.
     *
     * Prompts are absent by design. The daemon accepts, queues, dispatches, and
     * settles them itself, so its own count is both authoritative and strictly
     * wider than anything reported from here (it covers prompts still waiting in
     * the FIFO, which the child cannot see).
     */
    collectActiveWorkHolds(): ActiveWorkHoldV1[];
    beginClose(): () => void;
    beginCloseIfAvailable(): (() => void) | null;
    waitForCloseGateToRelease(): Promise<void>;
    waitForActiveTurnsToSettle(): Promise<void>;
    getTurnCount(): number;
    getCreatedAt(): number;
    dispose(): void;
    /**
     * Install the message rewrite middleware if configured.
     * Must be called AFTER history replay to avoid rewriting historical messages.
     */
    installRewriter(): void;
    /**
     * Replays conversation history to the client using modular components.
     * Delegates to HistoryReplayer for consistent event emission.
     */
    primeTurnFromHistory(records: ChatRecord[]): void;
    replayHistory(records: ChatRecord[], gaps?: HistoryGap[]): Promise<void>;
    rewindToTurn(targetTurnIndex: number, opts?: {
        rewindFiles?: boolean;
    }): {
        targetTurnIndex: number;
        apiTruncateIndex: number;
    };
    captureHistorySnapshot(): Content[];
    getRewindableUserTurnCount(): number;
    restoreHistory(history: Content[]): void;
    cancelPendingPrompt(): Promise<void>;
    prompt(params: PromptRequest, invocationContext?: InvocationContextV1, admissionCancellation?: AbortSignal, modelPrompt?: string, scheduledGoalTurn?: AcpGoalTurn): Promise<PromptResponse>;
    /**
     * Classify whether an unfinished previous turn can be resumed — an
     * interrupted prompt (the model never answered) or a turn left with dangling
     * tool calls — without injecting a synthetic "continue" user message.
     * Classifies from persisted history. Idempotent no-op (accepted:false) when
     * the last turn ended cleanly or a prompt is already in flight.
     *
     * This is the accept/reject pre-check only — it does NOT fire the turn. When
     * accepted, the daemon bridge drives the continuation through the normal
     * prompt-admission path (`sendPrompt` with the trusted continue meta) so it is
     * tracked like any other prompt; `prompt()` then re-detects/strips
     * authoritatively. Powers `qwen/control/session/continue`.
     */
    continueLastTurn(): Promise<{
        accepted: boolean;
        interruption: 'none' | 'interrupted_prompt' | 'interrupted_turn';
    }>;
    sendUpdate(update: SessionUpdate): Promise<void>;
    enqueueBackgroundNotification(item: BackgroundNotificationQueueItem): Promise<{
        accepted: boolean;
    }>;
    sendAvailableCommandsUpdate(): Promise<void>;
    refreshSkillsFromSettings(options?: {
        reloadSettings?: boolean;
        notifyConfigChanged?: boolean;
    }): Promise<void>;
    reloadSkillSettings(): void;
    private sendAvailableCommandsUpdateOrThrow;
    /**
     * Requests permission from the client for a tool call.
     * Used by SubAgentTracker for sub-agent approval requests.
     */
    requestPermission(params: RequestPermissionRequest): Promise<RequestPermissionResponse>;
    /**
     * Sets the approval mode for the current session.
     * Maps ACP approval mode values to core ApprovalMode enum.
     */
    setMode(params: SetSessionModeRequest): Promise<SetSessionModeResponse | void>;
    /**
     * Sets the model for the current session.
     * Validates the model ID and switches the model via Config.
     */
    setModel(params: SetSessionModelRequest, options?: {
        persistDefault?: boolean;
    }): Promise<SetSessionModelResponse | void>;
    /**
     * Sends a current_mode_update notification to the client.
     * Called after the agent switches modes (e.g., from exit_plan_mode tool).
     */
    private sendCurrentModeUpdateNotification;
    /**
     * Execute a batch of model-returned tool calls, running Agent calls
     * concurrently while keeping other tools sequential.
     *
     * Mirrors the partition logic in `coreToolScheduler.partitionToolCalls`:
     * consecutive Agent calls form a parallel batch (they spawn independent
     * sub-agents with no shared mutable state); any other tool forms its own
     * sequential batch to preserve the implicit ordering the model may rely
     * on. Response-part ordering matches the original `functionCalls` order.
     */
    private runToolCalls;
    private runTool;
    debug(msg: string): void;
    private emitHookArtifactsNotification;
    /**
     * Fire a notification hook and forward any terminalSequence to the ACP
     * client as an extNotification. Fire-and-forget — errors are logged at
     * debug level.
     */
    private fireNotificationHookWithTerminalSequence;
}
export {};
