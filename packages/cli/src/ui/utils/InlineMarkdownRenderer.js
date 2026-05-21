import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Text } from 'ink';
import { theme } from '../semantic-colors.js';
import stringWidth from 'string-width';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { renderInlineLatex } from './latexRenderer.js';
import { MD_LINK_CAPTURE, MD_LINK_PATTERN, isSafeOscScheme, labelMayDeceive, osc8Close, osc8Open, sanitizeForOsc, shouldWrapMarkdownLink, supportsHyperlinks, trimTrailingUrlPunctuation, } from './osc8.js';
// Constants for Markdown parsing
const BOLD_MARKER_LENGTH = 2; // For "**"
const ITALIC_MARKER_LENGTH = 1; // For "*" or "_"
const STRIKETHROUGH_MARKER_LENGTH = 2; // For "~~")
const INLINE_CODE_MARKER_LENGTH = 1; // For "`"
const UNDERLINE_TAG_START_LENGTH = 3; // For "<u>"
const UNDERLINE_TAG_END_LENGTH = 4; // For "</u>"
const INLINE_MATH_MARKER_LENGTH = 1; // For "$"
const INLINE_MATH_MAX_CHARS = 1024;
const INLINE_MATH_PATTERN = new RegExp(String.raw `(?<![\w$])\$(?![\s\d$])(?=[^$\n]{1,${INLINE_MATH_MAX_CHARS}}\S\$)[^$\n]{1,${INLINE_MATH_MAX_CHARS}}\$(?![\w$])`, 'g');
const INLINE_MARKDOWN_REGEX = new RegExp(String.raw `(\*\*.*?\*\*|\*.*?\*|_.*?_|~~.*?~~|${MD_LINK_PATTERN}|` +
    String.raw `\`+.+?\`+|<u>.*?<\/u>|https?:\/\/\S+)`, 'g');
const INLINE_MARKDOWN_WITH_MATH_REGEX = new RegExp(String.raw `(\*\*.*?\*\*|\*.*?\*|_.*?_|~~.*?~~|${MD_LINK_PATTERN}|` +
    String.raw `\`+.+?\`+|(?<![\w$])\$(?![\s\d$])(?=[^$\n]{1,${INLINE_MATH_MAX_CHARS}}\S\$)[^$\n]{1,${INLINE_MATH_MAX_CHARS}}\$(?![\w$])|<u>.*?<\/u>|https?:\/\/\S+)`, 'g');
