import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
export function HookEventHeader({ title, description, exitCodes, }) {
    return (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.text.primary, children: title }) }), description && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.secondary, children: description }) })), _jsx(ExitCodesBlock, { exitCodes: exitCodes })] }));
}
function ExitCodesBlock({ exitCodes, }) {
    if (exitCodes.length === 0)
        return null;
    return (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: exitCodes.map((ec, index) => {
            const label = typeof ec.code === 'number'
                ? `${t('Exit code')} ${ec.code}`
                : `${t('Other exit codes')}`;
            return (_jsx(Box, { children: _jsxs(Text, { color: theme.text.secondary, children: [label, " - ", ec.description] }) }, index));
        }) }));
}
//# sourceMappingURL=HookEventHeader.js.map