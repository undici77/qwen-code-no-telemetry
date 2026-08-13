/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskBase, TaskRegistration } from '../agents/tasks/types.js';
export declare const MAX_CONCURRENT_MONITORS = 16;
export declare const MAX_RETAINED_TERMINAL_MONITORS = 128;
export type MonitorStatus = 'running' | 'completed' | 'failed' | 'cancelled';
/**
 * Resolves a per-monitor reserved output path.
 *
 * Today no writer is attached at this path — monitors deliver their
 * events through the parent's chat record via the notification callback.
 * The path is reserved on every `MonitorTask` so the `TaskBase` contract
 * ("every task has a path it would write to if it produces a primary
 * stream") holds, and so a future per-monitor file writer can land
 * without changing the type signature.
 */
export declare function getMonitorOutputPath(projectDir: string, sessionId: string, monitorId: string): string;
/**
 * Monitor kind of `TaskState`. Tracks one long-running monitor process
 * whose stdout lines are pushed to the parent agent as event
 * notifications. `outputFile` is reserved on registration but no writer
 * is attached today — events stream into the parent's chat record.
 */
export interface MonitorTask extends TaskBase {
    kind: 'monitor';
    /**
     * @deprecated Read `id` instead; kept as a synonym during the back-compat
     * window. Always equals `id`.
     */
    monitorId: string;
    command: string;
    status: MonitorStatus;
    pid?: number;
    toolUseId?: string;
    ownerAgentId?: string;
    eventCount: number;
    lastEventTime: number;
    maxEvents: number;
    idleTimeoutMs: number;
    idleTimer?: ReturnType<typeof setTimeout>;
    droppedLines: number;
    /** Exit code from the underlying process, when known. */
    exitCode?: number;
    /**
     * Reason for terminal status, when one exists. Mirrors
     * `ShellTask.error`. Populated for:
     *   - `failed` — spawn error (passed to `fail(monitorId, error)`).
     *   - `completed` via auto-stop — currently `'Max events reached'`
     *     from `emitEvent` and `'Idle timeout'` from the idle timer; any
     *     future auto-stop reason should populate this field too so the
     *     detail view stays a complete record of why the monitor stopped.
     * Not populated for `cancelled` (no semantic reason — the user / agent
     * just asked to stop) or for `completed` via natural process exit
     * (the `exitCode` field carries that signal instead).
     * Surfaced in the dialog's `MonitorDetailBody`.
     */
    error?: string;
}
/**
 * @deprecated Renamed to `MonitorTask`. Kept as a one-release type alias
 * for external SDK consumers; will be removed in the release after PR 2
 * lands.
 */
export type MonitorEntry = MonitorTask;
/**
 * Shape callers pass to {@link MonitorRegistry.register}; the registry
 * derives the shared `TaskBase` envelope (`id`, `kind`, `outputOffset`,
 * `notified`) from these. Callers are responsible for computing
 * `outputFile` via {@link getMonitorOutputPath} so the registry stays
 * decoupled from the project/session paths owned by `Config`.
 */
export type MonitorTaskRegistration = TaskRegistration<MonitorTask>;
export interface MonitorNotificationMeta {
    monitorId: string;
    status: MonitorStatus;
    eventCount: number;
    toolUseId?: string;
    ownerAgentId?: string;
    todoWorkChainId?: string;
}
export type MonitorNotificationCallback = (displayText: string, modelText: string, meta: MonitorNotificationMeta) => void;
export type MonitorOwnerLifecycleCallback = () => void;
export type MonitorRegisterCallback = (entry: MonitorTask) => void;
/**
 * Fires on any change to the registry's contents that a snapshot
 * subscriber needs to observe — concretely: `register()` (nothing →
 * running), `settle()` (running → terminal: complete / fail / cancel /
 * emitEvent's auto-stop at maxEvents / idle timeout), and `reset()`
 * (mass clear, fired with no entry).
 *
 * Does NOT fire on `emitEvent` per se — per-event registry mutations
 * (eventCount / droppedLines) are deliberately excluded so the footer
 * pill and AppContainer don't churn under heavy event traffic. The
 * dialog's detail view re-resolves selected monitor entries from the
 * registry directly when it needs live counters.
 *
 * Symmetric with `BackgroundTaskRegistry.setStatusChangeCallback` and
 * `BackgroundShellRegistry.setStatusChangeCallback` so the same UI hook
 * can subscribe to all three registries.
 */
