/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config, type GoalTerminalEvent } from '@qwen-code/qwen-code-core';
import { type HistoryItem, type HistoryItemGoalStatus } from '../types.js';
/**
 * Finds the most recent `goal_status` history item. Returns the active
 * condition when the latest goal event is non-terminal (`set` or `checking`),
 * or `null` if the last goal_status was terminal/cancelled
 * (achieved / failed / cleared / aborted) or none exists.
 */
export declare function findGoalToRestore(history: HistoryItem[]): string | null;
/**
 * Finds the most recent terminal (achieved / failed / aborted) goal_status item in
 * the transcript. Sentinel-style entries (`set`, `cleared`, `checking`) are
 * SKIPPED — `/goal clear` after an achievement is intentionally a no-op on
 * this scan, matching Claude Code's `yjK` behavior (`if (!K.met || K.sentinel)
 * continue;`). Used on resume to repopulate the in-memory "last completed
 * goal" cache so empty `/goal` after a reload still shows the summary card.
 */
export declare function findLastTerminalGoal(history: HistoryItem[]): GoalTerminalEvent | null;
type GoalStatusItem = Omit<HistoryItemGoalStatus, 'id'>;
type AddGoalStatusItem = (item: GoalStatusItem, timestamp: number) => void;
export declare function goalTerminalEventToHistoryItem(event: GoalTerminalEvent): GoalStatusItem;
export declare function recordGoalStatusItem(config: Config, item: GoalStatusItem, rawCommand?: string): void;
export declare function installGoalTerminalObserver(args: {
    sessionId: string;
    config: Config;
    addItem: AddGoalStatusItem;
}): void;
/**
 * On session resume, restores the active /goal hook if the transcript ended
 * with an unsatisfied goal. Idempotent — safe to call on a fresh session.
 *
 * Re-runs the same trust/policy gates as `/goal`; if a gate now fails, we
 * silently skip restoration rather than re-register a goal the user can no
 * longer cancel.
 */
export declare function restoreGoalFromHistory(history: HistoryItem[], config: Config, addItem?: AddGoalStatusItem): {
    restored: true;
    condition: string;
} | {
    restored: false;
};
export {};
