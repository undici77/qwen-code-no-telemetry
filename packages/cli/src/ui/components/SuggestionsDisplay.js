import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { PrepareLabel, MAX_WIDTH } from './PrepareLabel.js';
import { Colors } from '../colors.js';
import { t } from '../../i18n/index.js';
export const MAX_SUGGESTIONS_TO_SHOW = 8;
export { MAX_WIDTH };
export function SuggestionsDisplay({ suggestions, activeIndex, isLoading, width, scrollOffset, userInput, mode, expandedIndex, }) {
    if (isLoading) {
        return (_jsx(Box, { width: width, children: _jsx(Text, { color: "gray", children: t('Loading suggestions...') }) }));
    }
    if (suggestions.length === 0) {
        return null; // Don't render anything if there are no suggestions
    }
    // Calculate the visible slice based on scrollOffset
    const startIndex = scrollOffset;
    const endIndex = Math.min(scrollOffset + MAX_SUGGESTIONS_TO_SHOW, suggestions.length);
    const visibleSuggestions = suggestions.slice(startIndex, endIndex);
    const getFullLabel = (s) => [s.label, s.argumentHint, s.sourceBadge].filter(Boolean).join(' ');
    const maxLabelLength = Math.max(...suggestions.map((s) => getFullLabel(s).length));
    const commandColumnWidth = mode === 'slash' ? Math.min(maxLabelLength, Math.floor(width * 0.5)) : 0;
    return (_jsxs(Box, { flexDirection: "column", width: width, children: [scrollOffset > 0 && _jsx(Text, { color: theme.text.primary, children: "\u25B2" }), visibleSuggestions.map((suggestion, index) => {
                const originalIndex = startIndex + index;
                const isActive = originalIndex === activeIndex;
                const isExpanded = originalIndex === expandedIndex;
                const textColor = isActive ? theme.text.accent : theme.text.secondary;
                const displayLabel = suggestion.label ?? suggestion.value;
                const isLong = displayLabel.length >= MAX_WIDTH;
                const expansionIndicatorWidth = isActive && isLong ? 3 : 0;
                const descriptionColumnWidth = Math.max(width - commandColumnWidth - 2 - expansionIndicatorWidth, 1);
                const labelElement = (_jsx(PrepareLabel, { label: displayLabel, matchedIndex: suggestion.matchedIndex, userInput: userInput, textColor: textColor, isExpanded: isExpanded }));
                return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { ...(mode === 'slash'
                                ? { width: commandColumnWidth, flexShrink: 0 }
                                : { flexShrink: 1 }), children: _jsxs(Box, { children: [labelElement, suggestion.argumentHint && (_jsxs(Text, { color: theme.text.secondary, children: [' ', suggestion.argumentHint] })), suggestion.sourceBadge && (_jsxs(Text, { color: textColor, children: [" ", suggestion.sourceBadge] }))] }) }), suggestion.description && (_jsx(Box, { width: descriptionColumnWidth, flexGrow: 1, flexShrink: 1, paddingLeft: 2, children: _jsx(Text, { color: textColor, wrap: "wrap", children: suggestion.description }) })), isActive && isLong && (_jsx(Box, { children: _jsx(Text, { color: Colors.Gray, children: isExpanded ? ' ← ' : ' → ' }) }))] }, `${suggestion.value}-${originalIndex}`));
            }), endIndex < suggestions.length && _jsx(Text, { color: "gray", children: "\u25BC" }), suggestions.length > MAX_SUGGESTIONS_TO_SHOW && (_jsxs(Text, { color: "gray", children: ["(", activeIndex + 1, "/", suggestions.length, ")"] }))] }));
}
//# sourceMappingURL=SuggestionsDisplay.js.map