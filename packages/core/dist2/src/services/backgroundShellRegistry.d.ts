/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskBase, TaskRegistration } from '../agents/tasks/types.js';
/**
 * Cap on how many terminal (completed/failed/cancelled) entries the
 * registry retains. Without this cap, every short-lived background
 * shell leaves a row in the Background tasks dialog and pill forever,
 * crowding out the running entries the user actually opened the dialog
 * to find. Mirrors the rationale + retention pattern in
 * `MonitorRegistry.MAX_RETAINED_TERMINAL_MONITORS`.
 *
 * Sized lower than the monitor cap because shells are user-initiated
 * (a session typically has tens, not hundreds) and the dialog-side
 * cost of a stale shell row is higher — each one has a long `command`
 * label, so they push newer entries out of the visible window faster
 * than monitor rows would.
 */
export declare const MAX_RETAINED_TERMINAL_SHELLS = 32;
export type BackgroundShellStatus = 'running' | 'completed' | 'failed' | 'cancelled';
/**
 * Shell kind of `TaskState`. Tracks one managed background shell — a
 * spawned child process whose stdout/stderr is captured to `outputFile`
 * and whose lifecycle is observable through this registry.
 */
export interface ShellTask extends TaskBase {
    kind: 'shell';
    /**
     * @deprecated Read `id` instead; kept as a synonym during the back-compat
     * window. Always equals `id`.
     */
    shellId: string;
    /** The user-supplied command, after any pre-processing the tool applies. */
    command: string;
    /** Working directory the process was spawned in. */
    cwd: string;
    /** OS pid once spawned; absent if registration happens before spawn. */
    pid?: number;
    status: BackgroundShellStatus;
    /** Exit code on `completed`. */
    exitCode?: number;
    /** Error message on `failed`. */
    error?: string;
    /**
     * @deprecated Use `outputFile`. Kept as a synonym during the back-compat
     * window; always equals `outputFile`.
     */
    outputPath: string;
}
/**
 * @deprecated Renamed to `ShellTask`. Kept as a one-release type alias for
 * external SDK consumers; will be removed in the release after PR 2 lands.
 */
export type BackgroundShellEntry = ShellTask;
/**
 * Shape callers pass to {@link BackgroundShellRegistry.register}; the
 * registry derives the shared `TaskBase` envelope (`id`, `kind`,
 * `outputOffset`, `notified`) from these and additionally:
 *   - aliases the legacy `outputPath` to `outputFile` (asymmetric vs.
 *     `AgentTaskRegistration` / `MonitorTaskRegistration`, which require
 *     callers to pass `outputFile` directly — this is a one-release
 *     transitional concession until `outputPath` is removed)
 *   - synthesizes `description` from `command` (shells have no separate
 *     human label).
 */
export type ShellTaskRegistration = Omit<TaskRegistration<ShellTask>, 'description' | 'outputFile'>;
/** Fires when a new entry is registered. */
export type BackgroundShellRegisterCallback = (entry: ShellTask) => void;
/**
 * Fires on every status transition (running → terminal). Symmetric with
 * `BackgroundTaskRegistry.setStatusChangeCallback` so the same UI hook can
 * subscribe to both registries.
 */
export type BackgroundShellStatusChangeCallback = (entry?: ShellTask) => void;
export declare class BackgroundShellRegistry {
    private readonly entries;
    private registerCallback;
    private statusChangeCallback;
    /**
     * Subscribe to new-entry events. Called synchronously inside `register()`.
     * Setting `undefined` clears the existing subscriber. Single-subscriber on
     * purpose — the UI hook is the only consumer in the codebase, and a list
     * would invite drift in error-handling.
     */
    setRegisterCallback(cb: BackgroundShellRegisterCallback | undefined): void;
    /**
     * Subscribe to status transitions (running → terminal). Called
     * synchronously inside `complete()` / `fail()` / `cancel()` after the
     * entry has been mutated. Same single-subscriber rationale as
     * `setRegisterCallback`.
     */
    setStatusChangeCallback(cb: BackgroundShellStatusChangeCallback | undefined): void;
    register(registration: ShellTaskRegistration): ShellTask;
    get(shellId: string): ShellTask | undefined;
    getAll(): readonly ShellTask[];
    hasRunningEntries(): boolean;
    complete(shellId: string, exitCode: number, endTime: number): void;
    fail(shellId: string, error: string, endTime: number): void;
    cancel(shellId: string, endTime: number): void;
    /**
     * Mutates a running entry to its `cancelled` terminal state without
     * touching the prune or status-change side channels. Internal helper
     * shared by `cancel()` (single-shot, fires both side channels) and
     * `abortAll()` (batch, fires both exactly once after the loop).
     *
     * Caller is responsible for verifying the entry is `running` before
     * invoking this. The split keeps the running-status guard at the
     * public-API boundary so a future caller can't accidentally settle
     * an already-terminal entry without that check.
     */
    private settleAsCancelled;
    /**
     * Evict the oldest terminal entries (by `endTime`, then `startTime`)
     * once the count exceeds `MAX_RETAINED_TERMINAL_SHELLS`. Running
     * entries are never evicted. Called after every running → terminal
     * transition; settle order ensures the newly-terminal entry has its
     * `endTime` stamped before the prune runs, so a fresh terminal
     * never out-ages the entries already retained.
     */
    private pruneTerminalEntries;
    private fireRegister;
    private fireStatusChange;
    /**
     * Request cancellation without marking the entry terminal.
     *
     * Triggers the entry's AbortController so the spawn handler can tear the
     * process down, but leaves `status='running'` until the settle path
     * observes the abort and records the real exit moment + outcome via
     * `complete()` / `fail()` / `cancel()`. This keeps the registry honest:
     * a cancelled shell only shows its terminal `endTime` once the process
     * has actually drained, and a cancel-vs-exit race can't permanently hide
     * a real completed/failed result.
     *
     * Used by the `task_stop` tool path; the immediate-mark `cancel()` above
     * is reserved for `abortAll()` / shutdown, where the CLI process is
     * tearing down anyway and there is no settle handler to wait for.
     *
     * Idempotent: no-op on entries that aren't `running`.
     */
    requestCancel(shellId: string): void;
    /**
     * Drops every in-memory entry without touching spawned processes.
     *
     * Callers must only use this after verifying that no running managed shell
     * from the current session still exists.
     */
    reset(): void;
    /**
     * Cancel every still-running entry. Called on session/Config shutdown so
     * background shells don't outlive the CLI process and leak orphaned
     * children. Symmetric with `BackgroundTaskRegistry.abortAll()` for the
     * subagent path.
     *
     * Settles each entry inline, then fires `pruneTerminalEntries` and the
     * statusChange callback exactly once after the loop. The per-entry
     * `cancel()` path would have triggered both side channels for every
     * running shell — wasteful on shutdown / `/clear` where the only
     * subscriber (`useBackgroundTaskView`) just re-pulls `getAll()`
     * regardless of the entry argument.
     */
    abortAll(): void;
}
