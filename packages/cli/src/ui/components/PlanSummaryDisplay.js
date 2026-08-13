import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { MarkdownDisplay } from '../utils/MarkdownDisplay.js';
import { Colors } from '../colors.js';
export const PlanSummaryDisplay = ({ data, availableHeight, childWidth, }) => {
    const { message, plan, rejected } = data;
    const messageColor = rejected ? Colors.AccentYellow : Colors.AccentGreen;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: messageColor, wrap: "wrap", children: message }) }), _jsx(MarkdownDisplay, { text: plan, isPending: false, availableTerminalHeight: availableHeight, contentWidth: childWidth })] }));
};
//# sourceMappingURL=PlanSummaryDisplay.js.map