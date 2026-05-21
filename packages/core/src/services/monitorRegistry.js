/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview MonitorRegistry — tracks long-running monitor processes.
 *
 * When the Monitor tool is called, a background process is spawned whose stdout
 * lines are pushed back to the agent as event notifications. This registry
 * manages the lifecycle of each monitor entry: running → completed/failed/cancelled.
 *
 * Follows the same structural pattern as BackgroundTaskRegistry (background-tasks.ts)
 * so the two can be unified into a single registry when #3488 lands.
 */
import * as path from 'node:path';
import { sanitizeFilenameComponent } from '../agents/agent-transcript.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { escapeXml } from '../utils/xml.js';
const debugLogger = createDebugLogger('MONITOR_REGISTRY');
const EVENT_LINE_TRUNCATE = 2000;
const MAX_DESCRIPTION_LENGTH = 80;
export const MAX_CONCURRENT_MONITORS = 16;
export const MAX_RETAINED_TERMINAL_MONITORS = 128;
/**
 * Strip C0 control characters (except tab) and C1 control characters from a
 * string destined for terminal/UI display. The Monitor tool pre-sanitizes
 * stdout lines before calling `emitEvent`, but we apply the same strip here
 * as defense-in-depth so that any direct caller of the registry cannot leak
 * terminal escape sequences or NUL bytes into the `displayText` surface.
 */
