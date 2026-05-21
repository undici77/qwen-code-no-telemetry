/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AgentTask, type Config, type TaskState } from '@qwen-code/qwen-code-core';
/**
 * @deprecated Use {@link AgentTask} from `@qwen-code/qwen-code-core`
 * directly. Kept as a one-release alias while UI consumers migrate.
 */
export type AgentDialogEntry = AgentTask;
/**
 * Dream-task adapter. MemoryManager owns its own task records
 * (MemoryTaskRecord) and intentionally lives outside the registry trio;
 * this view-model wraps the subset of fields the dialog needs and
 * narrows status to the four values that ever appear in the dialog
 * (skipped/pending records are filtered out at the source).
 */
export type DreamDialogEntry = {
    kind: 'dream';
    /** MemoryTaskRecord.id — used as React key + lookup. */
    dreamId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: number;
    /**
     * Wall-clock instant the record's `status` last changed. For
     * `completed` / `failed` this is when the dream actually finished;
     * for `cancelled` this is the moment `cancelTask` ran (NOT when
     * the fork agent finishes unwinding — that can lag by seconds for
     * agents mid-tool-call). The dialog renders elapsed from this
     * value, so a freshly-cancelled record snaps to "Stopped · Ns"
     * even while the underlying fork is still releasing the lock.
     */
    endTime?: number;
    progressText?: string;
    error?: string;
    /** Number of sessions the dream is reviewing — populated on schedule. */
    sessionCount?: number;
    /** Memory topic files written — populated on completion. */
    touchedTopics?: readonly string[];
    /**
     * Best-effort warnings populated by `runDream` when post-fork
     * housekeeping fails (gating-metadata write or consolidation-lock
     * release). The dream itself completed successfully — these are
     * informational so the user can explain why subsequent dreams may
     * be silently skipped as `'locked'` or why the scheduler gate
     * isn't seeing the most recent dream's timestamp.
     */
    lockReleaseError?: string;
    metadataWriteError?: string;
};
/**
 * A unified view-model entry the dialog/pill/context render against.
 * Discriminated by `kind`; per-kind fields are inlined verbatim so
 * renderer code can stay mechanical (`entry.kind === 'agent'` /
 * `'shell'` / `'monitor'` / `'dream'` guard, then access fields directly).
 *
 * The `agent`/`shell`/`monitor` arms are the core `TaskState` union
 * member — `kind` lives on the core entry, so the merge step here no
 * longer tags it. `dream` remains adapted from `MemoryManager` and is
 * unioned in here while the dream task placement is decided in PR 2.
 */
export type DialogEntry = TaskState | DreamDialogEntry;
export interface UseBackgroundTaskViewResult {
    entries: readonly DialogEntry[];
}
/** Stable id of an entry regardless of kind — used as React key + lookup. */
export declare function entryId(entry: DialogEntry): string;
export declare function useBackgroundTaskView(config: Config | null): UseBackgroundTaskViewResult;
