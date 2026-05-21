import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import {} from '@qwen-code/qwen-code-core';
import { RadioButtonSelect, } from './shared/RadioButtonSelect.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
export function WelcomeBackDialog({ welcomeBackInfo, onSelect, onClose, }) {
    useKeypress((key) => {
        if (key.name === 'escape') {
            onClose();
        }
    }, { isActive: true });
    const options = [
        {
            key: 'restart',
            label: t('Start new chat session'),
            value: 'restart',
        },
        {
            key: 'continue',
            label: t('Continue previous conversation'),
            value: 'continue',
        },
    ];
    // Extract data from welcomeBackInfo
    const { timeAgo, goalContent, totalTasks = 0, doneCount = 0, inProgressCount = 0, pendingTasks = [], } = welcomeBackInfo;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: Colors.AccentBlue, padding: 1, width: "100%", marginLeft: 1, children: [_jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsx(Text, { color: Colors.AccentBlue, bold: true, children: t('👋 Welcome back! (Last updated: {{timeAgo}})', {
                        timeAgo: timeAgo || '',
                    }) }) }), goalContent && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: Colors.Foreground, bold: true, children: t('🎯 Overall Goal:') }), _jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsx(Text, { color: Colors.Gray, children: goalContent }) })] })), totalTasks > 0 && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Text, { color: Colors.Foreground, bold: true, children: ["\uD83D\uDCCB ", t('Current Plan:')] }), _jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsxs(Text, { color: Colors.Gray, children: [t('Progress: {{done}}/{{total}} tasks completed', {
                                    done: String(doneCount),
                                    total: String(totalTasks),
                                }), inProgressCount > 0 &&
                                    t(', {{inProgress}} in progress', {
                                        inProgress: String(inProgressCount),
                                    })] }) }), pendingTasks.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, paddingLeft: 2, children: [_jsx(Text, { color: Colors.Foreground, bold: true, children: t('Pending Tasks:') }), pendingTasks.map((task, index) => (_jsxs(Text, { color: Colors.Gray, children: ["\u2022 ", task] }, index)))] }))] })), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: t('What would you like to do?') }), _jsx(Text, { children: t('Choose how to proceed with your session:') })] }), _jsx(Box, { marginTop: 1, children: _jsx(RadioButtonSelect, { items: options, onSelect: onSelect, isFocused: true }) })] }));
}
//# sourceMappingURL=WelcomeBackDialog.js.map