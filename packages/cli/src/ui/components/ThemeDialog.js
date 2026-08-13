import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { themeManager, DEFAULT_THEME, AUTO_THEME_NAME, } from '../themes/theme-manager.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { DiffRenderer } from './messages/DiffRenderer.js';
import { colorizeCode } from '../utils/CodeColorizer.js';
import { SettingScope } from '../../config/settings.js';
import { getScopeMessageForSetting } from '../../utils/dialogScopeUtils.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { ScopeSelector } from './shared/ScopeSelector.js';
import { t } from '../../i18n/index.js';
export function ThemeDialog({ onSelect, onHighlight, settings, availableTerminalHeight, terminalWidth, }) {
    const [selectedScope, setSelectedScope] = useState(SettingScope.User);
    // Track the currently highlighted theme name. An unset theme means
    // auto-detection is in effect, so reflect that by highlighting Auto.
    const [highlightedThemeName, setHighlightedThemeName] = useState(settings.merged.ui?.theme || AUTO_THEME_NAME);
    // Generate theme items filtered by selected scope
    const customThemes = selectedScope === SettingScope.User
        ? settings.user.settings.ui?.customThemes || {}
        : settings.merged.ui?.customThemes || {};
    const builtInThemes = themeManager
        .getAvailableThemes()
        .filter((theme) => theme.type !== 'custom');
    const customThemeNames = Object.keys(customThemes);
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    // Generate theme items with "Auto" at the top
    const themeItems = [
        {
            label: t('Auto (detect terminal theme)'),
            value: AUTO_THEME_NAME,
            themeNameDisplay: t('Auto'),
            themeTypeDisplay: t('Auto'),
            key: AUTO_THEME_NAME,
        },
        ...builtInThemes.map((theme) => ({
            label: theme.name,
            value: theme.name,
            themeNameDisplay: theme.name,
            themeTypeDisplay: capitalize(theme.type),
            key: theme.name,
        })),
        ...customThemeNames.map((name) => ({
            label: name,
            value: name,
            themeNameDisplay: name,
            themeTypeDisplay: t('Custom'),
            key: name,
        })),
    ];
    // Find the index of the selected theme, but only if it exists in the list
    const initialThemeIndex = themeItems.findIndex((item) => item.value === highlightedThemeName);
    // If not found, fall back to the first theme
    const safeInitialThemeIndex = initialThemeIndex >= 0 ? initialThemeIndex : 0;
    const handleThemeSelect = useCallback((themeName) => {
        onSelect(themeName, selectedScope);
    }, [onSelect, selectedScope]);
    const handleThemeHighlight = (themeName) => {
        setHighlightedThemeName(themeName);
        onHighlight(themeName);
    };
    const handleScopeHighlight = useCallback((scope) => {
        setSelectedScope(scope);
    }, []);
    const handleScopeSelect = useCallback((scope) => {
        onSelect(highlightedThemeName, scope);
    }, [onSelect, highlightedThemeName]);
    const [mode, setMode] = useState('theme');
    useKeypress((key) => {
        if (key.name === 'tab') {
            setMode((prev) => (prev === 'theme' ? 'scope' : 'theme'));
        }
        if (key.name === 'escape') {
            onSelect(undefined, selectedScope);
        }
    }, { isActive: true });
    // Generate scope message for theme setting
    const otherScopeModifiedMessage = getScopeMessageForSetting('ui.theme', selectedScope, settings);
    // Constants for calculating preview pane layout.
    // These values are based on the JSX structure below.
    const PREVIEW_PANE_WIDTH_PERCENTAGE = 0.55;
    // A safety margin to prevent text from touching the border.
    // This is a complete hack unrelated to the 0.9 used in App.tsx
    const PREVIEW_PANE_WIDTH_SAFETY_MARGIN = 0.9;
    // Combined horizontal padding from the dialog and preview pane.
    const TOTAL_HORIZONTAL_PADDING = 4;
    const colorizeCodeWidth = Math.max(Math.floor((terminalWidth - TOTAL_HORIZONTAL_PADDING) *
        PREVIEW_PANE_WIDTH_PERCENTAGE *
        PREVIEW_PANE_WIDTH_SAFETY_MARGIN), 1);
    const DIALOG_PADDING = 2;
    const selectThemeHeight = themeItems.length + 1;
    const TAB_TO_SELECT_HEIGHT = 2;
    availableTerminalHeight = availableTerminalHeight ?? Number.MAX_SAFE_INTEGER;
    availableTerminalHeight -= 2; // Top and bottom borders.
    availableTerminalHeight -= TAB_TO_SELECT_HEIGHT;
    let totalLeftHandSideHeight = DIALOG_PADDING + selectThemeHeight;
    let includePadding = true;
    // Remove content from the LHS that can be omitted if it exceeds the available height.
    if (totalLeftHandSideHeight > availableTerminalHeight) {
        includePadding = false;
        totalLeftHandSideHeight -= DIALOG_PADDING;
    }
    // Vertical space taken by elements other than the two code blocks in the preview pane.
    // Includes "Preview" title, borders, and margin between blocks.
    const PREVIEW_PANE_FIXED_VERTICAL_SPACE = 8;
    // The right column doesn't need to ever be shorter than the left column.
    availableTerminalHeight = Math.max(availableTerminalHeight, totalLeftHandSideHeight);
    const availableTerminalHeightCodeBlock = availableTerminalHeight -
        PREVIEW_PANE_FIXED_VERTICAL_SPACE -
        (includePadding ? 2 : 0) * 2;
    // Subtract margin between code blocks from available height.
    const availableHeightForPanes = Math.max(0, availableTerminalHeightCodeBlock - 1);
    // The code block is slightly longer than the diff, so give it more space.
    const codeBlockHeight = Math.ceil(availableHeightForPanes * 0.6);
    const diffHeight = Math.floor(availableHeightForPanes * 0.4);
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingTop: includePadding ? 1 : 0, paddingBottom: includePadding ? 1 : 0, paddingLeft: 1, paddingRight: 1, width: "100%", children: [mode === 'theme' ? (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Box, { flexDirection: "column", width: "45%", paddingRight: 2, children: [_jsxs(Text, { bold: mode === 'theme', wrap: "truncate", children: [mode === 'theme' ? '> ' : '  ', t('Select Theme'), ' ', _jsx(Text, { color: theme.text.secondary, children: otherScopeModifiedMessage })] }), _jsx(RadioButtonSelect, { items: themeItems, initialIndex: safeInitialThemeIndex, onSelect: handleThemeSelect, onHighlight: handleThemeHighlight, isFocused: mode === 'theme', maxItemsToShow: 12, showScrollArrows: true, showNumbers: mode === 'theme' })] }), _jsxs(Box, { flexDirection: "column", width: "55%", paddingLeft: 2, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Preview') }), (() => {
                                // For 'auto', show the currently resolved theme (set by onHighlight → applyTheme)
                                const previewTheme = highlightedThemeName === AUTO_THEME_NAME
                                    ? themeManager.getActiveTheme()
                                    : themeManager.getTheme(highlightedThemeName || DEFAULT_THEME.name) || DEFAULT_THEME;
                                return (_jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, paddingTop: includePadding ? 1 : 0, paddingBottom: includePadding ? 1 : 0, paddingLeft: 1, paddingRight: 1, flexDirection: "column", children: [colorizeCode(`# function
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`, 'python', codeBlockHeight, colorizeCodeWidth), _jsx(Box, { marginTop: 1 }), _jsx(DiffRenderer, { diffContent: `--- a/util.py
+++ b/util.py
@@ -1,2 +1,2 @@
- print("Hello, " + name)
+ print(f"Hello, {name}!")
`, availableTerminalHeight: diffHeight, contentWidth: colorizeCodeWidth, theme: previewTheme, settings: settings })] }));
                            })()] })] })) : (_jsx(ScopeSelector, { onSelect: handleScopeSelect, onHighlight: handleScopeHighlight, isFocused: mode === 'scope', initialScope: selectedScope })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: mode === 'theme'
                        ? t('(Use Enter to select, Tab to configure scope)')
                        : t('(Use Enter to apply scope, Tab to go back)') }) })] }));
}
//# sourceMappingURL=ThemeDialog.js.map