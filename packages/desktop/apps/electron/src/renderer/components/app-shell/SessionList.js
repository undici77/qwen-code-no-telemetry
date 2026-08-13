import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSetAtom } from "jotai";
import { isToday, isYesterday, format, startOfDay } from "date-fns";
import { getDateLocale } from "@craft-agent/shared/i18n";
import { useAction } from "@/actions";
import { Inbox, Archive } from "lucide-react";
import { getSessionStatus } from "@/utils/session";
import * as storage from "@/lib/local-storage";
import { KEYS } from "@/lib/local-storage";
import { flattenLabels } from "@craft-agent/shared/labels";
import * as MultiSelect from "@/hooks/useMultiSelect";
import { Spinner } from "@craft-agent/ui";
import { EntityListEmptyScreen } from "@/components/ui/entity-list-empty";
import { EntityList } from "@/components/ui/entity-list";
import { RenameDialog } from "@/components/ui/rename-dialog";
import { SessionSearchHeader } from "./SessionSearchHeader";
import { SessionItem } from "./SessionItem";
import { SessionListProvider } from "@/context/SessionListContext";
import { useSessionSelection, useSessionSelectionStore } from "@/hooks/useSession";
import { useSessionSearch } from "@/hooks/useSessionSearch";
import { useSessionActions } from "@/hooks/useSessionActions";
import { useEntityListInteractions } from "@/hooks/useEntityListInteractions";
import { useFocusZone } from "@/hooks/keyboard";
import { useEscapeInterrupt } from "@/context/EscapeInterruptContext";
import { useNavigation, useNavigationState, routes, isSessionsNavigation } from "@/contexts/NavigationContext";
import { useFocusContext } from "@/context/FocusContext";
import { compareSessionsByFlaggedThenActivityDesc, getSessionOrderTime, sendToWorkspaceAtom } from "@/atoms/sessions";
import { buildCollapsedGroupsScopeSuffix } from "@/utils/session-list-collapse";
// Note: uses date-fns format for non-today/yesterday dates; Today/Yesterday translated at render time
function formatDateGroupLabel(date, t, lang) {
    if (isToday(date))
        return t('common.today');
    if (isYesterday(date))
        return t('common.yesterday');
    return format(date, 'MMM d', { locale: getDateLocale(lang) });
}
/**
 * SessionList - Scrollable list of session cards with keyboard navigation
 *
 * Keyboard shortcuts:
 * - Arrow Up/Down: Navigate and select sessions (immediate selection)
 * - Arrow Left/Right: Navigate between zones
 * - Enter: Focus chat input
 * - Home/End: Jump to first/last session
 */
