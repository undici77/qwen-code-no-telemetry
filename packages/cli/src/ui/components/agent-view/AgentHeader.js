import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { shortenPath, tildeifyPath } from '@qwen-code/qwen-code-core';
import { theme } from '../../semantic-colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
export const AgentHeader = ({ modelId, modelName, workingDirectory, gitBranch, }) => {
    const { columns: terminalWidth } = useTerminalSize();
    const maxPathLen = Math.max(20, terminalWidth - 12);
    const displayPath = shortenPath(tildeifyPath(workingDirectory), maxPathLen);
    const modelText = modelName && modelName !== modelId ? `${modelId} (${modelName})` : modelId;
    return (_jsxs(Box, { flexDirection: "column", marginX: 2, marginTop: 1, borderStyle: "round", borderColor: theme.border.default, paddingX: 1, children: [_jsxs(Text, { children: [_jsx(Text, { color: theme.text.secondary, children: 'Model:  ' }), _jsx(Text, { color: theme.text.primary, children: modelText })] }), _jsxs(Text, { children: [_jsx(Text, { color: theme.text.secondary, children: 'Path:   ' }), _jsx(Text, { color: theme.text.primary, children: displayPath })] }), gitBranch && (_jsxs(Text, { children: [_jsx(Text, { color: theme.text.secondary, children: 'Branch: ' }), _jsx(Text, { color: theme.text.primary, children: gitBranch })] }))] }));
};
//# sourceMappingURL=AgentHeader.js.map