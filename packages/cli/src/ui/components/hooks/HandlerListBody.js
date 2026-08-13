import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { HookType } from '@qwen-code/qwen-code-core';
import { getConfigSourceDisplay } from './sourceLabels.js';
import { t } from '../../../i18n/index.js';
export function HandlerListBody({ configs, selectedIndex, }) {
    const { columns: terminalWidth } = useTerminalSize();
    const commandWidth = Math.floor(terminalWidth * 0.65);
    const sourceWidth = Math.floor(terminalWidth * 0.3);
    return (_jsxs(_Fragment, { children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Configured hooks:') }), configs.map((config, index) => {
                const isSelected = index === selectedIndex;
                const sourceDisplay = getConfigSourceDisplay(config);
                const hookDisplay = describeHook(config);
                const typeDisplay = formatTypeDisplay(config);
                return (_jsxs(Box, { children: [_jsxs(Box, { width: commandWidth, children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '❯' : ' ' }) }), _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, bold: isSelected, wrap: "wrap", children: `${index + 1}. [${typeDisplay}] ${hookDisplay}` })] }), _jsx(Box, { width: 2 }), _jsx(Box, { width: sourceWidth, children: _jsx(Text, { color: theme.text.secondary, wrap: "wrap", children: sourceDisplay }) })] }, index));
            }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to select · Esc to go back') }) })] }));
}
function describeHook(info) {
    const { config } = info;
    switch (config.type) {
        case HookType.Command:
            return config.command || '';
        case HookType.Http:
            return config.name || config.url || '';
        case HookType.Function:
            return config.name || config.id || 'function-hook';
        case HookType.Prompt: {
            const promptText = config.prompt || '';
            const maxLength = 50;
            return (config.name ||
                (promptText.length > maxLength
                    ? promptText.slice(0, maxLength) + '...'
                    : promptText));
        }
        default: {
            const _exhaustive = config;
            void _exhaustive;
            return '';
        }
    }
}
function formatTypeDisplay(info) {
    const { config } = info;
    const isAsync = config.type === HookType.Command && config.async === true;
    return isAsync ? `${config.type} async` : String(config.type);
}
//# sourceMappingURL=HandlerListBody.js.map