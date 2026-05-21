import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { RadioButtonSelect } from './components/shared/RadioButtonSelect.js';
import { useKeypress } from './hooks/useKeypress.js';
import { theme } from './semantic-colors.js';
import { t } from '../i18n/index.js';
export function CommandFormatMigrationNudge({ tomlFiles, onComplete, }) {
    useKeypress((key) => {
        if (key.name === 'escape') {
            onComplete({
                userSelection: 'no',
            });
        }
    }, { isActive: true });
    const OPTIONS = [
        {
            label: t('Yes'),
            value: {
                userSelection: 'yes',
            },
            key: 'Yes',
        },
        {
            label: t('No (esc)'),
            value: {
                userSelection: 'no',
            },
            key: 'No (esc)',
        },
    ];
    const count = tomlFiles.length;
    const fileList = count <= 3
        ? tomlFiles.map((f) => `  • ${f}`).join('\n')
        : `  • ${tomlFiles.slice(0, 2).join('\n  • ')}\n  • ${t('... and {{count}} more', { count: String(count - 2) })}`;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.status.warning, padding: 1, width: "100%", marginLeft: 1, children: [_jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsxs(Text, { children: [_jsx(Text, { color: theme.status.warning, children: '⚠️  ' }), _jsx(Text, { bold: true, children: t('Command Format Migration') })] }), _jsx(Text, { color: theme.text.secondary, children: count > 1
                            ? t('Found {{count}} TOML command files:', { count: String(count) })
                            : t('Found {{count}} TOML command file:', { count: String(count) }) }), _jsx(Text, { color: theme.text.secondary, children: fileList }), _jsx(Text, { children: '' }), _jsx(Text, { color: theme.text.secondary, children: t('The TOML format is deprecated. Would you like to migrate them to Markdown format?') }), _jsx(Text, { color: theme.text.secondary, children: t('(Backups will be created and original files will be preserved)') })] }), _jsx(RadioButtonSelect, { items: OPTIONS, onSelect: onComplete })] }));
}
//# sourceMappingURL=CommandFormatMigrationNudge.js.map