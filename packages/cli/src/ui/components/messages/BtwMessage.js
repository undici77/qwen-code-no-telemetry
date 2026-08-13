import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';
import { t } from '../../../i18n/index.js';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// border(1)*2 + paddingX(1)*2 = 4
const BTW_SELF_CHROME = 4;
/**
 * Ensure code fences (``` or ~~~) start on their own line so that
 * MarkdownDisplay's line-based parser can detect them.  Models sometimes
 * emit the opening fence right after prose text without a preceding newline.
 */
function normalizeCodeFences(text) {
    return text.replace(/([^\n])(```|~~~)/g, '$1\n$2');
}
const BtwMessageInternal = ({ btw, containerWidth, }) => {
    const { columns: terminalWidth } = useTerminalSize();
    const baseWidth = containerWidth ?? terminalWidth;
    const contentWidth = Math.max(2, baseWidth - BTW_SELF_CHROME);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: Colors.AccentYellow, paddingX: 1, width: "100%", children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: Colors.AccentYellow, bold: true, children: '/btw ' }), _jsx(Text, { wrap: "wrap", color: Colors.AccentYellow, children: btw.question })] }), btw.isPending ? (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: Colors.AccentYellow, children: '+ ' }), _jsx(Text, { color: Colors.AccentYellow, children: t('Answering...') })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('Press Escape, Ctrl+C, or Ctrl+D to cancel') }) })] })) : (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(MarkdownDisplay, { text: normalizeCodeFences(btw.answer), isPending: false, contentWidth: contentWidth }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('Press Space, Enter, or Escape to dismiss') }) })] }))] }));
};
export const BtwMessage = React.memo(BtwMessageInternal);
//# sourceMappingURL=BtwMessage.js.map