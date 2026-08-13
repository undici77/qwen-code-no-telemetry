/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Tracks in-flight and recently-finished workflow runs spawned via the
 * `Workflow` tool. Sibling of `BackgroundTaskRegistry` (agents),
 * `BackgroundShellRegistry` (shells), and `MonitorRegistry` (monitors).
 * Each entry holds the metadata that the footer pill, the `/workflows`
 * slash command, and the Background tasks dialog use to query, observe,
 * or cancel an active workflow.
 *
 * State machine: running → pausing → paused → running, with every active
 * state able to settle as completed, failed, or cancelled.
 *
 * Foreground runs return through the normal tool-result channel. Background
 * runs additionally emit one terminal `<task-notification>` through a
 * dedicated model-completion callback. That slot is separate from the
 * terminal-bell callback so the CLI can subscribe to both without either
 * consumer replacing the other.
 */
import type { TaskBase, TaskRegistration } from './tasks/types.js';
import type { WorkflowMeta } from './runtime/workflow-sandbox.js';
import type { WorkflowRunHandle } from './runtime/workflow-runner.js';
import { type AgentApprovalRequestEvent, type AgentEventEmitter } from './runtime/agent-events.js';
import { ToolConfirmationOutcome, type ToolConfirmationPayload } from '../tools/tools.js';
import type { WorkflowDispatchState } from './runtime/workflow-dispatch-scheduler.js';
/**
 * Cap on terminal entries retained for dialog history. Picked smaller
 * than `MAX_RETAINED_TERMINAL_AGENTS` (32) because workflow rows carry
 * the heavier label (workflow name + phase tree) and because users
 * typically run far fewer workflows than agents per session.
 */
export declare const MAX_RETAINED_TERMINAL_WORKFLOWS = 10;
export type WorkflowStatus = WorkflowDispatchState | 'completed' | 'failed' | 'cancelled';
export type WorkflowTerminalStatus = Extract<WorkflowStatus, 'completed' | 'failed' | 'cancelled'>;
export declare function isActiveWorkflowStatus(status: WorkflowStatus): status is WorkflowDispatchState;
export declare function isTerminalWorkflowStatus(status: WorkflowStatus): status is WorkflowTerminalStatus;
export declare const MAX_PENDING_WORKFLOW_APPROVALS = 32;
export declare const MAX_WORKFLOW_APPROVAL_DISPLAY_CHARS: number;
export interface WorkflowApproval {
    approvalId: string;
    subagentId: string;
    callId: string;
    name: string;
    description: string;
    confirmationDetails: AgentApprovalRequestEvent['confirmationDetails'];
    at: number;
}
/**
 * Workflow kind of `TaskState`. Tracks one orchestrator run — the
 * top-level `Workflow` tool call, not its internal subagent dispatches
 * (those are routed through the regular subagent path and recorded by
 * `BackgroundTaskRegistry` when backgrounded). The `phases` array is
 * the sandbox's `getPhases()` snapshot; `currentPhase` is the head of
 * the most recent `phase()` call.
 */
