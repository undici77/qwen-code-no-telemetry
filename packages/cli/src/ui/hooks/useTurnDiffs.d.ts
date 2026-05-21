/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type FileHistoryService, type TurnDiff } from '@qwen-code/qwen-code-core';
import type { HistoryItem } from '../types.js';
export interface TurnDiffEntry {
    /** 1-based index displayed to the user (T1 = oldest). */
    turnIndex: number;
    /** Trimmed preview of the original prompt, for the source tab label. */
    promptPreview: string;
    /** Full diff payload from FileHistoryService. */
    diff: TurnDiff;
}
/**
 * Loads per-turn diffs for every user turn that has a tracked `promptId`.
 *
 * Output is ordered **most recent first** to match how users mentally scan
 * "what just happened" — the source picker in the dialog mirrors that.
 *
 * Turns that:
 *   - have no `promptId` (slash commands, BTW prompts, pre-checkpointing
 *     legacy turns), or
 *   - have a `promptId` but no matching snapshot (e.g. compressed-out turns
 *     where the snapshot survives but the user message was rebuilt without
 *     a `promptId`), or
 *   - produced no file changes at all
 * are filtered out: showing an empty "T7" entry is just noise.
 */
export declare function useTurnDiffs(history: HistoryItem[], fileHistoryService: FileHistoryService | undefined, enabled: boolean): {
    turns: TurnDiffEntry[];
    loading: boolean;
};
