import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import {} from '@qwen-code/qwen-code-core';
import { theme } from '../../../semantic-colors.js';
import { t } from '../../../../i18n/index.js';
export function ScopeSelectStep({ selectedExtension, mode, onScopeSelect, }) {
    const scopeItems = [
        {
            key: 'user',
            get label() {
                return t('User (global)');
            },
            value: 'user',
        },
        {
            key: 'workspace',
            get label() {
                return t('Workspace (project-specific)');
            },
            value: 'workspace',
        },
    ];
    const handleSelect = (value) => {
        onScopeSelect(value);
    };
    if (!selectedExtension) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No extension selected') }) }));
    }
    const title = mode === 'disable'
        ? t('Disable "{{name}}" - Select Scope', { name: selectedExtension.name })
        : t('Enable "{{name}}" - Select Scope', { name: selectedExtension.name });
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.text.primary, children: title }), _jsx(Box, { children: _jsx(RadioButtonSelect, { items: scopeItems, onSelect: handleSelect, showNumbers: false }) })] }));
}
//# sourceMappingURL=ScopeSelectStep.js.map