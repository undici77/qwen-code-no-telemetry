import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LabelIcon } from './label-icon';
import { createLabelMenuItems, filterItems, filterSessionStatuses, } from './label-menu-utils';
import { getSessionStatusDisplayLabel, getStatusIconStyle, } from '@/config/session-status-config';
export { createLabelMenuItems, filterItems, filterSessionStatuses } from './label-menu-utils';
// ============================================================================
// Shared Styles (matching slash-command-menu and mention-menu)
// ============================================================================
const MENU_CONTAINER_STYLE = 'overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small';
const MENU_LIST_STYLE = 'max-h-[240px] overflow-y-auto py-1';
const MENU_ITEM_STYLE = 'flex cursor-pointer select-none items-center gap-2.5 rounded-[6px] mx-1 px-2 py-1.5 text-[13px]';
const MENU_ITEM_SELECTED = 'bg-foreground/5';
// ============================================================================
// InlineLabelMenu Component
// ============================================================================
/**
 * Inline autocomplete menu for labels and states, triggered by # in the input.
 * When states are provided, shows a "States" section above the labels section.
 * Appears above the cursor position and allows keyboard navigation across both sections.
 */
export function InlineLabelMenu({ open, onOpenChange, items, onSelect, onAddLabel, filter = '', position, className, states = [], activeStateId, onSelectState, }) {
    const { t } = useTranslation();
    const menuRef = React.useRef(null);
    const listRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const filteredItems = filterItems(items, filter);
    const getStateLabel = React.useCallback((state) => getSessionStatusDisplayLabel(state, t), [t]);
    const filteredStates_ = filterSessionStatuses(states, filter, getStateLabel);
    // Build a unified flat index for keyboard navigation:
    // [0..filteredStates_.length-1] = states, [filteredStates_.length..] = labels
    const totalItemCount = filteredStates_.length + filteredItems.length;
    // When no items exist at all but onAddLabel is provided, show the "Add New Label" row
    const showAddLabel = totalItemCount === 0 && !!onAddLabel;
    // Reset selection when filter changes
    React.useEffect(() => {
        setSelectedIndex(0);
    }, [filter]);
    // Scroll selected item into view
    React.useEffect(() => {
        if (!listRef.current)
            return;
        const selectedEl = listRef.current.querySelector('[data-selected="true"]');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);
    // Keyboard navigation (unified across states and labels)
    React.useEffect(() => {
        if (!open)
            return;
        if (totalItemCount === 0 && !showAddLabel)
            return;
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (!showAddLabel) {
                        setSelectedIndex(prev => (prev < totalItemCount - 1 ? prev + 1 : 0));
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (!showAddLabel) {
                        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItemCount - 1));
                    }
                    break;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    if (showAddLabel) {
                        onAddLabel?.(filter);
                        onOpenChange(false);
                    }
                    else if (selectedIndex < filteredStates_.length) {
                        // Selected item is a state
                        onSelectState?.(filteredStates_[selectedIndex].id);
                        onOpenChange(false);
                    }
                    else {
                        // Selected item is a label
                        const labelIndex = selectedIndex - filteredStates_.length;
                        if (filteredItems[labelIndex]) {
                            onSelect(filteredItems[labelIndex].id);
                            onOpenChange(false);
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onOpenChange(false);
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, filteredStates_, filteredItems, totalItemCount, selectedIndex, onSelect, onSelectState, onAddLabel, onOpenChange, showAddLabel, filter]);
    // Close on click outside
    React.useEffect(() => {
        if (!open)
            return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onOpenChange(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onOpenChange]);
    // Hide if not open, or if no items and no "Add New Label" fallback
    if (!open || (totalItemCount === 0 && !showAddLabel))
        return null;
    // Position menu above cursor
    const bottomPosition = typeof window !== 'undefined'
        ? window.innerHeight - Math.round(position.y) + 8
        : 0;
    // Whether to show section headers (only when both states and labels are present)
    const showSectionHeaders = filteredStates_.length > 0 && filteredItems.length > 0;
    return (_jsx("div", { ref: menuRef, "data-inline-menu": true, className: cn('fixed z-dropdown', MENU_CONTAINER_STYLE, className), style: { left: Math.round(position.x) - 10, bottom: bottomPosition, minWidth: 200, maxWidth: 260 }, children: _jsx("div", { ref: listRef, className: MENU_LIST_STYLE, children: showAddLabel ? (
            /* "Add New Label" fallback row when nothing matches the filter */
            _jsxs("div", { "data-selected": "true", onClick: () => {
                    onAddLabel?.(filter);
                    onOpenChange(false);
                }, className: cn(MENU_ITEM_STYLE, MENU_ITEM_SELECTED), children: [_jsx("div", { className: "shrink-0 text-muted-foreground", children: _jsx(Plus, { className: "h-3.5 w-3.5" }) }), _jsx("span", { className: "text-[13px]", children: t('sidebarMenu.addNewLabel') })] })) : (_jsxs(_Fragment, { children: [filteredStates_.length > 0 && (_jsxs(_Fragment, { children: [showSectionHeaders && (_jsx("div", { className: "px-3 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider", children: t('sessionMenu.status') })), filteredStates_.map((state, index) => {
                                const isSelected = index === selectedIndex;
                                const isActive = state.id === activeStateId;
                                return (_jsxs("div", { "data-selected": isSelected, onClick: () => {
                                        onSelectState?.(state.id);
                                        onOpenChange(false);
                                    }, onMouseEnter: () => setSelectedIndex(index), className: cn(MENU_ITEM_STYLE, isSelected && MENU_ITEM_SELECTED, isActive && 'bg-foreground/7'), children: [_jsx("span", { className: "shrink-0 flex items-center w-4 h-4 [&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full [&>span]:text-sm", style: getStatusIconStyle(state), children: state.icon }), _jsx("div", { className: "flex-1 min-w-0 truncate", children: getStateLabel(state) }), isActive && (_jsx(Check, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }))] }, `state-${state.id}`));
                            })] })), showSectionHeaders && (_jsx("div", { className: "my-1 mx-2 border-t border-border/40" })), filteredItems.length > 0 && (_jsxs(_Fragment, { children: [showSectionHeaders && (_jsx("div", { className: "px-3 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider", children: t('sessionMenu.labels') })), filteredItems.map((item, index) => {
                                // Offset index by state count for unified selectedIndex
                                const flatIndex = filteredStates_.length + index;
                                const isSelected = flatIndex === selectedIndex;
                                return (_jsxs("div", { "data-selected": isSelected, onClick: () => {
                                        onSelect(item.id);
                                        onOpenChange(false);
                                    }, onMouseEnter: () => setSelectedIndex(flatIndex), className: cn(MENU_ITEM_STYLE, isSelected && MENU_ITEM_SELECTED), children: [_jsx(LabelIcon, { label: item.config, size: "lg" }), _jsxs("div", { className: "flex-1 min-w-0 truncate", children: [item.parentPath && (_jsx("span", { className: "text-muted-foreground", children: item.parentPath })), _jsx("span", { children: item.label })] })] }, item.id));
                            })] }))] })) }) }));
}
/**
 * Hook that manages inline label/state menu state.
 * Detects # trigger in input text and shows a filterable menu of available labels and states.
 * Already-applied labels are excluded from the menu to prevent duplicates.
 */
export function useInlineLabelMenu({ inputRef, labels, sessionLabels = [], onSelect, sessionStatuses = [], activeStateId, }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filter, setFilter] = React.useState('');
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [hashStart, setHashStart] = React.useState(-1);
    // Store current input state for handleSelect
    const currentInputRef = React.useRef({ value: '', cursorPosition: 0 });
    // Build flat menu items from label tree, excluding already-applied labels
    const items = React.useMemo(() => createLabelMenuItems(labels, sessionLabels), [labels, sessionLabels]);
    const handleInputChange = React.useCallback((value, cursorPosition) => {
        // Store current state for handleSelect
        currentInputRef.current = { value, cursorPosition };
        const textBeforeCursor = value.slice(0, cursorPosition);
        // Match # at start of input or after whitespace, followed by optional filter text
        const hashMatch = textBeforeCursor.match(/(?:^|\s)#([\w\-\/]*)$/);
        if (hashMatch) {
            const filterText = hashMatch[1] || '';
            const matchStart = textBeforeCursor.lastIndexOf('#');
            setHashStart(matchStart);
            setFilter(filterText);
            if (inputRef.current) {
                // Try to get actual caret position
                const caretRect = inputRef.current.getCaretRect?.();
                if (caretRect && caretRect.x > 0) {
                    setPosition({ x: caretRect.x, y: caretRect.y });
                }
                else {
                    // Fallback: position at input element's left edge
                    const rect = inputRef.current.getBoundingClientRect();
                    const lineHeight = 20;
                    const linesBeforeCursor = textBeforeCursor.split('\n').length - 1;
                    setPosition({
                        x: rect.left,
                        y: rect.top + (linesBeforeCursor + 1) * lineHeight,
                    });
                }
            }
            setIsOpen(true);
        }
        else {
            setIsOpen(false);
            setFilter('');
            setHashStart(-1);
        }
    }, [inputRef, items]);
    // Handle label selection: remove #trigger text from input, call onSelect
    const handleSelect = React.useCallback((labelId) => {
        let result = '';
        if (hashStart >= 0) {
            const { value: currentValue, cursorPosition } = currentInputRef.current;
            const before = currentValue.slice(0, hashStart);
            const after = currentValue.slice(cursorPosition);
            result = (before + after).trim();
        }
        onSelect(labelId);
        setIsOpen(false);
        return result;
    }, [onSelect, hashStart]);
    const close = React.useCallback(() => {
        setIsOpen(false);
        setFilter('');
        setHashStart(-1);
    }, []);
    return {
        isOpen,
        filter,
        position,
        items,
        states: sessionStatuses,
        activeStateId,
        handleInputChange,
        close,
        handleSelect,
    };
}
//# sourceMappingURL=label-menu.js.map