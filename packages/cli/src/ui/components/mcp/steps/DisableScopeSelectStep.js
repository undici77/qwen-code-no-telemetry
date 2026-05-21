import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { t } from '../../../../i18n/index.js';
export const DisableScopeSelectStep = ({ server, onSelectScope, onBack, }) => {
    const [selectedScope, setSelectedScope] = useState('user');
    const scopes = [
        {
            key: 'user',
            get label() {
                return t('User Settings (global)');
            },
            value: 'user',
        },
        {
            key: 'workspace',
            get label() {
                return t('Workspace Settings (project-specific)');
            },
            value: 'workspace',
        },
    ];
    useKeypress((key) => {
        if (key.name === 'escape') {
            onBack();
        }
        else if (key.name === 'return') {
            onSelectScope(selectedScope);
        }
    }, { isActive: true });
    if (!server) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No server selected') }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: theme.text.primary, children: [t('Disable server:'), " ", server.name] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Select where to add the server to the exclude list:') }) })] }), _jsx(Box, { marginTop: 1, children: _jsx(RadioButtonSelect, { items: scopes, onHighlight: (value) => setSelectedScope(value), onSelect: (value) => onSelectScope(value) }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Press Enter to confirm, Esc to cancel') }) })] }));
};
//# sourceMappingURL=DisableScopeSelectStep.js.map