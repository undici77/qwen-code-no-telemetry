/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * useBackgroundTaskView — subscribes to the three background-task
 * registries (background subagents, managed shells, and event monitors)
 * AND to `MemoryManager` for dream consolidation tasks, merging them
 * into a single ordered snapshot of `DialogEntry`s. Each registry fires
 * `statusChange` on register too, so a single subscription per registry
 * is enough to keep the snapshot fresh for new + transitioning entries.
 * The `MemoryManager.subscribe({ taskType: 'dream' })` filter routes
 * dream-task transitions to the same refresh path while skipping the
 * per-UserQuery extract notifies that have no dialog surface.
 *
 * Surfaces that only care about live work (the footer pill, the
 * composer's Down-arrow route) filter for `running` themselves.
 *
 * Intentionally ignores activity updates (appendActivity). Tool-call
 * traffic from a running background agent would otherwise churn the
 * Footer pill and the AppContainer every few hundred ms. The detail
 * dialog subscribes to the activity callback directly when it needs
 * live Progress updates.
 */
import { useState, useEffect } from 'react';
import {} from '@qwen-code/qwen-code-core';
// Cap on retained terminal dream entries surfaced via the dialog.
// `MemoryManager.tasks` has no eviction; without this cap the list
// grows unboundedly with completed dreams over the project's lifetime.
// 3 is small enough to stay glanceable yet keeps the most recent
// outcomes visible across rapid succession (e.g. the user opening the
// dialog right after two dreams completed).
const MAX_RETAINED_TERMINAL_DREAMS = 3;
/** Stable id of an entry regardless of kind — used as React key + lookup. */
export function entryId(entry) {
    switch (entry.kind) {
        case 'agent':
            return entry.agentId;
        case 'shell':
            return entry.shellId;
        case 'monitor':
            return entry.monitorId;
        case 'dream':
            return entry.dreamId;
        default: {
            const _exhaustive = entry;
            throw new Error(`entryId: unknown DialogEntry kind: ${JSON.stringify(_exhaustive)}`);
        }
    }
}
export function useBackgroundTaskView(config) {
    const [entries, setEntries] = useState([]);
    useEffect(() => {
        if (!config)
            return;
        const agentRegistry = config.getBackgroundTaskRegistry();
        const shellRegistry = config.getBackgroundShellRegistry();
        const monitorRegistry = config.getMonitorRegistry();
        const memoryManager = config.getMemoryManager();
        const projectRoot = config.getProjectRoot();
        // Dream snapshot signature, kept as a defense-in-depth dedup for
        // the dream-filtered memory listener below. The taskType filter
        // already skips the listener entirely on extract notifies; this
        // signature additionally absorbs the rare case where dream
        // metadata is updated without an observable dialog change.
        let lastDreamSig = '';
        // Declared before `refresh` so the function ordering can't trip
        // the temporal-dead-zone if a future refactor adds a synchronous
        // call to refresh between the two `const` bindings.
        const computeDreamSig = (dreams) => dreams.map((t) => `${t.id}:${t.status}:${t.updatedAt}`).join('|');
        // refresh accepts a pre-fetched dream snapshot so the memory
        // listener can reuse the same array it computed for its dedup
        // check — avoids a second listTasksByType call AND eliminates the
        // race window where the listener's gate sig and the entries it
        // builds would otherwise come from two separate snapshots.
        const refresh = (dreamSnapshot) => {
            const agentEntries = [...agentRegistry.getAll()];
            const shellEntries = [...shellRegistry.getAll()];
            const monitorEntries = [...monitorRegistry.getAll()];
            // Dream entries: only surface tasks that actually fired.
            // `pending` is a sub-second transition state and `skipped`
            // records arise from the rare race where the schedule-time
            // lock check passed but `acquireDreamLock` then hit EEXIST in
            // runDream — these never reflect user-visible work, so filter
            // them out. (Most gate misses don't create a record at all;
            // scheduleDream returns `{status: 'skipped'}` early without
            // touching the task map.) Extract tasks also intentionally
            // stay out of this view — they fire on every UserQuery and
            // their completion is already covered by the `memory_saved`
            // toast in useGeminiStream.
            //
            // Cap retained terminal entries — MemoryManager.tasks Map has no
            // eviction path, so completed/failed dreams accumulate forever
            // (every fired dream over the project's lifetime). Without this
            // cap the dialog would grow unbounded; with it the user sees all
            // running dreams plus the most recent few terminal results
            // (mirrors MonitorRegistry.MAX_RETAINED_TERMINAL_MONITORS).
            const allDreams = dreamSnapshot ?? memoryManager.listTasksByType('dream', projectRoot);
            const runningDreams = allDreams.filter((t) => t.status === 'running');
            const terminalDreams = allDreams
                .filter((t) => t.status === 'completed' ||
                t.status === 'failed' ||
                t.status === 'cancelled')
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, MAX_RETAINED_TERMINAL_DREAMS);
            const dreamEntries = [
                ...runningDreams,
                ...terminalDreams,
            ].map((t) => {
                const sessionCount = t.metadata?.['sessionCount'];
                const touchedTopics = t.metadata?.['touchedTopics'];
                const lockReleaseError = t.metadata?.['lockReleaseError'];
                const metadataWriteError = t.metadata?.['metadataWriteError'];
                return {
                    kind: 'dream',
                    dreamId: t.id,
                    status: t.status,
                    startTime: Date.parse(t.createdAt),
                    endTime: t.status === 'running' ? undefined : Date.parse(t.updatedAt),
                    progressText: t.progressText,
                    error: t.error,
                    sessionCount: typeof sessionCount === 'number' ? sessionCount : undefined,
                    touchedTopics: Array.isArray(touchedTopics)
                        ? touchedTopics.filter((s) => typeof s === 'string')
                        : undefined,
                    lockReleaseError: typeof lockReleaseError === 'string' ? lockReleaseError : undefined,
                    metadataWriteError: typeof metadataWriteError === 'string'
                        ? metadataWriteError
                        : undefined,
                };
            });
            // Two-bucket merge so "new OR running tasks should appear at the
            // top" (the literal phrasing of the issue this view-model serves).
            // A pure startTime DESC sort surfaces the newest LAUNCH but lets
            // an older long-running / paused entry fall below a batch of
            // newer terminal entries — the user opens the dialog wanting to
            // check the running work, and finds it buried under noise.
            //
            //   bucket 1 — active (running + paused), sorted by startTime DESC
            //              so the most recent launch sits at the very top.
            //   bucket 2 — terminal (completed / failed / cancelled), sorted
            //              by endTime DESC so the most recently FINISHED entry
            //              is the first terminal row (matches "what changed
            //              while I wasn't looking" intuition; startTime would
            //              put a long-running task that just settled below an
            //              old quick task that finished hours ago).
            //
            // Entries falling out the bottom of bucket 2 are eventually
            // pruned by each registry's terminal-entry cap (see
            // `MAX_RETAINED_TERMINAL_AGENTS` / `MAX_RETAINED_TERMINAL_SHELLS`
            // / `MAX_RETAINED_TERMINAL_MONITORS`).
            const isActive = (entry) => entry.status === 'running' || entry.status === 'paused';
            const merged = [
                ...agentEntries,
                ...shellEntries,
                ...monitorEntries,
                ...dreamEntries,
            ].sort((a, b) => {
                const aActive = isActive(a);
                const bActive = isActive(b);
                if (aActive !== bActive)
                    return aActive ? -1 : 1;
                if (aActive)
                    return b.startTime - a.startTime;
                // Terminal bucket: fall back to startTime when an entry has no
                // endTime yet (defensive — the registries stamp endTime on
                // every running → terminal transition, so this only matters
                // for synthetic / partially-restored entries).
                return (b.endTime ?? b.startTime) - (a.endTime ?? a.startTime);
            });
            // Cache the dream signature derived from the freshly-built
            // entries — the memory listener uses this to skip redundant
            // setEntries calls when an extract notify fires (extract has no
            // dialog surface, so the merged result is identical). Computed
            // from the same `allDreams` snapshot used to build dreamEntries
            // so the gate value can never desync from what's on screen.
            lastDreamSig = computeDreamSig(allDreams);
            setEntries(merged);
        };
        // Wrap registry callbacks in a thunk so React's setStatusChange
        // signature (no-arg) doesn't accidentally pass an entry into
        // refresh's `dreamSnapshot` parameter.
        const refreshFromRegistry = () => refresh();
        refresh();
        agentRegistry.setStatusChangeCallback(refreshFromRegistry);
        shellRegistry.setStatusChangeCallback(refreshFromRegistry);
        monitorRegistry.setStatusChangeCallback(refreshFromRegistry);
        // Memory listener fires only on dream-task transitions —
        // `subscribe({ taskType: 'dream' })` skips the per-extract notify
        // entirely so we don't pay the per-UserQuery O(n) signature cost
        // for transitions we have no surface for. The dream-content
        // signature dedup remains as a second-line guard against the rare
        // case where dream metadata is updated without observable changes
        // to the dialog (e.g. a future progressText-only patch on the
        // same status). The fetched snapshot is forwarded to refresh so
        // both the gate and the rendered dreamEntries come from one read.
        const memoryListener = () => {
            const dreams = memoryManager.listTasksByType('dream', projectRoot);
            const sig = computeDreamSig(dreams);
            if (sig === lastDreamSig)
                return;
            refresh(dreams);
        };
        const unsubscribeMemory = memoryManager.subscribe(memoryListener, {
            taskType: 'dream',
        });
        return () => {
            agentRegistry.setStatusChangeCallback(undefined);
            shellRegistry.setStatusChangeCallback(undefined);
            monitorRegistry.setStatusChangeCallback(undefined);
            unsubscribeMemory();
        };
    }, [config]);
    return { entries };
}
//# sourceMappingURL=useBackgroundTaskView.js.map