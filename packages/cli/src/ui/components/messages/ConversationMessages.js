import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import stringWidth from 'string-width';
import { MarkdownDisplay, } from '../../utils/MarkdownDisplay.js';
import { theme } from '../../semantic-colors.js';
import { SCREEN_READER_MODEL_PREFIX, SCREEN_READER_USER_PREFIX, } from '../../textConstants.js';
import { t } from '../../../i18n/index.js';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { ErrorBoundary } from '../shared/ErrorBoundary.js';
import { ICON } from '../../constants.js';
import { sanitizeTerminalText } from '../../utils/textUtils.js';
import { formatDuration } from '../../utils/displayUtils.js';
import { TerminalImage } from '../TerminalImage.js';
import { formatInlineImageOverflow } from '../../utils/inline-image-parts.js';
const debugLogger = createDebugLogger('THINK_RENDER');
export const THINKING_ICON = `${ICON.THEREFORE} `;
export const THINKING_ICON_PENDING = `${ICON.BECAUSE} `;
export const toggleKeyHint = 'ctrl+o';
function getPrefixWidth(prefix) {
    // Reserve one extra column so text never touches the prefix glyph.
    return stringWidth(prefix) + 1;
}
const PrefixedTextMessage = ({ text, prefix, prefixColor, textColor, ariaLabel, marginTop = 0, alignSelf, }) => {
    const prefixWidth = getPrefixWidth(prefix);
    return (_jsxs(Box, { flexDirection: "row", paddingY: 0, marginTop: marginTop, alignSelf: alignSelf, children: [_jsx(Box, { width: prefixWidth, flexShrink: 0, children: _jsx(Text, { color: prefixColor, "aria-label": ariaLabel, children: prefix }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { wrap: "wrap", color: textColor, children: text }) })] }));
};
const PrefixedMarkdownMessage = ({ text, images, omittedImageCount, prefix, prefixColor, isPending, availableTerminalHeight, contentWidth, ariaLabel, textColor, sourceCopyIndexOffsets, }) => {
    const prefixWidth = getPrefixWidth(prefix);
    const imageHeightBudget = availableTerminalHeight !== undefined && images?.length
        ? Math.max(1, Math.floor(availableTerminalHeight / (images.length + 1)))
        : availableTerminalHeight;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: prefixWidth, flexShrink: 0, children: _jsx(Text, { color: prefixColor, "aria-label": ariaLabel, children: prefix }) }), _jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [text.length > 0 && (_jsx(MarkdownDisplay, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth - prefixWidth, textColor: textColor, sourceCopyIndexOffsets: sourceCopyIndexOffsets })), images?.map((image, index) => (_jsx(TerminalImage, { image: image, contentWidth: contentWidth - prefixWidth, availableTerminalHeight: imageHeightBudget }, index))), omittedImageCount !== undefined && omittedImageCount > 0 && (_jsx(Text, { dimColor: true, children: formatInlineImageOverflow(omittedImageCount) }))] })] }));
};
const ContinuationMarkdownMessage = ({ text, images, omittedImageCount, isPending, availableTerminalHeight, contentWidth, basePrefix, textColor, sourceCopyIndexOffsets, }) => {
    const prefixWidth = getPrefixWidth(basePrefix);
    const imageHeightBudget = availableTerminalHeight !== undefined && images?.length
        ? Math.max(1, Math.floor(availableTerminalHeight / (images.length + 1)))
        : availableTerminalHeight;
    return (_jsxs(Box, { flexDirection: "column", paddingLeft: prefixWidth, children: [text.length > 0 && (_jsx(MarkdownDisplay, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth - prefixWidth, textColor: textColor, sourceCopyIndexOffsets: sourceCopyIndexOffsets })), images?.map((image, index) => (_jsx(TerminalImage, { image: image, contentWidth: contentWidth - prefixWidth, availableTerminalHeight: imageHeightBudget }, index))), omittedImageCount !== undefined && omittedImageCount > 0 && (_jsx(Text, { dimColor: true, children: formatInlineImageOverflow(omittedImageCount) }))] }));
};
export const UserMessage = ({ text }) => (
// The TUI paints no background of its own; user messages render directly on
// the terminal background so they blend in across terminals and themes.
_jsx(PrefixedTextMessage, { text: text, prefix: ">", prefixColor: theme.text.accent, textColor: theme.text.accent, ariaLabel: SCREEN_READER_USER_PREFIX, alignSelf: "flex-start", marginTop: 1 }));
export const UserShellMessage = ({ text }) => {
    const commandToDisplay = text.startsWith('!') ? text.substring(1) : text;
    return (_jsx(PrefixedTextMessage, { text: commandToDisplay, prefix: "$", prefixColor: theme.text.link, textColor: theme.text.primary }));
};
export const AssistantMessage = ({ text, images, omittedImageCount, isPending, availableTerminalHeight, contentWidth, sourceCopyIndexOffsets, }) => (_jsx(PrefixedMarkdownMessage, { text: text, images: images, omittedImageCount: omittedImageCount, prefix: ICON.DIAMOND, prefixColor: theme.text.accent, ariaLabel: SCREEN_READER_MODEL_PREFIX, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth, sourceCopyIndexOffsets: sourceCopyIndexOffsets }));
export const AssistantMessageContent = ({ text, images, omittedImageCount, isPending, availableTerminalHeight, contentWidth, sourceCopyIndexOffsets, }) => (_jsx(ContinuationMarkdownMessage, { text: text, images: images, omittedImageCount: omittedImageCount, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth, basePrefix: ICON.DIAMOND, sourceCopyIndexOffsets: sourceCopyIndexOffsets }));
const BRIEF_THOUGHT_THRESHOLD_MS = 1_000;
const ThinkBody = ({ text, isPending, expanded, availableTerminalHeight, contentWidth }) => {
    if (!expanded)
        return null;
    return (_jsx(Box, { paddingLeft: 2, flexDirection: "column", children: _jsx(ErrorBoundary, { fallback: (err) => (_jsx(Text, { color: theme.text.secondary, dimColor: true, children: sanitizeTerminalText(err.message) })), onError: (error, info) => {
                debugLogger.error(`[THINK_RENDER_ERROR] ${error.message}\n${info.componentStack ?? ''}\n${error.stack ?? ''}`);
            }, children: _jsx(MarkdownDisplay, { text: text, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth - 2, textColor: theme.text.secondary }) }) }));
};
export const ThinkMessage = ({ text, isPending, expanded = false, availableTerminalHeight, contentWidth, durationMs, clickable = false, }) => {
    const durationSuffix = durationMs != null ? ` ${formatDuration(durationMs)}` : '';
    const completedLabel = durationMs == null
        ? null
        : durationMs < BRIEF_THOUGHT_THRESHOLD_MS
            ? t('Thought briefly')
            : `${t('Thought for')} ${formatDuration(durationMs)}`;
    if (!isPending && !expanded) {
        const label = completedLabel ?? t('Thinking');
        const hint = clickable
            ? t('(click or {{keyHint}} to expand)', { keyHint: toggleKeyHint })
            : t('({{keyHint}} to expand)', { keyHint: toggleKeyHint });
        return (_jsxs(Text, { dimColor: true, italic: true, children: [THINKING_ICON, label, " ", hint] }));
    }
    const label = isPending
        ? `${t('Thinking')}…${durationSuffix}`
        : (completedLabel ?? `${t('Thinking')}…`);
    const collapseHint = !isPending && expanded
        ? ` ${t('({{keyHint}} to collapse)', { keyHint: toggleKeyHint })}`
        : '';
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { dimColor: true, italic: true, children: [isPending ? THINKING_ICON_PENDING : THINKING_ICON, label, collapseHint] }), _jsx(ThinkBody, { text: text, isPending: isPending, expanded: expanded, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth })] }));
};
export const ThinkMessageContent = ({ text, isPending, expanded = false, availableTerminalHeight, contentWidth, }) => (_jsx(ThinkBody, { text: text, isPending: isPending, expanded: expanded, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth }));
//# sourceMappingURL=ConversationMessages.js.map