import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { t } from '../../i18n/index.js';
// Platform-specific key mappings
const getNewlineKey = () => process.platform === 'win32' ? 'ctrl+enter' : 'ctrl+j';
const getPasteKey = () => {
    if (process.platform === 'win32')
        return 'alt+v';
    return process.platform === 'darwin' ? 'cmd+v' : 'ctrl+v';
};
const getExternalEditorKey = () => process.platform === 'darwin' ? 'ctrl+x' : 'ctrl+x';
// Generate shortcuts with translations (called at render time)
const getShortcuts = () => [
    { key: '!', description: t('for shell mode') },
    { key: '/', description: t('for commands') },
    { key: '@', description: t('for file paths') },
    { key: 'esc esc', description: t('to clear input') },
    {
        key: process.platform === 'win32' ? 'tab' : 'shift+tab',
        description: t('to cycle approvals'),
    },
    { key: 'ctrl+c', description: t('to quit') },
    { key: getNewlineKey(), description: t('for newline') + ' ⏎' },
    { key: 'ctrl+l', description: t('to clear screen') },
    { key: 'ctrl+r', description: t('to search history') },
    { key: 'ctrl+y', description: t('to retry last request') },
    { key: getPasteKey(), description: t('to paste images') },
    { key: getExternalEditorKey(), description: t('for external editor') },
    { key: 'ctrl+o', description: t('to toggle compact mode') },
];
const ShortcutItem = ({ shortcut }) => (_jsxs(Text, { color: theme.text.secondary, children: [_jsx(Text, { color: theme.text.accent, children: shortcut.key }), " ", shortcut.description] }));
// Layout constants
const COLUMN_GAP = 4;
const MARGIN_LEFT = 2;
const MARGIN_RIGHT = 2;
// Column distribution for different layouts (5+4+4 for 3 cols, 7+6 for 2 cols)
const COLUMN_SPLITS = {
    3: [5, 4, 4],
    2: [7, 6],
    1: [13],
};
export const KeyboardShortcuts = () => {
    const { columns: terminalWidth } = useTerminalSize();
    const shortcuts = getShortcuts();
    // Helper to calculate width needed for a column layout
    const getShortcutWidth = (shortcut) => shortcut.key.length + 1 + shortcut.description.length;
    const calculateLayoutWidth = (splits) => {
        let startIndex = 0;
        let totalWidth = 0;
        splits.forEach((count, colIndex) => {
            const columnItems = shortcuts.slice(startIndex, startIndex + count);
            const columnWidth = Math.max(...columnItems.map(getShortcutWidth));
            totalWidth += columnWidth;
            if (colIndex < splits.length - 1) {
                totalWidth += COLUMN_GAP;
            }
            startIndex += count;
        });
        return totalWidth;
    };
    // Calculate number of columns based on terminal width and actual content
    const availableWidth = terminalWidth - MARGIN_LEFT - MARGIN_RIGHT;
    const width3Col = calculateLayoutWidth(COLUMN_SPLITS[3]);
    const width2Col = calculateLayoutWidth(COLUMN_SPLITS[2]);
    const numColumns = availableWidth >= width3Col ? 3 : availableWidth >= width2Col ? 2 : 1;
    // Split shortcuts into columns using predefined distribution
    const splits = COLUMN_SPLITS[numColumns];
    const columns = [];
    let startIndex = 0;
    for (const count of splits) {
        columns.push(shortcuts.slice(startIndex, startIndex + count));
        startIndex += count;
    }
    return (_jsx(Box, { flexDirection: "row", marginLeft: MARGIN_LEFT, marginRight: MARGIN_RIGHT, children: columns.map((column, colIndex) => (_jsx(Box, { flexDirection: "column", marginRight: colIndex < numColumns - 1 ? COLUMN_GAP : 0, children: column.map((shortcut) => (_jsx(ShortcutItem, { shortcut: shortcut }, shortcut.key))) }, colIndex))) }));
};
//# sourceMappingURL=KeyboardShortcuts.js.map