export interface WorkflowTask extends TaskBase<WorkflowStatus> {
    kind: 'workflow';
    /** Run identifier (e.g. `wf_<8hex>`); aliased to `TaskBase.id`. */
    runId: string;
    /**
     * Parsed `export const meta = {...}` from the workflow script, or
     * `null` if the script had no meta declaration. The pill / dialog
     * row label falls back to `runId` when meta is null.
     */
    meta: WorkflowMeta | null;
    status: WorkflowStatus;
    /** Whether the tool returned before this run reached a terminal state. */
    isBackgrounded?: boolean;
    /** Title of the most recent `phase(...)` call, or `null` before the first phase. */
    currentPhase: string | null;
    /**
     * All phase titles seen so far (deduplicated against the previous
     * entry — matches the sandbox's `safePhase` collapse). Capped at
     * `MAX_PHASE_ENTRIES` (10_000) by the sandbox.
     */
    phases: string[];
    /** Cumulative `agent()` dispatches issued by this run. */
    agentsDispatched: number;
    /** Cumulative `agent()` dispatches that have resolved (success or thrown). */
    agentsCompleted: number;
    /** Most recent log lines from the sandbox's `getLogs()`. Capped at 100 for the UI. */
    recentLogs: string[];
    /**
     * P5: cumulative output tokens spent by this run's `agent()` dispatches.
     * Mirrored from `budget.spent()` after each successful completion via
     * the `budgetUpdated` emitter event. Stays at `0` for runs without a
     * budget (legacy callers) and for the period between register and the
     * first dispatch settling.
     */
    tokensSpent: number;
    /**
     * P5: per-run token cap from `QWEN_CODE_MAX_TOKENS_PER_WORKFLOW`. `null`
     * when no cap is set — the dialog renders `tokensSpent` alone in that
     * case rather than the `M / N` form. Set at register time from
     * `budget.total` and re-affirmed by every `budgetUpdated` fire (the
     * budget's `total` is immutable so the value never changes mid-run).
     */
    tokenBudgetTotal: number | null;
    /**
     * P5: per-phase token attribution. Delta tokens are attributed to the
     * entry's `currentPhase` at the moment `budgetUpdated` fires. A
     * workflow that dispatches an agent before its first `phase()` call
     * accumulates that agent's tokens under a sentinel `null` phase, which
     * the UI surfaces as `(no phase)` so the share is observable rather
     * than hidden.
     */
    perPhaseTokens: Map<string | null, number>;
    /**
     * P7b: the workflow script source (verbatim, as the tool received it).
     * Used by the run-snapshot writer (so a persisted run carries its
     * script) and the save-to-disk dialog (so a completed run can be saved
     * to `.qwen/workflows/<name>.js`). Empty string for legacy callers that
     * don't supply it.
     */
    script: string;
    /**
     * P7b: the path the script was loaded from, when the run was launched
     * from a saved workflow (`Workflow({scriptPath})` or a `/workflow-name`
     * slash command). `undefined` for inline scripts. Recorded as run
     * provenance (e.g. for the snapshot).
     */
    scriptPath?: string;
    /** Process-local approval requests; omitted from persisted snapshots. */
    pendingApprovals: readonly WorkflowApproval[];
    /** Final script return value once the run completes (success path). */
    result?: unknown;
    /** Error message on `failed` (terminal). */
    error?: string;
}
/**
 * Shape callers pass to `register()`. The four `TaskBase` fields the
 * registry derives — `id`, `kind`, `outputOffset`, `notified` — are
 * omitted; everything else (including `outputFile`) is supplied by the
 * caller. `currentPhase` / `phases` / `agentsDispatched` /
 * `agentsCompleted` / `recentLogs` all default to their empty
 * counterparts at register time and become observable via subsequent
 * `onPhaseStarted` / `onAgentDispatched` / etc.
 */
export type WorkflowTaskRegistration = Omit<TaskRegistration<WorkflowTask>, 'currentPhase' | 'phases' | 'agentsDispatched' | 'agentsCompleted' | 'recentLogs' | 'tokensSpent' | 'tokenBudgetTotal' | 'perPhaseTokens' | 'script' | 'description' | 'pendingApprovals' | 'isBackgrounded'> & {
    description?: string;
    /**
     * P5: optional per-run token cap at register time. Defaults to `null`
     * (no cap). Persists for the life of the entry — `onBudgetUpdated`
     * does NOT re-write it because the budget's `total` is immutable.
     */
    tokenBudgetTotal?: number | null;
    /**
     * P7b: the workflow script source. Defaults to `''` when omitted (legacy
     * callers / tests). Needed for run snapshots + the save-to-disk dialog.
     */
    script?: string;
    /** Defaults to false for legacy and foreground callers. */
    isBackgrounded?: boolean;
};
/** Fires when a new entry is registered. */
export type WorkflowRunRegisterCallback = (entry: WorkflowTask) => void;
/**
 * Fires whenever the entry's `status`, `currentPhase`, or dispatch
 * counts change. Symmetric with the other registries' `statusChange`
 * callback so the unified `useBackgroundTaskView` hook can subscribe
 * to all four with the same shape.
 */
export type WorkflowRunStatusChangeCallback = (entry?: WorkflowTask) => void;
/**
 * P-notif: fires once when a run reaches a terminal state worth surfacing to
 * the user — `completed` / `failed`, but NOT a user-initiated `cancel` (the
 * user already knows). The CLI wires this to the terminal-bell notification
 * service. A separate slot from `statusChangeCallback` (which the dialog's
 * `useBackgroundTaskView` owns), so the two never clobber each other.
 */
