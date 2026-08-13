import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box } from 'ink';
import { useUIState } from '../contexts/UIStateContext.js';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
export const QuittingDisplay = () => {
    const uiState = useUIState();
    const { rows: terminalHeight, columns: terminalWidth } = useTerminalSize();
    const availableTerminalHeight = terminalHeight;
    const { mainAreaWidth } = uiState;
    if (!uiState.quittingMessages) {
        return null;
    }
    return (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: uiState.quittingMessages.map((item) => (_jsx(HistoryItemDisplay, { availableTerminalHeight: uiState.constrainHeight ? availableTerminalHeight : undefined, terminalWidth: terminalWidth, mainAreaWidth: mainAreaWidth, item: item, isPending: false }, item.id))) }));
};
//# sourceMappingURL=QuittingDisplay.js.map