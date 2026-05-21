import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { relaunchApp } from '../../utils/processUtils.js';
import {} from '../hooks/useIdeTrustListener.js';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
const debugLogger = createDebugLogger('IDE_TRUST_DIALOG');
export const IdeTrustChangeDialog = ({ reason }) => {
    useKeypress((key) => {
        if (key.name === 'r' || key.name === 'R') {
            relaunchApp();
        }
    }, { isActive: true });
    let message = 'Workspace trust has changed.';
    if (reason === 'NONE') {
        // This should not happen, but provides a fallback and a debug log.
        debugLogger.error('IdeTrustChangeDialog rendered with unexpected reason "NONE"');
    }
    else if (reason === 'CONNECTION_CHANGE') {
        message =
            'Workspace trust has changed due to a change in the IDE connection.';
    }
    else if (reason === 'TRUST_CHANGE') {
        message = 'Workspace trust has changed due to a change in the IDE trust.';
    }
    return (_jsx(Box, { borderStyle: "round", borderColor: theme.status.warning, paddingX: 1, children: _jsxs(Text, { color: theme.status.warning, children: [message, " Press 'r' to restart Gemini to apply the changes."] }) }));
};
//# sourceMappingURL=IdeTrustChangeDialog.js.map