import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolConfirmationOutcome } from '@qwen-code/qwen-code-core';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { RenderInline } from '../utils/InlineMarkdownRenderer.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
export const ShellConfirmationDialog = ({ request }) => {
    const { commands, onConfirm } = request;
    useKeypress((key) => {
        if (key.name === 'escape') {
            onConfirm(ToolConfirmationOutcome.Cancel);
        }
    }, { isActive: true });
    const handleSelect = (item) => {
        if (item === ToolConfirmationOutcome.Cancel) {
            onConfirm(item);
        }
        else {
            // For both ProceedOnce and ProceedAlways, we approve all the
            // commands that were requested.
            onConfirm(item, commands);
        }
    };
    const options = [
        {
            label: t('Yes, allow once'),
            value: ToolConfirmationOutcome.ProceedOnce,
            key: 'Yes, allow once',
        },
        {
            label: t('Always allow in this project'),
            value: ToolConfirmationOutcome.ProceedAlwaysProject,
            key: 'Always allow in this project',
        },
        {
            label: t('Always allow for this user'),
            value: ToolConfirmationOutcome.ProceedAlwaysUser,
            key: 'Always allow for this user',
        },
        {
            label: t('No (esc)'),
            value: ToolConfirmationOutcome.Cancel,
            key: 'No (esc)',
        },
    ];
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.status.warning, padding: 1, width: "100%", marginLeft: 1, children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Shell Command Execution') }), _jsx(Text, { color: theme.text.primary, children: t('A custom command wants to run the following shell commands:') }), _jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, paddingX: 1, marginTop: 1, children: commands.map((cmd) => (_jsx(Text, { color: theme.text.link, children: _jsx(RenderInline, { text: cmd }) }, cmd))) })] }), _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.primary, children: t('Do you want to proceed?') }) }), _jsx(RadioButtonSelect, { items: options, onSelect: handleSelect, isFocused: true })] }));
};
//# sourceMappingURL=ShellConfirmationDialog.js.map