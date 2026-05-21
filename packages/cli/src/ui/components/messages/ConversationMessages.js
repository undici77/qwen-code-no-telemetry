import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import stringWidth from 'string-width';
import { MarkdownDisplay, } from '../../utils/MarkdownDisplay.js';
import { theme } from '../../semantic-colors.js';
import { SCREEN_READER_MODEL_PREFIX, SCREEN_READER_USER_PREFIX, } from '../../textConstants.js';
function getPrefixWidth(prefix) {
    // Reserve one extra column so text never touches the prefix glyph.
    return stringWidth(prefix) + 1;
}
const PrefixedTextMessage = ({ text, prefix, prefixColor, textColor, ariaLabel, marginTop = 0, alignSelf, }) => {
    const prefixWidth = getPrefixWidth(prefix);
    return (_jsxs(Box, { flexDirection: "row", paddingY: 0, marginTop: marginTop, alignSelf: alignSelf, children: [_jsx(Box, { width: prefixWidth, children: _jsx(Text, { color: prefixColor, "aria-label": ariaLabel, children: prefix }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { wrap: "wrap", color: textColor, children: text }) })] }));
};
const PrefixedMarkdownMessage = ({ text, prefix, prefixColor, isPending, availableTerminalHeight, contentWidth, ariaLabel, textColor, sourceCopyIndexOffsets, }) => {
    const prefixWidth = getPrefixWidth(prefix);
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: prefixWidth, children: _jsx(Text, { color: prefixColor, "aria-label": ariaLabel, children: prefix }) }), _jsx(Box, { flexGrow: 1, flexDirection: "column", children: _jsx(MarkdownDisplay, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth - prefixWidth, textColor: textColor, sourceCopyIndexOffsets: sourceCopyIndexOffsets }) })] }));
};
const ContinuationMarkdownMessage = ({ text, isPending, availableTerminalHeight, contentWidth, basePrefix, textColor, sourceCopyIndexOffsets, }) => {
    const prefixWidth = getPrefixWidth(basePrefix);
    return (_jsx(Box, { flexDirection: "column", paddingLeft: prefixWidth, children: _jsx(MarkdownDisplay, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth - prefixWidth, textColor: textColor, sourceCopyIndexOffsets: sourceCopyIndexOffsets }) }));
};
export const UserMessage = ({ text }) => (_jsx(PrefixedTextMessage, { text: text, prefix: ">", prefixColor: theme.text.accent, textColor: theme.text.accent, ariaLabel: SCREEN_READER_USER_PREFIX, alignSelf: "flex-start" }));
export const UserShellMessage = ({ text }) => {
    const commandToDisplay = text.startsWith('!') ? text.substring(1) : text;
    return (_jsx(PrefixedTextMessage, { text: commandToDisplay, prefix: "$", prefixColor: theme.text.link, textColor: theme.text.primary }));
};
export const AssistantMessage = ({ text, isPending, availableTerminalHeight, contentWidth, sourceCopyIndexOffsets, }) => (_jsx(PrefixedMarkdownMessage, { text: text, prefix: "\u2726", prefixColor: theme.text.accent, ariaLabel: SCREEN_READER_MODEL_PREFIX, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth, sourceCopyIndexOffsets: sourceCopyIndexOffsets }));
export const AssistantMessageContent = ({ text, isPending, availableTerminalHeight, contentWidth, sourceCopyIndexOffsets, }) => (_jsx(ContinuationMarkdownMessage, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth, basePrefix: "\u2726", sourceCopyIndexOffsets: sourceCopyIndexOffsets }));
export const ThinkMessage = ({ text, isPending, availableTerminalHeight, contentWidth, }) => (_jsx(PrefixedMarkdownMessage, { text: text, prefix: "\u2726", prefixColor: theme.text.secondary, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth, textColor: theme.text.secondary }));
export const ThinkMessageContent = ({ text, isPending, availableTerminalHeight, contentWidth, }) => (_jsx(ContinuationMarkdownMessage, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth, basePrefix: "\u2726", textColor: theme.text.secondary }));
//# sourceMappingURL=ConversationMessages.js.map