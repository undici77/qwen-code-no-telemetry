/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AgentApprovalRequestEvent, type AgentEventEmitter } from './runtime/agent-events.js';
import type { AgentExternalInput } from './runtime/agent-types.js';
import type { TaskBase, TaskRegistration, TaskStatus } from './tasks/types.js';
/**
 * Cap on each agent's rolling `recentActivities` buffer. Exported so UI
 * consumers that render the buffer (e.g. the detail dialog's Progress
 * section) can bound their display to the same value instead of
 * hardcoding a coincidentally-equal number.
 */
export declare const MAX_RECENT_ACTIVITIES = 10;
export declare const DEFAULT_MAX_CONCURRENT_BACKGROUND_AGENTS = 10;
export declare const BACKGROUND_AGENT_CONCURRENCY_ENV = "QWEN_CODE_MAX_BACKGROUND_AGENTS";
export declare function resolveMaxConcurrentBackgroundAgents(env?: Record<string, string | undefined>): number;
export declare const MAX_CONCURRENT_BACKGROUND_AGENTS: number;
/**
 * Cap on how many fully-finalized terminal entries (those that have
 * already emitted their terminal `task-notification`) the registry
 * retains. Without this cap, every short-lived background subagent
 * leaves a row in the Background tasks dialog and pill forever,
 * crowding out the running entries the user actually opened the
 * dialog to find. Mirrors the rationale + retention pattern in
 * `MonitorRegistry.MAX_RETAINED_TERMINAL_MONITORS` and
 * `BackgroundShellRegistry.MAX_RETAINED_TERMINAL_SHELLS`.
 *
 * Entries that are still `running`, `paused`, or `cancelled` but
 * not yet notified are NEVER evicted — pruning a not-yet-notified
 * cancelled entry would break the SDK contract that every
 * `register` pairs with exactly one terminal `task-notification`.
 */
export declare const MAX_RETAINED_TERMINAL_AGENTS = 32;
/**
 * Single source of truth for the human-facing label of a background
 * entry. Shared by the notification payload (model-facing) and the TUI
 * dialog (user-facing) so the two surfaces never drift.
 *
 * When `includePrefix` is true (default), returns `subagentType: desc`;
 * when false, returns the bare truncated description — used where the
 * subagent type is already rendered separately (e.g. the dialog header).
 */
export declare function buildBackgroundEntryLabel(entry: {
    description: string;
    subagentType?: string;
}, options?: {
    includePrefix?: boolean;
}): string;
/**
 * @deprecated Use `TaskStatus` from `./tasks/types.js`. Kept as a one-release
 * alias so existing consumers (notably `nonInteractiveCli.ts`) compile
 * unchanged; the underlying union is identical.
 */
export type BackgroundTaskStatus = TaskStatus;
export interface AgentCompletionStats {
    totalTokens: number;
    outputTokens: number;
    toolUses: number;
    durationMs: number;
}
/**
 * A tool call from a background agent that is parked waiting for the user
 * to approve or reject it from the parent session's UI ("permission
 * bubbling"). Without this, a background agent whose `approvalMode` still
 * requires confirmation for some call would be auto-denied — defeating the
 * point of backgrounding. The entry holds everything the shared
 * confirmation component needs to render plus the `respond` callback that
 * resumes the parked tool call.
 *
 * `confirmationDetails` deliberately omits `onConfirm` (the runtime owns
 * that via `respond`) — the UI renders the rest and calls `respond` with
 * the chosen outcome.
 */
export interface BackgroundApproval {
    /** Tool-call id the approval belongs to. */
    callId: string;
    /** Tool name (e.g. `Shell`) — drives the row/notification label. */
    name: string;
    /** Render-friendly one-line description of the call. */
    description: string;
    /** Everything the confirmation UI needs except the owned `onConfirm`. */
    confirmationDetails: AgentApprovalRequestEvent['confirmationDetails'];
    /** Resolve the parked call with the user's outcome. */
    respond: AgentApprovalRequestEvent['respond'];
    /** Emission timestamp (ms) — newest-first ordering in the UI. */
    at: number;
}
/**
 * A compact record of a recent tool invocation — drives the Progress
 * section of the detail dialog. The Agent tool maintains a rolling
 * buffer of these on each background entry by subscribing to the
 * subagent's event emitter.
 */