export type MonitorStatusChangeCallback = (entry?: MonitorTask) => void;
interface MonitorCancelOptions {
    notify?: boolean;
}
export declare class MonitorRegistry {
    private readonly monitors;
    private readonly agentNotificationCallbacks;
    private readonly agentLifecycleCallbacks;
    private notificationCallback?;
    private registerCallback?;
    private statusChangeCallback?;
    register(registration: MonitorTaskRegistration): MonitorTask;
    /**
     * Push a stdout line as an event notification to the agent.
     * Increments eventCount, resets idle timer, auto-stops if maxEvents reached.
     * No-op if the monitor is no longer running.
     */
    emitEvent(monitorId: string, line: string): void;
    complete(monitorId: string, exitCode: number | null): void;
    fail(monitorId: string, error: string): void;
    /**
     * Cancel a running monitor. No-op if not 'running' — guards against a race
     * with concurrent cancellation.
     *
     * The two branches order `settle()` and `abort()` differently on purpose:
     *
     * - `notify: false` (silent cancel, e.g. owner-agent teardown): settle to
     *   `'cancelled'` *first*, then abort. The status transition is locked in
     *   before any abort-listener can run, so an abort-triggered `fail()` or
     *   `complete()` can't race in and overwrite the terminal status. The
     *   owner is woken via `dispatchOwnerLifecycleWake()` instead of the
     *   notification channel.
     *
     * - Default (user-visible cancel): abort *first*, then re-check `status`.
     *   This lets a naturally-completing operation settle itself through its
     *   own terminal path (so the user sees `completed`/`failed` rather than
     *   a forced `cancelled` when the abort arrives at the finish line). Only
     *   if `status` is still `'running'` after abort do we force `'cancelled'`
     *   and emit the terminal notification.
     */
    cancel(monitorId: string, options?: MonitorCancelOptions): void;
    get(monitorId: string): MonitorTask | undefined;
    getAll(): MonitorTask[];
    getRunning(): MonitorTask[];
    hasRunningForOwner(ownerAgentId: string): boolean;
    setNotificationCallback(cb: MonitorNotificationCallback | undefined): void;
    setAgentNotificationCallback(agentId: string, cb: MonitorNotificationCallback | undefined): void;
    setAgentLifecycleCallback(agentId: string, cb: MonitorOwnerLifecycleCallback | undefined): void;
    setRegisterCallback(cb: MonitorRegisterCallback | undefined): void;
    /**
     * Subscribe to status transitions (register + every running → terminal
     * settle). Single-subscriber on purpose — the dialog hook is the only
     * consumer in the codebase, and a list would invite drift in
     * error-handling.
     */
    setStatusChangeCallback(cb: MonitorStatusChangeCallback | undefined): void;
    abortAll(options?: MonitorCancelOptions): void;
    cancelRunningForOwner(ownerAgentId: string, options?: MonitorCancelOptions): void;
    reset(): void;
    private settle;
    private fireStatusChange;
    private dispatchOwnerLifecycleWake;
    private pruneTerminalEntries;
    private resetIdleTimer;
    private clearIdleTimer;
    /** Emit a streaming event notification (status=running, includes stdout line). */
    private emitNotification;
    /** Emit a terminal notification (completed/failed/cancelled). */
    private emitTerminalNotification;
    private dispatchNotification;
}
export {};
