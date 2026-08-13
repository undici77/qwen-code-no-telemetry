import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import Link from 'ink-link';
import stringWidth from 'string-width';
import { theme } from '../../semantic-colors.js';
import { ICON } from '../../constants.js';
import { RenderInline } from '../../utils/InlineMarkdownRenderer.js';
/**
 * Shared renderer for status-like history messages (info/warning/error/retry).
 * Keeps prefix spacing and wrapping behavior consistent across variants.
 */
export const StatusMessage = ({ text, prefix, prefixColor, textColor, children, footer, }) => {
    if ((!text || text.trim() === '') && !footer) {
        return null;
    }
    const prefixWidth = stringWidth(prefix) + 1;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: prefixWidth, flexShrink: 0, children: _jsx(Text, { color: prefixColor, children: prefix }) }), _jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [text && text.trim() !== '' && (_jsxs(Text, { wrap: "wrap", color: textColor, children: [_jsx(RenderInline, { text: text }), children] })), footer] })] }));
};
export const InfoMessage = ({ text, linkUrl, linkText, }) => (_jsx(StatusMessage, { text: text, prefix: ICON.CIRCLE_FILLED, prefixColor: theme.text.primary, textColor: theme.text.primary, footer: linkUrl && (_jsx(Link, { url: linkUrl, children: _jsx(Text, { color: theme.text.link, underline: true, children: linkText ?? linkUrl }) })) }));
export const SuccessMessage = ({ text }) => (_jsx(StatusMessage, { text: text, prefix: "\u2713", prefixColor: theme.status.success, textColor: theme.status.success }));
export const WarningMessage = ({ text }) => (_jsx(StatusMessage, { text: text, prefix: ICON.TRIANGLE, prefixColor: theme.status.warning, textColor: theme.status.warning }));
export const ErrorMessage = ({ text, hint, }) => (_jsx(StatusMessage, { text: text, prefix: "\u2715", prefixColor: theme.status.error, textColor: theme.status.error, children: hint && _jsxs(Text, { color: theme.text.secondary, children: [" (", hint, ")"] }) }));
export const RetryCountdownMessage = ({ text }) => (_jsx(StatusMessage, { text: text, prefix: "\u21BB", prefixColor: theme.text.secondary, textColor: theme.text.secondary }));
// Dim, tip-style notice for the vision bridge. The ◎ sits in the gutter as the
// sole prefix (the message text no longer carries its own glyph), and the body
// is rendered in secondary color so the disclosure reads as a hint rather than
// a primary INFO line.
export const VisionNoticeMessage = ({ text }) => (_jsx(StatusMessage, { text: text, prefix: ICON.BULLSEYE, prefixColor: theme.text.secondary, textColor: theme.text.secondary }));
// Mirrors Claude Code's away-summary rendering: a `※` prefix in a fixed
// 2-column gutter, then bold "recap: " label and italic content, all
// dim-colored. Rendered as a regular history item so it scrolls with
// the conversation instead of pinning above the input.
export const AwayRecapMessage = ({ text }) => (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: 2, flexShrink: 0, children: _jsx(Text, { color: theme.text.secondary, children: ICON.REFERENCE }) }), _jsxs(Text, { wrap: "wrap", children: [_jsxs(Text, { color: theme.text.secondary, bold: true, children: ["recap:", ' '] }), _jsx(Text, { color: theme.text.secondary, italic: true, children: text })] })] }));
//# sourceMappingURL=StatusMessages.js.map