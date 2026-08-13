import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { useState, useCallback, useMemo } from 'react';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { keyMatchers, Command } from '../keyMatchers.js';
// Maximum number of visible items in the list
const MAX_VISIBLE_ITEMS = 8;
export const PluginChoicePrompt = (props) => {
    const { marketplaceName, plugins, onSelect, onCancel } = props;
    const [selectedIndex, setSelectedIndex] = useState(0);
    const prefixWidth = 2; // "❯ " or "  "
    const handleKeypress = useCallback((key) => {
        const { name, sequence } = key;
        if (name === 'escape') {
            onCancel();
            return;
        }
        if (name === 'return') {
            const plugin = plugins[selectedIndex];
            if (plugin) {
                onSelect(plugin.name);
            }
            return;
        }
        // Navigate up
        if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : plugins.length - 1));
            return;
        }
        // Navigate down
        if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex((prev) => (prev < plugins.length - 1 ? prev + 1 : 0));
            return;
        }
        // Number shortcuts (1-9)
        const num = parseInt(sequence || '', 10);
        if (!isNaN(num) && num >= 1 && num <= plugins.length && num <= 9) {
            setSelectedIndex(num - 1);
            const plugin = plugins[num - 1];
            if (plugin) {
                onSelect(plugin.name);
            }
        }
    }, [plugins, selectedIndex, onSelect, onCancel]);
    useKeypress(handleKeypress, { isActive: true });
    // Calculate visible range for scrolling
    const { visiblePlugins, startIndex, hasMore, hasLess } = useMemo(() => {
        const total = plugins.length;
        if (total <= MAX_VISIBLE_ITEMS) {
            return {
                visiblePlugins: plugins,
                startIndex: 0,
                hasMore: false,
                hasLess: false,
            };
        }
        // Calculate window position to keep selected item visible
        let start = 0;
        const halfWindow = Math.floor(MAX_VISIBLE_ITEMS / 2);
        if (selectedIndex <= halfWindow) {
            // Near the beginning
            start = 0;
        }
        else if (selectedIndex >= total - halfWindow) {
            // Near the end
            start = total - MAX_VISIBLE_ITEMS;
        }
        else {
            // In the middle - center on selected
            start = selectedIndex - halfWindow;
        }
        const end = Math.min(start + MAX_VISIBLE_ITEMS, total);
        return {
            visiblePlugins: plugins.slice(start, end),
            startIndex: start,
            hasLess: start > 0,
            hasMore: end < total,
        };
    }, [plugins, selectedIndex]);
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, width: "100%", children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Select a plugin from "{{name}}"', { name: marketplaceName }) }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [hasLess && (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [' ', "\u2191 ", t('{{count}} more above', { count: String(startIndex) })] }) })), visiblePlugins.map((plugin, visibleIndex) => {
                        const actualIndex = startIndex + visibleIndex;
                        const isSelected = actualIndex === selectedIndex;
                        const prefix = isSelected ? '❯ ' : '  ';
                        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: isSelected ? theme.text.accent : undefined, children: prefix }), _jsx(Text, { bold: isSelected, color: isSelected ? theme.text.accent : undefined, children: plugin.name })] }), isSelected && plugin.description && (_jsx(Box, { marginLeft: prefixWidth, children: _jsx(Text, { color: theme.text.accent, children: plugin.description }) }))] }, plugin.name));
                    }), hasMore && (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [' ', "\u2193", ' ', t('{{count}} more below', {
                                    count: String(plugins.length - startIndex - MAX_VISIBLE_ITEMS),
                                })] }) }))] }), _jsxs(Box, { marginTop: 1, flexDirection: "row", gap: 2, children: [_jsx(Text, { dimColor: true, children: t('Use ↑↓ or j/k to navigate, Enter to select, Escape to cancel') }), plugins.length > MAX_VISIBLE_ITEMS && (_jsxs(Text, { dimColor: true, children: ["(", selectedIndex + 1, "/", plugins.length, ")"] }))] })] }));
};
//# sourceMappingURL=PluginChoicePrompt.js.map