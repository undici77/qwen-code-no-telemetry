/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Unified session picker hook for both dialog and standalone modes.
 *
 * IMPORTANT:
 * - Uses KeypressContext (`useKeypress`) so it behaves correctly inside the main app.
 * - Standalone mode should wrap the picker in `<KeypressProvider>` when rendered
 *   outside the main app.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { filterSessions, SESSION_PAGE_SIZE, } from '../utils/sessionPickerUtils.js';
import { useKeypress } from './useKeypress.js';
import { isPrintableSearchChar, useSessionSearchInput, } from './useSessionSearchInput.js';
export function useSessionPicker({ sessionService, currentBranch, onSelect, onCancel, maxVisibleItems, centerSelection = false, initialSessions, isActive = true, enablePreview = false, enableMultiSelect = false, onConfirmMulti, disabledIds, }) {
    // Both modes bind Space — they cannot coexist without a different chord.
    // Fail loudly so a future caller doesn't silently lose preview when they
    // turn on multi-select (or vice-versa).
    if (enableMultiSelect && enablePreview) {
        throw new Error('useSessionPicker: enableMultiSelect and enablePreview both bind Space; pick one or wire a different chord.');
    }
    // Without onConfirmMulti the Enter handler skips the multi-select branch
    // and silently falls through to single-select on the cursor row — Space
    // still toggles checkboxes and the footer reads "N selected", so the
    // user thinks N items will be deleted but only 1 is. Refuse the config.
    if (enableMultiSelect && !onConfirmMulti) {
        throw new Error('useSessionPicker: enableMultiSelect requires onConfirmMulti.');
    }
    const hasInitialSessions = initialSessions !== undefined;
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [sessionState, setSessionState] = useState(hasInitialSessions
        ? { sessions: initialSessions, hasMore: false, nextCursor: undefined }
        : { sessions: [], hasMore: true, nextCursor: undefined });
    const [filterByBranch, setFilterByBranch] = useState(false);
    const [isLoading, setIsLoading] = useState(!hasInitialSessions);
    // For follow mode (non-centered)
    const [followScrollOffset, setFollowScrollOffset] = useState(0);
    // Picker mode state
    const [viewMode, setViewMode] = useState('list');
    const [previewSessionId, setPreviewSessionId] = useState(null);
    // Multi-select state. Empty until the user actively toggles Space; an
    // empty set means "no multi-selection in progress" and the picker keeps
    // its single-select semantics on Enter.
    const [checkedIds, setCheckedIds] = useState(() => new Set());
    const disabledIdSet = useMemo(() => new Set(disabledIds ?? []), [disabledIds]);
    const toggleChecked = useCallback((sessionId) => {
        if (disabledIdSet.has(sessionId))
            return;
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(sessionId)) {
                next.delete(sessionId);
            }
            else {
                next.add(sessionId);
            }
            return next;
        });
    }, [disabledIdSet]);
    const exitPreview = useCallback(() => {
        setViewMode('list');
        setPreviewSessionId(null);
    }, []);
    // Search-mode editor — owns the query buffer and handles the
    // edit-keys (printable chars, Backspace/Delete, Ctrl+U/L, Esc).
    // The outer hook below dispatches keys to it whenever
    // `viewMode === 'search'`.
    const onExitToList = useCallback(() => {
        setViewMode('list');
    }, []);
    const { searchQuery, setSearchQuery, handleSearchKey } = useSessionSearchInput({ onExitToList });
    const isLoadingMoreRef = useRef(false);
    const filteredSessions = useMemo(() => filterSessions(sessionState.sessions, filterByBranch, currentBranch, searchQuery), [sessionState.sessions, filterByBranch, currentBranch, searchQuery]);
    const scrollOffset = useMemo(() => {
        if (centerSelection) {
            if (filteredSessions.length <= maxVisibleItems) {
                return 0;
            }
            const halfVisible = Math.floor(maxVisibleItems / 2);
            let offset = selectedIndex - halfVisible;
            offset = Math.max(0, offset);
            offset = Math.min(filteredSessions.length - maxVisibleItems, offset);
            return offset;
        }
        return followScrollOffset;
    }, [
        centerSelection,
        filteredSessions.length,
        followScrollOffset,
        maxVisibleItems,
        selectedIndex,
    ]);
    const visibleSessions = useMemo(() => filteredSessions.slice(scrollOffset, scrollOffset + maxVisibleItems), [filteredSessions, maxVisibleItems, scrollOffset]);
    const showScrollUp = scrollOffset > 0;
    const showScrollDown = scrollOffset + maxVisibleItems < filteredSessions.length;
    // Initial load — skip when pre-filtered sessions are provided
    useEffect(() => {
        if (!sessionService || hasInitialSessions) {
            return;
        }
        const loadInitialSessions = async () => {
            try {
                const result = await sessionService.listSessions({
                    size: SESSION_PAGE_SIZE,
                });
                setSessionState({
                    sessions: result.items,
                    hasMore: result.hasMore,
                    nextCursor: result.nextCursor,
                });
            }
            finally {
                setIsLoading(false);
            }
        };
        void loadInitialSessions();
    }, [sessionService, hasInitialSessions]);
    const loadMoreSessions = useCallback(async () => {
        if (!sessionService || !sessionState.hasMore || isLoadingMoreRef.current) {
            return;
        }
        isLoadingMoreRef.current = true;
        try {
            const result = await sessionService.listSessions({
                size: SESSION_PAGE_SIZE,
                cursor: sessionState.nextCursor,
            });
            setSessionState((prev) => ({
                sessions: [...prev.sessions, ...result.items],
                hasMore: result.hasMore && result.nextCursor !== undefined,
                nextCursor: result.nextCursor,
            }));
        }
        finally {
            isLoadingMoreRef.current = false;
        }
    }, [sessionService, sessionState.hasMore, sessionState.nextCursor]);
    // Reset selection when any filter changes (branch toggle or text query).
    useEffect(() => {
        setSelectedIndex(0);
        setFollowScrollOffset(0);
    }, [filterByBranch, searchQuery]);
    // Ensure selectedIndex is valid when filtered sessions change
    useEffect(() => {
        if (selectedIndex >= filteredSessions.length &&
            filteredSessions.length > 0) {
            setSelectedIndex(filteredSessions.length - 1);
        }
    }, [filteredSessions.length, selectedIndex]);
    // Auto-load more when centered mode hits the sentinel or list is empty.
    useEffect(() => {
        if (isLoading ||
            !sessionState.hasMore ||
            isLoadingMoreRef.current ||
            !centerSelection) {
            return;
        }
        const sentinelVisible = scrollOffset + maxVisibleItems >= filteredSessions.length;
        const shouldLoadMore = filteredSessions.length === 0 || sentinelVisible;
        if (shouldLoadMore) {
            void loadMoreSessions();
        }
    }, [
        centerSelection,
        filteredSessions.length,
        isLoading,
        loadMoreSessions,
        maxVisibleItems,
        scrollOffset,
        sessionState.hasMore,
    ]);
    const moveSelection = useCallback((delta) => {
        // Both directions need the same empty-list guard. Without it, the
        // -1 branch coasts on `Math.max(0, 0-1) === 0` (no crash), but the
        // asymmetry was a tell that the empty case wasn't being thought
        // about — share the early-return so a future tweak in either
        // branch can't drift past length 0.
        if (filteredSessions.length === 0)
            return;
        if (delta === -1) {
            setSelectedIndex((prev) => {
                const newIndex = Math.max(0, prev - 1);
                if (!centerSelection && newIndex < followScrollOffset) {
                    setFollowScrollOffset(newIndex);
                }
                return newIndex;
            });
            return;
        }
        setSelectedIndex((prev) => {
            const newIndex = Math.min(filteredSessions.length - 1, prev + 1);
            if (!centerSelection &&
                newIndex >= followScrollOffset + maxVisibleItems) {
                setFollowScrollOffset(newIndex - maxVisibleItems + 1);
            }
            if (!centerSelection && newIndex >= filteredSessions.length - 3) {
                void loadMoreSessions();
            }
            return newIndex;
        });
    }, [
        centerSelection,
        filteredSessions.length,
        followScrollOffset,
        loadMoreSessions,
        maxVisibleItems,
    ]);
    useKeypress((key) => {
        // Preview mode is gated by the `isActive` option below, so this
        // callback only runs in list/search modes — no inline guard
        // needed.
        const { name, sequence, ctrl } = key;
        if (ctrl && name === 'c') {
            onCancel();
            return;
        }
        if (name === 'return') {
            if (viewMode === 'search') {
                if (filteredSessions.length === 0) {
                    // Nothing to commit to — keep editing.
                    return;
                }
                setViewMode('list');
                return;
            }
            if (enableMultiSelect && checkedIds.size > 0 && onConfirmMulti) {
                // Commit *every* checked id (minus disabled), not just the
                // currently-filtered ones. If the user checked A-E and then
                // typed a search matching only C-E, intersecting with the
                // visible set would silently drop A and B — a partial-delete
                // the user never asked for. Filter is a navigation aid; the
                // commit set is whatever the user explicitly checked.
                //
                // Order by the full session list so the receiver can present
                // "Deleted N sessions" feedback in display order, even for
                // items that were filtered out at commit time.
                const orderedIds = sessionState.sessions
                    .map((s) => s.sessionId)
                    .filter((id) => checkedIds.has(id) && !disabledIdSet.has(id));
                if (orderedIds.length > 0) {
                    onConfirmMulti(orderedIds);
                    return;
                }
                // Commit set ended up empty — every checked id is disabled.
                // Don't fall through to single-select on the cursor row, that
                // would silently delete a different session than the one the
                // footer's "N selected" hint promised.
                return;
            }
            const session = filteredSessions[selectedIndex];
            // Disabled rows render dimmed with a "cannot delete" hint; honor
            // that here so a stray Enter on the active session doesn't close
            // the dialog and leave the receiver to bounce back with an error.
            if (session && !disabledIdSet.has(session.sessionId)) {
                onSelect(session.sessionId);
            }
            return;
        }
        // Arrow keys are mode-aware (cross between search and list).
        // Hoist Ctrl+P/Ctrl+N alongside as their readline-style equivalents so
        // they escape the search input the same way arrows do. Bare `k`/`j`
        // remain list-only further below (they would otherwise seed the search
        // query with the letter and the design intent — see the comment near
        // the `name === 'k'` branch — is that vim-style keys do not cross
        // modes).
        const isNavUp = name === 'up' || (ctrl && name === 'p');
        const isNavDown = name === 'down' || (ctrl && name === 'n');
        if (isNavUp || isNavDown) {
            const delta = isNavUp ? -1 : +1;
            const inSearch = viewMode === 'search';
            if (inSearch) {
                if (filteredSessions.length === 0)
                    return;
                setViewMode('list');
                return;
            }
            if (delta === -1 &&
                filteredSessions.length > 0 &&
                selectedIndex === 0) {
                setViewMode('search');
                return;
            }
            moveSelection(delta);
            return;
        }
        // While the search input is focused it owns the keyboard
        // exclusively: anything `handleSearchKey` doesn't claim is
        // intentionally swallowed (e.g. Ctrl+B, '/' typed as a query
        // char, etc.). The mode-independent shortcuts above (Ctrl+C,
        // Enter, ↑↓) are the only escape hatches. To make a list-mode
        // shortcut work in search, hoist it above this delegate the
        // way Enter / ↑↓ already are.
        if (viewMode === 'search') {
            handleSearchKey(key);
            return;
        }
        // ── list mode ──
        if (name === 'escape') {
            if (searchQuery !== '') {
                setSearchQuery('');
            }
            else {
                onCancel();
            }
            return;
        }
        // `j`/`k` are list-mode navigation only — intentionally claimed
        // BEFORE the implicit-search-seed branch below, so typing `j`
        // never seeds the query with "j". vim users stay in list mode;
        // anyone wanting to search for a literal "j..." can press `/`
        // first to enter search explicitly.
        if (name === 'k') {
            moveSelection(-1);
            return;
        }
        if (name === 'j') {
            moveSelection(+1);
            return;
        }
        if (name === 'space') {
            // The constructor invariant ensures at most one of these is on.
            if (enableMultiSelect) {
                const session = filteredSessions[selectedIndex];
                if (session) {
                    toggleChecked(session.sessionId);
                }
                return;
            }
            if (enablePreview) {
                const session = filteredSessions[selectedIndex];
                if (session) {
                    setPreviewSessionId(session.sessionId);
                    setViewMode('preview');
                }
                return;
            }
        }
        if (ctrl && (name === 'b' || name === 'B')) {
            if (currentBranch) {
                setFilterByBranch((prev) => !prev);
            }
            return;
        }
        if (sequence === '/') {
            setViewMode('search');
            return;
        }
        if (isPrintableSearchChar(key)) {
            // Skip Space when it would seed a leading-whitespace query —
            // hits this branch only when enablePreview=false (otherwise
            // the Space-preview shortcut above already returned).
            if (sequence === ' ') {
                return;
            }
            setViewMode('search');
            setSearchQuery((q) => q + sequence);
        }
    }, { isActive: isActive && viewMode !== 'preview' });
    return {
        selectedIndex,
        sessionState,
        filteredSessions,
        filterByBranch,
        isLoading,
        scrollOffset,
        visibleSessions,
        showScrollUp,
        showScrollDown,
        loadMoreSessions,
        viewMode,
        previewSessionId,
        exitPreview,
        checkedIds,
        toggleChecked,
        disabledIdSet,
        searchQuery,
        isSearchActive: viewMode === 'search',
    };
}
//# sourceMappingURL=useSessionPicker.js.map