const debugLogger = createDebugLogger('INLINE_MARKDOWN');
const RenderInlineInternal = ({ text, textColor = theme.text.primary, enableInlineMath = false, }) => {
    // Early return for plain text without markdown or URLs
    if (!/[*_~`<[]|https?:/.test(text) &&
        !(enableInlineMath && text.includes('$'))) {
        return _jsx(Text, { color: textColor, children: text });
    }
    const nodes = [];
    let lastIndex = 0;
    // Capability is stable for the duration of a single render — read it once
    // here so each matched link/URL doesn't re-walk the env-var table.
    const canHyperlink = supportsHyperlinks();
    const inlineRegex = enableInlineMath
        ? INLINE_MARKDOWN_WITH_MATH_REGEX
        : INLINE_MARKDOWN_REGEX;
    inlineRegex.lastIndex = 0;
    let match;
    while ((match = inlineRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(_jsx(Text, { children: text.slice(lastIndex, match.index) }, `t-${lastIndex}`));
        }
        const fullMatch = match[0];
        let renderedNode = null;
        const key = `m-${match.index}`;
        try {
            if (fullMatch.startsWith('**') &&
                fullMatch.endsWith('**') &&
                fullMatch.length > BOLD_MARKER_LENGTH * 2) {
                renderedNode = (_jsx(Text, { bold: true, children: fullMatch.slice(BOLD_MARKER_LENGTH, -BOLD_MARKER_LENGTH) }, key));
            }
            else if (fullMatch.length > ITALIC_MARKER_LENGTH * 2 &&
                ((fullMatch.startsWith('*') && fullMatch.endsWith('*')) ||
                    (fullMatch.startsWith('_') && fullMatch.endsWith('_'))) &&
                !/\w/.test(text.substring(match.index - 1, match.index)) &&
                !/\w/.test(text.substring(inlineRegex.lastIndex, inlineRegex.lastIndex + 1)) &&
                !/\S[./\\]/.test(text.substring(match.index - 2, match.index)) &&
                !/[./\\]\S/.test(text.substring(inlineRegex.lastIndex, inlineRegex.lastIndex + 2))) {
                renderedNode = (_jsx(Text, { italic: true, children: fullMatch.slice(ITALIC_MARKER_LENGTH, -ITALIC_MARKER_LENGTH) }, key));
            }
            else if (fullMatch.startsWith('~~') &&
                fullMatch.endsWith('~~') &&
                fullMatch.length > STRIKETHROUGH_MARKER_LENGTH * 2) {
                renderedNode = (_jsx(Text, { strikethrough: true, children: fullMatch.slice(STRIKETHROUGH_MARKER_LENGTH, -STRIKETHROUGH_MARKER_LENGTH) }, key));
            }
            else if (fullMatch.startsWith('`') &&
                fullMatch.endsWith('`') &&
                fullMatch.length > INLINE_CODE_MARKER_LENGTH) {
                const codeMatch = fullMatch.match(/^(`+)(.+?)\1$/s);
                if (codeMatch && codeMatch[2]) {
                    renderedNode = (_jsx(Text, { color: theme.text.code, children: codeMatch[2] }, key));
                }
            }
            else if (fullMatch.startsWith('[') &&
                fullMatch.includes('](') &&
                fullMatch.endsWith(')')) {
                const linkMatch = fullMatch.match(MD_LINK_CAPTURE);
                if (linkMatch) {
                    const linkText = linkMatch[1] ?? '';
                    const url = linkMatch[2] ?? '';
                    const wrapOsc8 = shouldWrapMarkdownLink(url, canHyperlink);
                    // When OSC 8 is active, render ONLY the markdown label — the
                    // clickable target lives in the envelope, so repeating a long URL
                    // in plain text would just clutter the output. Empty labels
                    // (`[](url)`) fall back to showing the URL so the link stays
                    // discoverable.
                    //
                    // When OSC 8 is NOT active (unsupported terminal, unsafe scheme,
                    // whitespace in URL) we emit byte-identical legacy `label (url)`
                    // rendering so the user can still read and copy the target.
                    // The label is rendered inside the clickable region, so any bidi /
                    // C0 / C1 byte the model embedded would still spoof the visible
                    // text even though the OSC target is sanitized. Run the same
                    // sanitizer over both the visible label AND any URL bytes that
                    // end up as visible text (empty-label fallback, anti-deception
                    // `(url)` suffix) when OSC 8 is active. The legacy `label (url)`
                    // branch leaves both intact so today's unsupported-terminal
                    // output stays byte-identical.
                    const safeLabel = wrapOsc8 ? sanitizeForOsc(linkText) : linkText;
                    const safeUrl = wrapOsc8 ? sanitizeForOsc(url) : url;
                    // Keep the `(url)` suffix visible when the label itself looks
                    // like a (mismatched) URL — pre-OSC-8 rendering always showed the
                    // target; eliding it now would let `[https://google.com](https://attacker.com)`
                    // present a clickable "google.com" that resolves elsewhere.
                    const showUrlSuffix = wrapOsc8 && labelMayDeceive(safeLabel, safeUrl);
                    renderedNode = wrapOsc8 ? (_jsxs(Text, { children: [_jsxs(Text, { color: theme.text.link, children: [osc8Open(url), safeLabel || safeUrl, osc8Close()] }), showUrlSuffix ? (_jsxs(Text, { color: theme.text.link, children: [" (", safeUrl, ")"] })) : null] }, key)) : (_jsxs(Text, { children: [linkText, _jsxs(Text, { color: theme.text.link, children: [" (", url, ")"] })] }, key));
                }
            }
            else if (fullMatch.startsWith('<u>') &&
                fullMatch.endsWith('</u>') &&
                fullMatch.length >
                    UNDERLINE_TAG_START_LENGTH + UNDERLINE_TAG_END_LENGTH - 1 // -1 because length is compared to combined length of start and end tags
            ) {
                renderedNode = (_jsx(Text, { underline: true, children: fullMatch.slice(UNDERLINE_TAG_START_LENGTH, -UNDERLINE_TAG_END_LENGTH) }, key));
            }
            else if (enableInlineMath &&
                fullMatch.startsWith('$') &&
                fullMatch.endsWith('$') &&
                fullMatch.length > INLINE_MATH_MARKER_LENGTH * 2) {
                renderedNode = (_jsx(Text, { color: theme.text.accent, children: renderInlineLatex(fullMatch.slice(INLINE_MATH_MARKER_LENGTH, -INLINE_MATH_MARKER_LENGTH)) }, key));
            }
            else if (fullMatch.match(/^https?:\/\//)) {
                // The bare-URL regex greedily eats trailing punctuation (`.`, `)`,
                // `,`, …). Trim that off the OSC 8 *target* so the clickable link
                // resolves correctly, while leaving the visible bytes unchanged so
                // unsupported terminals see today's output exactly. The bare-URL
                // alternative is anchored on `https?://`, so `isSafeOscScheme` is
                // redundant but kept as a cheap defense-in-depth assertion.
                const trimmedUrl = canHyperlink
                    ? trimTrailingUrlPunctuation(fullMatch)
                    : fullMatch;
                const wrapOsc8 = canHyperlink && isSafeOscScheme(trimmedUrl);
                renderedNode = (_jsxs(Text, { color: theme.text.link, children: [wrapOsc8 ? osc8Open(trimmedUrl) : null, fullMatch, wrapOsc8 ? osc8Close() : null] }, key));
            }
        }
        catch (e) {
            debugLogger.error('Error parsing inline markdown part:', fullMatch, e);
            renderedNode = null;
        }
        nodes.push(renderedNode ?? _jsx(Text, { children: fullMatch }, key));
        lastIndex = inlineRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        nodes.push(_jsx(Text, { children: text.slice(lastIndex) }, `t-${lastIndex}`));
    }
    return _jsx(_Fragment, { children: nodes.filter((node) => node !== null) });
};
export const RenderInline = React.memo(RenderInlineInternal);
/**
 * Utility function to get the plain text length of a string with markdown formatting
 * This is useful for calculating column widths in tables
 */
export const getPlainTextLength = (text, enableInlineMath = false) => {
    const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(INLINE_MATH_PATTERN, (match) => enableInlineMath
        ? renderInlineLatex(match.slice(INLINE_MATH_MARKER_LENGTH, -INLINE_MATH_MARKER_LENGTH))
        : match)
        .replace(/<u>(.*?)<\/u>/g, '$1')
        .replace(/.*\[(.*?)\]\(.*\)/g, '$1');
    return stringWidth(cleanText);
};
//# sourceMappingURL=InlineMarkdownRenderer.js.map