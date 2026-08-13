import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import {} from 'react';
import { theme } from '../semantic-colors.js';
import { MarkdownDisplay } from '../utils/MarkdownDisplay.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { t } from '../../i18n/index.js';
import { clampDialogHeight } from '../utils/layoutUtils.js';
// Border, vertical padding, option margin, and two Yes/No option rows.
const CONSENT_PROMPT_CHROME_ROWS = 7;
export const ConsentPrompt = (props) => {
    const { prompt, onConfirm, terminalWidth, availableTerminalHeight } = props;
    const constrainedHeight = clampDialogHeight(availableTerminalHeight);
    const availablePromptRows = constrainedHeight === undefined
        ? undefined
        : Math.max(1, constrainedHeight - CONSENT_PROMPT_CHROME_ROWS);
    const showPromptTruncationNotice = typeof prompt === 'string' &&
        availablePromptRows !== undefined &&
        availablePromptRows <= 2;
    const promptHeight = availablePromptRows === undefined
        ? undefined
        : Math.max(1, availablePromptRows - (showPromptTruncationNotice ? 1 : 0));
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, height: constrainedHeight, overflow: "hidden", children: [_jsx(Box, { flexDirection: "column", flexShrink: 1, overflow: "hidden", children: typeof prompt === 'string' ? (_jsx(MarkdownDisplay, { isPending: true, text: prompt, contentWidth: terminalWidth, ...(promptHeight !== undefined
                        ? { availableTerminalHeight: promptHeight }
                        : {}) })) : (prompt) }), showPromptTruncationNotice && (_jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: t('Content truncated - resize terminal to review') })), _jsx(Box, { marginTop: 1, flexShrink: 0, children: _jsx(RadioButtonSelect, { items: [
                        { label: 'Yes', value: true, key: 'Yes' },
                        { label: 'No', value: false, key: 'No' },
                    ], onSelect: onConfirm }) })] }));
};
//# sourceMappingURL=ConsentPrompt.js.map