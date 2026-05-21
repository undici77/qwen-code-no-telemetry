import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import {} from '@qwen-code/qwen-code-core';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { t } from '../../../../i18n/index.js';
const debugLogger = createDebugLogger('EXTENSION_UNINSTALL_STEP');
export function UninstallConfirmStep({ selectedExtension, onConfirm, onNavigateBack, }) {
    useKeypress(async (key) => {
        if (!selectedExtension)
            return;
        if (key.name === 'y' || key.name === 'return') {
            try {
                await onConfirm(selectedExtension);
                // Navigation will be handled by the parent component after successful uninstall
            }
            catch (error) {
                debugLogger.error('Failed to uninstall extension:', error);
            }
        }
        else if (key.name === 'n' || key.name === 'escape') {
            onNavigateBack();
        }
    }, { isActive: true });
    if (!selectedExtension) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No extension selected') }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.status.error, children: t('Are you sure you want to uninstall extension "{{name}}"?', {
                    name: selectedExtension.name,
                }) }), _jsx(Text, { color: theme.text.secondary, children: t('This action cannot be undone.') })] }));
}
//# sourceMappingURL=UninstallConfirmStep.js.map