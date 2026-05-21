/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentExternalInput } from './runtime/agent-types.js';
import type { TaskBase, TaskRegistration, TaskStatus } from './tasks/types.js';
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
    toolUses: number;
    durationMs: number;
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
export interface NotificationMeta {
    agentId: string;
    status: TaskStatus;
    stats?: AgentCompletionStats;
    toolUseId?: string;
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
export declare class BackgroundTaskRegistry {
    private readonly agents;
    private readonly messageWaiters;
    private notificationCallback?;
    private registerCallback?;
    private statusChangeCallback?;
    private activityChangeCallback?;
    register(registration: AgentTaskRegistration): AgentTask;
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
    get(agentId: string): AgentTask | undefined;
    /**
     * Snapshot of every entry regardless of status. Used by the TUI
     * footer/dialog to render rows for still-running AND terminal-state
     * tasks; the headless holdback loop keys off `hasUnfinalizedTasks`
     * instead, so callers that only need the running slice can filter
     * this snapshot at the call site.
     */
    getAll(): AgentTask[];
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
    setActivityChangeCallback(cb: BackgroundActivityChangeCallback | undefined): void;
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
    private wakeMessageWaiters;
    private emitActivityChange;
}
export {};
