import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import {} from '@qwen-code/qwen-code-core';
import { t } from '../../../../i18n/index.js';
export const ExtensionDetailStep = ({ selectedExtension, }) => {
    if (!selectedExtension) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No extension selected') }) }));
    }
    const ext = selectedExtension;
    const isActive = ext.isActive;
    const activeColor = isActive ? theme.status.success : theme.text.secondary;
    const activeString = isActive ? t('active') : t('disabled');
    // Fixed width for labels to ensure alignment
    const LABEL_WIDTH = 12;
    return (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Name:') }) }), _jsx(Text, { children: ext.name })] }), _jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Version:') }) }), _jsx(Text, { children: ext.version })] }), _jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Status:') }) }), _jsx(Text, { color: activeColor, children: activeString })] }), _jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Path:') }) }), _jsx(Text, { children: ext.path })] }), ext.installMetadata && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Source:') }) }), _jsx(Text, { children: ext.installMetadata.source })] })), ext.mcpServers && Object.keys(ext.mcpServers).length > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('MCP Servers:') }) }), _jsx(Text, { children: Object.keys(ext.mcpServers).join(', ') })] })), ext.commands && ext.commands.length > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Commands:') }) }), _jsx(Text, { children: ext.commands.join(', ') })] })), ext.skills && ext.skills.length > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Skills:') }) }), _jsx(Text, { children: ext.skills.map((s) => s.name).join(', ') })] })), ext.agents && ext.agents.length > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Agents:') }) }), _jsx(Text, { children: ext.agents.map((a) => a.name).join(', ') })] })), ext.resolvedSettings && ext.resolvedSettings.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Box, { width: LABEL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Settings:') }) }), _jsx(Box, { flexDirection: "column", paddingLeft: 2, children: ext.resolvedSettings.map((setting) => (_jsxs(Text, { children: ["- ", setting.name, ": ", setting.value] }, setting.name))) })] }))] }) }));
};
//# sourceMappingURL=ExtensionDetailStep.js.map