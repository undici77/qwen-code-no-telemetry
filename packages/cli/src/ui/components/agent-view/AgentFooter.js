import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { AutoAcceptIndicator } from '../AutoAcceptIndicator.js';
import { ContextUsageDisplay } from '../ContextUsageDisplay.js';
import { theme } from '../../semantic-colors.js';
export const AgentFooter = ({ approvalMode, promptTokenCount, contextWindowSize, terminalWidth, }) => {
    const showApproval = approvalMode !== undefined;
    const showContext = promptTokenCount > 0 && contextWindowSize !== undefined;
    if (!showApproval && !showContext) {
        return null;
    }
    return (_jsxs(Box, { justifyContent: "space-between", width: "100%", flexDirection: "row", alignItems: "center", children: [_jsx(Box, { marginLeft: 2, children: showApproval ? (_jsx(AutoAcceptIndicator, { approvalMode: approvalMode })) : null }), _jsx(Box, { marginRight: 2, children: showContext && (_jsx(Text, { color: theme.text.accent, children: _jsx(ContextUsageDisplay, { promptTokenCount: promptTokenCount, terminalWidth: terminalWidth, contextWindowSize: contextWindowSize }) })) })] }));
};
//# sourceMappingURL=AgentFooter.js.map