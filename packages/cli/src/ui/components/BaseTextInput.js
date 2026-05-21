import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import { useKeypress } from '../hooks/useKeypress.js';
import { keyMatchers, Command } from '../keyMatchers.js';
import stringWidth from 'string-width';
import { cpSlice, cpLen } from '../utils/textUtils.js';
import { theme } from '../semantic-colors.js';
// ─── Default line renderer ──────────────────────────────────
/**
 * Renders a single visual line with an inverse-video block cursor.
 * Uses codepoint-aware string operations for Unicode/emoji safety.
 */
export function defaultRenderLine({ lineText, isOnCursorLine, cursorCol, showCursor, }) {
    if (!isOnCursorLine || !showCursor) {
        return _jsx(Text, { children: lineText || ' ' });
    }
    const len = cpLen(lineText);
    // Cursor past end of line — append inverse space
    if (cursorCol >= len) {
        return (_jsxs(Text, { children: [lineText, chalk.inverse(' ') + '\u200B'] }));
    }
    const before = cpSlice(lineText, 0, cursorCol);
    const cursorChar = cpSlice(lineText, cursorCol, cursorCol + 1);
    const after = cpSlice(lineText, cursorCol + 1);
    return (_jsxs(Text, { children: [before, chalk.inverse(cursorChar), after] }));
}
// ─── Component ──────────────────────────────────────────────
export const BaseTextInput = ({ buffer, onSubmit, onKeypress, showCursor = true, placeholder, prefix, borderColor, topRightLabel, isActive = true, renderLine = defaultRenderLine, }) => {
    // ── Keyboard handling ──
    const handleKey = useCallback((key) => {
        // Let the consumer intercept first
        if (onKeypress?.(key)) {
            return;
        }
        if (keyMatchers[Command.TOGGLE_RENDER_MODE](key)) {
            return;
        }
        // ── Standard readline shortcuts ──
        // Submit (Enter, no modifiers)
        if (keyMatchers[Command.SUBMIT](key)) {
            if (buffer.text.trim()) {
                const text = buffer.text;
                buffer.setText('');
                onSubmit(text);
            }
            return;
        }
        // Newline (Shift+Enter, Ctrl+Enter, Ctrl+J)
        if (keyMatchers[Command.NEWLINE](key)) {
            buffer.newline();
            return;
        }
        // Escape → clear input
        if (keyMatchers[Command.ESCAPE](key)) {
            if (buffer.text.length > 0) {
                buffer.setText('');
            }
            return;
        }
        // Ctrl+C → clear input
        if (keyMatchers[Command.CLEAR_INPUT](key)) {
            if (buffer.text.length > 0) {
                buffer.setText('');
            }
            return;
        }
        // Ctrl+A → home
        if (keyMatchers[Command.HOME](key)) {
            buffer.move('home');
            return;
        }
        // Ctrl+E → end
        if (keyMatchers[Command.END](key)) {
            buffer.move('end');
            return;
        }
        // Ctrl+K → kill to end of line
        if (keyMatchers[Command.KILL_LINE_RIGHT](key)) {
            buffer.killLineRight();
            return;
        }
        // Ctrl+U → kill to start of line
        if (keyMatchers[Command.KILL_LINE_LEFT](key)) {
            buffer.killLineLeft();
            return;
        }
        // Ctrl+W / Alt+Backspace → delete word backward
        if (keyMatchers[Command.DELETE_WORD_BACKWARD](key)) {
            buffer.deleteWordLeft();
            return;
        }
        // Ctrl+X Ctrl+E → open in external editor
        if (keyMatchers[Command.OPEN_EXTERNAL_EDITOR](key)) {
            buffer.openInExternalEditor();
            return;
        }
        // Tab — never insert literal tab characters into the buffer;
        // consumers that need Tab behaviour should intercept it via onKeypress.
        if ((key.name === 'tab' || key.sequence === '\t') && !key.paste) {
            return;
        }
        // Backspace
        if (key.name === 'backspace' ||
            key.sequence === '\x7f' ||
            (key.ctrl && key.name === 'h')) {
            buffer.backspace();
            return;
        }
        // Fallthrough — delegate to buffer's built-in input handler
        buffer.handleInput(key);
    }, [buffer, onSubmit, onKeypress]);
    useKeypress(handleKey, { isActive });
    // ── Rendering ──
    const linesToRender = buffer.viewportVisualLines;
    const [cursorVisualRow, cursorVisualCol] = buffer.visualCursor;
    const scrollVisualRow = buffer.visualScrollRow;
    const resolvedBorderColor = borderColor ?? theme.border.focused;
    const resolvedPrefix = prefix ?? (_jsx(Text, { color: theme.text.accent, children: '> ' }));
    const columns = process.stdout.columns || 80;
    // Build the top border line: ─────── label ──
    // Label takes: 1 space + text + 1 space + 2 trailing dashes = label.length + 4
    const labelWidth = topRightLabel ? stringWidth(topRightLabel) + 4 : 0;
    const dashCount = Math.max(1, columns - labelWidth);
    const topBorderLine = topRightLabel
        ? `${'─'.repeat(dashCount)} ${topRightLabel} ${'─'.repeat(2)}`
        : '─'.repeat(columns);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: resolvedBorderColor, wrap: "truncate-end", children: topBorderLine }), _jsxs(Box, { borderStyle: "single", borderTop: false, borderBottom: true, borderLeft: false, borderRight: false, borderColor: resolvedBorderColor, children: [resolvedPrefix, _jsx(Box, { flexGrow: 1, flexDirection: "column", children: buffer.text.length === 0 && placeholder ? (showCursor ? (_jsxs(Text, { children: [chalk.inverse(placeholder.slice(0, 1)), _jsx(Text, { color: theme.text.secondary, children: placeholder.slice(1) })] })) : (_jsx(Text, { color: theme.text.secondary, children: placeholder }))) : (linesToRender.map((lineText, idx) => {
                            const absoluteVisualIndex = scrollVisualRow + idx;
                            const isOnCursorLine = absoluteVisualIndex === cursorVisualRow;
                            return (_jsx(Box, { height: 1, children: renderLine({
                                    lineText,
                                    isOnCursorLine,
                                    cursorCol: cursorVisualCol,
                                    showCursor,
                                    visualLineIndex: idx,
                                    absoluteVisualIndex,
                                    buffer,
                                    scrollVisualRow,
                                }) }, idx));
                        })) })] })] }));
};
//# sourceMappingURL=BaseTextInput.js.map