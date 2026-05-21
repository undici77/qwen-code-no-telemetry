import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { t } from '../../../i18n/index.js';
export function HooksListStep({ hooks, selectedIndex, }) {
    const { columns: terminalWidth } = useTerminalSize();
    // Calculate responsive width for hook name column (min 20, max 35)
    const hookNameWidth = Math.min(35, Math.max(20, Math.floor(terminalWidth * 0.25)));
    if (hooks.length === 0) {
        return (_jsx(Box, { flexDirection: "column", paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('No hook events found.') }) }));
    }
    // Calculate total configured hooks
    const totalConfigured = hooks.reduce((sum, hook) => sum + hook.configs.length, 0);
    // Get the correct plural/singular form
    const hooksConfiguredText = totalConfigured === 1
        ? t('{{count}} hook configured', { count: String(totalConfigured) })
        : t('{{count}} hooks configured', { count: String(totalConfigured) });
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Hooks') }), _jsx(Text, { color: theme.text.secondary, children: ` · ${hooksConfiguredText}` })] }), _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('This menu is read-only. To add or modify hooks, edit settings.json directly or ask Qwen Code.') }) }), hooks.map((hook, index) => {
                const isSelected = index === selectedIndex;
                const configCount = hook.configs.length;
                const maxDigits = String(hooks.length).length;
                const paddedIndex = String(index + 1).padStart(maxDigits);
                return (_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '❯' : ' ' }) }), _jsx(Box, { width: hookNameWidth, children: _jsxs(Text, { color: isSelected ? theme.text.accent : theme.text.primary, bold: isSelected, children: [paddedIndex, ". ", hook.event, configCount > 0 && (_jsxs(Text, { color: theme.status.success, children: [" (", configCount, ")"] }))] }) }), _jsx(Text, { color: theme.text.secondary, children: hook.shortDescription })] }, hook.event));
            }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to select · Esc to cancel') }) })] }));
}
//# sourceMappingURL=HooksListStep.js.map