function stripDisplayControlChars(text) {
    let out = '';
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code === 0x09) {
            out += text[i];
            continue;
        }
        if (code < 0x20)
            continue; // C0 (NUL, BEL, ESC, \n, \r, ...)
        if (code >= 0x80 && code <= 0x9f)
            continue; // C1
        out += text[i];
    }
    return out;
}
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
export function getMonitorOutputPath(projectDir, sessionId, monitorId) {
    return path.join(projectDir, 'monitors', sanitizeFilenameComponent(sessionId), `monitor-${sanitizeFilenameComponent(monitorId)}.log`);
}
export class MonitorRegistry {
    monitors = new Map();
    agentNotificationCallbacks = new Map();
    agentLifecycleCallbacks = new Map();
    notificationCallback;
    registerCallback;
    statusChangeCallback;
    register(registration) {
        if (this.getRunning().length >= MAX_CONCURRENT_MONITORS) {
            throw new Error(`Cannot start monitor: maximum concurrent monitors (${MAX_CONCURRENT_MONITORS}) reached. Stop an existing monitor first.`);
        }
        // Mutate the registration in place to graduate it to a `MonitorTask`.
        // Returning the same reference lets the caller continue using the
        // variable for the post-register mutations (`status`, `droppedLines`,
        // …) the existing monitor.ts flow relies on; the registry stores this
        // exact reference, so external mutations remain observable through
        // `get()` / `getAll()`.
        const entry = registration;
        entry.id = registration.monitorId;
        entry.kind = 'monitor';
        entry.outputOffset = 0;
        entry.notified = false;
        this.monitors.set(entry.monitorId, entry);
        debugLogger.info(`Registered monitor: ${entry.monitorId}`);
        this.resetIdleTimer(entry);
        if (!entry.ownerAgentId && this.registerCallback) {
            try {
                this.registerCallback(entry);
            }
            catch (error) {
                debugLogger.error('Failed to emit register callback:', error);
            }
        }
        // Mirror BackgroundTaskRegistry / BackgroundShellRegistry: registration
        // is a status transition (nothing → running) so subscribers that only
        // care about "what's in the registry now" can subscribe to a single
        // callback and see new entries the same way they see status changes.
        this.fireStatusChange(entry);
        return entry;
    }
    /**
     * Push a stdout line as an event notification to the agent.
     * Increments eventCount, resets idle timer, auto-stops if maxEvents reached.
     * No-op if the monitor is no longer running.
     */
    emitEvent(monitorId, line) {
        const entry = this.monitors.get(monitorId);
        if (!entry || entry.status !== 'running')
            return;
        entry.eventCount++;
        entry.lastEventTime = Date.now();
        this.resetIdleTimer(entry);
        const truncatedLine = line.length > EVENT_LINE_TRUNCATE
            ? line.slice(0, EVENT_LINE_TRUNCATE) + '...[truncated]'
            : line;
        this.emitNotification(entry, truncatedLine);
        // Auto-stop if max events reached. Settle BEFORE aborting so that any
        // synchronous abort listener that flushes buffered output back through
        // `registry.emitEvent()` (see Monitor tool's flushPartialLineBuffers)
        // finds `entry.status !== 'running'` and short-circuits, instead of
        // incrementing `eventCount` past `maxEvents` and emitting a duplicate
        // terminal notification.
        if (entry.eventCount >= entry.maxEvents) {
            debugLogger.info(`Monitor ${monitorId} reached max events (${entry.maxEvents}), stopping`);
            // Persist the reason so the dialog's detail view can surface it
            // after the monitor terminates. The chat-history notification is
            // separate from the registry's persistent state, so reopening the
            // Background tasks dialog or running `/tasks` later won't surface
            // it on its own — the persisted `entry.error` is what those
            // surfaces actually read.
            entry.error = 'Max events reached';
            this.settle(entry, 'completed');
            entry.abortController.abort();
            this.emitTerminalNotification(entry, 'Max events reached');
        }
    }
    // No-op if not 'running' — guards against race with concurrent cancellation.
    complete(monitorId, exitCode) {
        const entry = this.monitors.get(monitorId);
        if (!entry || entry.status !== 'running')
            return;
        if (exitCode !== null)
            entry.exitCode = exitCode;
        this.settle(entry, 'completed');
        debugLogger.info(`Monitor completed: ${monitorId} (exit ${exitCode}, ${entry.eventCount} events)`);
        this.emitTerminalNotification(entry, exitCode !== null ? `Exited with code ${exitCode}` : undefined);
    }
    // No-op if not 'running' — guards against race with concurrent cancellation.
    fail(monitorId, error) {
        const entry = this.monitors.get(monitorId);
        if (!entry || entry.status !== 'running')
            return;
        entry.error = error;
        this.settle(entry, 'failed');
        debugLogger.info(`Monitor failed: ${monitorId}: ${error}`);
        this.emitTerminalNotification(entry, error);
    }
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
    cancel(monitorId, options = {}) {
        const entry = this.monitors.get(monitorId);
        if (!entry || entry.status !== 'running')
            return;
        if (options.notify === false) {
            this.settle(entry, 'cancelled');
            debugLogger.info(`Monitor cancelled: ${monitorId}`);
            entry.abortController.abort();
            this.dispatchOwnerLifecycleWake(entry);
            return;
        }
        entry.abortController.abort();
        if (entry.status !== 'running')
            return;
        this.settle(entry, 'cancelled');
        debugLogger.info(`Monitor cancelled: ${monitorId}`);
        this.emitTerminalNotification(entry);
    }
    get(monitorId) {
        return this.monitors.get(monitorId);
    }
    getAll() {
        return Array.from(this.monitors.values());
    }
    getRunning() {
        return Array.from(this.monitors.values()).filter((e) => e.status === 'running');
    }
    hasRunningForOwner(ownerAgentId) {
        for (const entry of this.monitors.values()) {
            if (entry.ownerAgentId === ownerAgentId && entry.status === 'running') {
                return true;
            }
        }
        return false;
    }
    setNotificationCallback(cb) {
        this.notificationCallback = cb;
    }
    setAgentNotificationCallback(agentId, cb) {
        if (cb) {
            this.agentNotificationCallbacks.set(agentId, cb);
        }
        else {
            this.agentNotificationCallbacks.delete(agentId);
        }
    }
    setAgentLifecycleCallback(agentId, cb) {
        if (cb) {
            this.agentLifecycleCallbacks.set(agentId, cb);
        }
        else {
            this.agentLifecycleCallbacks.delete(agentId);
        }
    }
    setRegisterCallback(cb) {
        this.registerCallback = cb;
    }
    /**
     * Subscribe to status transitions (register + every running → terminal
     * settle). Single-subscriber on purpose — the dialog hook is the only
     * consumer in the codebase, and a list would invite drift in
     * error-handling.
     */
    setStatusChangeCallback(cb) {
        this.statusChangeCallback = cb;
    }
    abortAll(options = {}) {
        for (const entry of Array.from(this.monitors.values())) {
            this.cancel(entry.monitorId, options);
        }
        debugLogger.info('Aborted all monitors');
    }
    cancelRunningForOwner(ownerAgentId, options = {}) {
        const monitorIds = [];
        for (const entry of this.monitors.values()) {
            if (entry.ownerAgentId === ownerAgentId && entry.status === 'running') {
                monitorIds.push(entry.monitorId);
            }
        }
        for (const monitorId of monitorIds) {
            this.cancel(monitorId, options);
        }
    }
    reset() {
        this.agentNotificationCallbacks.clear();
        this.agentLifecycleCallbacks.clear();
        if (this.monitors.size === 0)
            return;
        for (const entry of this.monitors.values()) {
            this.clearIdleTimer(entry);
            if (entry.status === 'running') {
                entry.abortController.abort();
            }
        }
        this.monitors.clear();
        // Notify subscribers that the registry's contents changed wholesale
        // — without this, the dialog snapshot in `useBackgroundTaskView`
        // would keep rendering the now-cleared rows until an unrelated
        // register/settle event happens. Mirrors BackgroundShellRegistry /
        // BackgroundTaskRegistry's reset paths.
        this.fireStatusChange();
    }
    // --- Internal helpers ---
    settle(entry, status) {
        entry.status = status;
        entry.endTime = Date.now();
        this.clearIdleTimer(entry);
        this.pruneTerminalEntries();
        this.fireStatusChange(entry);
    }
    fireStatusChange(entry) {
        if (!this.statusChangeCallback)
            return;
        try {
            this.statusChangeCallback(entry);
        }
        catch (error) {
            debugLogger.error('statusChange callback failed:', error);
        }
    }
    dispatchOwnerLifecycleWake(entry) {
        if (!entry.ownerAgentId)
            return;
        const callback = this.agentLifecycleCallbacks.get(entry.ownerAgentId);
        if (!callback)
            return;
        try {
            callback();
        }
        catch (error) {
            debugLogger.error('owner lifecycle callback failed:', error);
        }
    }
    pruneTerminalEntries() {
        const terminalEntries = Array.from(this.monitors.values())
            .filter((entry) => entry.status !== 'running')
            .sort((a, b) => (a.endTime ?? a.startTime) - (b.endTime ?? b.startTime) ||
            a.startTime - b.startTime);
        while (terminalEntries.length > MAX_RETAINED_TERMINAL_MONITORS) {
            const oldest = terminalEntries.shift();
            if (oldest) {
                this.monitors.delete(oldest.monitorId);
            }
        }
    }
    resetIdleTimer(entry) {
        this.clearIdleTimer(entry);
        entry.idleTimer = setTimeout(() => {
            if (entry.status === 'running') {
                debugLogger.info(`Monitor ${entry.monitorId} idle timeout (${entry.idleTimeoutMs}ms), stopping`);
                entry.abortController.abort();
                if (entry.status !== 'running')
                    return;
                // Same rationale as the max-events branch in `emitEvent`: persist
                // the reason so the dialog detail view can show it after settle.
                entry.error = 'Idle timeout';
                this.settle(entry, 'completed');
                this.emitTerminalNotification(entry, 'Idle timeout');
            }
        }, entry.idleTimeoutMs);
        entry.idleTimer.unref?.();
    }
    clearIdleTimer(entry) {
        if (entry.idleTimer !== undefined) {
            clearTimeout(entry.idleTimer);
            entry.idleTimer = undefined;
        }
    }
    /** Emit a streaming event notification (status=running, includes stdout line). */
    emitNotification(entry, eventLine) {
        const desc = stripDisplayControlChars(this.truncateDescription(entry.description));
        const safeEventLine = stripDisplayControlChars(eventLine);
        const displayLine = `Monitor "${desc}" event #${entry.eventCount}: ${safeEventLine}`;
        const xmlParts = [
            '<task-notification>',
            `<task-id>${escapeXml(entry.monitorId)}</task-id>`,
        ];
        if (entry.toolUseId) {
            xmlParts.push(`<tool-use-id>${escapeXml(entry.toolUseId)}</tool-use-id>`);
        }
        xmlParts.push('<kind>monitor</kind>', '<status>running</status>', `<event-count>${entry.eventCount}</event-count>`, `<summary>Monitor "${escapeXml(desc)}" emitted event #${entry.eventCount}.</summary>`, `<result>${escapeXml(eventLine)}</result>`, '</task-notification>');
        const meta = {
            monitorId: entry.monitorId,
            status: 'running',
            eventCount: entry.eventCount,
            toolUseId: entry.toolUseId,
            ownerAgentId: entry.ownerAgentId,
        };
        this.dispatchNotification(entry, displayLine, xmlParts.join('\n'), meta);
    }
    /** Emit a terminal notification (completed/failed/cancelled). */
    emitTerminalNotification(entry, detail) {
        const statusText = entry.status === 'completed'
            ? 'completed'
            : entry.status === 'failed'
                ? 'failed'
                : 'was cancelled';
        const desc = stripDisplayControlChars(this.truncateDescription(entry.description));
        const droppedSuffix = entry.droppedLines > 0
            ? `, ${entry.droppedLines} lines dropped due to throttling`
            : '';
        const displayLine = `Monitor "${desc}" ${statusText}. (${entry.eventCount} events${droppedSuffix})`;
        const xmlParts = [
            '<task-notification>',
            `<task-id>${escapeXml(entry.monitorId)}</task-id>`,
        ];
        if (entry.toolUseId) {
            xmlParts.push(`<tool-use-id>${escapeXml(entry.toolUseId)}</tool-use-id>`);
        }
        xmlParts.push('<kind>monitor</kind>', `<status>${escapeXml(entry.status)}</status>`, `<event-count>${entry.eventCount}</event-count>`, `<summary>Monitor "${escapeXml(desc)}" ${statusText}. Total events: ${entry.eventCount}.${entry.droppedLines > 0 ? ` ${entry.droppedLines} lines dropped due to throttling.` : ''}</summary>`);
        if (detail) {
            xmlParts.push(`<result>${escapeXml(stripDisplayControlChars(detail))}</result>`);
        }
        xmlParts.push('</task-notification>');
        const meta = {
            monitorId: entry.monitorId,
            status: entry.status,
            eventCount: entry.eventCount,
            toolUseId: entry.toolUseId,
            ownerAgentId: entry.ownerAgentId,
        };
        this.dispatchNotification(entry, displayLine, xmlParts.join('\n'), meta);
    }
    dispatchNotification(entry, displayLine, modelText, meta) {
        const callback = entry.ownerAgentId
            ? this.agentNotificationCallbacks.get(entry.ownerAgentId)
            : this.notificationCallback;
        if (!callback) {
            if (entry.ownerAgentId) {
                debugLogger.warn(`Dropping monitor notification for ${entry.monitorId}: owner agent ${entry.ownerAgentId} has no notification callback`);
            }
            return;
        }
        try {
            callback(displayLine, modelText, meta);
        }
        catch (error) {
            debugLogger.error('Failed to emit monitor notification:', error);
        }
    }
    truncateDescription(desc) {
        // Ellipsis counts against the configured cap so the returned string is
        // guaranteed to be <= MAX_DESCRIPTION_LENGTH characters, matching the
        // documented contract and the Monitor tool's display truncation.
        const ELLIPSIS = '...';
        if (desc.length <= MAX_DESCRIPTION_LENGTH)
            return desc;
        const keep = Math.max(0, MAX_DESCRIPTION_LENGTH - ELLIPSIS.length);
        return desc.slice(0, keep) + ELLIPSIS;
    }
}
//# sourceMappingURL=monitorRegistry.js.map