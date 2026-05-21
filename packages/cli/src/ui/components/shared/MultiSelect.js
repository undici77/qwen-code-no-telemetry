import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useSelectionList } from '../../hooks/useSelectionList.js';
import { useKeypress } from '../../hooks/useKeypress.js';
const EMPTY_SELECTED_KEYS = [];
function getSelectedValues(items, selectedKeys) {
    return items
        .filter((item) => selectedKeys.has(item.key))
        .map((item) => item.value);
}
export function MultiSelect({ items, initialIndex = 0, selectedKeys = EMPTY_SELECTED_KEYS, onConfirm, onChange, onSelectedKeysChange, onHighlight, isFocused = true, showNumbers = true, showScrollArrows = false, maxItemsToShow = 10, checkedText = '[✓]', showActiveMarker = false, }) {
    const [scrollOffset, setScrollOffset] = useState(0);
    const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
    const { activeIndex } = useSelectionList({
        items,
        initialIndex,
        isFocused,
        // Disable numeric quick-select in useSelectionList — in a multi-select
        // context, onSelect triggers onConfirm (submit), so numeric keys would
        // accidentally submit the dialog instead of toggling checkboxes.
        // Numbers are still rendered visually via the showNumbers prop below.
        showNumbers: false,
        onHighlight,
        onSelect: () => {
            onConfirm(getSelectedValues(items, selectedKeySet));
        },
    });
    const toggleSelectionAtIndex = useCallback((index) => {
        const item = items[index];
        if (!item || item.disabled) {
            return;
        }
        const next = new Set(selectedKeySet);
        if (next.has(item.key)) {
            next.delete(item.key);
        }
        else {
            next.add(item.key);
        }
        const nextKeys = Array.from(next);
        onSelectedKeysChange?.(nextKeys);
        onChange?.(getSelectedValues(items, next));
    }, [items, onChange, onSelectedKeysChange, selectedKeySet]);
    useKeypress((key) => {
        if (key.name === 'space' || key.sequence === ' ') {
            toggleSelectionAtIndex(activeIndex);
        }
    }, { isActive: isFocused });
    useEffect(() => {
        const newScrollOffset = Math.max(0, Math.min(activeIndex - maxItemsToShow + 1, items.length - maxItemsToShow));
        if (activeIndex < scrollOffset) {
            setScrollOffset(activeIndex);
        }
        else if (activeIndex >= scrollOffset + maxItemsToShow) {
            setScrollOffset(newScrollOffset);
        }
    }, [activeIndex, items.length, scrollOffset, maxItemsToShow]);
    const visibleItems = useMemo(() => items.slice(scrollOffset, scrollOffset + maxItemsToShow), [items, scrollOffset, maxItemsToShow]);
    const numberColumnWidth = String(items.length).length;
    const hasMoreAbove = scrollOffset > 0;
    const hasMoreBelow = scrollOffset + maxItemsToShow < items.length;
    const moreAboveCount = scrollOffset;
    const moreBelowCount = Math.max(0, items.length - (scrollOffset + maxItemsToShow));
    return (_jsxs(Box, { flexDirection: "column", children: [showScrollArrows && hasMoreAbove && (_jsxs(Text, { color: theme.text.secondary, children: ["\u2191 ", moreAboveCount, " more above"] })), visibleItems.map((item, index) => {
                const itemIndex = scrollOffset + index;
                const isActive = activeIndex === itemIndex;
                const isChecked = selectedKeySet.has(item.key);
                const activeMarker = isActive ? '›' : ' ';
                const itemNumberText = `${String(itemIndex + 1).padStart(numberColumnWidth)}.`;
                const checkboxText = item.disabled
                    ? '[x]'
                    : isChecked
                        ? checkedText
                        : '[ ]';
                let textColor = theme.text.primary;
                if (item.disabled) {
                    textColor = theme.text.secondary;
                }
                else if (isActive) {
                    textColor = theme.status.success;
                }
                else if (isChecked) {
                    textColor = theme.text.accent;
                }
                if (item.separator) {
                    return (_jsxs(Box, { alignItems: "flex-start", children: [showActiveMarker && (_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: textColor, children: activeMarker }) })), _jsx(Box, { minWidth: 4, flexShrink: 0, children: _jsx(Text, { children: " " }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: theme.text.secondary, children: item.label }) })] }, item.key));
                }
                return (_jsxs(Box, { alignItems: "flex-start", children: [showActiveMarker && (_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: textColor, children: activeMarker }) })), _jsx(Box, { minWidth: 4, flexShrink: 0, children: _jsx(Text, { color: textColor, children: checkboxText }) }), showNumbers && (_jsx(Box, { marginRight: 1, minWidth: itemNumberText.length, children: _jsx(Text, { color: textColor, children: itemNumberText }) })), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: textColor, children: item.label }) })] }, item.key));
            }), showScrollArrows && hasMoreBelow && (_jsxs(Text, { color: theme.text.secondary, children: ["\u2193 ", moreBelowCount, " more below"] }))] }));
}
//# sourceMappingURL=MultiSelect.js.map