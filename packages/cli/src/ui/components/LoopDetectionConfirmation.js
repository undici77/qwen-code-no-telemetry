import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { theme } from '../semantic-colors.js';
export function LoopDetectionConfirmation({ onComplete, }) {
    useKeypress((key) => {
        if (key.name === 'escape') {
            onComplete({
                userSelection: 'keep',
            });
        }
    }, { isActive: true });
    const OPTIONS = [
        {
            label: 'Keep loop detection enabled (esc)',
            value: {
                userSelection: 'keep',
            },
            key: 'Keep loop detection enabled (esc)',
        },
        {
            label: 'Disable loop detection for this session',
            value: {
                userSelection: 'disable',
            },
            key: 'Disable loop detection for this session',
        },
    ];
    return (_jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.status.warning, width: "100%", marginLeft: 1, children: _jsxs(Box, { paddingX: 1, paddingY: 0, flexDirection: "column", children: [_jsxs(Box, { minHeight: 1, children: [_jsx(Box, { minWidth: 3, children: _jsx(Text, { color: theme.status.warning, "aria-label": "Loop detected:", children: "?" }) }), _jsx(Box, { children: _jsxs(Text, { wrap: "truncate-end", children: [_jsx(Text, { color: theme.text.primary, bold: true, children: "A potential loop was detected" }), ' '] }) })] }), _jsx(Box, { width: "100%", marginTop: 1, children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "This can happen due to repetitive tool calls or other model behavior. Do you want to keep loop detection enabled or disable it for this session?" }), _jsx(Box, { marginTop: 1, children: _jsx(RadioButtonSelect, { items: OPTIONS, onSelect: onComplete }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: "Note: To disable loop detection checks for all future sessions, set \"model.skipLoopDetection\" to true in your settings.json." }) })] }) })] }) }));
}
//# sourceMappingURL=LoopDetectionConfirmation.js.map