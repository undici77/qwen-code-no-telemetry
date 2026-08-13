import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { isToday, isYesterday, format, startOfDay } from "date-fns";
import { searchLog } from "@/lib/logger";
import { parseLabelEntry } from "@craft-agent/shared/labels";
import { fuzzyScore } from "@craft-agent/shared/search";
import { getSessionTitle, getSessionStatus } from "@/utils/session";
import { compareSessionsByFlaggedThenActivityDesc, getSessionOrderTime } from "@/atoms/sessions";
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INITIAL_DISPLAY_LIMIT = 50;
const BATCH_SIZE = 50;
const MAX_SEARCH_RESULTS = 100;
// ---------------------------------------------------------------------------
// Pure helpers (moved from SessionList)
// ---------------------------------------------------------------------------
function formatDateHeader(date) {
    if (isToday(date))
        return "Today";
    if (isYesterday(date))
        return "Yesterday";
    return format(date, "MMM d");
}
function groupSessionsByDate(sessions) {
    const groups = new Map();
    for (const session of sessions) {
        const timestamp = getSessionOrderTime(session);
        const date = startOfDay(new Date(timestamp));
        const key = date.toISOString();
        if (!groups.has(key)) {
            groups.set(key, { date, sessions: [] });
        }
        groups.get(key).sessions.push(session);
    }
    return Array.from(groups.values())
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(group => ({
        ...group,
        label: formatDateHeader(group.date),
    }));
}
function getCollapseGroupKey(item, groupingMode) {
    return groupingMode === 'status'
        ? `status-${getSessionStatus(item)}`
        : startOfDay(new Date(getSessionOrderTime(item))).toISOString();
}
export function computeCollapsedPagination(items, displayLimit, collapsedGroups, groupingMode) {
    // Fast path: no collapse state → original slice
    if (groupingMode === 'none' || !collapsedGroups || collapsedGroups.size === 0) {
        return {
            paginatedItems: items.slice(0, displayLimit),
            hasMore: displayLimit < items.length,
            collapsedGroupsMeta: [],
        };
    }
    const groupKeysInView = new Set(items.map(item => getCollapseGroupKey(item, groupingMode)));
    // Safety guard: don't allow collapse state to hide the entire list when only one
    // group exists in the current filtered view (there would be no meaningful collapse UX).
    if (groupKeysInView.size <= 1) {
        return {
            paginatedItems: items.slice(0, displayLimit),
            hasMore: displayLimit < items.length,
            collapsedGroupsMeta: [],
        };
    }
    const effectiveCollapsedKeys = new Set(Array.from(collapsedGroups).filter(key => groupKeysInView.has(key)));
    if (effectiveCollapsedKeys.size === 0) {
        return {
            paginatedItems: items.slice(0, displayLimit),
            hasMore: displayLimit < items.length,
            collapsedGroupsMeta: [],
        };
    }
    const expandedItems = [];
    const collapsedCounts = new Map();
    for (const item of items) {
        const groupKey = getCollapseGroupKey(item, groupingMode);
        if (effectiveCollapsedKeys.has(groupKey)) {
            collapsedCounts.set(groupKey, (collapsedCounts.get(groupKey) || 0) + 1);
        }
        else {
            expandedItems.push(item);
        }
    }
    const meta = Array.from(collapsedCounts.entries()).map(([key, count]) => ({ key, count }));
    return {
        paginatedItems: expandedItems.slice(0, displayLimit),
        hasMore: displayLimit < expandedItems.length,
        collapsedGroupsMeta: meta,
    };
}
export function sessionMatchesCurrentFilter(session, currentFilter, options = {}) {
    const { evaluateViews, statusFilter, labelFilterMap } = options;
    const passesStatusFilter = () => {
        if (!statusFilter || statusFilter.size === 0)
            return true;
        const sessionState = (session.sessionStatus || 'todo');
        let hasIncludes = false;
        let matchesInclude = false;
        for (const [stateId, mode] of statusFilter) {
            if (mode === 'exclude' && sessionState === stateId)
                return false;
            if (mode === 'include') {
                hasIncludes = true;
                if (sessionState === stateId)
                    matchesInclude = true;
            }
        }
        return !hasIncludes || matchesInclude;
    };
    const passesLabelFilter = () => {
        if (!labelFilterMap || labelFilterMap.size === 0)
            return true;
        const sessionLabelIds = session.labels?.map(l => parseLabelEntry(l).id) || [];
        let hasIncludes = false;
        let matchesInclude = false;
        for (const [labelId, mode] of labelFilterMap) {
            if (mode === 'exclude' && sessionLabelIds.includes(labelId))
                return false;
            if (mode === 'include') {
                hasIncludes = true;
                if (sessionLabelIds.includes(labelId))
                    matchesInclude = true;
            }
        }
        return !hasIncludes || matchesInclude;
    };
    if (!passesStatusFilter() || !passesLabelFilter())
        return false;
    if (!currentFilter)
        return true;
    switch (currentFilter.kind) {
        case 'allSessions':
            return session.isArchived !== true;
        case 'flagged':
            return session.isFlagged === true && session.isArchived !== true;
        case 'archived':
            return session.isArchived === true;
        case 'state':
            return (session.sessionStatus || 'todo') === currentFilter.stateId && session.isArchived !== true;
        case 'label': {
            if (!session.labels?.length)
                return false;
            if (session.isArchived === true)
                return false;
            if (currentFilter.labelId === '__all__')
                return true;
            const labelIds = session.labels.map(l => parseLabelEntry(l).id);
            return labelIds.includes(currentFilter.labelId);
        }
        case 'view':
            if (session.isArchived === true)
                return false;
            if (!evaluateViews)
                return true;
            const matched = evaluateViews(session);
            if (currentFilter.viewId === '__all__')
                return matched.length > 0;
            return matched.some(v => v.id === currentFilter.viewId);
        default:
            const _exhaustive = currentFilter;
            return true;
    }
}
// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSessionSearch({ items, searchActive, searchQuery, workspaceId, currentFilter, evaluateViews, statusFilter, labelFilterMap, collapsedGroups, groupingMode, scrollViewportRef, }) {
    const [contentSearchResults, setContentSearchResults] = useState(new Map());
    const [isSearchingContent, setIsSearchingContent] = useState(false);
    const [isSearchUnavailable, setIsSearchUnavailable] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);
    const searchInputRef = useRef(null);
    // Search mode is active when search is open AND query has 2+ characters
    const isSearchMode = searchActive && searchQuery.length >= 2;
    const highlightQuery = isSearchMode ? searchQuery : undefined;
    // --- Content search (ripgrep IPC with debounce + cancellation) ---
    useEffect(() => {
        if (!workspaceId || !isSearchMode) {
            setContentSearchResults(new Map());
            return;
        }
        const searchId = Date.now().toString(36);
        searchLog.info('query:change', { searchId, query: searchQuery });
        let cancelled = false;
        setIsSearchingContent(true);
        setIsSearchUnavailable(false);
        const timer = setTimeout(async () => {
            try {
                searchLog.info('ipc:call', { searchId });
                const ipcStart = performance.now();
                const results = await window.electronAPI.searchSessionContent(workspaceId, searchQuery, searchId);
                if (cancelled)
                    return;
                searchLog.info('ipc:received', {
                    searchId,
                    durationMs: Math.round(performance.now() - ipcStart),
                    resultCount: results.length,
                });
                const resultMap = new Map();
                for (const result of results) {
                    resultMap.set(result.sessionId, {
                        matchCount: result.matchCount,
                        snippet: result.matches[0]?.snippet || '',
                    });
                }
                setContentSearchResults(resultMap);
                requestAnimationFrame(() => {
                    searchLog.info('render:complete', { searchId, sessionsDisplayed: resultMap.size });
                });
            }
            catch (error) {
                if (cancelled)
                    return;
                // Detect search unavailable (ripgrep not found) vs transient errors
                const message = error instanceof Error ? error.message : String(error);
                if (message.includes('SearchUnavailableError') || message.includes('ripgrep')) {
                    console.warn('[useSessionSearch] Search unavailable:', message);
                    setIsSearchUnavailable(true);
                }
                else {
                    console.error('[useSessionSearch] Content search error:', error);
                }
                setContentSearchResults(new Map());
            }
            finally {
                if (!cancelled) {
                    setIsSearchingContent(false);
                }
            }
        }, 100);
        return () => {
            cancelled = true;
            clearTimeout(timer);
            setIsSearchingContent(false);
        };
    }, [workspaceId, isSearchMode, searchQuery]);
    // --- Focus search input when search activates ---
    useEffect(() => {
        if (searchActive) {
            searchInputRef.current?.focus();
        }
    }, [searchActive]);
    // --- Data pipeline ---
    // Filter out hidden sessions before any processing
    const visibleItems = useMemo(() => items.filter(item => !item.hidden), [items]);
    // Sort by flagged display priority first, then most recent activity.
    const sortedItems = useMemo(() => [...visibleItems].sort(compareSessionsByFlaggedThenActivityDesc), [visibleItems]);
    // Filter items by search query or current filter
    const searchFilteredItems = useMemo(() => {
        if (!isSearchMode) {
            return sortedItems.filter(item => sessionMatchesCurrentFilter(item, currentFilter, { evaluateViews, statusFilter, labelFilterMap }));
        }
        return sortedItems
            .filter(item => contentSearchResults.has(item.id))
            .sort((a, b) => {
            const aScore = fuzzyScore(getSessionTitle(a), searchQuery);
            const bScore = fuzzyScore(getSessionTitle(b), searchQuery);
            if (aScore > 0 && bScore === 0)
                return -1;
            if (aScore === 0 && bScore > 0)
                return 1;
            if (aScore !== bScore)
                return bScore - aScore;
            const countA = contentSearchResults.get(a.id)?.matchCount || 0;
            const countB = contentSearchResults.get(b.id)?.matchCount || 0;
            return countB - countA;
        });
    }, [sortedItems, isSearchMode, searchQuery, contentSearchResults, currentFilter, evaluateViews, statusFilter, labelFilterMap]);
    // Split search results: matching current filter vs others
    const { matchingFilterItems, otherResultItems, exceededSearchLimit } = useMemo(() => {
        const hasActiveFilters = (currentFilter && currentFilter.kind !== 'allSessions') ||
            (statusFilter && statusFilter.size > 0) ||
            (labelFilterMap && labelFilterMap.size > 0);
        if (searchQuery.trim() && searchFilteredItems.length > 0) {
            searchLog.info('search:grouping', {
                searchQuery,
                currentFilterKind: currentFilter?.kind,
                currentFilterStateId: currentFilter?.kind === 'state' ? currentFilter.stateId : undefined,
                hasActiveFilters,
                statusFilterSize: statusFilter?.size ?? 0,
                labelFilterSize: labelFilterMap?.size ?? 0,
                itemCount: searchFilteredItems.length,
            });
        }
        const totalCount = searchFilteredItems.length;
        const exceeded = totalCount > MAX_SEARCH_RESULTS;
        if (!isSearchMode || !hasActiveFilters) {
            const limitedItems = searchFilteredItems.slice(0, MAX_SEARCH_RESULTS);
            return { matchingFilterItems: limitedItems, otherResultItems: [], exceededSearchLimit: exceeded };
        }
        const matching = [];
        const others = [];
        for (const item of searchFilteredItems) {
            if (matching.length + others.length >= MAX_SEARCH_RESULTS)
                break;
            const matches = sessionMatchesCurrentFilter(item, currentFilter, { evaluateViews, statusFilter, labelFilterMap });
            if (matches) {
                matching.push(item);
            }
            else {
                others.push(item);
            }
        }
        if (searchFilteredItems.length > 0) {
            searchLog.info('search:grouping:result', {
                matchingCount: matching.length,
                othersCount: others.length,
                exceeded,
            });
        }
        return { matchingFilterItems: matching, otherResultItems: others, exceededSearchLimit: exceeded };
    }, [searchFilteredItems, currentFilter, evaluateViews, isSearchMode, statusFilter, labelFilterMap, searchQuery]);
    // --- Pagination ---
    useEffect(() => {
        setDisplayLimit(INITIAL_DISPLAY_LIMIT);
    }, [searchQuery]);
    // Collapse-aware pagination: collapsed items are excluded entirely from
    // paginatedItems (and therefore flatItems / keyboard nav). Their counts are
    // returned as collapsedGroupsMeta so the renderer can show header-only groups.
    const { paginatedItems, hasMore, collapsedGroupsMeta } = useMemo(() => {
        return computeCollapsedPagination(searchFilteredItems, displayLimit, collapsedGroups, groupingMode);
    }, [searchFilteredItems, displayLimit, collapsedGroups, groupingMode]);
    const loadMore = useCallback(() => {
        setDisplayLimit(prev => Math.min(prev + BATCH_SIZE, searchFilteredItems.length));
    }, [searchFilteredItems.length]);
    // Scroll-based pagination: listen for scroll on the actual ScrollArea viewport
    // (IntersectionObserver with root=null doesn't detect scroll inside Radix ScrollArea)
    useEffect(() => {
        if (!hasMore)
            return;
        const viewport = scrollViewportRef?.current;
        if (!viewport)
            return;
        const check = () => {
            const { scrollTop, scrollHeight, clientHeight } = viewport;
            if (scrollHeight - scrollTop - clientHeight < 200) {
                loadMore();
            }
        };
        check(); // fill viewport on mount / after group expand
        viewport.addEventListener('scroll', check, { passive: true });
        return () => viewport.removeEventListener('scroll', check);
    }, [hasMore, loadMore, displayLimit, scrollViewportRef]);
    // --- Derived render data ---
    const dateGroups = useMemo(() => groupSessionsByDate(paginatedItems), [paginatedItems]);
    const flatItems = useMemo(() => {
        if (isSearchMode) {
            return [...matchingFilterItems, ...otherResultItems];
        }
        return dateGroups.flatMap(group => group.sessions);
    }, [isSearchMode, matchingFilterItems, otherResultItems, dateGroups]);
    const sessionIndexMap = useMemo(() => {
        const map = new Map();
        flatItems.forEach((item, index) => map.set(item.id, index));
        return map;
    }, [flatItems]);
    return {
        isSearchMode,
        highlightQuery,
        isSearchingContent,
        isSearchUnavailable,
        contentSearchResults,
        matchingFilterItems,
        otherResultItems,
        exceededSearchLimit,
        flatItems,
        dateGroups,
        sessionIndexMap,
        hasMore,
        collapsedGroupsMeta,
        searchInputRef,
    };
}
//# sourceMappingURL=useSessionSearch.js.map