/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionListItem, SessionService } from '@qwen-code/qwen-code-core';
import { type SessionState } from '../utils/sessionPickerUtils.js';
export interface UseSessionPickerOptions {
    sessionService: SessionService | null;
    currentBranch?: string;
    onSelect: (sessionId: string) => void;
    onCancel: () => void;
    maxVisibleItems: number;
    /**
     * If true, computes centered scroll offset (keeps selection near middle).
     * If false, uses follow mode (scrolls when selection reaches edge).
     */
    centerSelection?: boolean;
    /**
     * Pre-filtered sessions to display instead of loading from sessionService.
     * When provided, skips the initial listSessions() call and disables
     * pagination (load-more). Used by /resume <title> when multiple sessions
     * match the given title.
     */
    initialSessions?: SessionListItem[];
    /**
     * Enable/disable input handling.
     */
    isActive?: boolean;
    /**
     * Enable Space-to-preview. See SessionPickerProps.enablePreview for the
     * safety rationale (preview's Enter forwards to onSelect).
     */
    enablePreview?: boolean;
    /**
     * Enable multi-select mode. Space toggles selection on the cursor item,
     * Enter commits — invoking {@link onConfirmMulti} when one or more items
     * are checked, falling back to {@link onSelect} (single-select) otherwise.
     * Disabled by default.
     */
    enableMultiSelect?: boolean;
    /**
     * Receives the full set of checked session IDs when the user commits a
     * multi-selection. Required when {@link enableMultiSelect} is true.
     */
    onConfirmMulti?: (sessionIds: string[]) => void;
    /**
     * Session IDs that cannot be checked in multi-select mode (e.g. the
     * currently active session must not be deletable). They remain
     * navigable but Space is a no-op on them and they never appear in the
     * commit set.
     *
     * Only consulted when {@link enableMultiSelect} is true. In
     * single-select mode this option is silently inert because there is
     * no checkbox state to gate — the Space binding routes to preview (or
     * nothing) rather than to `toggleChecked`.
     */
    disabledIds?: readonly string[];
}
export interface UseSessionPickerResult {
    selectedIndex: number;
    sessionState: SessionState;
    filteredSessions: SessionListItem[];
    filterByBranch: boolean;
    isLoading: boolean;
    scrollOffset: number;
    visibleSessions: SessionListItem[];
    showScrollUp: boolean;
    showScrollDown: boolean;
    loadMoreSessions: () => Promise<void>;
    viewMode: 'list' | 'search' | 'preview';
    previewSessionId: string | null;
    exitPreview: () => void;
    /**
     * Set of session IDs the user has checked. Empty until the user toggles
     * Space on at least one item; consumers should treat empty as "no
     * multi-selection in progress" and fall back to single-select.
     */
    checkedIds: ReadonlySet<string>;
    /** Toggle the checked state for a session id (no-op when disabled). */
    toggleChecked: (sessionId: string) => void;
    /**
     * Memoized lookup for the `disabledIds` option. Exposed so render-side
     * consumers can ask "is this row disabled?" without rebuilding the set.
     */
    disabledIdSet: ReadonlySet<string>;
    /** Free-text filter applied on top of branch filter. */
    searchQuery: string;
    /**
     * True iff `viewMode === 'search'`. Convenience for UI that conditions
     * on "the user is currently typing a query".
     */
    isSearchActive: boolean;
}
export declare function useSessionPicker({ sessionService, currentBranch, onSelect, onCancel, maxVisibleItems, centerSelection, initialSessions, isActive, enablePreview, enableMultiSelect, onConfirmMulti, disabledIds, }: UseSessionPickerOptions): UseSessionPickerResult;
