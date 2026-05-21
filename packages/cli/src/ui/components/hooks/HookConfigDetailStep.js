import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { HooksConfigSource } from '@qwen-code/qwen-code-core';
import { t } from '../../../i18n/index.js';
export function HookConfigDetailStep({ hookEvent, hookConfig, }) {
    const { columns: terminalWidth } = useTerminalSize();
    // Get source display
    const getSourceDisplay = () => {
        switch (hookConfig.source) {
            case HooksConfigSource.Project:
                return t('Local Settings');
            case HooksConfigSource.User:
                return t('User Settings');
            case HooksConfigSource.System:
                return t('System Settings');
            case HooksConfigSource.Extensions:
                return t('Extensions');
            default:
                return hookConfig.source;
        }
    };
    // Check if this is from an extension
    const isFromExtension = hookConfig.source === HooksConfigSource.Extensions;
    // Get hook type display
    const getHookTypeDisplay = () => {
        switch (hookConfig.config.type) {
            case 'command':
                return 'command';
            default:
                return hookConfig.config.type;
        }
    };
    // Get command to display
    const getCommand = () => {
        if (hookConfig.config.type === 'command') {
            return hookConfig.config.command;
        }
        return '';
    };
    // Get prompt to display
    const getPrompt = () => {
        if (hookConfig.config.type === 'prompt') {
            return hookConfig.config.prompt;
        }
        return '';
    };
    // Get URL to display
    const getUrl = () => {
        if (hookConfig.config.type === 'http') {
            return hookConfig.config.url;
        }
        return '';
    };
    // Calculate box width for command display
    const commandBoxWidth = Math.min(terminalWidth - 6, 80);
    // Label width for alignment (Extension: is the longest label)
    const labelWidth = 12;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Hook details') }) }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Event:') }) }), _jsx(Text, { color: theme.text.primary, children: hookEvent.event })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Type:') }) }), _jsx(Text, { color: theme.text.primary, children: getHookTypeDisplay() })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Source:') }) }), _jsx(Text, { color: theme.text.primary, children: getSourceDisplay() }), hookConfig.sourcePath && (_jsxs(Text, { color: theme.text.secondary, children: [" (", hookConfig.sourcePath, ")"] }))] }), isFromExtension && hookConfig.sourceDisplay && (_jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Extension:') }) }), _jsx(Text, { color: theme.text.primary, children: hookConfig.sourceDisplay })] })), hookConfig.config.name && (_jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Name:') }) }), _jsx(Text, { color: theme.text.primary, children: hookConfig.config.name })] })), hookConfig.config.description && (_jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Desc:') }) }), _jsx(Text, { color: theme.text.primary, children: hookConfig.config.description })] })), hookConfig.config.type === 'command' && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Command:') }) }), _jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, paddingX: 1, width: commandBoxWidth, children: _jsx(Text, { color: theme.text.primary, children: getCommand() }) })] })), hookConfig.config.type === 'prompt' && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Prompt:') }) }), _jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, paddingX: 1, width: commandBoxWidth, children: _jsx(Text, { color: theme.text.primary, children: getPrompt() }) })] })), hookConfig.config.type === 'http' && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('URL:') }) }), _jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, paddingX: 1, width: commandBoxWidth, children: _jsx(Text, { color: theme.text.primary, children: getUrl() }) })] })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('To modify or remove this hook, edit settings.json directly or ask Qwen to help.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to go back') }) })] }));
}
//# sourceMappingURL=HookConfigDetailStep.js.map