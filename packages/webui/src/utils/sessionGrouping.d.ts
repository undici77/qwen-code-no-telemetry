/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Session grouping utilities
 * Functions for organizing sessions by date and formatting time ago
 */
/**
 * Session group structure
 */
export interface SessionGroup {
    /** Group label (e.g., "Today", "Yesterday") */
    label: string;
    /** Sessions in this group */
    sessions: Array<Record<string, unknown>>;
}
/**
 * Group sessions by date
 *
 * Categories:
 * - Today: Sessions from today
 * - Yesterday: Sessions from yesterday
 * - This Week: Sessions from the last 7 days (excluding today/yesterday)
 * - Older: Sessions older than a week
 *
 * @param sessions - Array of session objects (must have lastUpdated or startTime)
 * @returns Array of grouped sessions, only includes non-empty groups
 *
 * @example
 * ```ts
 * const grouped = groupSessionsByDate(sessions);
 * // [{ label: 'Today', sessions: [...] }, { label: 'Older', sessions: [...] }]
 * ```
 */
export declare const groupSessionsByDate: (sessions: Array<Record<string, unknown>>) => SessionGroup[];
/**
 * Format timestamp as relative time string
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted relative time (e.g., "now", "5m", "2h", "Yesterday", "3d", or date)
 *
 * @example
 * ```ts
 * getTimeAgo(new Date().toISOString()) // "now"
 * getTimeAgo(thirtyMinutesAgo.toISOString()) // "30m"
 * getTimeAgo(twoHoursAgo.toISOString()) // "2h"
 * ```
 */
export declare const getTimeAgo: (timestamp: string) => string;
