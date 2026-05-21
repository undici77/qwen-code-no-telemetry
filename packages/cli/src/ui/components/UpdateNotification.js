import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
export const UpdateNotification = ({ message }) => (_jsx(Box, { borderStyle: "round", borderColor: theme.status.warning, paddingX: 1, marginY: 1, children: _jsx(Text, { color: theme.status.warning, children: message }) }));
//# sourceMappingURL=UpdateNotification.js.map