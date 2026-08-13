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
import { BARE_URL_PATTERN, MD_LINK_CAPTURE, MD_LINK_PATTERN, isSafeOscScheme, labelMayDeceive, osc8Close, osc8Open, sanitizeForOsc, shouldWrapMarkdownLink, supportsHyperlinks, trimTrailingUrlPunctuation, } from './osc8.js';
import { INLINE_CODE_SPAN_PATTERN_SOURCE, mergeInlineMathMatches, unescapeMarkdownBeforeMath, unescapeMarkdownDollars, } from './inline-math.js';
// Constants for Markdown parsing
const BOLD_MARKER_LENGTH = 2; // For "**"
const ITALIC_MARKER_LENGTH = 1; // For "*" or "_"
const STRIKETHROUGH_MARKER_LENGTH = 2; // For "~~")
const INLINE_CODE_MARKER_LENGTH = 1; // For "`"
const UNDERLINE_TAG_START_LENGTH = 3; // For "<u>"
const UNDERLINE_TAG_END_LENGTH = 4; // For "</u>"
const INLINE_MARKDOWN_REGEX = new RegExp(String.raw `(\*\*.*?\*\*|\*.*?\*|(?<![\w\u3400-\u9fff])_(?!_)[^_]*_(?![\w\u3400-\u9fff])|~~.*?~~|${MD_LINK_PATTERN}|` +
    String.raw `${INLINE_CODE_SPAN_PATTERN_SOURCE}|<u>.*?<\/u>|${BARE_URL_PATTERN})`, 'g');
