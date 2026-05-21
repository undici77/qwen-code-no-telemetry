/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { HistoryItem, HistoryItemWithoutId } from '../types.js';
export interface UseAwaySummaryOptions {
    enabled: boolean;
    config: Config | null;
    isFocused: boolean;
    isIdle: boolean;
    addItem: (item: HistoryItemWithoutId, baseTimestamp: number) => number;
    /**
     * The current chat history. Read at fire time only (via a ref) to apply
     * the dedup gate; not added to the effect's deps so it doesn't re-fire
     * on every history change.
     */
    history: HistoryItem[];
    /**
     * Minutes the terminal must be blurred before an auto-recap fires on
     * the next focus-in. Falsy / non-positive values fall back to the
     * 5-minute default (matching Claude Code).
     */
    awayThresholdMinutes?: number;
}
/**
 * Generates and displays a 1-3 sentence "where you left off" recap when the
 * user returns to a terminal that has been blurred for ≥ AWAY_THRESHOLD_MS.
 *
 * Best-effort: silently no-ops on disabled, unavailable config, in-flight
 * turn, or any generation failure. The recap is debounced per blur cycle —
 * a single back-and-forth produces at most one recap.
 */
export declare function useAwaySummary(options: UseAwaySummaryOptions): void;
