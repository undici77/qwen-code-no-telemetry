import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolConfirmationOutcome } from '@qwen-code/qwen-code-core';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { MaxSizedBox } from './shared/MaxSizedBox.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
import { clampDialogHeight } from '../utils/layoutUtils.js';
// Border, title, subtitle, question, and option rows that must remain visible.
const SHELL_CONFIRMATION_FIXED_ROWS = 9;
const MIN_HEIGHT_WITH_HIDDEN_COMMAND_OPTIONS = 8;
export const ShellConfirmationDialog = ({ request, availableTerminalHeight, contentWidth = 80 }) => {
    const { commands, onConfirm } = request;
    const constrainedHeight = clampDialogHeight(availableTerminalHeight);
    const commandPreviewHeight = constrainedHeight === undefined
        ? undefined
        : constrainedHeight >= SHELL_CONFIRMATION_FIXED_ROWS + 2
            ? Math.max(2, constrainedHeight - SHELL_CONFIRMATION_FIXED_ROWS)
            : 0;
    const commandsHidden = constrainedHeight !== undefined &&
        commandPreviewHeight === 0 &&
        commands.length > 0;
    const commandApprovalUnavailable = commandsHidden &&
        constrainedHeight !== undefined &&
        constrainedHeight < MIN_HEIGHT_WITH_HIDDEN_COMMAND_OPTIONS;
    const compactHiddenCommandsLayout = commandsHidden && constrainedHeight <= SHELL_CONFIRMATION_FIXED_ROWS;
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
    const visibleOptions = commandApprovalUnavailable
        ? options.filter((option) => option.value === ToolConfirmationOutcome.Cancel)
        : options;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.status.warning, paddingX: 1, paddingY: constrainedHeight === undefined ? 1 : 0, width: "100%", marginLeft: 1, height: constrainedHeight, overflow: "hidden", children: [_jsx(Text, { bold: true, color: theme.text.primary, wrap: "truncate", children: t('Shell Command Execution') }), !compactHiddenCommandsLayout && (_jsx(Text, { color: theme.text.primary, wrap: "truncate", children: t('A custom command wants to run the following shell commands:') })), constrainedHeight === undefined ? (_jsx(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1, flexShrink: 1, children: _jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, paddingX: 1, children: commands.map((cmd) => (_jsx(Text, { color: theme.text.link, children: cmd }, cmd))) }) })) : commandPreviewHeight !== undefined && commandPreviewHeight > 0 ? (_jsx(Box, { flexDirection: "column", flexShrink: 1, children: _jsx(MaxSizedBox, { maxHeight: commandPreviewHeight, maxWidth: Math.max(1, contentWidth - 8), overflowDirection: "top", children: commands.map((cmd) => (_jsx(Box, { children: _jsx(Text, { color: theme.text.link, children: cmd }) }, cmd))) }) })) : commandsHidden ? (_jsxs(Text, { color: theme.status.warning, wrap: "truncate", children: [commands.length, ' ', t('shell commands hidden - resize terminal to review')] })) : null, !compactHiddenCommandsLayout && (_jsx(Box, { marginBottom: constrainedHeight === undefined ? 1 : 0, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, children: t('Do you want to proceed?') }) })), _jsx(Box, { flexShrink: 0, children: _jsx(RadioButtonSelect, { items: visibleOptions, onSelect: handleSelect, isFocused: true }) })] }));
};
//# sourceMappingURL=ShellConfirmationDialog.js.map