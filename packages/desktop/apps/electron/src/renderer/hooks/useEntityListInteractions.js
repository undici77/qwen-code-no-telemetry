/**
 * useEntityListInteractions — Convenience hook that wires together:
 * - useRovingTabIndex (keyboard navigation)
 * - useMultiSelect (pure selection state)
 * - Optional search filtering
 *
 * Returns props to spread onto EntityList and EntityRow.
 *
 * NOTE: Does NOT include useFocusZone — that requires app-level FocusContext.
 * Consumers who need zone integration compose it externally (see SessionList).
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import { useRovingTabIndex } from '@/hooks/keyboard';
import * as MultiSelect from '@/hooks/useMultiSelect';
// ============================================================================
// Hook
// ============================================================================
export function useEntityListInteractions({ items: rawItems, getId, keyboard: keyboardOpts, multiSelect: multiSelectEnabled = false, search, selectionStore, selectedIdOverride, }) {
    // ---- Search filtering ----
    const items = useMemo(() => {
        if (!search || !search.query.trim())
            return rawItems;
        return rawItems.filter(item => search.fn(item, search.query));
    }, [rawItems, search?.query, search?.fn]); // eslint-disable-line react-hooks/exhaustive-deps
    // ---- Multi-select state ----
    // Use external store (e.g. Jotai atom) when provided, otherwise local useState
    const [internalState, setInternalState] = useState(MultiSelect.createInitialState);
    const selectionState = selectionStore?.state ?? internalState;
    const setSelectionState = selectionStore?.setState ?? setInternalState;
    const allIds = useMemo(() => items.map(getId), [items, getId]);
    const toggle = useCallback((id, index) => {
        setSelectionState(prev => MultiSelect.toggleSelect(prev, id, index));
    }, []);
    const range = useCallback((toIndex) => {
        setSelectionState(prev => MultiSelect.rangeSelect(prev, toIndex, allIds));
    }, [allIds]);
    const selectAllItems = useCallback(() => {
        setSelectionState(MultiSelect.selectAll(allIds));
    }, [allIds]);
    const clearSelection = useCallback(() => {
        setSelectionState(prev => MultiSelect.clearMultiSelect(prev));
    }, []);
    const isMultiSelectActive = MultiSelect.isMultiSelectActive(selectionState);
    // ---- Keyboard navigation ----
    const handleNavigate = useCallback((item, index) => {
        // Scroll into view
        const id = getId(item);
        requestAnimationFrame(() => {
            const el = document.getElementById(`item-${id}`);
            el?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        });
        // Exit multi-select on plain arrow navigation, then single-select the navigated item
        if (multiSelectEnabled && isMultiSelectActive) {
            clearSelection();
        }
        // Update selection to follow the keyboard cursor
        setSelectionState(MultiSelect.singleSelect(id, index));
        keyboardOpts?.onNavigate?.(item, index);
    }, [getId, multiSelectEnabled, isMultiSelectActive, clearSelection, keyboardOpts?.onNavigate]); // eslint-disable-line react-hooks/exhaustive-deps
    const handleActivate = useCallback((item, index) => {
        if (multiSelectEnabled && !isMultiSelectActive) {
            // Single-select on Enter
            setSelectionState(MultiSelect.singleSelect(getId(item), index));
        }
        keyboardOpts?.onActivate?.(item, index);
    }, [multiSelectEnabled, isMultiSelectActive, getId, keyboardOpts?.onActivate]); // eslint-disable-line react-hooks/exhaustive-deps
    const handleExtendSelection = useCallback((toIndex) => {
        if (multiSelectEnabled) {
            range(toIndex);
        }
    }, [multiSelectEnabled, range]);
    const { activeIndex, setActiveIndex, getItemProps, getContainerProps, focusActiveItem, } = useRovingTabIndex({
        items,
        getId: (item) => getId(item),
        orientation: 'vertical',
        wrap: true,
        onNavigate: handleNavigate,
        onActivate: handleActivate,
        enabled: keyboardOpts?.enabled ?? true,
        moveFocus: !(keyboardOpts?.virtualFocus ?? false),
        onExtendSelection: multiSelectEnabled ? handleExtendSelection : undefined,
    });
    // ---- Mouse interaction ----
    // Track last selected index for range select — separate from activeIndex
    // because activeIndex follows keyboard, this follows clicks.
    const lastClickIndexRef = useRef(-1);
    const getRowMouseDown = useCallback((item, index) => {
        return (e) => {
            const id = getId(item);
            // Right-click: preserve multi-select, let context menu handle batch actions
            if (e.button === 2) {
                if (multiSelectEnabled && isMultiSelectActive && !selectionState.selectedIds.has(id)) {
                    // Right-clicking an unselected item during multi-select: add it to selection
                    toggle(id, index);
                }
                // Don't change selection — context menu shows batch or single actions
                return;
            }
            const isMetaKey = e.metaKey || e.ctrlKey;
            const isShiftKey = e.shiftKey;
            if (multiSelectEnabled && isMetaKey) {
                e.preventDefault();
                toggle(id, index);
                lastClickIndexRef.current = index;
                return;
            }
            if (multiSelectEnabled && isShiftKey) {
                e.preventDefault();
                range(index);
                return;
            }
            // Normal click — single select
            setSelectionState(MultiSelect.singleSelect(id, index));
            lastClickIndexRef.current = index;
            setActiveIndex(index);
        };
    }, [getId, multiSelectEnabled, isMultiSelectActive, selectionState.selectedIds, toggle, range, setActiveIndex]);
    // ---- Search input keyboard forwarding ----
    // Forwards ArrowDown/ArrowUp from a search input to the roving tabindex handler.
    // Matches SessionList pattern (SessionList.tsx:1598).
    const searchInputOnKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            // Forward to the roving tabindex container handler
            getContainerProps().onKeyDown(e);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            e.target.blur();
            return;
        }
        if (e.key === 'Enter') {
            // Forward Enter to activate the focused item
            e.preventDefault();
            getContainerProps().onKeyDown(e);
            return;
        }
    }, [getContainerProps]);
    // ---- Build return values ----
    const containerProps = getContainerProps();
    const listProps = useMemo(() => ({
        containerRef: undefined,
        containerProps: {
            role: containerProps.role,
            'aria-activedescendant': containerProps['aria-activedescendant'] ?? '',
        },
    }), [containerProps.role, containerProps['aria-activedescendant']]);
    const getRowProps = useCallback((item, index) => {
        const id = getId(item);
        const itemProps = getItemProps(item, index);
        const effectiveSelected = selectedIdOverride !== undefined
            ? selectedIdOverride
            : selectionState.selected;
        const isSelected = multiSelectEnabled
            ? effectiveSelected === id
            : index === activeIndex;
        const isInMultiSelect = multiSelectEnabled && isMultiSelectActive && selectionState.selectedIds.has(id);
        return {
            buttonProps: {
                id: itemProps.id,
                tabIndex: itemProps.tabIndex,
                ref: itemProps.ref,
                onKeyDown: itemProps.onKeyDown,
                onFocus: itemProps.onFocus,
                'aria-selected': itemProps['aria-selected'],
                role: itemProps.role,
            },
            isSelected,
            isInMultiSelect,
            onMouseDown: getRowMouseDown(item, index),
        };
    }, [getId, getItemProps, multiSelectEnabled, selectionState, activeIndex, isMultiSelectActive, getRowMouseDown, selectedIdOverride]);
    return {
        items,
        listProps,
        getRowProps,
        searchInputProps: {
            onKeyDown: searchInputOnKeyDown,
        },
        keyboard: {
            activeIndex,
            setActiveIndex,
            focusActiveItem,
        },
        selection: {
            state: selectionState,
            isMultiSelectActive,
            selectedIds: selectionState.selectedIds,
            toggle,
            range,
            selectAll: selectAllItems,
            clear: clearSelection,
        },
    };
}
//# sourceMappingURL=useEntityListInteractions.js.map