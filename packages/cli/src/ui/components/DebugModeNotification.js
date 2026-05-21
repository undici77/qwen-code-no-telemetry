import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { Storage, isDebugLoggingDegraded } from '@qwen-code/qwen-code-core';
import { useConfig } from '../contexts/ConfigContext.js';
import { theme } from '../semantic-colors.js';
/**
 * Displays debug mode status and log file path when debug mode is enabled.
 */
export const DebugModeNotification = () => {
    const config = useConfig();
    if (!config.getDebugMode()) {
        return null;
    }
    const logPath = Storage.getDebugLogPath(config.getSessionId());
    const isDegraded = isDebugLoggingDegraded();
    return (_jsxs(Box, { paddingX: 1, marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.status.warning, children: "Debug mode enabled" }), _jsxs(Text, { dimColor: true, children: ["Logging to: ", logPath] }), isDegraded && (_jsx(Text, { dimColor: true, children: "Warning: Debug logging is degraded (write failures occurred)" }))] }));
};
//# sourceMappingURL=DebugModeNotification.js.map