export interface BackgroundActivity {
    /** Tool name (e.g. `Bash`, `Read`). */
    name: string;
    /** Short one-line description — the tool's own render-friendly summary. */
    description: string;
    /** Emission timestamp (ms). */
    at: number;
}
/**
 * Agent kind of `TaskState`. Tracks one running subagent — either a
 * synchronous foreground run (`isBackgrounded: false`, awaited by the
 * parent's tool-call) or an async background run (`isBackgrounded: true`,
 * persists across turns and emits a terminal `<task-notification>`).
 *
 * Carries the shared `TaskBase` envelope plus agent-specific state:
 * subagent config, prompt, stats, recent activity buffer, persisted
 * sidecar metadata path, message queue, and resume hooks.
 */
export interface AgentTask extends TaskBase {
    kind: 'agent';
    /**
     * @deprecated Read `id` instead; kept as a synonym during the back-compat
     * window. Always equals `id`.
     */
    agentId: string;
    subagentType?: string;
    /**
     * Concrete model ID this agent runs with (resolved from the subagent's
     * model selector at launch time). Used to enforce per-model concurrency
     * caps (`agents.maxParallelAgentsByModel`); undefined when the model
     * could not be resolved, in which case only the global cap applies.
     */
    model?: string;
    /**
     * AgentId of the sub-agent that spawned this one; null when launched
     * from the top-level session. Drives the nested-agent tree display in
     * the LiveAgentPanel and BackgroundTasksDialog. Mirrors
     * `AgentMeta.parentAgentId`.
     */
    parentAgentId?: string | null;
    /**
     * Display name (`subagentType`) of the spawning sub-agent, captured at
     * registration time. Display-only: lets the orphan annotation
     * ("· from <parent>") survive the parent's eviction from the registry.
     */
    parentName?: string;
    /**
     * Launch depth (0-based; 0 = spawned by the top-level session). Same
     * value as `AgentMeta.depth` / `childLaunchDepth()`. User-facing level
     * = depth + 1.
     */
    depth?: number;
    /**
     * True if the task is running asynchronously (parent has moved on, the
     * task persists across turns and emits a terminal XML notification).
     * False if the parent's tool-call is synchronously awaiting it; the
     * result is delivered through the normal tool-result channel and no
     * XML envelope fires. Replaces the older `flavor: 'foreground' |
     * 'background'` discriminator — same binary fact, named after the
     * question every read site asks.
     */
    isBackgrounded: boolean;
    status: TaskStatus;
    result?: string;
    error?: string;
    /**
     * Present only when the task is intentionally kept paused but cannot be
     * safely resumed under the current conditions.
     */
    resumeBlockedReason?: string;
    stats?: AgentCompletionStats;
    toolUseId?: string;
    /**
     * The original user-supplied prompt for the background task. Surfaced
     * verbatim in the detail dialog's Prompt section. Optional because
     * resume-restored entries may not have it.
     */
    prompt?: string;
    /**
     * Rolling buffer (newest last, capped at MAX_RECENT_ACTIVITIES) of
     * recent tool invocations by this agent. Feeds the detail dialog's
     * Progress section. Replaced as a new array each time an activity is
     * appended so reference-based change detection works. Optional:
     * callers may register without providing it, and `appendActivity`
     * initializes the array lazily.
     */
    recentActivities?: readonly BackgroundActivity[];
    /**
     * Tool calls this background agent has parked awaiting user approval
     * (permission bubbling). Empty/absent unless the agent opted into
     * bubbling AND a tool call reached `awaiting_approval`. Each is answered
     * via its `respond` callback; answering removes it from this list.
     * Newest last, mirroring `recentActivities`.
     */
    pendingApprovals?: readonly BackgroundApproval[];
    /** Absolute path to the agent's sidecar metadata file. */
    metaPath?: string;
    /**
     * Inputs queued for delivery between tool rounds.
     * Strings are parent `send_message` payloads; notification objects are
     * owner-routed Monitor notifications.
     */
    pendingMessages?: AgentExternalInput[];
    /**
     * Persisted sidecar status to write when the current cancellation settles.
     * Explicit user cancellation uses `cancelled`; shutdown interruption keeps
     * `running` so `/resume` can recover the work later.
     */
    persistedCancellationStatus?: Extract<TaskStatus, 'running' | 'cancelled'>;
}
/**
 * @deprecated Renamed to `AgentTask`. Kept as a one-release type alias for
 * external SDK consumers; will be removed in the release after PR 2 lands.
 */
