import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useEffect, useRef, useState } from 'react';
import { Text, Box } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useSelectionList } from '../../hooks/useSelectionList.js';
import { SettingsContext } from '../../contexts/SettingsContext.js';
import { useVirtualViewport } from '../../contexts/VirtualViewportContext.js';
import { useMouseTrackingEnabled } from '../../hooks/use-mouse-tracking-enabled.js';
import { RowMouseController } from './RowMouseController.js';
function getScrollOffsetForIndex(activeIndex, itemCount, maxItemsToShow) {
    return Math.max(0, Math.min(activeIndex - maxItemsToShow + 1, itemCount - maxItemsToShow));
}
/**
 * Base component for selection lists that provides common UI structure
 * and keyboard navigation logic via the useSelectionList hook.
 *
 * This component handles:
 * - Radio button indicators
 * - Item numbering
 * - Scrolling for long lists
 * - Color theming based on selection/disabled state
 * - Keyboard navigation and numeric selection
 *
 * Specific components should use this as a base and provide
 * their own renderItem implementation for custom content.
 */
export function BaseSelectionList({ items, initialIndex = 0, onSelect, onHighlight, isFocused = true, showNumbers = true, showScrollArrows = false, maxItemsToShow = 10, itemGap = 0, renderItem, }) {
    const { activeIndex, setActiveIndex, selectIndex } = useSelectionList({
        items,
        initialIndex,
        onSelect,
        onHighlight,
        isFocused,
        showNumbers,
    });
    const [scrollOffset, setScrollOffset] = useState(() => getScrollOffsetForIndex(activeIndex, items.length, maxItemsToShow));
    // Handle scrolling for long lists
    useEffect(() => {
        const newScrollOffset = getScrollOffsetForIndex(activeIndex, items.length, maxItemsToShow);
        if (activeIndex < scrollOffset) {
            setScrollOffset(activeIndex);
        }
        else if (activeIndex >= scrollOffset + maxItemsToShow) {
            setScrollOffset(newScrollOffset);
        }
    }, [activeIndex, items.length, scrollOffset, maxItemsToShow]);
    // Mouse input is enabled in alternate-screen mode (ui.useTerminalBuffer):
    // the hit-test relies on alternate-screen coordinates where
    // measureElementPosition rows line up with mouse event rows. In inline mode
    // the live region floats, so the layer is not mounted there. It is mounted
    // only when enabled, so dialogs that don't use it pull in no extra providers.
    // Read the context raw (not the throwing useSettings) so the component still
    // renders outside a SettingsProvider — e.g. in unit tests.
    const settings = useContext(SettingsContext);
    const mouseTrackingEnabled = useMouseTrackingEnabled();
    const mouseEnabled = useVirtualViewport(settings?.merged.ui?.useTerminalBuffer) &&
        mouseTrackingEnabled;
    const containerRef = useRef(null);
    const itemRefs = useRef([]);
    const visibleItems = items.slice(scrollOffset, scrollOffset + maxItemsToShow);
    const numberColumnWidth = String(items.length).length;
    return (_jsxs(Box, { ref: containerRef, flexDirection: "column", gap: itemGap, children: [mouseEnabled && isFocused && items.length > 0 && (_jsx(RowMouseController, { containerRef: containerRef, itemRefs: itemRefs, scrollOffset: scrollOffset, isDisabled: (index) => !!items[index]?.disabled, onHoverIndex: setActiveIndex, onSelectIndex: selectIndex })), showScrollArrows && (_jsx(Text, { color: scrollOffset > 0 ? theme.text.primary : theme.text.secondary, children: "\u25B2" })), visibleItems.map((item, index) => {
                const itemIndex = scrollOffset + index;
                const isSelected = activeIndex === itemIndex;
                // Determine colors based on selection and disabled state
                let titleColor = theme.text.primary;
                let numberColor = theme.text.primary;
                if (isSelected) {
                    titleColor = theme.status.success;
                    numberColor = theme.status.success;
                }
                else if (item.disabled) {
                    titleColor = theme.text.secondary;
                    numberColor = theme.text.secondary;
                }
                if (!isFocused && !item.disabled) {
                    numberColor = theme.text.secondary;
                }
                if (!showNumbers) {
                    numberColor = theme.text.secondary;
                }
                const itemNumberText = `${String(itemIndex + 1).padStart(numberColumnWidth)}.`;
                return (_jsxs(Box, { alignItems: "flex-start", ref: (node) => {
                        itemRefs.current[index] = node;
                    }, children: [_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: isSelected ? theme.status.success : theme.text.primary, "aria-hidden": true, children: isSelected ? '›' : ' ' }) }), showNumbers && (_jsx(Box, { marginRight: 1, flexShrink: 0, minWidth: itemNumberText.length, "aria-state": { checked: isSelected }, children: _jsx(Text, { color: numberColor, children: itemNumberText }) })), _jsx(Box, { flexGrow: 1, children: renderItem(item, {
                                isSelected,
                                titleColor,
                                numberColor,
                            }) })] }, item.key));
            }), showScrollArrows && (_jsx(Text, { color: scrollOffset + maxItemsToShow < items.length
                    ? theme.text.primary
                    : theme.text.secondary, children: "\u25BC" }))] }));
}
//# sourceMappingURL=BaseSelectionList.js.map