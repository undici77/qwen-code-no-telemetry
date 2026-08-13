import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { HookEventHeader } from './HookEventHeader.js';
import { formatSourceLabels } from './sourceLabels.js';
import { t } from '../../../i18n/index.js';
export function HookEventMatcherListStep({ hook, selectedIndex, }) {
    const { columns: terminalWidth } = useTerminalSize();
    const leftWidth = Math.floor(terminalWidth * 0.6);
    const hasMatchers = hook.matcherGroups.length > 0;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(HookEventHeader, { title: `${hook.event} - ${t('Matchers')}`, description: hook.description, exitCodes: hook.exitCodes }), hasMatchers ? (_jsxs(_Fragment, { children: [hook.matcherGroups.map((group, index) => {
                        const isSelected = index === selectedIndex;
                        const sourceLabel = formatSourceLabels(group.configs);
                        const count = group.configs.length;
                        const countLabel = count === 1
                            ? t('{{count}} hook', { count: String(count) })
                            : t('{{count}} hooks', { count: String(count) });
                        const rowText = `${index + 1}. [${sourceLabel}] ${group.matcher}`;
                        return (_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '❯' : ' ' }) }), _jsx(Box, { width: leftWidth, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, bold: isSelected, wrap: "wrap", children: rowText }) }), _jsx(Text, { color: theme.text.secondary, children: countLabel })] }, `${group.matcher}-${index}`));
                    }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to select · Esc to go back') }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: t('No hooks configured for this event.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('To add hooks, edit settings.json directly or ask Qwen.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to go back') }) })] }))] }));
}
//# sourceMappingURL=HookEventMatcherListStep.js.map