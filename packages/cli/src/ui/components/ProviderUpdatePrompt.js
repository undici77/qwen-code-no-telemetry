import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
const ProviderDiffSection = ({ entry }) => {
    const { providerLabel, diff } = entry;
    const hasModelChanges = diff.added.length > 0 || diff.removed.length > 0;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.text.secondary, children: providerLabel }), hasModelChanges ? (_jsxs(Box, { flexDirection: "column", children: [diff.added.map((model) => (_jsxs(Text, { color: theme.status.success, children: ['  + ', model] }, model))), diff.removed.map((model) => (_jsxs(Text, { color: theme.status.error, children: ['  - ', model] }, model)))] })) : (_jsxs(Text, { color: theme.text.secondary, children: ['  ', t('Model parameters updated (context window, capabilities, etc.)')] }))] }));
};
export const ProviderUpdatePrompt = ({ entries, onConfirm, }) => {
    const handleKeypress = useCallback((key) => {
        if (key.name === 'escape') {
            onConfirm('later');
        }
    }, [onConfirm]);
    useKeypress(handleKeypress, { isActive: true });
    const affectedEntry = entries.find((e) => e.diff.currentModelAffected);
    const title = entries.length === 1
        ? t('Built-in Provider Update · {{provider}}', {
            provider: entries[0].providerLabel,
        })
        : t('Built-in Provider Updates');
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, children: [_jsx(Text, { bold: true, children: title }), _jsx(Box, { flexDirection: "column", marginTop: 1, gap: 1, children: entries.map((entry) => (_jsx(ProviderDiffSection, { entry: entry }, entry.providerLabel))) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [affectedEntry && (_jsx(Text, { color: theme.status.warning, children: t('Note: Your selected model is being removed. It will switch to "{{model}}" after update.', { model: affectedEntry.diff.fallbackModel ?? '' }) })), _jsx(Text, { color: theme.text.secondary, children: t('Tips: Your credentials will not be modified.') })] }), _jsx(Box, { marginTop: 1, children: _jsx(RadioButtonSelect, { items: [
                        {
                            label: t('Update all'),
                            value: 'update',
                            key: 'update',
                        },
                        {
                            label: t('Skip this version'),
                            value: 'skip',
                            key: 'skip',
                        },
                        {
                            label: t('Remind me later (esc)'),
                            value: 'later',
                            key: 'later',
                        },
                    ], onSelect: onConfirm }) })] }));
};
//# sourceMappingURL=ProviderUpdatePrompt.js.map