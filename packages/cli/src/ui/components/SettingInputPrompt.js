import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { useState } from 'react';
import { theme } from '../semantic-colors.js';
import { TextInput } from './shared/TextInput.js';
import { t } from '../../i18n/index.js';
import { useKeypress } from '../hooks/useKeypress.js';
import chalk from 'chalk';
/**
 * A simple password input component that masks the input with asterisks.
 */
const PasswordInput = ({ value, onChange, onSubmit, placeholder, }) => {
    useKeypress((key) => {
        // Handle submit
        if (key.name === 'return') {
            onSubmit();
            return;
        }
        // Handle backspace
        if (key.name === 'backspace' || key.name === 'delete') {
            onChange(value.slice(0, -1));
            return;
        }
        // Handle clear (Ctrl+U)
        if (key.ctrl && key.name === 'u') {
            onChange('');
            return;
        }
        // Handle printable characters
        if (key.sequence && !key.ctrl && !key.meta && key.sequence.length === 1) {
            const charCode = key.sequence.charCodeAt(0);
            // Only accept printable ASCII characters (32-126)
            if (charCode >= 32 && charCode <= 126) {
                onChange(value + key.sequence);
            }
        }
    }, { isActive: true });
    const maskedValue = '*'.repeat(value.length);
    const displayValue = maskedValue || '';
    const cursorChar = chalk.inverse(' ');
    return (_jsxs(Box, { children: [_jsx(Text, { color: theme.text.accent, children: '> ' }), value.length === 0 ? (_jsxs(Text, { children: [cursorChar, _jsx(Text, { dimColor: true, children: placeholder.slice(1) })] })) : (_jsxs(Text, { children: [displayValue, cursorChar] }))] }));
};
export const SettingInputPrompt = (props) => {
    const { settingName, settingDescription, sensitive, onSubmit, onCancel, terminalWidth, } = props;
    const [value, setValue] = useState('');
    useKeypress((key) => {
        if (key.name === 'escape') {
            onCancel();
        }
    }, { isActive: true });
    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value);
        }
    };
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: settingName }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: settingDescription }) }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: sensitive ? (_jsx(PasswordInput, { value: value, onChange: setValue, onSubmit: handleSubmit, placeholder: t('Enter sensitive value...') })) : (_jsx(TextInput, { value: value, onChange: setValue, onSubmit: handleSubmit, placeholder: t('Enter value...'), inputWidth: Math.min(terminalWidth - 10, 60), isActive: true })) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('Press Enter to submit, Escape to cancel') }) })] }));
};
//# sourceMappingURL=SettingInputPrompt.js.map