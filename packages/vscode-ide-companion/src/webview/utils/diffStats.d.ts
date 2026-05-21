/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Diff statistics calculation tool
 */
/**
 * Diff statistics
 */
export interface DiffStats {
    /** Number of added lines */
    added: number;
    /** Number of removed lines */
    removed: number;
    /** Number of changed lines (estimated value) */
    changed: number;
    /** Total number of changed lines */
    total: number;
}
/**
 * Calculate diff statistics between two texts
 *
 * Using a simple line comparison algorithm (avoiding heavy-weight diff libraries)
 * Algorithm explanation:
 * 1. Split text by lines
 * 2. Compare set differences of lines
 * 3. Estimate changed lines (lines that appear in both added and removed)
 *
 * @param oldText Old text content
 * @param newText New text content
 * @returns Diff statistics
 *
 * @example
 * ```typescript
 * const stats = calculateDiffStats(
 *   "line1\nline2\nline3",
 *   "line1\nline2-modified\nline4"
 * );
 * // { added: 2, removed: 2, changed: 1, total: 3 }
 * ```
 */
export declare function calculateDiffStats(oldText: string | null | undefined, newText: string | undefined): DiffStats;
/**
 * Format diff statistics as human-readable text
 *
 * @param stats Diff statistics
 * @returns Formatted text, e.g. "+5 -3 ~2"
 *
 * @example
 * ```typescript
 * formatDiffStats({ added: 5, removed: 3, changed: 2, total: 10 });
 * // "+5 -3 ~2"
 * ```
 */
export declare function formatDiffStats(stats: DiffStats): string;
/**
 * Format detailed diff statistics
 *
 * @param stats Diff statistics
 * @returns Detailed description text
 *
 * @example
 * ```typescript
 * formatDiffStatsDetailed({ added: 5, removed: 3, changed: 2, total: 10 });
 * // "+5 lines, -3 lines, ~2 lines"
 * ```
 */
export declare function formatDiffStatsDetailed(stats: DiffStats): string;
