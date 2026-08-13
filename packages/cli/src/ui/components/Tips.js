import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';
import { getTipHistory, selectTip, tipRegistry, } from '../../services/tips/index.js';
/**
 * Select a startup tip. Extracted as a standalone function for clarity.
 * Called once via useMemo([], ...) — recordShown writes to disk.
 */
function pickStartupTip() {
    const history = getTipHistory();
    const context = {
        lastPromptTokenCount: 0,
        contextWindowSize: 0,
        sessionPromptCount: 0,
        sessionCount: history.sessionCount,
        platform: process.platform,
    };
    const tip = selectTip('startup', context, tipRegistry, history);
    if (tip) {
        history.recordShown(tip.id, 0);
        return tip.content;
    }
    // Fallback — should not happen with the current registry
    return 'Type / to see all available commands.';
}
export const Tips = () => {
    const selectedTip = useMemo(() => pickStartupTip(), []);
    return (_jsx(Box, { marginLeft: 2, marginRight: 2, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Tips:'), " ", t(selectedTip)] }) }));
};
//# sourceMappingURL=Tips.js.map