export type BackgroundTaskEntry = AgentTask;
/**
 * Shape callers pass to {@link BackgroundTaskRegistry.register}; the
 * registry derives the shared `TaskBase` envelope (`id`, `kind`,
 * `outputOffset`, `notified`) from these and the surrounding context.
 * `outputFile` is required here because every agent run reserves a JSONL
 * transcript path at registration.
 */
export type AgentTaskRegistration = TaskRegistration<AgentTask>;
export interface BackgroundTaskRegisterOptions {
    suppressRegisterCallback?: boolean;
    preserveNotificationState?: boolean;
    slotReservation?: BackgroundSlotReservation;
}
export interface NotificationMeta {
    agentId: string;
    status: TaskStatus;
    stats?: AgentCompletionStats;
    toolUseId?: string;
    todoWorkChainId?: string;
}
export type BackgroundNotificationCallback = (displayText: string, modelText: string, meta: NotificationMeta) => void;
export type BackgroundRegisterCallback = (entry: AgentTask) => void;
interface BackgroundTaskCancelOptions {
    notify?: boolean;
    persistedStatus?: Extract<TaskStatus, 'running' | 'cancelled'>;
}
/**
 * Fires on entry status transitions: `register`, `complete`, `fail`,
 * `cancel`, `finalizeCancelled`, `finalizeCancellationIfPending`,
 * `abandon`, `unregisterForeground`, and `reset`. Intentionally does
 * NOT fire on `appendActivity` so consumers that only care about the
 * roster don't re-render on every tool call a background agent makes.
 *
 * Ordering relative to the registry mutation falls into two camps:
 *   - **Keeps the entry around** (`register` / `complete` / `fail` /
 *     `cancel` / `finalizeCancelled` /
 *     `finalizeCancellationIfPending` / `abandon`): emit while the
 *     entry is still in the Map (the status field has been mutated
 *     in place to its terminal value), so a callback that re-reads
 *     `registry.get(entry.agentId)` sees the entry. Snapshot-style
 *     consumers calling `getAll()` see the new status too.
 *   - **Removes the entry** (`unregisterForeground`, `reset`):
 *     deletes from the Map BEFORE emitting so snapshot-style
 *     consumers drop the row. The `entry` arg carries the agent's
 *     last live state for log / display consumers; `registry.get`
 *     and `getAll` already reflect the deletion.
 */
export type BackgroundStatusChangeCallback = (entry?: AgentTask) => void;
/** Fires on `appendActivity` — scoped to detail-view consumers. */
export type BackgroundActivityChangeCallback = (entry: AgentTask) => void;
/**
 * Fires when a background agent's pending-approval queue changes (a tool
 * call is parked for confirmation, or a parked one is answered/cleared).
 * Distinct from `statusChange` so the footer pill and roster snapshot can
 * react to "needs approval" without re-rendering on every tool call, and
 * distinct from `activityChange` so a consumer can subscribe to approvals
 * alone. The arg carries the affected entry (with its current
 * `pendingApprovals`).
 */
export type BackgroundApprovalChangeCallback = (entry: AgentTask) => void;
/**
 * Session-scoped handle for a background agent whose runtime remains alive
 * after a completed turn. The handle is deliberately not part of AgentTask:
 * task state is serializable, while the live runtime is process-local.
 */