export type WorkflowRunNotificationCallback = (entry: WorkflowTask) => void;
export interface WorkflowRunCompletionMeta {
    runId: string;
    status: Extract<WorkflowStatus, 'completed' | 'failed'>;
    todoWorkChainId?: string;
}
export type WorkflowRunCompletionCallback = (displayText: string, modelText: string, meta: WorkflowRunCompletionMeta) => void;
export type WorkflowApprovalChangeCallback = (entry: WorkflowTask) => void;
export type WorkflowApprovalRequestCallback = (entry: WorkflowTask, approval: WorkflowApproval, args: Record<string, unknown>, signal: AbortSignal) => void | Promise<void>;
export declare class WorkflowRunRegistry {
    private readonly entries;
    private readonly handles;
    private registerCallback;
    private statusChangeCallback;
    private notificationCallback;
    private completionCallback;
    private approvalChangeCallback;
    private approvalRequestCallback;
    private readonly approvalRuntimes;
    private nextApprovalId;
    /**
     * P5 T7: one-time usage-warning latch. The first `Workflow` tool
     * invocation per session checks `shouldShowUsageWarning()`; if true,
     * the tool prepends a one-line banner to the result describing the
     * token-budget knob (`QWEN_CODE_MAX_TOKENS_PER_WORKFLOW`) and how to
     * suppress (`skipWorkflowUsageWarning` setting). The latch flips on
     * the same call so subsequent runs are quiet. Survives `reset()` —
     * the warning is per-session, not per-clear.
     */
    private usageWarningShown;
    /**
     * P5 T7: gate the one-time usage warning. Returns `true` exactly once
     * per session, flipping the latch as a side effect. Settings-level
     * suppression (`skipWorkflowUsageWarning`) is enforced upstream by
     * the caller (`WorkflowTool`) before invoking — the registry only
     * tracks session-scoped freshness.
     */
    shouldShowUsageWarning(): boolean;
    setRegisterCallback(cb: WorkflowRunRegisterCallback | undefined): void;
    setStatusChangeCallback(cb: WorkflowRunStatusChangeCallback | undefined): void;
    setNotificationCallback(cb: WorkflowRunNotificationCallback | undefined): void;
    setCompletionCallback(cb: WorkflowRunCompletionCallback | undefined): void;
    hasCompletionCallback(): boolean;
    setApprovalChangeCallback(cb: WorkflowApprovalChangeCallback | undefined): void;
    setApprovalRequestCallback(cb: WorkflowApprovalRequestCallback | undefined): void;
    /** Fire the terminal-completion notification (best-effort). */
    private emitNotification;
    private emitCompletion;
    /**
     * Register a new run. Mutates the registration in place to graduate
     * it to a `WorkflowTask` (sets `id`, `kind`, derived counters), so
     * callers can keep using their local reference post-register and
     * observers see updates without an extra `get()`.
     */
    register(registration: WorkflowTaskRegistration): WorkflowTask;
    attachHandle(handle: WorkflowRunHandle): void;
    pause(runId: string): boolean;
    resume(runId: string): boolean;
    onDispatchStateChange(runId: string, state: WorkflowDispatchState): void;
    getHandle(runId: string): WorkflowRunHandle | undefined;
    releaseHandle(runId: string, handle: WorkflowRunHandle): void;
    bridgeApprovalEvents(runId: string, emitter: AgentEventEmitter): () => void;
    resolvePendingApproval(runId: string, approvalId: string, outcome: ToolConfirmationOutcome, payload?: ToolConfirmationPayload): Promise<boolean>;
    clearPendingApproval(runId: string, subagentId: string, callId: string): boolean;
    private parkPendingApproval;
    /**
     * Append a phase title. Mirrors the sandbox's `safePhase` collapse:
     * a phase identical to the most recent entry is treated as the same
     * phase and not re-appended. `currentPhase` is set unconditionally.
     *
     * @param runId  the run to update
     * @param title  the phase title from the sandbox `phase()` call
     */
    onPhaseStarted(runId: string, title: string): void;
    /** Cumulative dispatch counter — incremented before each `agent()` call resolves. */
    onAgentDispatched(runId: string): void;
    /** Cumulative completion counter — incremented after each `agent()` call settles. */
    onAgentCompleted(runId: string): void;
    /**
     * P5: mirror a `budgetUpdated` emitter event into the entry. Attributes
     * the cumulative delta (`spent - entry.tokensSpent`) to the entry's
     * `currentPhase`. Per-phase attribution is best-effort: agents in
     * flight when the script issues a new `phase()` will attribute their
     * tokens to whichever phase was current when `budgetUpdated` fires —
     * the orchestrator fires immediately after `agentCompleted`, so the
     * race window is bounded but not zero. Tasks before the first
     * `phase()` call attribute to the sentinel `null` key.
     */
    onBudgetUpdated(runId: string, spent: number, total: number | null): void;
    /**
     * Replace the recent-log tail. The sandbox owns the source-of-truth
     * `getLogs()` array; we mirror it here for the UI so the dialog
     * doesn't have to thread a sandbox reference. Capped at 100 entries
     * (the tail) so a chatty workflow doesn't bloat the registry.
     *
     * R7 (wenshao): allowed after a `'cancelled'` transition too. The
     * dialog-initiated cancel path calls `registry.cancel()` first
     * (status flips to `'cancelled'` synchronously), then the abort
     * propagates to the tool's catch arm which calls `setRecentLogs`.
     * Without this, dialog-cancelled runs always showed an empty Logs
     * section. `'completed'` / `'failed'` are still rejected — those
     * terminal states ARE final (no late-arriving logs to absorb).
     */
    setRecentLogs(runId: string, logs: readonly string[]): void;
    complete(runId: string, result: unknown, endTime: number): void;
    fail(runId: string, message: string, endTime: number): void;
    /**
     * Mark an active entry as cancelled and abort its controller. No-op
     * if the entry has already settled — protects against an explicit
     * dialog cancel racing with the natural complete/fail path.
     */
    cancel(runId: string, endTime: number): void;
    get(runId: string): WorkflowTask | undefined;
    /** All entries (active + terminal, no filter). Iteration order = registration order. */
    list(): WorkflowTask[];
    /**
     * R7 (wenshao): true if any entry is still actively executing.
     * Mirrors the three sibling registries' `hasUnfinalizedTasks()` /
     * `hasRunningEntries()` / `getRunning().length > 0` so the unified
     * `hasBlockingBackgroundWork()` helper (the gate `/clear` and session-
     * resume both use to refuse a switch with live work) can count
     * workflow runs the same way.
     *
     * R12 (doudouOUC): `paused` deliberately does NOT count. A paused run
     * has drained its dispatches and executes nothing, and its wall-clock
     * watchdog is suspended — if it blocked the switch, a paused-and-
     * forgotten run would block `/clear` and session switching forever
     * with no backstop to release it. Mirrors the sibling
     * `BackgroundTaskRegistry.hasRunningTasks()`, which also counts only
     * `running` (a paused background agent does not block a switch).
     * Session-switch teardown cancels paused runs via `abortAll()` before
     * `reset()` so they settle terminal instead of leaking.
     */
    hasRunningEntries(): boolean;
    /**
     * R7 (wenshao): drop every in-memory entry without touching
     * controllers. Mirrors `BackgroundShellRegistry.reset()` and the
     * other siblings' contract — callers (`/clear`, session-resume)
     * MUST verify via `hasRunningEntries()` first that no active
     * work exists before invoking. The companion path that aborts
     * controllers is `abortAll()`.
     */
    reset(): void;
    /**
     * R7 (wenshao): cancel every active entry. Called on session/
     * Config shutdown so workflow runs don't outlive the CLI process and
     * leak orphaned dispatches. Symmetric with `BackgroundShellRegistry.
     * abortAll()` and `BackgroundTaskRegistry.abortAll()`.
     *
     * Settles each entry inline (status → 'cancelled', abort the
     * controller) and fires the status-change callback exactly once
     * after the loop — the per-entry `cancel()` path would have fired
     * the callback for every active entry, wasteful on shutdown.
     */
    abortAll(): void;
    /**
     * Sweep terminal entries when they exceed `MAX_RETAINED_TERMINAL_WORKFLOWS`.
     * Active entries are always retained. Oldest terminal entries
     * (by `endTime`) are evicted first.
     */
    private evictTerminal;
    private emitStatusChange;
    private rejectPendingApprovals;
    private rejectResponder;
    private emitApprovalChange;
}
