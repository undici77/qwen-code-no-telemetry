import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Text, Box } from 'ink';
import { theme } from '../semantic-colors.js';
import { colorizeCode } from './CodeColorizer.js';
import { TableRenderer } from './TableRenderer.js';
import { RenderInline } from './InlineMarkdownRenderer.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { MermaidDiagram } from './MermaidDiagram.js';
import { renderInlineLatex } from './latexRenderer.js';
import { useRenderMode } from '../contexts/RenderModeContext.js';
export function countMarkdownSourceBlocks(text) {
    const codeBlockLanguageCounts = new Map();
    const lines = text.split(/\r?\n/);
    const codeFenceRegex = /^ *(`{3,}|~{3,}) *([^`]*)$/;
    const mathFenceRegex = /^ *\$\$ *$/;
    let activeCodeFence = null;
    let inMathBlock = false;
    let mathBlockCount = 0;
    for (const line of lines) {
        const codeFenceMatch = line.match(codeFenceRegex);
        if (activeCodeFence) {
            if (codeFenceMatch &&
                codeFenceMatch[1].startsWith(activeCodeFence[0]) &&
                codeFenceMatch[1].length >= activeCodeFence.length) {
                activeCodeFence = null;
            }
            continue;
        }
        if (inMathBlock) {
            if (mathFenceRegex.test(line)) {
                inMathBlock = false;
            }
            continue;
        }
        if (codeFenceMatch) {
            activeCodeFence = codeFenceMatch[1];
            const lang = codeFenceMatch[2]?.trim().split(/\s+/)[0]?.toLowerCase() || null;
            if (lang) {
                codeBlockLanguageCounts.set(lang, (codeBlockLanguageCounts.get(lang) ?? 0) + 1);
            }
            continue;
        }
        if (mathFenceRegex.test(line)) {
            inMathBlock = true;
            mathBlockCount += 1;
        }
    }
    return { codeBlockLanguageCounts, mathBlockCount };
}
// Constants for Markdown parsing and rendering
const EMPTY_LINE_HEIGHT = 1;
const CODE_BLOCK_PREFIX_PADDING = 1;
const LIST_ITEM_PREFIX_PADDING = 1;
const LIST_ITEM_TEXT_FLEX_GROW = 1;
const BLOCKQUOTE_PREFIX_PADDING = 1;
const MATH_BLOCK_PREFIX_PADDING = 1;
const INLINE_MATH_MAX_CHARS = 1024;
const TABLE_INLINE_MATH_SPAN_RE = new RegExp(String.raw `(?<![\w$])\$(?![\s\d$])(?=[^$\n]{1,${INLINE_MATH_MAX_CHARS}}\S\$)[^$\n]{1,${INLINE_MATH_MAX_CHARS}}\$(?![\w$])`, 'y');
function readTableInlineMathSpan(row, index) {
    TABLE_INLINE_MATH_SPAN_RE.lastIndex = index;
    return TABLE_INLINE_MATH_SPAN_RE.exec(row)?.[0] ?? null;
}
function splitMarkdownTableRow(row) {
    const cells = [];
    let current = '';
    let activeCodeFenceLength = 0;
    for (let index = 0; index < row.length; index++) {
        const char = row[index];
        if (char === '\\') {
            const next = row[index + 1];
            if (next === '|') {
                current += '|';
                index += 1;
                continue;
            }
            current += char;
            continue;
        }
        if (char === '`') {
            let runLength = 1;
            while (row[index + runLength] === '`') {
                runLength += 1;
            }
            if (activeCodeFenceLength === 0) {
                activeCodeFenceLength = runLength;
            }
            else if (runLength === activeCodeFenceLength) {
                activeCodeFenceLength = 0;
            }
            current += '`'.repeat(runLength);
            index += runLength - 1;
            continue;
        }
        if (char === '$' && activeCodeFenceLength === 0) {
            const mathSpan = readTableInlineMathSpan(row, index);
            if (mathSpan) {
                current += mathSpan;
                index += mathSpan.length - 1;
                continue;
            }
        }
        if (char === '|' && activeCodeFenceLength === 0) {
            cells.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    cells.push(current.trim());
    return cells;
}
const MarkdownDisplayInternal = ({ text, isPending, availableTerminalHeight, contentWidth, textColor = theme.text.primary, sourceCopyIndexOffsets, }) => {
    const { renderMode } = useRenderMode();
    if (!text)
        return _jsx(_Fragment, {});
    const renderVisualBlocks = renderMode === 'render';
    // Some models stream long runs of trailing newlines after useful content.
    // Trim them from the live preview so blank rows do not push stable streaming
    // text into scrollback on every repaint. The committed transcript still
    // renders the full message via MarkdownDisplay with isPending=false.
    const displayText = isPending ? text.trimEnd() : text;
    const lines = displayText.split(/\r?\n/);
    const headerRegex = /^ *(#{1,4}) +(.*)/;
    const codeFenceRegex = /^ *(`{3,}|~{3,}) *([^`]*)$/;
    const ulItemRegex = /^([ \t]*)([-*+]) +(.*)/;
    const olItemRegex = /^([ \t]*)(\d+)\. +(.*)/;
    const hrRegex = /^ *([-*_] *){3,} *$/;
    const blockquoteRegex = /^ *> ?(.*)$/;
    const mathFenceRegex = /^ *\$\$ *$/;
    const tableRowRegex = /^\s*\|(.+)\|\s*$/;
    const tableSeparatorRegex = /^(?=.*\|)\s*\|?\s*(:?-+:?)\s*(\|\s*(:?-+:?)\s*)*\|?\s*$/;
    /** Parse column alignments from a markdown table separator like `|:---|:---:|---:|` */
    const parseTableAligns = (line) => splitMarkdownTableRow(line)
        .filter((cell) => cell.length > 0)
        .map((cell) => {
        const startsWithColon = cell.startsWith(':');
        const endsWithColon = cell.endsWith(':');
        if (startsWithColon && endsWithColon)
            return 'center';
        if (endsWithColon)
            return 'right';
        return 'left';
    });
    const contentBlocks = [];
    let inCodeBlock = false;
    let codeBlockIndex = 0;
    let currentCodeBlockIndex = 0;
    let currentCodeBlockLangIndex = 0;
    const codeBlockLanguageCounts = new Map(sourceCopyIndexOffsets?.codeBlockLanguageCounts);
    let lastLineEmpty = true;
    let codeBlockContent = [];
    let codeBlockLang = null;
    let codeBlockFence = '';
    let inMathBlock = false;
    let mathBlockIndex = sourceCopyIndexOffsets?.mathBlockCount ?? 0;
    let currentMathBlockIndex = 0;
    let mathBlockContent = [];
    let inTable = false;
    let tableRows = [];
    let tableHeaders = [];
    let tableAligns = [];
    function addContentBlock(block) {
        if (block) {
            contentBlocks.push(block);
            lastLineEmpty = false;
        }
    }
    lines.forEach((line, index) => {
        const key = `line-${index}`;
        if (inCodeBlock) {
            const fenceMatch = line.match(codeFenceRegex);
            if (fenceMatch &&
                fenceMatch[1].startsWith(codeBlockFence[0]) &&
                fenceMatch[1].length >= codeBlockFence.length) {
                addContentBlock(_jsx(RenderCodeBlock, { content: codeBlockContent, lang: codeBlockLang, codeBlockIndex: currentCodeBlockIndex, codeBlockLangIndex: currentCodeBlockLangIndex, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth }, key));
                inCodeBlock = false;
                currentCodeBlockIndex = 0;
                currentCodeBlockLangIndex = 0;
                codeBlockContent = [];
                codeBlockLang = null;
                codeBlockFence = '';
            }
            else {
                codeBlockContent.push(line);
            }
            return;
        }
        if (inMathBlock) {
            if (mathFenceRegex.test(line)) {
                addContentBlock(_jsx(RenderMathBlock, { content: mathBlockContent, sourceCopyCommand: `/copy latex ${currentMathBlockIndex}`, contentWidth: contentWidth, isPending: isPending, availableTerminalHeight: availableTerminalHeight }, key));
                inMathBlock = false;
                currentMathBlockIndex = 0;
                mathBlockContent = [];
            }
            else {
                mathBlockContent.push(line);
            }
            return;
        }
        const codeFenceMatch = line.match(codeFenceRegex);
        const mathFenceMatch = line.match(mathFenceRegex);
        const headerMatch = line.match(headerRegex);
        const ulMatch = line.match(ulItemRegex);
        const olMatch = line.match(olItemRegex);
        const hrMatch = line.match(hrRegex);
        const blockquoteMatch = line.match(blockquoteRegex);
        const tableRowMatch = line.match(tableRowRegex);
        const tableSeparatorMatch = line.match(tableSeparatorRegex);
        if (codeFenceMatch) {
            inCodeBlock = true;
            codeBlockIndex += 1;
            currentCodeBlockIndex = codeBlockIndex;
            codeBlockFence = codeFenceMatch[1];
            codeBlockLang = codeFenceMatch[2]?.trim().split(/\s+/)[0] || null;
            if (codeBlockLang) {
                const normalizedLang = codeBlockLang.toLowerCase();
                const nextLangIndex = (codeBlockLanguageCounts.get(normalizedLang) ?? 0) + 1;
                codeBlockLanguageCounts.set(normalizedLang, nextLangIndex);
                currentCodeBlockLangIndex = nextLangIndex;
            }
            else {
                currentCodeBlockLangIndex = 0;
            }
        }
        else if (mathFenceMatch && renderVisualBlocks) {
            inMathBlock = true;
            mathBlockIndex += 1;
            currentMathBlockIndex = mathBlockIndex;
            mathBlockContent = [];
        }
        else if (tableRowMatch && !inTable && renderVisualBlocks) {
            // Potential table start - check if next line is separator with matching column count
            const potentialHeaders = splitMarkdownTableRow(tableRowMatch[1]);
            const nextLine = index + 1 < lines.length ? lines[index + 1] : '';
            const sepMatch = nextLine.match(tableSeparatorRegex);
            const sepColCount = sepMatch
                ? splitMarkdownTableRow(nextLine).filter((c) => c.length > 0).length
                : 0;
            if (sepMatch && sepColCount === potentialHeaders.length) {
                inTable = true;
                tableHeaders = potentialHeaders;
                tableRows = [];
            }
            else {
                // Not a table, treat as regular text
                addContentBlock(_jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: _jsx(RenderInline, { text: line, textColor: textColor, enableInlineMath: renderVisualBlocks }) }) }, key));
            }
        }
        else if (inTable && tableSeparatorMatch) {
            // Parse alignment from separator line
            tableAligns = parseTableAligns(line);
        }
        else if (inTable && tableRowMatch) {
            // Add table row
            const cells = splitMarkdownTableRow(tableRowMatch[1]);
            // Ensure row has same column count as headers
            while (cells.length < tableHeaders.length) {
                cells.push('');
            }
            if (cells.length > tableHeaders.length) {
                cells.length = tableHeaders.length;
            }
            tableRows.push(cells);
        }
        else if (inTable && !tableRowMatch) {
            // End of table
            if (tableHeaders.length > 0 && tableRows.length > 0) {
                addContentBlock(_jsx(RenderTable, { headers: tableHeaders, rows: tableRows, contentWidth: contentWidth, aligns: tableAligns, enableInlineMath: renderVisualBlocks }, `table-${contentBlocks.length}`));
            }
            inTable = false;
            tableRows = [];
            tableHeaders = [];
            tableAligns = [];
            // Process current line as normal
            if (line.trim().length > 0) {
                addContentBlock(_jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: _jsx(RenderInline, { text: line, textColor: textColor, enableInlineMath: renderVisualBlocks }) }) }, key));
            }
        }
        else if (hrMatch) {
            addContentBlock(_jsx(Box, { children: _jsx(Text, { dimColor: true, children: "---" }) }, key));
        }
        else if (blockquoteMatch && renderVisualBlocks) {
            addContentBlock(_jsx(RenderBlockquote, { quoteText: blockquoteMatch[1], textColor: textColor, enableInlineMath: renderVisualBlocks }, key));
        }
        else if (headerMatch) {
            const level = headerMatch[1].length;
            const headerText = headerMatch[2];
            let headerNode = null;
            switch (level) {
                case 1:
                    headerNode = (_jsx(Text, { bold: true, color: textColor, children: _jsx(RenderInline, { text: headerText, textColor: textColor, enableInlineMath: renderVisualBlocks }) }));
                    break;
                case 2:
                    headerNode = (_jsx(Text, { bold: true, color: textColor, children: _jsx(RenderInline, { text: headerText, textColor: textColor, enableInlineMath: renderVisualBlocks }) }));
                    break;
                case 3:
                    headerNode = (_jsx(Text, { bold: true, color: textColor, children: _jsx(RenderInline, { text: headerText, textColor: textColor, enableInlineMath: renderVisualBlocks }) }));
                    break;
                case 4:
                    headerNode = (_jsx(Text, { italic: true, color: textColor, children: _jsx(RenderInline, { text: headerText, textColor: textColor, enableInlineMath: renderVisualBlocks }) }));
                    break;
                default:
                    headerNode = (_jsx(Text, { color: textColor, children: _jsx(RenderInline, { text: headerText, textColor: textColor, enableInlineMath: renderVisualBlocks }) }));
                    break;
            }
            if (headerNode)
                addContentBlock(_jsx(Box, { children: headerNode }, key));
        }
        else if (ulMatch) {
            const leadingWhitespace = ulMatch[1];
            const marker = ulMatch[2];
            const itemText = ulMatch[3];
            addContentBlock(_jsx(RenderListItem, { itemText: itemText, type: "ul", marker: marker, leadingWhitespace: leadingWhitespace, textColor: textColor, renderVisualBlocks: renderVisualBlocks }, key));
        }
        else if (olMatch) {
            const leadingWhitespace = olMatch[1];
            const marker = olMatch[2];
            const itemText = olMatch[3];
            addContentBlock(_jsx(RenderListItem, { itemText: itemText, type: "ol", marker: marker, leadingWhitespace: leadingWhitespace, textColor: textColor, renderVisualBlocks: renderVisualBlocks }, key));
        }
        else {
            if (line.trim().length === 0 && !inCodeBlock) {
                if (!lastLineEmpty) {
                    contentBlocks.push(_jsx(Box, { height: EMPTY_LINE_HEIGHT }, `spacer-${index}`));
                    lastLineEmpty = true;
                }
            }
            else {
                addContentBlock(_jsx(Box, { children: _jsx(Text, { wrap: "wrap", color: textColor, children: _jsx(RenderInline, { text: line, textColor: textColor, enableInlineMath: renderVisualBlocks }) }) }, key));
            }
        }
    });
    if (inCodeBlock) {
        addContentBlock(_jsx(RenderCodeBlock, { content: codeBlockContent, lang: codeBlockLang, codeBlockIndex: currentCodeBlockIndex, codeBlockLangIndex: currentCodeBlockLangIndex, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth }, "line-eof"));
    }
    if (inMathBlock) {
        addContentBlock(_jsx(RenderMathBlock, { content: mathBlockContent, sourceCopyCommand: `/copy latex ${currentMathBlockIndex}`, contentWidth: contentWidth, isPending: isPending, availableTerminalHeight: availableTerminalHeight }, "math-eof"));
    }
    // Handle table at end of content
    if (inTable && tableHeaders.length > 0 && tableRows.length > 0) {
        addContentBlock(_jsx(RenderTable, { headers: tableHeaders, rows: tableRows, contentWidth: contentWidth, aligns: tableAligns, enableInlineMath: renderVisualBlocks }, `table-${contentBlocks.length}`));
    }
    return _jsx(_Fragment, { children: contentBlocks });
};
const RenderCodeBlockInternal = ({ content, lang, codeBlockIndex, codeBlockLangIndex, isPending, availableTerminalHeight, contentWidth, }) => {
    const settings = useSettings();
    const { renderMode } = useRenderMode();
    const MIN_LINES_FOR_MESSAGE = 1; // Minimum lines to show before the "generating more" message
    const RESERVED_LINES = 2; // Lines reserved for the message itself and potential padding
    if (lang?.toLowerCase() === 'mermaid' && renderMode === 'render') {
        if (isPending) {
            return (_jsx(RenderPendingMermaidBlock, { content: content, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth }));
        }
        return (_jsx(MermaidDiagram, { source: content.join('\n'), sourceCopyCommand: `/copy mermaid ${codeBlockLangIndex || codeBlockIndex}`, isPending: isPending, availableTerminalHeight: availableTerminalHeight, contentWidth: contentWidth }));
    }
    const fullContent = content.join('\n');
    if (isPending && availableTerminalHeight !== undefined) {
        const MAX_CODE_LINES_WHEN_PENDING = Math.max(0, availableTerminalHeight - RESERVED_LINES);
        if (content.length > MAX_CODE_LINES_WHEN_PENDING) {
            if (MAX_CODE_LINES_WHEN_PENDING < MIN_LINES_FOR_MESSAGE) {
                // Not enough space to even show the message meaningfully
                return (_jsx(Box, { paddingLeft: CODE_BLOCK_PREFIX_PADDING, children: _jsx(Text, { color: theme.text.secondary, children: "... code is being written ..." }) }));
            }
            const truncatedContent = content.slice(0, MAX_CODE_LINES_WHEN_PENDING);
            const colorizedTruncatedCode = colorizeCode(truncatedContent.join('\n'), lang, availableTerminalHeight, contentWidth - CODE_BLOCK_PREFIX_PADDING, undefined, settings);
            return (_jsxs(Box, { paddingLeft: CODE_BLOCK_PREFIX_PADDING, flexDirection: "column", children: [colorizedTruncatedCode, _jsx(Text, { color: theme.text.secondary, children: "... generating more ..." })] }));
        }
    }
    const colorizedCode = colorizeCode(fullContent, lang, availableTerminalHeight, contentWidth - CODE_BLOCK_PREFIX_PADDING, undefined, settings);
    return (_jsx(Box, { paddingLeft: CODE_BLOCK_PREFIX_PADDING, flexDirection: "column", width: contentWidth, flexShrink: 0, children: colorizedCode }));
};
const RenderCodeBlock = React.memo(RenderCodeBlockInternal);
const RenderPendingMermaidBlockInternal = ({ content, availableTerminalHeight, contentWidth }) => {
    const maxPreviewLines = availableTerminalHeight === undefined
        ? 6
        : Math.max(0, availableTerminalHeight - 2);
    const previewLines = content.slice(0, maxPreviewLines);
    return (_jsxs(Box, { paddingLeft: CODE_BLOCK_PREFIX_PADDING, flexDirection: "column", width: contentWidth, flexShrink: 0, children: [_jsx(Text, { color: theme.text.accent, children: "Mermaid diagram is being written..." }), previewLines.map((line, index) => (_jsx(Text, { color: theme.text.secondary, wrap: "truncate-end", children: line || ' ' }, index))), content.length > previewLines.length && (_jsx(Text, { color: theme.text.secondary, children: "... generating more ..." }))] }));
};
const RenderPendingMermaidBlock = React.memo(RenderPendingMermaidBlockInternal);
const RenderMathBlockInternal = ({ content, sourceCopyCommand, contentWidth, isPending, availableTerminalHeight, }) => {
    const RESERVED_LINES = 3;
    if (isPending && availableTerminalHeight !== undefined) {
        const maxPreviewLines = Math.max(0, availableTerminalHeight - RESERVED_LINES);
        if (content.length > maxPreviewLines) {
            const previewLines = content.slice(0, maxPreviewLines);
            return (_jsxs(Box, { paddingLeft: MATH_BLOCK_PREFIX_PADDING, flexDirection: "column", width: contentWidth, flexShrink: 0, children: [_jsxs(Text, { bold: true, color: theme.text.accent, children: ["LaTeX block \u00B7 source: ", sourceCopyCommand] }), previewLines.map((line, index) => (_jsx(Text, { color: theme.text.secondary, wrap: "truncate-end", children: line || ' ' }, index))), _jsx(Text, { color: theme.text.secondary, children: "... generating more ..." })] }));
        }
    }
    const rendered = renderInlineLatex(content.join(' '));
    return (_jsxs(Box, { paddingLeft: MATH_BLOCK_PREFIX_PADDING, flexDirection: "column", width: contentWidth, flexShrink: 0, children: [_jsxs(Text, { bold: true, color: theme.text.accent, children: ["LaTeX block \u00B7 source: ", sourceCopyCommand] }), _jsx(Text, { color: theme.text.accent, wrap: "wrap", children: rendered })] }));
};
const RenderMathBlock = React.memo(RenderMathBlockInternal);
const RenderBlockquoteInternal = ({ quoteText, textColor = theme.text.primary, enableInlineMath = true, }) => (_jsxs(Box, { paddingLeft: BLOCKQUOTE_PREFIX_PADDING, flexDirection: "row", children: [_jsx(Text, { color: theme.text.secondary, children: "\u2502 " }), _jsx(Box, { flexGrow: LIST_ITEM_TEXT_FLEX_GROW, children: _jsx(Text, { wrap: "wrap", color: textColor, italic: true, children: _jsx(RenderInline, { text: quoteText, textColor: textColor, enableInlineMath: enableInlineMath }) }) })] }));
const RenderBlockquote = React.memo(RenderBlockquoteInternal);
const RenderListItemInternal = ({ itemText, type, marker, leadingWhitespace = '', textColor = theme.text.primary, renderVisualBlocks = true, }) => {
    const taskMatch = itemText.match(/^\[([ xX])\]\s+(.*)$/);
    const isTaskItem = taskMatch !== null && renderVisualBlocks;
    const isTaskChecked = taskMatch?.[1]?.toLowerCase() === 'x';
    const effectiveItemText = isTaskItem ? taskMatch[2] : itemText;
    const prefix = isTaskItem
        ? `${isTaskChecked ? '✓' : '○'} `
        : type === 'ol'
            ? `${marker}. `
            : `${marker} `;
    const prefixWidth = prefix.length;
    const indentation = leadingWhitespace.length;
    return (_jsxs(Box, { paddingLeft: indentation + LIST_ITEM_PREFIX_PADDING, flexDirection: "row", children: [_jsx(Box, { width: prefixWidth, children: _jsx(Text, { color: textColor, children: prefix }) }), _jsx(Box, { flexGrow: LIST_ITEM_TEXT_FLEX_GROW, children: _jsx(Text, { wrap: "wrap", color: textColor, children: _jsx(RenderInline, { text: effectiveItemText, textColor: textColor, enableInlineMath: renderVisualBlocks }) }) })] }));
};
const RenderListItem = React.memo(RenderListItemInternal);
const RenderTableInternal = ({ headers, rows, contentWidth, aligns, enableInlineMath = false, }) => (_jsx(TableRenderer, { headers: headers, rows: rows, contentWidth: contentWidth, aligns: aligns, enableInlineMath: enableInlineMath }));
const RenderTable = React.memo(RenderTableInternal);
export const MarkdownDisplay = React.memo(MarkdownDisplayInternal);
//# sourceMappingURL=MarkdownDisplay.js.map