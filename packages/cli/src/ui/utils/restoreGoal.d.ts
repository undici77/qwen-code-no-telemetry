/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ChatRecord, type Config, type GoalTerminalEvent } from '@qwen-code/qwen-code-core';
import { type HistoryItemGoalStatus, type HistoryItemWithoutId } from '../types.js';
export interface RestorableGoal {
    condition: string;
    iterations: number;
    /** Absent when no card of this goal's run carried one. */
    setAt?: number;
}
/**
 * Finds the most recent `goal_status` history item. Returns the active
 * condition plus the iteration count to resume from when the latest goal event
 * is non-terminal (`set` or `checking`), or `null` if the last goal_status was
 * terminal/cancelled (achieved / failed / cleared / aborted) or none exists.
 *
 * The iteration count is carried so the MAX_GOAL_ITERATIONS safety cap survives
 * resume instead of resetting to zero. `checking` items persist the running
 * count (see useGeminiStream's continuation handler); `set` items predate any
 * iteration, so they restore at 0.
 *
 * `setAt` is carried so elapsed time keeps measuring from the original `/goal`.
 * The newest card is not necessarily the one that has it — only `set` cards are
 * written with a `setAt` — so we keep scanning back through this same run's
 * cards for it, stopping at the terminal card that ends the previous run.
 */
export declare function findGoalToRestore(history: readonly HistoryItemWithoutId[]): RestorableGoal | null;
/**
 * Finds the most recent terminal (achieved / failed / aborted) goal_status item in
 * the transcript. Sentinel-style entries (`set`, `cleared`, `checking`) are
 * SKIPPED — `/goal clear` after an achievement is intentionally a no-op on
 * this scan, matching Claude Code's `yjK` behavior (`if (!K.met || K.sentinel)
 * continue;`). Used on resume to repopulate the in-memory "last completed
 * goal" cache so empty `/goal` after a reload still shows the summary card.
 */
export declare function findLastTerminalGoal(history: readonly HistoryItemWithoutId[]): GoalTerminalEvent | null;
export type GoalStatusItem = Omit<HistoryItemGoalStatus, 'id'>;
type AddGoalStatusItem = (item: GoalStatusItem, timestamp: number) => void;
/**
 * Narrows one untrusted `outputHistoryItems` entry before any field is read.
 * A transcript is a file: an entry may be any JSON value, and only a plain
 * object is safely indexable.
 */
export declare function isTranscriptItemRecord(item: unknown): item is Record<string, unknown>;
/**
 * Rebuilds a goal card from one persisted `outputHistoryItems` entry, or
 * returns null when the entry is not a well-formed goal card. Transcripts are
 * files on disk: an entry may be any JSON value at all — including `null` or an
 * array — so the shape is checked before any field is read, and then every
 * field is re-validated rather than cast.
 */
export declare function parseGoalStatusItem(item: unknown): GoalStatusItem | null;
/**
 * Extracts the goal cards a transcript persisted inside its `system` /
 * `slash_command` records, oldest first. This is the daemon-side counterpart to
 * the TUI's in-memory `HistoryItem[]`: on the ACP path no `HistoryItem[]` ever
 * exists, so `findGoalToRestore` / `findLastTerminalGoal` are fed from here.
 */
export declare function collectGoalStatusItemsFromRecords(records: readonly ChatRecord[]): GoalStatusItem[];
export declare function goalTerminalEventToHistoryItem(event: GoalTerminalEvent): GoalStatusItem;
export declare function recordGoalStatusItem(config: Config, item: GoalStatusItem, rawCommand?: string): void;
export declare function installGoalTerminalObserver(args: {
    sessionId: string;
    config: Config;
    addItem: AddGoalStatusItem;
}): void;
/**
 * Why a transcript's active goal could not be put back under a live Stop hook.
 * `condition-invalid` covers a transcript that no longer describes a goal
 * `/goal` itself would accept.
 */
export type GoalRestoreBlockedReason = 'untrusted-folder' | 'hooks-disabled' | 'no-hook-system' | 'condition-invalid';
/**
 * The environment half of `/goal`'s gates, as a pure function of `config`.
 *
 * Split out so the history replay can ask the question *before* restore runs:
 * a client derives "there is an active goal" from the newest replayed goal
 * card, so a card that is about to be refused must not be replayed as active.
 */
export declare function goalRestoreBlockedBy(config: Config): Exclude<GoalRestoreBlockedReason, 'condition-invalid'> | null;
/**
 * Mirrors the gates `/goal` applies to a condition at set time.
 *
 * There is deliberately no length cap: #6665 removed the one `/goal` had, so
 * capping here would silently destroy a long goal the user legitimately set —
 * refused on restore, and dropped from the replay so they never see why.
 */
export declare function goalConditionBlockedBy(condition: string): 'condition-invalid' | null;
export type RestoreGoalResult = {
    restored: true;
    condition: string;
} | {
    restored: false;
    blockedBy?: GoalRestoreBlockedReason;
};
/**
 * On session resume, restores the active /goal hook if the transcript ended
 * with an unsatisfied goal. Idempotent — safe to call on a fresh session.
 *
 * Re-runs the same trust/policy/length gates as `/goal`; if a gate now fails,
 * we skip restoration rather than re-register a goal the user can no longer
 * cancel. That case reports `blockedBy`, which callers must not confuse with
 * "the transcript had no goal": the transcript still shows one as active, so
 * something has to say otherwise.
 *
 * Note that every `{ restored: false }` path unregisters, which clears the
 * session's goal-terminal observer as a side effect. ACP callers reinstall it.
 */
export declare function restoreGoalFromHistory(history: readonly HistoryItemWithoutId[], config: Config, addItem?: AddGoalStatusItem): RestoreGoalResult;
export {};