const debugLogger = createDebugLogger('INLINE_MARKDOWN');
const RenderInlineInternal = ({ text, textColor = theme.text.primary, enableInlineMath = false, }) => {
    // Early return for plain text without markdown or URLs
    if (!/[*_~`<[]|https?:/.test(text) &&
        !(enableInlineMath && text.includes('$')) &&
        !text.includes('\\$')) {
        return _jsx(Text, { color: textColor, children: text });
    }
    const nodes = [];
    let lastIndex = 0;
    // Capability is stable for the duration of a single render — read it once
    // here so each matched link/URL doesn't re-walk the env-var table.
    const canHyperlink = supportsHyperlinks();
    for (const token of mergeInlineMathMatches(text, INLINE_MARKDOWN_REGEX, enableInlineMath)) {
        const index = token.kind === 'math' ? token.span.index : (token.match.index ?? 0);
        if (index > lastIndex) {
            const prose = text.slice(lastIndex, index);
            nodes.push(_jsx(Text, { children: token.kind === 'math'
                    ? unescapeMarkdownBeforeMath(prose)
                    : unescapeMarkdownDollars(prose) }, `t-${lastIndex}`));
        }
        if (token.kind === 'math') {
            nodes.push(_jsx(Text, { color: theme.text.accent, children: renderInlineLatex(unescapeMarkdownDollars(token.span.content)) }, `m-${index}`));
            lastIndex = index + token.span.raw.length;
            continue;
        }
        const match = token.match;
        const fullMatch = match[0];
        let renderedNode = null;
        const key = `m-${index}`;
        try {
            if (fullMatch.startsWith('**') &&
                fullMatch.endsWith('**') &&
                fullMatch.length > BOLD_MARKER_LENGTH * 2) {
                renderedNode = (_jsx(Text, { bold: true, children: unescapeMarkdownDollars(fullMatch.slice(BOLD_MARKER_LENGTH, -BOLD_MARKER_LENGTH)) }, key));
            }
            else if (fullMatch.length > ITALIC_MARKER_LENGTH * 2 &&
                ((fullMatch.startsWith('*') && fullMatch.endsWith('*')) ||
                    (fullMatch.startsWith('_') && fullMatch.endsWith('_'))) &&
                !/\w/.test(text.substring(index - 1, index)) &&
                !/\w/.test(text.substring(index + fullMatch.length, index + fullMatch.length + 1)) &&
                !/\S[./\\]/.test(text.substring(index - 2, index)) &&
                !/[./\\]\S/.test(text.substring(index + fullMatch.length, index + fullMatch.length + 2))) {
                renderedNode = (_jsx(Text, { italic: true, children: unescapeMarkdownDollars(fullMatch.slice(ITALIC_MARKER_LENGTH, -ITALIC_MARKER_LENGTH)) }, key));
            }
            else if (fullMatch.startsWith('~~') &&
                fullMatch.endsWith('~~') &&
                fullMatch.length > STRIKETHROUGH_MARKER_LENGTH * 2) {
                renderedNode = (_jsx(Text, { strikethrough: true, children: unescapeMarkdownDollars(fullMatch.slice(STRIKETHROUGH_MARKER_LENGTH, -STRIKETHROUGH_MARKER_LENGTH)) }, key));
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
                    const renderedLinkText = unescapeMarkdownDollars(linkText);
                    const safeLabel = wrapOsc8
                        ? sanitizeForOsc(renderedLinkText)
                        : renderedLinkText;
                    const safeUrl = wrapOsc8 ? sanitizeForOsc(url) : url;
                    // Keep the `(url)` suffix visible when the label itself looks
                    // like a (mismatched) URL — pre-OSC-8 rendering always showed the
                    // target; eliding it now would let `[https://google.com](https://attacker.com)`
                    // present a clickable "google.com" that resolves elsewhere.
                    const showUrlSuffix = wrapOsc8 && labelMayDeceive(safeLabel, safeUrl);
                    renderedNode = wrapOsc8 ? (_jsxs(Text, { children: [_jsxs(Text, { color: theme.text.link, children: [osc8Open(url), safeLabel || safeUrl, osc8Close()] }), showUrlSuffix ? (_jsxs(Text, { color: theme.text.link, children: [" (", safeUrl, ")"] })) : null] }, key)) : (_jsxs(Text, { children: [renderedLinkText, _jsxs(Text, { color: theme.text.link, children: [" (", url, ")"] })] }, key));
                }
            }
            else if (fullMatch.startsWith('<u>') &&
                fullMatch.endsWith('</u>') &&
                fullMatch.length >
                    UNDERLINE_TAG_START_LENGTH + UNDERLINE_TAG_END_LENGTH - 1 // -1 because length is compared to combined length of start and end tags
            ) {
                renderedNode = (_jsx(Text, { underline: true, children: unescapeMarkdownDollars(fullMatch.slice(UNDERLINE_TAG_START_LENGTH, -UNDERLINE_TAG_END_LENGTH)) }, key));
            }
            else if (fullMatch.match(/^https?:\/\//)) {
                // The bare-URL regex greedily eats trailing punctuation (`.`, `)`,
                // `,`, …). Trim that off the OSC 8 *target* so the clickable link
                // resolves correctly, while leaving the visible bytes unchanged so
                // unsupported terminals see today's output exactly. The bare-URL
                // alternative is anchored on `https?://`, so `isSafeOscScheme` is
                // redundant but kept as a cheap defense-in-depth assertion.
                const trimmedUrl = canHyperlink
                    ? trimTrailingUrlPunctuation(fullMatch, text[index + fullMatch.length])
                    : fullMatch;
                const wrapOsc8 = canHyperlink && isSafeOscScheme(trimmedUrl);
                renderedNode = (_jsxs(Text, { color: theme.text.link, children: [wrapOsc8 ? osc8Open(trimmedUrl) : null, fullMatch, wrapOsc8 ? osc8Close() : null] }, key));
            }
        }
        catch (e) {
            debugLogger.error('Error parsing inline markdown part:', fullMatch, e);
            renderedNode = null;
        }
        nodes.push(renderedNode ?? (_jsx(Text, { children: unescapeMarkdownDollars(fullMatch) }, key)));
        lastIndex = index + fullMatch.length;
    }
    if (lastIndex < text.length) {
        nodes.push(_jsx(Text, { children: unescapeMarkdownDollars(text.slice(lastIndex)) }, `t-${lastIndex}`));
    }
    return _jsx(_Fragment, { children: nodes.filter((node) => node !== null) });
};
export const RenderInline = React.memo(RenderInlineInternal);
/**
 * Utility function to get the plain text length of a string with markdown formatting
 * This is useful for calculating column widths in tables
 */
export const getPlainTextLength = (text, enableInlineMath = false) => {
    let normalizedText = '';
    let lastIndex = 0;
    for (const token of mergeInlineMathMatches(text, INLINE_MARKDOWN_REGEX, enableInlineMath)) {
        const index = token.kind === 'math' ? token.span.index : (token.match.index ?? 0);
        const prose = text.slice(lastIndex, index);
        normalizedText +=
            token.kind === 'math'
                ? unescapeMarkdownBeforeMath(prose)
                : unescapeMarkdownDollars(prose);
        if (token.kind === 'math') {
            normalizedText += renderInlineLatex(unescapeMarkdownDollars(token.span.content));
            lastIndex = index + token.span.raw.length;
            continue;
        }
        const match = token.match;
        const fullMatch = match[0];
        const codeMatch = fullMatch.match(/^(`+)(.+?)\1$/s);
        if (codeMatch?.[2]) {
            normalizedText += codeMatch[2];
        }
        else {
            normalizedText += unescapeMarkdownDollars(fullMatch);
        }
        lastIndex = index + fullMatch.length;
    }
    normalizedText += unescapeMarkdownDollars(text.slice(lastIndex));
    const cleanText = normalizedText
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/<u>(.*?)<\/u>/g, '$1')
        .replace(/.*\[(.*?)\]\(.*\)/g, '$1');
    return stringWidth(cleanText);
};
//# sourceMappingURL=InlineMarkdownRenderer.js.map