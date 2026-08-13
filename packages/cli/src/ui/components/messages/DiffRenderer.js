import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text, useIsScreenReaderEnabled } from 'ink';
import crypto from 'node:crypto';
import { colorizeCode, colorizeLine } from '../../utils/CodeColorizer.js';
import { MaxSizedBox } from '../shared/MaxSizedBox.js';
import { theme as semanticTheme } from '../../semantic-colors.js';
function parseDiffWithLineNumbers(diffContent) {
    const lines = diffContent.split('\n');
    const result = [];
    let currentOldLine = 0;
    let currentNewLine = 0;
    let inHunk = false;
    const hunkHeaderRegex = /^@@ -(\d+),?\d* \+(\d+),?\d* @@/;
    for (const line of lines) {
        const hunkMatch = line.match(hunkHeaderRegex);
        if (hunkMatch) {
            currentOldLine = parseInt(hunkMatch[1], 10);
            currentNewLine = parseInt(hunkMatch[2], 10);
            inHunk = true;
            result.push({ type: 'hunk', content: line });
            // We need to adjust the starting point because the first line number applies to the *first* actual line change/context,
            // but we increment *before* pushing that line. So decrement here.
            currentOldLine--;
            currentNewLine--;
            continue;
        }
        if (!inHunk) {
            // Skip standard Git header lines more robustly
            if (line.startsWith('--- ')) {
                continue;
            }
            // If it's not a hunk or header, skip (or handle as 'other' if needed)
            continue;
        }
        if (line.startsWith('+')) {
            currentNewLine++; // Increment before pushing
            result.push({
                type: 'add',
                newLine: currentNewLine,
                content: line.substring(1),
            });
        }
        else if (line.startsWith('-')) {
            currentOldLine++; // Increment before pushing
            result.push({
                type: 'del',
                oldLine: currentOldLine,
                content: line.substring(1),
            });
        }
        else if (line.startsWith(' ')) {
            currentOldLine++; // Increment before pushing
            currentNewLine++;
            result.push({
                type: 'context',
                oldLine: currentOldLine,
                newLine: currentNewLine,
                content: line.substring(1),
            });
        }
        else if (line.startsWith('\\')) {
            // Handle "\ No newline at end of file"
            result.push({ type: 'other', content: line });
        }
    }
    return result;
}
const DEFAULT_TAB_WIDTH = 4; // Spaces per tab for normalization
export const DiffRenderer = ({ diffContent, filename, tabWidth = DEFAULT_TAB_WIDTH, availableTerminalHeight, contentWidth, theme, settings, }) => {
    const screenReaderEnabled = useIsScreenReaderEnabled();
    if (!diffContent || typeof diffContent !== 'string') {
        return _jsx(Text, { color: semanticTheme.status.warning, children: "No diff content." });
    }
    const parsedLines = parseDiffWithLineNumbers(diffContent);
    if (parsedLines.length === 0) {
        return (_jsx(Box, { borderStyle: "round", borderColor: semanticTheme.border.default, padding: 1, children: _jsx(Text, { dimColor: true, children: "No changes detected." }) }));
    }
    if (screenReaderEnabled) {
        return (_jsx(Box, { flexDirection: "column", children: parsedLines.map((line, index) => (_jsxs(Text, { children: [line.type, ": ", line.content] }, index))) }));
    }
    // Check if the diff represents a new file (only additions and header lines)
    const isNewFile = parsedLines.every((line) => line.type === 'add' ||
        line.type === 'hunk' ||
        line.type === 'other' ||
        line.content.startsWith('diff --git') ||
        line.content.startsWith('new file mode'));
    let renderedOutput;
    if (isNewFile) {
        // Extract only the added lines' content
        const addedContent = parsedLines
            .filter((line) => line.type === 'add')
            .map((line) => line.content)
            .join('\n');
        // Attempt to infer language from filename, default to plain text if no filename
        const fileExtension = filename?.split('.').pop() || null;
        const language = fileExtension
            ? getLanguageFromExtension(fileExtension)
            : null;
        renderedOutput = colorizeCode(addedContent, language, availableTerminalHeight, contentWidth, { theme, settings, tabWidth });
    }
    else {
        renderedOutput = renderDiffContent(parsedLines, filename, tabWidth, availableTerminalHeight, contentWidth, settings);
    }
    return renderedOutput;
};
const renderDiffContent = (parsedLines, filename, tabWidth = DEFAULT_TAB_WIDTH, availableTerminalHeight, contentWidth, settings) => {
    // 1. Normalize whitespace (replace tabs with spaces) *before* further processing
    const normalizedLines = parsedLines.map((line) => ({
        ...line,
        content: line.content.replace(/\t/g, ' '.repeat(tabWidth)),
    }));
    // Filter out non-displayable lines (hunks, potentially 'other') using the normalized list
    const displayableLines = normalizedLines.filter((l) => l.type !== 'hunk' && l.type !== 'other');
    if (displayableLines.length === 0) {
        return (_jsx(Box, { borderStyle: "round", borderColor: semanticTheme.border.default, padding: 1, children: _jsx(Text, { dimColor: true, children: "No changes detected." }) }));
    }
    const showLineNumbers = settings?.merged.ui?.showLineNumbers ?? true;
    const maxLineNumber = Math.max(0, ...displayableLines.map((l) => l.oldLine ?? 0), ...displayableLines.map((l) => l.newLine ?? 0));
    const gutterWidth = Math.max(1, maxLineNumber.toString().length);
    const fileExtension = filename?.split('.').pop() || null;
    const language = fileExtension
        ? getLanguageFromExtension(fileExtension)
        : null;
    // Calculate the minimum indentation across all displayable lines
    let baseIndentation = Infinity; // Start high to find the minimum
    for (const line of displayableLines) {
        // Only consider lines with actual content for indentation calculation
        if (line.content.trim() === '')
            continue;
        const firstCharIndex = line.content.search(/\S/); // Find index of first non-whitespace char
        const currentIndent = firstCharIndex === -1 ? 0 : firstCharIndex; // Indent is 0 if no non-whitespace found
        baseIndentation = Math.min(baseIndentation, currentIndent);
    }
    // If baseIndentation remained Infinity (e.g., no displayable lines with content), default to 0
    if (!isFinite(baseIndentation)) {
        baseIndentation = 0;
    }
    const key = filename
        ? `diff-box-${filename}`
        : `diff-box-${crypto.createHash('sha1').update(JSON.stringify(parsedLines)).digest('hex')}`;
    let lastLineNumber = null;
    const MAX_CONTEXT_LINES_WITHOUT_GAP = 5;
    return (_jsx(MaxSizedBox, { maxHeight: availableTerminalHeight, maxWidth: contentWidth, children: displayableLines.reduce((acc, line, index) => {
            // Determine the relevant line number for gap calculation based on type
            let relevantLineNumberForGapCalc = null;
            if (line.type === 'add' || line.type === 'context') {
                relevantLineNumberForGapCalc = line.newLine ?? null;
            }
            else if (line.type === 'del') {
                // For deletions, the gap is typically in relation to the original file's line numbering
                relevantLineNumberForGapCalc = line.oldLine ?? null;
            }
            if (lastLineNumber !== null &&
                relevantLineNumberForGapCalc !== null &&
                relevantLineNumberForGapCalc >
                    lastLineNumber + MAX_CONTEXT_LINES_WITHOUT_GAP + 1) {
                acc.push(_jsx(Box, { children: _jsx(Text, { wrap: "truncate", color: semanticTheme.text.secondary, children: '═'.repeat(contentWidth) }) }, `gap-${index}`));
            }
            const lineKey = `diff-line-${index}`;
            let gutterNumStr = '';
            let prefixSymbol = ' ';
            switch (line.type) {
                case 'add':
                    gutterNumStr = (line.newLine ?? '').toString();
                    prefixSymbol = '+';
                    lastLineNumber = line.newLine ?? null;
                    break;
                case 'del':
                    gutterNumStr = (line.oldLine ?? '').toString();
                    prefixSymbol = '-';
                    // For deletions, update lastLineNumber based on oldLine if it's advancing.
                    // This helps manage gaps correctly if there are multiple consecutive deletions
                    // or if a deletion is followed by a context line far away in the original file.
                    if (line.oldLine !== undefined) {
                        lastLineNumber = line.oldLine;
                    }
                    break;
                case 'context':
                    gutterNumStr = (line.newLine ?? '').toString();
                    prefixSymbol = ' ';
                    lastLineNumber = line.newLine ?? null;
                    break;
                default:
                    return acc;
            }
            const displayContent = line.content.substring(baseIndentation);
            acc.push(_jsxs(Box, { flexDirection: "row", children: [showLineNumbers && (_jsxs(Text, { color: semanticTheme.text.secondary, backgroundColor: line.type === 'add'
                            ? semanticTheme.background.diff.added
                            : line.type === 'del'
                                ? semanticTheme.background.diff.removed
                                : undefined, children: [gutterNumStr.padStart(gutterWidth), ' '] })), line.type === 'context' ? (_jsxs(_Fragment, { children: [_jsxs(Text, { children: [prefixSymbol, " "] }), _jsx(Text, { wrap: "wrap", children: colorizeLine(displayContent, language) })] })) : (_jsxs(Text, { backgroundColor: line.type === 'add'
                            ? semanticTheme.background.diff.added
                            : semanticTheme.background.diff.removed, wrap: "wrap", children: [_jsx(Text, { color: line.type === 'add'
                                    ? semanticTheme.status.success
                                    : semanticTheme.status.error, children: prefixSymbol }), ' ', colorizeLine(displayContent, language)] }))] }, lineKey));
            return acc;
        }, []) }, key));
};
const getLanguageFromExtension = (extension) => {
    const languageMap = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        json: 'json',
        css: 'css',
        html: 'html',
        sh: 'bash',
        md: 'markdown',
        yaml: 'yaml',
        yml: 'yaml',
        txt: 'plaintext',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        rb: 'ruby',
    };
    return languageMap[extension] || null; // Return null if extension not found
};
//# sourceMappingURL=DiffRenderer.js.map