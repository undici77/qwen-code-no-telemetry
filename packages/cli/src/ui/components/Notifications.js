import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { useAppContext } from '../contexts/AppContext.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { theme } from '../semantic-colors.js';
import { StreamingState } from '../types.js';
import { UpdateNotification } from './UpdateNotification.js';
export const Notifications = () => {
    const { startupWarnings } = useAppContext();
    const { initError, streamingState, updateInfo } = useUIState();
    const showStartupWarnings = startupWarnings.length > 0;
    const showInitError = initError && streamingState !== StreamingState.Responding;
    return (_jsxs(_Fragment, { children: [updateInfo && _jsx(UpdateNotification, { message: updateInfo.message }), showStartupWarnings && (_jsx(Box, { borderStyle: "round", borderColor: theme.status.warning, paddingX: 1, marginY: 1, flexDirection: "column", children: startupWarnings.map((warning, index) => (_jsx(Text, { color: theme.status.warning, children: warning }, index))) })), showInitError && (_jsxs(Box, { borderStyle: "round", borderColor: theme.status.error, paddingX: 1, marginBottom: 1, children: [_jsxs(Text, { color: theme.status.error, children: ["Initialization Error: ", initError] }), _jsxs(Text, { color: theme.status.error, children: [' ', "Please check API key and configuration."] })] }))] }));
};
//# sourceMappingURL=Notifications.js.map