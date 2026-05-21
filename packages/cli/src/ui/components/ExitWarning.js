import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useUIState } from '../contexts/UIStateContext.js';
import { theme } from '../semantic-colors.js';
export const ExitWarning = () => {
    const uiState = useUIState();
    return (_jsxs(_Fragment, { children: [uiState.dialogsVisible && uiState.ctrlCPressedOnce && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.warning, children: "Press Ctrl+C again to exit." }) })), uiState.dialogsVisible && uiState.ctrlDPressedOnce && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.warning, children: "Press Ctrl+D again to exit." }) }))] }));
};
//# sourceMappingURL=ExitWarning.js.map