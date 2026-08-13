import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { redactUrlCredentials, } from '@qwen-code/qwen-code-core';
import { t } from '../../../../i18n/index.js';
import { stripUnsafeCharacters } from '../../../utils/textUtils.js';
const LABEL_WIDTH = 14;
const InfoRow = ({ label, children, }) => (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: label }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { children: children }) })] }));
function componentSummary(ext) {
    const parts = [];
    const mcpCount = ext.mcpServers ? Object.keys(ext.mcpServers).length : 0;
    if (mcpCount)
        parts.push(t('{{count}} MCP', { count: String(mcpCount) }));
    if (ext.skills?.length)
        parts.push(t('{{count}} Skills', { count: String(ext.skills.length) }));
    if (ext.commands?.length)
        parts.push(t('{{count}} Commands', { count: String(ext.commands.length) }));
    if (ext.agents?.length)
        parts.push(t('{{count}} Agents', { count: String(ext.agents.length) }));
    return parts.length ? parts.join(' · ') : t('None');
}
export const PluginDetailView = ({ extension, scope, isFavorite, hasUpdateAvailable, isFocused, showFavorite = true, onAction, }) => {
    const ext = extension;
    const isActive = ext.isActive;
    const actions = useMemo(() => {
        const items = [
            {
                key: 'toggle',
                label: isActive ? t('Disable') : t('Enable'),
                value: 'toggle',
            },
            ...(showFavorite
                ? [
                    {
                        key: 'favorite',
                        label: isFavorite
                            ? t('Remove from Favorites')
                            : t('Add to Favorites'),
                        value: 'favorite',
                    },
                ]
                : []),
            {
                key: 'change-scope',
                label: t('Change scope'),
                value: 'change-scope',
            },
            {
                key: 'mark-update',
                label: t('Mark for Update'),
                value: 'mark-update',
            },
            ...(hasUpdateAvailable
                ? [{ key: 'update', label: t('Update Now'), value: 'update' }]
                : []),
            {
                key: 'uninstall',
                label: t('Uninstall'),
                value: 'uninstall',
            },
        ];
        return items;
    }, [isActive, isFavorite, hasUpdateAvailable, showFavorite]);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(InfoRow, { label: t('Name:'), children: ext.name }), _jsx(InfoRow, { label: t('Version:'), children: stripUnsafeCharacters(ext.version ?? '') }), _jsx(InfoRow, { label: t('Scope:'), children: scope }), _jsxs(InfoRow, { label: t('Status:'), children: [_jsx(Text, { color: isActive ? theme.status.success : theme.text.secondary, children: isActive ? t('active') : t('disabled') }), isFavorite ? _jsx(Text, { color: theme.status.warning, children: " \u2605" }) : null] }), ext.installMetadata && (_jsx(InfoRow, { label: t('Source:'), children: redactUrlCredentials(ext.installMetadata.source) })), ext.installMetadata?.originSource && (_jsx(InfoRow, { label: t('Origin:'), children: ext.installMetadata.originSource })), _jsx(InfoRow, { label: t('Components:'), children: componentSummary(ext) })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('Actions') }), _jsx(RadioButtonSelect, { items: actions, isFocused: isFocused, showNumbers: false, onSelect: onAction })] })] }));
};
//# sourceMappingURL=PluginDetailView.js.map