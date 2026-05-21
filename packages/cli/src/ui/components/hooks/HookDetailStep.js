import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { HooksConfigSource, HookType } from '@qwen-code/qwen-code-core';
import { getTranslatedSourceDisplayMap } from './constants.js';
import { t } from '../../../i18n/index.js';
export function HookDetailStep({ hook, selectedIndex, }) {
    const hasConfigs = hook.configs.length > 0;
    const { columns: terminalWidth } = useTerminalSize();
    // Get translated source display map
    const sourceDisplayMap = getTranslatedSourceDisplayMap();
    // Calculate column widths (command: 70%, source: 30%)
    const commandWidth = Math.floor(terminalWidth * 0.65);
    const sourceWidth = Math.floor(terminalWidth * 0.3);
    // Get source display for config list
    const getConfigSourceDisplay = (config) => {
        if (config.source === HooksConfigSource.Extensions) {
            // For extensions, sourceDisplay is the extension name
            return `${sourceDisplayMap[HooksConfigSource.Extensions]} (${config.sourceDisplay})`;
        }
        return sourceDisplayMap[config.source] || config.source;
    };
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.text.primary, children: hook.event }) }), hook.description && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.secondary, children: hook.description }) })), hook.exitCodes.length > 0 && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Exit codes:') }), hook.exitCodes.map((ec, index) => (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: `  ${ec.code}: ${ec.description}` }) }, index)))] })), _jsx(Box, { marginTop: 1 }), hasConfigs ? (_jsxs(_Fragment, { children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Configured hooks:') }), hook.configs.map((config, index) => {
                        const isSelected = index === selectedIndex;
                        const sourceDisplay = getConfigSourceDisplay(config);
                        // Get display text based on hook type
                        let hookDisplay = '';
                        const hookType = config.config.type;
                        if (hookType === HookType.Command) {
                            // For command hook, show command (truncate if too long)
                            hookDisplay = config.config.command || '';
                        }
                        else if (hookType === HookType.Http) {
                            // For http hook, show name or url
                            hookDisplay = config.config.name || config.config.url || '';
                        }
                        else if (hookType === HookType.Function) {
                            // For function hook, show name or id
                            hookDisplay =
                                config.config.name || config.config.id || 'function-hook';
                        }
                        else if (hookType === HookType.Prompt) {
                            // For prompt hook, show name or prompt content (truncated)
                            const promptText = config.config.prompt || '';
                            const maxLength = 50;
                            hookDisplay =
                                config.config.name ||
                                    (promptText.length > maxLength
                                        ? promptText.slice(0, maxLength) + '...'
                                        : promptText);
                        }
                        // Check if this is an async hook (only command hooks support async)
                        const isAsync = hookType === HookType.Command && config.config.async === true;
                        const typeDisplay = isAsync
                            ? `${hookType} async`
                            : String(hookType);
                        return (_jsxs(Box, { children: [_jsxs(Box, { width: commandWidth, children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '❯' : ' ' }) }), _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, bold: isSelected, wrap: "wrap", children: `${index + 1}. [${typeDisplay}] ${hookDisplay}` })] }), _jsx(Box, { width: 2 }), _jsx(Box, { width: sourceWidth, children: _jsx(Text, { color: theme.text.secondary, wrap: "wrap", children: sourceDisplay }) })] }, index));
                    }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to select · Esc to go back') }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: t('No hooks configured for this event.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('To add hooks, edit settings.json directly or ask Qwen.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to go back') }) })] }))] }));
}
//# sourceMappingURL=HookDetailStep.js.map