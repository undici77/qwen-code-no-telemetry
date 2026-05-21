import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box } from 'ink';
import {} from 'react';
import { theme } from '../semantic-colors.js';
import { MarkdownDisplay } from '../utils/MarkdownDisplay.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
export const ConsentPrompt = (props) => {
    const { prompt, onConfirm, terminalWidth } = props;
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, children: [typeof prompt === 'string' ? (_jsx(MarkdownDisplay, { isPending: true, text: prompt, contentWidth: terminalWidth })) : (prompt), _jsx(Box, { marginTop: 1, children: _jsx(RadioButtonSelect, { items: [
                        { label: 'Yes', value: true, key: 'Yes' },
                        { label: 'No', value: false, key: 'No' },
                    ], onSelect: onConfirm }) })] }));
};
//# sourceMappingURL=ConsentPrompt.js.map