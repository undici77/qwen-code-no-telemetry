import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
export function HooksDisabledStep({ configuredHooksCount, }) {
    // Note: The i18n t() function expects string parameters (Record<string, string>).
    // Pluralization is handled manually by selecting the appropriate translation key
    // based on the count, since the i18n system doesn't support ICU MessageFormat.
    const hooksText = configuredHooksCount === 1
        ? t('{{count}} configured hook', { count: String(configuredHooksCount) })
        : t('{{count}} configured hooks', {
            count: String(configuredHooksCount),
        });
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.status.warning, children: t('Hook Configuration - Disabled') }) }), _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.primary, children: t('All hooks are currently disabled. You have {{count}} that are not running.', {
                        count: hooksText,
                    }) }) }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('When hooks are disabled:') }), _jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: `  · ${t('No hook commands will execute')}` }) }), _jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: `  · ${t('StatusLine will not be displayed')}` }) }), _jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: `  · ${t('Tool operations will proceed without hook validation')}` }) })] }), _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('To re-enable hooks, remove "disableAllHooks" from settings.json or ask Qwen Code.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to close') }) })] }));
}
//# sourceMappingURL=HooksDisabledStep.js.map