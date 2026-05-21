/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionListItem } from '@qwen-code/qwen-code-core';
/**
 * State for managing loaded sessions in the session picker.
 */
export interface SessionState {
    sessions: SessionListItem[];
    hasMore: boolean;
    nextCursor?: number;
}
/**
 * Page size for loading sessions.
 */
export declare const SESSION_PAGE_SIZE = 20;
/**
 * Truncates text to fit within a given width, adding ellipsis if needed.
 */
export declare function truncateText(text: string, maxWidth: number): string;
/**
 * Filters sessions by branch and/or a free-text query.
 *
 * Branch filter and query filter compose (AND): when both are active, a
 * session must satisfy both. Query is matched case-insensitively against
 * customTitle, prompt, and gitBranch — branch is included in query matching
 * so users can type a branch name without first toggling branch-filter.
 */
export declare function filterSessions(sessions: SessionListItem[], filterByBranch: boolean, currentBranch?: string, query?: string): SessionListItem[];
/**
 * Formats message count for display with proper pluralization.
 */
export declare function formatMessageCount(count: number): string;
