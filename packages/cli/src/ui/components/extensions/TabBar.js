import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
import { EXTENSIONS_TABS, } from './types.js';
// Literal t() calls keep the labels extractable for translation.
function tabLabel(id) {
    switch (id) {
        case EXTENSIONS_TABS.DISCOVER:
            return t('Discover');
        case EXTENSIONS_TABS.INSTALLED:
            return t('Installed');
        case EXTENSIONS_TABS.SOURCES:
            return t('Sources');
        default:
            return id;
    }
}
export const TabBar = ({ tabs, activeTab, canSwitch }) => (_jsxs(Box, { children: [tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (_jsx(Box, { marginRight: 2, children: isActive ? (_jsx(Text, { bold: true, backgroundColor: theme.text.accent, color: theme.background.primary, children: ` ${tabLabel(tab.id)} ` })) : (_jsx(Text, { color: theme.text.secondary, children: ` ${tabLabel(tab.id)} ` })) }, tab.id));
        }), _jsx(Text, { color: theme.text.secondary, dimColor: !canSwitch, children: t('(Tab / ←→ to switch)') })] }));
//# sourceMappingURL=TabBar.js.map