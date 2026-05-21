import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { formatMemoryUsage } from '../utils/formatters.js';
import { theme } from '../semantic-colors.js';
import { MaxSizedBox } from './shared/MaxSizedBox.js';
const DEFAULT_HEIGHT = 24;
export const AnsiOutputText = ({ data, availableTerminalHeight, maxWidth, }) => {
    const lastLines = data.slice(-(availableTerminalHeight && availableTerminalHeight > 0
        ? availableTerminalHeight
        : DEFAULT_HEIGHT));
    return (_jsx(MaxSizedBox, { maxHeight: availableTerminalHeight, maxWidth: maxWidth, children: lastLines.map((line, lineIndex) => (_jsx(Box, { children: line.length > 0
                ? line.map((token, tokenIndex) => (_jsx(Text, { color: token.inverse ? token.bg : token.fg, backgroundColor: token.inverse ? token.fg : token.bg, dimColor: token.dim, bold: token.bold, italic: token.italic, underline: token.underline, wrap: "truncate", children: token.text }, tokenIndex)))
                : null }, lineIndex))) }));
};
export const ShellStatsBar = ({ totalLines, totalBytes, displayHeight = DEFAULT_HEIGHT, }) => {
    const parts = [];
    if (totalLines && totalLines > displayHeight) {
        parts.push(`+${totalLines - displayHeight} lines`);
    }
    if (totalBytes && totalBytes > 0) {
        parts.push(formatMemoryUsage(totalBytes));
    }
    if (parts.length === 0)
        return null;
    return (_jsx(Box, { flexDirection: "row", gap: 1, children: parts.map((part, i) => (_jsx(Text, { color: theme.text.secondary, children: part }, i))) }));
};
//# sourceMappingURL=AnsiOutput.js.map