export function SessionList({ items, onDelete, onFlag, onUnflag, onArchive, onUnarchive, onMarkUnread, onSessionStatusChange, onRename, onFocusChatInput, onOpenInNewWindow, sessionOptions, searchActive, searchQuery = '', onSearchChange, onSearchClose, sessionStatuses = [], evaluateViews, labels = [], onLabelsChange, groupingMode = 'none', workspaceId, statusFilter, labelFilterMap, focusedSessionId, onNavigateToSession, hasPendingPrompt, activeChatMatchInfo, isLoading = false, }) {
    const { t, i18n } = useTranslation();
    const setSendToWorkspace = useSetAtom(sendToWorkspaceAtom);
    // --- Selection (atom-backed, shared with ChatDisplay + BatchActionPanel) ---
    const { select: selectSession, toggle: toggleSession, selectRange, isMultiSelectActive, } = useSessionSelection();
    const selectionStore = useSessionSelectionStore();
    const { navigate, navigateToSession: navigateToSessionPrimary } = useNavigation();
    const navigateToSession = onNavigateToSession ?? navigateToSessionPrimary;
    const navState = useNavigationState();
    const { showEscapeOverlay } = useEscapeInterrupt();
    // Pre-flatten label tree once for efficient ID lookups in each SessionItem
    const flatLabels = useMemo(() => flattenLabels(labels), [labels]);
    // Get current filter from navigation state (for preserving context in tab routes)
    const currentFilter = isSessionsNavigation(navState) ? navState.filter : undefined;
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameSessionId, setRenameSessionId] = useState(null);
    const [renameName, setRenameName] = useState("");
    // Track if search input has actual DOM focus (for proper keyboard navigation gating)
    const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
    // Collapsed group keys (for collapsible group headers) — persisted per workspace/filter/grouping context
    const collapseScopeSuffix = useMemo(() => {
        return buildCollapsedGroupsScopeSuffix({
            workspaceId,
            currentFilter,
            groupingMode,
        });
    }, [
        workspaceId,
        groupingMode,
        currentFilter?.kind,
        currentFilter && 'stateId' in currentFilter ? currentFilter.stateId : undefined,
        currentFilter && 'labelId' in currentFilter ? currentFilter.labelId : undefined,
        currentFilter && 'viewId' in currentFilter ? currentFilter.viewId : undefined,
    ]);
    const readCollapsedGroupsForScope = useCallback((scopeSuffix) => {
        const scopedRaw = storage.getRaw(KEYS.collapsedSessionGroups, scopeSuffix);
        if (scopedRaw !== null) {
            try {
                const parsed = JSON.parse(scopedRaw);
                return new Set(Array.isArray(parsed) ? parsed : []);
            }
            catch {
                return new Set();
            }
        }
        // Legacy fallback: previous versions used a single global key with no scope suffix.
        // Use as migration source only when this scope has never been written.
        const legacy = storage.get(KEYS.collapsedSessionGroups, []);
        return new Set(legacy);
    }, []);
    const [collapsedGroups, setCollapsedGroups] = useState(() => readCollapsedGroupsForScope(collapseScopeSuffix));
    const collapseScopeRef = useRef(collapseScopeSuffix);
    useEffect(() => {
        if (collapseScopeRef.current === collapseScopeSuffix)
            return;
        setCollapsedGroups(readCollapsedGroupsForScope(collapseScopeSuffix));
        collapseScopeRef.current = collapseScopeSuffix;
    }, [collapseScopeSuffix, readCollapsedGroupsForScope]);
    useEffect(() => {
        // Avoid writing stale groups from a previous scope during context switches.
        if (collapseScopeRef.current !== collapseScopeSuffix)
            return;
        storage.set(KEYS.collapsedSessionGroups, Array.from(collapsedGroups), collapseScopeSuffix);
    }, [collapsedGroups, collapseScopeSuffix]);
    const toggleGroupCollapse = useCallback((groupKey) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupKey))
                next.delete(groupKey);
            else
                next.add(groupKey);
            return next;
        });
    }, []);
    // --- Data pipeline (search, filtering, pagination, grouping) ---
    const scrollViewportRef = useRef(null);
    const { isSearchMode, highlightQuery, isSearchingContent, isSearchUnavailable, contentSearchResults, matchingFilterItems, otherResultItems, exceededSearchLimit, flatItems, hasMore, collapsedGroupsMeta, searchInputRef, } = useSessionSearch({
        items,
        searchActive: searchActive ?? false,
        searchQuery,
        workspaceId,
        currentFilter,
        evaluateViews,
        statusFilter,
        labelFilterMap,
        collapsedGroups,
        groupingMode,
        scrollViewportRef,
    });
    const rowData = useMemo(() => {
        if (isSearchMode) {
            const matchingRows = matchingFilterItems.map(item => ({ item }));
            const otherRows = otherResultItems.map(item => ({ item }));
            const groups = [];
            if (matchingRows.length > 0) {
                groups.push({ key: 'matching', label: t("session.inCurrentView"), items: matchingRows });
            }
            if (otherRows.length > 0) {
                groups.push({ key: 'other', label: t("session.otherConversations"), items: otherRows });
            }
            return {
                rows: [...matchingRows, ...otherRows],
                groups,
            };
        }
        // flatItems only contains visible (expanded + paginated) items.
        // collapsedGroupsMeta provides key + count for collapsed groups so we
        // can insert header-only placeholder groups in the correct position.
        const rows = flatItems.map(item => ({ item }));
        if (groupingMode === 'none') {
            return {
                rows,
                groups: undefined,
            };
        }
        if (groupingMode === 'status') {
            const statusOrder = new Map();
            sessionStatuses.forEach((state, index) => statusOrder.set(state.id, index));
            // Build groups from visible items
            const groupsByKey = new Map();
            for (const row of rows) {
                const statusId = getSessionStatus(row.item);
                const key = `status-${statusId}`;
                if (!groupsByKey.has(key))
                    groupsByKey.set(key, { rows: [], statusId });
                groupsByKey.get(key).rows.push(row);
            }
            // Insert collapsed placeholder groups
            for (const meta of collapsedGroupsMeta) {
                if (!groupsByKey.has(meta.key)) {
                    const statusId = meta.key.replace('status-', '');
                    groupsByKey.set(meta.key, { rows: [], statusId });
                }
            }
            const orderedGroups = [];
            for (const [key, { rows: groupRows, statusId }] of groupsByKey) {
                const state = sessionStatuses.find(s => s.id === statusId);
                if (!state)
                    continue;
                groupRows.sort((a, b) => compareSessionsByFlaggedThenActivityDesc(a.item, b.item));
                const collapsedMeta = collapsedGroupsMeta.find(m => m.key === key);
                orderedGroups.push({
                    key,
                    label: t(`status.${state.id}`, state.label),
                    items: groupRows,
                    collapsible: true,
                    ...(collapsedMeta ? { collapsedCount: collapsedMeta.count } : {}),
                });
            }
            orderedGroups.sort((a, b) => {
                const aOrder = statusOrder.get(a.key.replace('status-', '')) ?? 999;
                const bOrder = statusOrder.get(b.key.replace('status-', '')) ?? 999;
                return aOrder - bOrder;
            });
            // If only one group exists, disable collapsing — there's nothing to collapse into
            if (orderedGroups.length === 1) {
                orderedGroups[0].collapsible = false;
            }
            return {
                rows: orderedGroups.flatMap(g => g.items),
                groups: orderedGroups,
            };
        }
        // Default: group by date
        const groupsByKey = new Map();
        const groupDates = new Map();
        for (const row of rows) {
            const day = startOfDay(new Date(getSessionOrderTime(row.item)));
            const groupKey = day.toISOString();
            if (!groupsByKey.has(groupKey)) {
                groupsByKey.set(groupKey, {
                    key: groupKey,
                    label: formatDateGroupLabel(day, t, i18n.resolvedLanguage ?? 'en'),
                    items: [],
                    collapsible: true,
                });
                groupDates.set(groupKey, day);
            }
            groupsByKey.get(groupKey).items.push(row);
        }
        // Insert collapsed placeholder groups (header-only, items: [])
        for (const meta of collapsedGroupsMeta) {
            if (!groupsByKey.has(meta.key)) {
                const date = new Date(meta.key);
                groupsByKey.set(meta.key, {
                    key: meta.key,
                    label: formatDateGroupLabel(date, t, i18n.resolvedLanguage ?? 'en'),
                    items: [],
                    collapsible: true,
                    collapsedCount: meta.count,
                });
                groupDates.set(meta.key, date);
            }
        }
        // Sort all groups by date descending
        const orderedKeys = Array.from(groupDates.entries())
            .sort(([, a], [, b]) => b.getTime() - a.getTime())
            .map(([key]) => key);
        const orderedGroups = orderedKeys.map(key => groupsByKey.get(key));
        // If only one group exists, disable collapsing — there's nothing to collapse into
        if (orderedGroups.length === 1) {
            orderedGroups[0].collapsible = false;
        }
        return {
            rows,
            groups: orderedGroups,
        };
    }, [isSearchMode, matchingFilterItems, otherResultItems, flatItems, groupingMode, sessionStatuses, collapsedGroupsMeta, t]);
    const flatRows = rowData.rows;
    const collapseAllGroups = useCallback(() => {
        if (groupingMode === 'none') {
            setCollapsedGroups(new Set());
        }
        else if (groupingMode === 'status') {
            const allKeys = new Set(items.map(item => `status-${getSessionStatus(item)}`));
            setCollapsedGroups(allKeys);
        }
        else {
            const allKeys = new Set(items.map(item => startOfDay(new Date(getSessionOrderTime(item))).toISOString()));
            setCollapsedGroups(allKeys);
        }
    }, [items, groupingMode]);
    const expandAllGroups = useCallback(() => {
        setCollapsedGroups(new Set());
    }, []);
    const rowIndexMap = useMemo(() => {
        const map = new Map();
        flatRows.forEach((row, index) => {
            map.set(row.item.id, index);
        });
        return map;
    }, [flatRows]);
    // --- Action handlers with toast feedback ---
    const { handleFlagWithToast, handleUnflagWithToast, handleArchiveWithToast, handleUnarchiveWithToast, handleDeleteWithToast, } = useSessionActions({ onFlag, onUnflag, onArchive, onUnarchive, onDelete });
    // --- Focus zone ---
    const { focusZone } = useFocusContext();
    const { zoneRef, isFocused, shouldMoveDOMFocus } = useFocusZone({ zoneId: 'navigator' });
    // Keyboard eligibility: zone-focused OR search input focused (for arrow navigation)
    const isKeyboardEligible = isFocused || (searchActive && isSearchInputFocused);
    // --- Interactions (keyboard navigation + selection via shared atom) ---
    const interactions = useEntityListInteractions({
        items: flatRows,
        getId: (row) => row.item.id,
        keyboard: {
            onNavigate: useCallback((row) => {
                navigateToSession(row.item.id);
            }, [navigateToSession]),
            onActivate: useCallback((row) => {
                // Only navigate when not in multi-select (matches original behavior)
                if (!MultiSelect.isMultiSelectActive(selectionStore.state)) {
                    navigateToSession(row.item.id);
                }
                onFocusChatInput?.(row.item.id);
            }, [selectionStore.state, navigateToSession, onFocusChatInput]),
            enabled: isKeyboardEligible,
            virtualFocus: searchActive ?? false,
        },
        multiSelect: true,
        selectionStore,
        selectedIdOverride: focusedSessionId,
    });
    // Sync activeIndex when selection changes externally (e.g. from ChatDisplay)
    useEffect(() => {
        const newIndex = flatRows.findIndex(row => row.item.id === selectionStore.state.selected);
        if (newIndex >= 0 && newIndex !== interactions.keyboard.activeIndex) {
            interactions.keyboard.setActiveIndex(newIndex);
        }
    }, [selectionStore.state.selected, flatRows, interactions.keyboard]);
    // Focus active item when zone gains keyboard focus
    useEffect(() => {
        if (shouldMoveDOMFocus && flatRows.length > 0 && !(searchActive ?? false)) {
            interactions.keyboard.focusActiveItem();
        }
    }, [shouldMoveDOMFocus, flatRows.length, searchActive, interactions.keyboard]);
    // --- Global keyboard shortcuts ---
    const isFocusWithinZone = () => zoneRef.current?.contains(document.activeElement) ?? false;
    useAction('navigator.selectAll', () => {
        interactions.selection.selectAll();
    }, {
        enabled: isFocusWithinZone,
    }, [interactions.selection]);
    useAction('navigator.clearSelection', () => {
        const selectedId = selectionStore.state.selected;
        interactions.selection.clear();
        if (selectedId)
            navigateToSession(selectedId);
    }, {
        enabled: () => isMultiSelectActive && !showEscapeOverlay,
    }, [isMultiSelectActive, showEscapeOverlay, interactions.selection, selectionStore.state.selected, navigateToSession]);
    // --- Click handlers ---
    const handleSelectSession = useCallback((row, index) => {
        selectSession(row.item.id, index);
        navigateToSession(row.item.id);
    }, [selectSession, navigateToSession]);
    const handleSelectSessionById = useCallback((sessionId) => {
        const index = rowIndexMap.get(sessionId) ?? -1;
        if (index >= 0) {
            selectSession(sessionId, index);
        }
        else {
            selectSession(sessionId, 0);
        }
        navigateToSession(sessionId);
    }, [rowIndexMap, selectSession, navigateToSession]);
    const handleToggleSelect = useCallback((row, index) => {
        focusZone('navigator', { intent: 'click', moveFocus: false });
        toggleSession(row.item.id, index);
    }, [focusZone, toggleSession]);
    const handleRangeSelect = useCallback((toIndex) => {
        focusZone('navigator', { intent: 'click', moveFocus: false });
        const allIds = flatRows.map(row => row.item.id);
        selectRange(toIndex, allIds);
    }, [focusZone, flatRows, selectRange]);
    // Arrow key shortcuts for zone navigation (left → sidebar, right → chat)
    const handleKeyDown = useCallback((e, _item) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            focusZone('sidebar', { intent: 'keyboard' });
            return;
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            focusZone('chat', { intent: 'keyboard' });
            return;
        }
    }, [focusZone]);
    // --- Rename dialog ---
    const handleRenameClick = useCallback((sessionId, currentName) => {
        setRenameSessionId(sessionId);
        setRenameName(currentName);
        requestAnimationFrame(() => {
            setRenameDialogOpen(true);
        });
    }, []);
    const handleRenameSubmit = () => {
        if (renameSessionId && renameName.trim()) {
            onRename(renameSessionId, renameName.trim());
        }
        setRenameDialogOpen(false);
        setRenameSessionId(null);
        setRenameName("");
    };
    // --- Search input key handler ---
    const handleSearchKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            searchInputRef.current?.blur();
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            onFocusChatInput?.(selectionStore.state.selected ?? undefined);
            return;
        }
        // Forward arrow keys via interactions
        interactions.searchInputProps.onKeyDown(e);
    }, [searchInputRef, onFocusChatInput, interactions.searchInputProps, selectionStore.state.selected]);
    // --- Context value (shared across all SessionItems) ---
    const handleFocusZone = useCallback(() => focusZone('navigator', { intent: 'click', moveFocus: false }), [focusZone]);
    const handleOpenInNewWindow = useCallback((item) => onOpenInNewWindow?.(item), [onOpenInNewWindow]);
    const resolvedSearchQuery = isSearchMode ? highlightQuery : searchQuery;
    const listContext = useMemo(() => ({
        onRenameClick: handleRenameClick,
        onSessionStatusChange,
        onFlag: onFlag ? handleFlagWithToast : undefined,
        onUnflag: onUnflag ? handleUnflagWithToast : undefined,
        onArchive: onArchive ? handleArchiveWithToast : undefined,
        onUnarchive: onUnarchive ? handleUnarchiveWithToast : undefined,
        onMarkUnread,
        onDelete: handleDeleteWithToast,
        onLabelsChange,
        onSelectSessionById: handleSelectSessionById,
        onOpenInNewWindow: handleOpenInNewWindow,
        onSendToWorkspace: (ids) => setSendToWorkspace(ids),
        onFocusZone: handleFocusZone,
        onKeyDown: handleKeyDown,
        sessionStatuses,
        flatLabels,
        labels,
        searchQuery: resolvedSearchQuery,
        selectedSessionId: focusedSessionId !== undefined ? focusedSessionId : selectionStore.state.selected,
        isMultiSelectActive,
        sessionOptions,
        contentSearchResults,
        activeChatMatchInfo,
        hasPendingPrompt,
    }), [
        handleRenameClick, onSessionStatusChange,
        onFlag, handleFlagWithToast, onUnflag, handleUnflagWithToast,
        onArchive, handleArchiveWithToast, onUnarchive, handleUnarchiveWithToast,
        onMarkUnread, handleDeleteWithToast, onLabelsChange,
        handleSelectSessionById, handleOpenInNewWindow, setSendToWorkspace, handleFocusZone, handleKeyDown,
        sessionStatuses, flatLabels, labels, resolvedSearchQuery,
        focusedSessionId, selectionStore.state.selected, isMultiSelectActive,
        sessionOptions, contentSearchResults, activeChatMatchInfo, hasPendingPrompt,
    ]);
    // --- Empty state (non-search) — render before EntityList ---
    // Don't show empty state when there are collapsed groups with content
    if (flatRows.length === 0 && (rowData.groups?.length ?? 0) === 0 && !searchActive) {
        if (isLoading) {
            return (_jsx("div", { className: "flex h-full items-center justify-center px-4", children: _jsxs("div", { className: "flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm font-medium text-muted-foreground", children: [_jsx(Spinner, { className: "text-muted-foreground" }), _jsx("span", { children: t("common.loading") })] }) }));
        }
        if (currentFilter?.kind === 'archived') {
            return (_jsx(EntityListEmptyScreen, { icon: _jsx(Archive, {}), title: t("session.noArchivedSessions"), description: t("session.noArchivedSessionsDesc"), className: "h-full" }));
        }
        return (_jsx(EntityListEmptyScreen, { icon: _jsx(Inbox, {}), title: t("session.noSessionsYet"), description: t("session.noSessionsYetDesc"), className: "h-full", children: _jsx("button", { onClick: () => {
                    const params = {};
                    if (currentFilter?.kind === 'state')
                        params.status = currentFilter.stateId;
                    else if (currentFilter?.kind === 'label')
                        params.label = currentFilter.labelId;
                    navigate(routes.action.newSession(Object.keys(params).length > 0 ? params : undefined));
                }, className: "inline-flex items-center h-7 px-3 text-xs font-medium rounded-[8px] bg-background shadow-minimal hover:bg-foreground/[0.03] transition-colors", children: t("session.newSession") }) }));
    }
    // --- Render ---
    return (_jsxs("div", { className: "flex flex-col flex-1 min-h-0", children: [_jsx(SessionListProvider, { value: listContext, children: _jsx(EntityList, { groups: rowData.groups, items: rowData.groups ? undefined : rowData.rows, getKey: (row) => row.item.id, renderItem: (row, _indexInGroup, isFirstInGroup) => {
                        const flatIndex = rowIndexMap.get(row.item.id) ?? 0;
                        const rowProps = interactions.getRowProps(row, flatIndex);
                        return (_jsx(SessionItem, { item: row.item, index: flatIndex, itemProps: rowProps.buttonProps, isSelected: rowProps.isSelected, isFirstInGroup: isFirstInGroup, isInMultiSelect: rowProps.isInMultiSelect ?? false, onSelect: () => handleSelectSession(row, flatIndex), onToggleSelect: () => handleToggleSelect(row, flatIndex), onRangeSelect: () => handleRangeSelect(flatIndex) }));
                    }, header: _jsxs(_Fragment, { children: [searchActive && (_jsx(SessionSearchHeader, { searchQuery: searchQuery, onSearchChange: onSearchChange, onSearchClose: onSearchClose, onKeyDown: handleSearchKeyDown, onFocus: () => setIsSearchInputFocused(true), onBlur: () => setIsSearchInputFocused(false), isSearching: isSearchingContent, isUnavailable: isSearchUnavailable, resultCount: matchingFilterItems.length + otherResultItems.length, exceededLimit: exceededSearchLimit, inputRef: searchInputRef })), isSearchMode && matchingFilterItems.length === 0 && otherResultItems.length > 0 && (_jsx("div", { className: "px-4 py-3 text-sm text-muted-foreground", children: t("session.noResultsInFilter") }))] }), emptyState: isSearchMode && !isSearchingContent ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: t("session.noSessionsFound") }), _jsx("p", { className: "text-xs text-muted-foreground/60 mt-0.5", children: t("session.noSessionsFoundDesc") }), _jsx("button", { onClick: () => onSearchChange?.(''), className: "text-xs text-foreground hover:underline mt-2", children: t("session.clearSearch") })] })) : undefined, footer: hasMore || (isLoading && !searchActive) ? (_jsx("div", { className: "flex justify-center py-4", children: _jsx(Spinner, { className: "text-muted-foreground" }) })) : undefined, viewportRef: scrollViewportRef, containerRef: zoneRef, containerProps: {
                        'data-focus-zone': 'navigator',
                        role: 'listbox',
                        'aria-label': 'Sessions',
                    }, scrollAreaClassName: "select-none mask-fade-top-short", collapsedGroups: collapsedGroups, onToggleCollapse: toggleGroupCollapse, onCollapseAll: collapseAllGroups, onExpandAll: expandAllGroups }) }), _jsx(RenameDialog, { open: renameDialogOpen, onOpenChange: setRenameDialogOpen, title: t("session.renameSession"), value: renameName, onValueChange: setRenameName, onSubmit: handleRenameSubmit, placeholder: t("session.enterSessionName") })] }));
}
//# sourceMappingURL=SessionList.js.map