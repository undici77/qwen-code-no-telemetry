import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import Spinner from 'ink-spinner';
export const InsightProgressMessage = ({ progress, }) => {
    const { stage, progress: percent, isComplete, error } = progress;
    const width = 30;
    const completedWidth = Math.round((percent / 100) * width);
    const remainingWidth = width - completedWidth;
    const bar = '█'.repeat(Math.max(0, completedWidth)) +
        '░'.repeat(Math.max(0, remainingWidth));
    if (error) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: theme.status.error, children: ["\u2715 ", stage] }), _jsx(Text, { color: theme.text.secondary, children: error })] }));
    }
    if (isComplete) {
        return (_jsx(Box, { flexDirection: "row", children: _jsxs(Text, { color: theme.status.success, children: ["\u2713 ", stage] }) }));
    }
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: theme.text.accent, children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { children: " " }), _jsxs(Text, { color: theme.text.secondary, children: [bar, " "] }), _jsxs(Text, { color: theme.text.accent, children: [stage, progress.detail ? ` (${progress.detail})` : ''] })] }));
};
//# sourceMappingURL=InsightProgressMessage.js.map