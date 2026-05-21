import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text, Box } from 'ink';
import { theme } from '../../semantic-colors.js';
import { BaseSelectionList } from './BaseSelectionList.js';
/**
 * A radio button select component that displays items with title and description.
 *
 * @template T The type of the value associated with each descriptive radio item.
 */
export function DescriptiveRadioButtonSelect({ items, initialIndex = 0, onSelect, onHighlight, isFocused = true, showNumbers = false, showScrollArrows = false, maxItemsToShow = 10, itemGap = 0, }) {
    return (_jsx(BaseSelectionList, { items: items, initialIndex: initialIndex, onSelect: onSelect, onHighlight: onHighlight, isFocused: isFocused, showNumbers: showNumbers, showScrollArrows: showScrollArrows, maxItemsToShow: maxItemsToShow, itemGap: itemGap, renderItem: (item, { titleColor }) => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: titleColor, children: item.title }), typeof item.description === 'string' ? (_jsx(Text, { color: theme.text.secondary, children: item.description })) : (item.description)] }, item.key)) }));
}
//# sourceMappingURL=DescriptiveRadioButtonSelect.js.map