export interface ResidentBackgroundAgent {
    continue(message: string): boolean;
    dispose(): void;
}
export interface BackgroundTaskRegistryOptions {
    maxConcurrentBackgroundAgents?: number;
    /**
     * Per-model concurrency caps keyed by concrete model ID. Each value is the
     * maximum number of background sub-agents that may run concurrently on that
     * model. A model not present here is bounded only by the global
     * `maxConcurrentBackgroundAgents` cap. Useful when a model has a lower
     * concurrency capacity than the rest of the fleet.
     */
    maxConcurrentBackgroundAgentsByModel?: ReadonlyMap<string, number> | Record<string, number>;
}
export interface BackgroundSlotReservation {
    readonly id: symbol;
    /**
     * Concrete model ID the slot was reserved for; undefined when the launch
     * path could not resolve a model. Carried so the per-model cap can be
     * checked consistently across reserve → consume → release.
     */
    readonly model?: string;
}
export declare class BackgroundTaskRegistry {
    private readonly agents;
    private readonly residentAgents;
    private readonly messageWaiters;
    private readonly finishingAgents;
    private readonly finishingWaiters;
    private readonly waitQueue;
    private readonly reservedBackgroundSlots;
    private readonly maxConcurrentBackgroundAgents;
    private readonly maxConcurrentBackgroundAgentsByModel;
    private notificationCallback?;
    private registerCallback?;
    private statusChangeCallback?;
    private activityChangeCallback?;
    private approvalChangeCallback?;
    constructor(options?: BackgroundTaskRegistryOptions);
    /**
     * Whether a new background agent may start. Always bounded by the global
     * cap; when `model` is given and a per-model cap is configured for it, the
     * per-model cap must also have room.
     */
    canStartBackgroundAgent(model?: string): boolean;
    getMaxConcurrentBackgroundAgents(): number;
    assertCanStartBackgroundAgent(model?: string): void;
    /** Configured per-model cap for `model`, or undefined when none applies. */
    private resolvePerModelCap;
    waitForBackgroundSlot(signal?: AbortSignal, model?: string): Promise<BackgroundSlotReservation>;
    tryReserveBackgroundSlot(model?: string): BackgroundSlotReservation | undefined;
    getQueuedCount(): number;
    releaseBackgroundSlot(reservation: BackgroundSlotReservation): void;
    register(registration: AgentTaskRegistration, options?: BackgroundTaskRegisterOptions): AgentTask;
    /**
     * Restart a completed background task for another turn while preserving its
     * resident runtime. Capacity is checked before mutating the entry so a
     * rejected restart leaves the completed task intact.
     */
    restartCompletedAgent(agentId: string, abortController: AbortController): AgentTask | undefined;
    registerResidentAgent(agentId: string, resident: ResidentBackgroundAgent): void;
    continueResidentAgent(agentId: string, message: string): boolean;
    unregisterResidentAgent(agentId: string, resident?: ResidentBackgroundAgent): boolean;
    disposeResidentAgent(agentId: string, resident?: ResidentBackgroundAgent): boolean;
    disposeResidentAgents(): void;
    complete(agentId: string, result: string, stats?: AgentCompletionStats): void;
    /**
     * Remove a foreground entry from the registry without emitting any
     * terminal notification. Called by the foreground tool-call's `finally`
     * path, which has already delivered the result through the tool-result
     * channel — the registry entry has served its UI-surfacing purpose.
     * Background entries must go through complete/fail/finalizeCancelled
     * instead, so this throws if asked to remove one.
     */
    unregisterForeground(agentId: string): void;
    fail(agentId: string, error: string, stats?: AgentCompletionStats): void;
    cancel(agentId: string, options?: BackgroundTaskCancelOptions): void;
    /**
     * Marks a paused interrupted task as intentionally discarded/cancelled
     * without emitting a task-notification. Used when the user explicitly
     * abandons a recovered task instead of resuming it.
     */
    abandon(agentId: string): void;
    finalizeCancelled(agentId: string, partialResult: string, stats?: AgentCompletionStats): void;
    finalizeCancellationIfPending(agentId: string): void;
    /**
     * Append a recent tool activity to a running entry's rolling buffer.
     * No-op if the entry is not running — late events after a cancellation
     * shouldn't leak into the Progress section.
     */
    appendActivity(agentId: string, activity: BackgroundActivity): void;
    /**
     * Park a tool call awaiting user approval ("permission bubbling"). No-op
     * (and the call is auto-rejected by the caller) if the entry is not a
     * running background agent — late approvals after cancellation must not
     * resurrect a parked prompt. Duplicate callIds are ignored so a
     * re-emitted event can't double-list the same call.
     */
    addPendingApproval(agentId: string, approval: BackgroundApproval): boolean;
    /**
     * Answer a parked approval with the user's outcome. Invokes the parked
     * call's `respond` callback (which re-enters the agent's runtime frames
     * and resumes the tool), removes it from the queue, and fires an approval
     * change. No-op if the call isn't parked (already answered or cleared).
     */
    resolvePendingApproval(agentId: string, callId: string, outcome: Parameters<BackgroundApproval['respond']>[0], payload?: Parameters<BackgroundApproval['respond']>[1]): Promise<boolean>;
    /**
     * Drop a parked approval WITHOUT responding. Used when the underlying
     * tool call settled through another path (e.g. the scheduler resolved it
     * via an IDE confirmation handler) so the stale prompt must clear without
     * double-answering. Mirrors the foreground `pendingConfirmation` clear in
     * the Agent tool's TOOL_RESULT handler.
     */
    clearPendingApproval(agentId: string, callId: string): void;
    /** Read a background agent's parked approvals (empty if none). */
    getPendingApprovals(agentId: string): readonly BackgroundApproval[];
    /**
     * Subscribe to a background agent's tool-call event stream and bridge
     * approval requests into this registry's parked-approval queue. Returns
     * an unsubscribe function the caller MUST invoke when the agent
     * terminates. Only wire this up when the agent opted into permission
     * bubbling — otherwise the scheduler auto-denies before any
     * `TOOL_WAITING_APPROVAL` fires and this would never see an event anyway.
     *
     * On agent termination any still-parked approval is auto-rejected via its
     * `respond` callback (handled by the caller's cleanup of the agent), so
     * the reasoning loop never hangs on an unanswered prompt.
     */
    bridgeApprovalEvents(agentId: string, emitter: AgentEventEmitter): () => void;
    get(agentId: string): AgentTask | undefined;
    /**
     * Snapshot of every entry regardless of status. Used by the TUI
     * footer/dialog to render rows for still-running AND terminal-state
     * tasks; the headless holdback loop keys off `hasUnfinalizedTasks`
     * instead, so callers that only need the running slice can filter
     * this snapshot at the call site.
     */
    getAll(): AgentTask[];
    private getRunningBackgroundCount;
    private getReservedBackgroundSlotCount;
    private getClaimedBackgroundSlotCount;
    private reserveBackgroundSlot;
    private consumeBackgroundSlot;
    private drainWaitQueue;
    private rejectWaitQueue;
    /**
     * True if any registered task has not yet emitted its terminal
     * task-notification. Covers `running` (still executing) and
     * `cancelled`-but-not-finalized (cancel requested, but the natural
     * handler hasn't fired finalizeCancelled() yet). Headless callers
     * must keep their event loop alive while this returns true, so every
     * task_started is paired with a matching task_notification.
     */
    hasUnfinalizedTasks(): boolean;
    /**
     * The agent ids behind `hasUnfinalizedTasks()`, in registration order.
     *
     * Callers that must *name* the outstanding work — rather than just know
     * that some exists — use this. The daemon's active-work snapshot builds
     * one hold per id so a restart controller and the session-retention path
     * both see the same set the registry itself would report, with no second
     * ledger to drift out of sync. Deliberately shares
     * `hasUnfinalizedTasks()`'s predicate (and not `hasRunningTasks()`'s):
     * a cancelled entry still owes its terminal task-notification, and
     * dropping it here would let the daemon reap the session inside the
     * cancel → finalizeCancelled() window.
     */
    listUnfinalizedBackgroundAgentIds(): string[];
    /**
     * True while any background entry is still actually executing. Unlike
     * `hasUnfinalizedTasks()`, a `cancelled`-but-not-yet-finalized entry
     * does NOT count: its work has already been aborted and only the
     * terminal task-notification is outstanding. Session-switch gates
     * (/clear, /resume) key off this instead — they abort-and-reset the
     * registry right after passing the gate, which suppresses that very
     * notification, so blocking on it made the command silently no-op
     * when the user cleared immediately after cancelling (issue #5949).
     * Headless holdback loops must keep using `hasUnfinalizedTasks()` so
     * every task_started still pairs with a task_notification.
     */
    hasRunningTasks(): boolean;
    /**
     * Drops every in-memory entry without touching sidecar state.
     *
     * Used only when switching to a different session after the caller has
     * already established that no live work from the current session is still
     * running. Paused/interrupted entries remain recoverable from disk because
     * their sidecars keep the persisted status.
     */
    reset(): void;
    /**
     * Enqueue a message for delivery to a running background agent.
     * The agent drains this queue between tool rounds.
     */
    queueMessage(agentId: string, message: string): boolean;
    /**
     * Enqueue generalized external input for an agent. Use queueMessage for the
     * parent send_message text path; this lower-level API also accepts
     * structured inputs such as owner-routed Monitor notifications.
     */
    queueExternalInput(agentId: string, input: AgentExternalInput): boolean;
    /** Close the input queue after its final drain but before async teardown. */
    beginFinishing(agentId: string): boolean;
    isFinishing(agentId: string): boolean;
    /** Wait until a finishing task publishes its terminal state. */
    waitForFinishing(agentId: string, signal: AbortSignal): Promise<boolean>;
    /**
     * Drain all pending messages for an agent. Returns the messages
     * and clears the queue. Called by the agent's reasoning loop.
     */
    drainMessages(agentId: string): AgentExternalInput[];
    waitForMessages(agentId: string, signal: AbortSignal): Promise<AgentExternalInput[]>;
    wakeExternalInputWaiters(agentId: string): void;
    setNotificationCallback(cb: BackgroundNotificationCallback | undefined): void;
    setRegisterCallback(cb: BackgroundRegisterCallback | undefined): void;
    setStatusChangeCallback(cb: BackgroundStatusChangeCallback | undefined): void;
    /**
     * Retract `cb`, but only if it is still the installed one.
     *
     * The slot holds a single callback, so a subscriber that clears it
     * unconditionally on teardown can unhook whoever claimed it afterwards. This
     * makes the retraction safe to call from any owner's dispose path without
     * having to know whether it is still the owner.
     */
    clearStatusChangeCallback(cb: BackgroundStatusChangeCallback): void;
    setActivityChangeCallback(cb: BackgroundActivityChangeCallback | undefined): void;
    setApprovalChangeCallback(cb: BackgroundApprovalChangeCallback | undefined): void;
    abortAll(options?: BackgroundTaskCancelOptions): void;
    private buildDisplayLabel;
    private emitNotification;
    private emitStatusChange;
    /**
     * Evict the oldest fully-finalized terminal entries (those with
     * `notified === true`) once their count exceeds
     * `MAX_RETAINED_TERMINAL_AGENTS`. Sorted by `endTime` (then
     * `startTime` as a tiebreaker for entries that share an endTime).
     *
     * Running, paused, and cancelled-but-not-yet-notified entries are
     * excluded from the eviction set:
     *   - running / paused: the user explicitly cares about live work,
     *     and pruning a paused entry would silently drop a recoverable
     *     task without giving the user a chance to resume / abandon it.
     *   - cancelled but not notified: the natural handler (or grace
     *     timer) is still going to fire `finalizeCancelled` /
     *     `finalizeCancellationIfPending`. Evicting now would break the
     *     SDK contract that every `register` pairs with exactly one
     *     terminal `task-notification`.
     *
     * The caller (typically `emitStatusChange`) is responsible for
     * invoking this after every transition that mutates `notified` or
     * `endTime`. Cap-exceeded eviction is a best-effort: a transition
     * that sets `notified = true` outside the status-change path (the
     * `cancel({ notify: false })` shortcut and `abortAll`'s loop body)
     * may briefly carry a few extra entries until the next transition
     * triggers another prune. Both of those paths are reset / shutdown
     * adjacent — the registry is about to be cleared via `reset()`
     * anyway, so the extra retention does not leak across sessions.
     */
    private pruneTerminalEntries;
    private deleteAgent;
    private releaseFinishingWaiters;
    private releaseAllFinishingWaiters;
    private disposeAllResidentAgents;
    private wakeMessageWaiters;
    private emitActivityChange;
    private emitApprovalChange;
    /**
     * Auto-reject and drop every parked approval for an entry. Called when
     * the entry reaches a terminal state so the agent's reasoning loop never
     * hangs on a prompt no one will answer, and the UI surface clears. Each
     * parked call is resolved with `Cancel` (denied). Safe to call on entries
     * with no parked approvals.
     */
    private rejectPendingApprovals;
}
export {};
