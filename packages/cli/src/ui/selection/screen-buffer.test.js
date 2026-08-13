import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Box, Text } from 'ink';
import { render } from 'ink-testing-library';
import { getScreenBuffer } from './screen-buffer.js';
import { getSelectedText } from './selection-text.js';
/** The background escape the patched renderer appends to selected cells. */
const SELECTION_BG = '[48;5;240m';
let current;
afterEach(() => {
    current?.unmount();
    current = undefined;
});
describe('ScreenBuffer (Ink frame-controller M0)', () => {
    it('exposes the composited frame as addressable cells', () => {
        current = render(_jsx(Text, { children: "hello \u4E2D\u6587" }));
        const buffer = getScreenBuffer(current.stdout);
        expect(buffer).toBeDefined();
        expect(buffer.dimensions.height).toBeGreaterThan(0);
        expect(buffer.lineText(0)).toBe('hello 中文');
        expect(buffer.getCellAt(0, 0)?.value).toBe('h');
    });
    it('handles wide characters with a leading cell and a spacer', () => {
        current = render(_jsx(Text, { children: "hello \u4E2D\u6587" }));
        const buffer = getScreenBuffer(current.stdout);
        // "hello " occupies columns 0-5; the first wide glyph starts at column 6.
        const wide = buffer.getCellAt(6, 0);
        expect(wide?.value).toBe('中');
        expect(wide?.fullWidth).toBe(true);
        // The trailing half of a wide glyph is an empty spacer cell.
        expect(buffer.getCellAt(7, 0)?.value).toBe('');
    });
    it('highlights the selected range before serialization and clears it', () => {
        current = render(_jsx(Text, { children: "hello world" }));
        const buffer = getScreenBuffer(current.stdout);
        expect(current.lastFrame()).not.toContain(SELECTION_BG);
        buffer.setSelection({ sx: 0, sy: 0, ex: 4, ey: 0 });
        expect(current.lastFrame()).toContain(SELECTION_BG);
        buffer.setSelection(null);
        expect(current.lastFrame()).not.toContain(SELECTION_BG);
    });
    it('does not leak the highlight onto identical text elsewhere on screen', () => {
        // "abc" appears twice; selecting the first must not highlight the second.
        current = render(_jsxs(Text, { children: ["abc", '\n', "abc"] }));
        const buffer = getScreenBuffer(current.stdout);
        buffer.setSelection({ sx: 0, sy: 0, ex: 2, ey: 0 });
        const frame = current.lastFrame() ?? '';
        const [firstLine, secondLine] = frame.split('\n');
        expect(firstLine).toContain(SELECTION_BG);
        expect(secondLine).not.toContain(SELECTION_BG);
    });
    it('publishes exactly one frame per distinct selection change (no loop, deduped)', () => {
        current = render(_jsx(Text, { children: "hello world" }));
        const buffer = getScreenBuffer(current.stdout);
        let publishes = 0;
        buffer.subscribe(() => {
            publishes++;
        });
        buffer.setSelection({ sx: 0, sy: 0, ex: 2, ey: 0 });
        expect(publishes).toBe(1);
        // Identical selection is deduplicated: no extra render.
        buffer.setSelection({ sx: 0, sy: 0, ex: 2, ey: 0 });
        expect(publishes).toBe(1);
        // A different selection renders once more.
        buffer.setSelection({ sx: 0, sy: 0, ex: 4, ey: 0 });
        expect(publishes).toBe(2);
    });
    it('publishes soft boundaries and preserves omitted whitespace', () => {
        current = render(_jsx(Box, { width: 5, children: _jsx(Text, { children: "hello world" }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(frame.cells.map((row) => row
            .map((cell) => cell.value)
            .join('')
            .trimEnd())).toEqual(['hello', '', 'world']);
        expect(frame.cells[1].every((cell) => !cell.selectable)).toBe(true);
        expect(frame.boundaries[0].find(Boolean)).toMatchObject({
            kind: 'soft',
            joiner: ' ',
        });
        expect(frame.boundaries[1].find(Boolean)).toMatchObject({
            kind: 'soft',
            joiner: '',
        });
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe('hello world');
    });
    it.each([
        ['multiple spaces', 'hello  world'],
        ['a tab', 'hello\tworld'],
    ])('preserves %s across a direct Ink word wrap', (_name, source) => {
        current = render(_jsx(Box, { width: 5, children: _jsx(Text, { children: source }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe(source);
    });
    it.each([
        ['leading indentation', '   hello'],
        ['whitespace-only content', '   '],
    ])('preserves wrapped %s', (_name, source) => {
        current = render(_jsx(Box, { width: 2, children: _jsx(Text, { children: source }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe(source);
    });
    it('keeps renderer background fill out of selected text', () => {
        current = render(_jsx(Box, { width: 5, backgroundColor: "blue", children: _jsx(Text, { children: "hi" }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe('hi');
    });
    it('distinguishes explicit hard newlines from exact-width wraps', () => {
        current = render(_jsx(Box, { width: 5, children: _jsx(Text, { children: 'hello\nworld' }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(frame.boundaries[0].find(Boolean)).toMatchObject({
            kind: 'hard',
            joiner: '\n',
        });
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe('hello\nworld');
    });
    it('preserves empty and whitespace-only hard lines', () => {
        const source = 'alpha\n\n   \nomega';
        current = render(_jsx(Text, { children: source }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe(source);
    });
    it('rejoins styled CJK and emoji text without duplicating wide cells', () => {
        const source = '你好 世界🙂';
        current = render(_jsx(Box, { width: 5, children: _jsx(Text, { color: "cyan", children: source }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe(source);
    });
    it('keeps a newline when sibling flows make a boundary ambiguous', () => {
        current = render(_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { selectionFlow: "a", selectionBreakAfter: "soft", children: "A" }), _jsx(Text, { selectionFlow: "b", selectionBreakAfter: "soft", children: "B" })] }), _jsxs(Box, { children: [_jsx(Text, { selectionFlow: "a", children: "C" }), _jsx(Text, { selectionFlow: "b", children: "D" })] })] }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe('AB\nCD');
    });
    it('clears a boundary claim when a later write overlaps it', () => {
        current = render(_jsxs(Box, { width: 3, height: 1, children: [_jsx(Text, { selectionBreakAfter: "soft", children: "abc" }), _jsx(Box, { position: "absolute", children: _jsx(Text, { selectable: false, children: "xyz" }) })] }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(frame.cells[0]
            .map((cell) => cell.value)
            .join('')
            .trimEnd()).toBe('xyz');
        expect(frame.boundaries[0].every((claim) => claim === null)).toBe(true);
    });
    it('does not publish a boundary outside a clipping rectangle', () => {
        current = render(_jsx(Box, { width: 3, height: 1, overflow: "hidden", children: _jsx(Box, { position: "absolute", marginLeft: 3, children: _jsx(Text, { selectionBreakAfter: "soft", children: "abc" }) }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(frame.boundaries[0].every((claim) => claim === null)).toBe(true);
    });
    it('covers visible text after left clipping with boundary claims', () => {
        current = render(_jsxs(Box, { width: 3, height: 2, flexDirection: "column", children: [_jsxs(Box, { width: 3, height: 1, overflow: "hidden", children: [_jsx(Box, { position: "absolute", marginLeft: -2, children: _jsx(Text, { selectionFlow: "flow", selectionBreakAfter: "soft", selectionJoiner: " ", children: "abcde" }) }), _jsx(Box, { position: "absolute", children: _jsx(Text, { selectable: false, children: "X" }) })] }), _jsx(Text, { selectionFlow: "flow", children: "fgh" })] }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(frame.boundaries[0].slice(0, 3).map(Boolean)).toEqual([
            false,
            true,
            true,
        ]);
        expect(getSelectedText(frame, {
            sx: 0,
            sy: 0,
            ex: frame.width - 1,
            ey: frame.height - 1,
        })).toBe('de fgh');
    });
    it('limits boundary claims to the rendered text width', () => {
        current = render(_jsx(Box, { width: 5, children: _jsx(Text, { selectionBreakAfter: "soft", children: "hi" }) }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(frame.boundaries[0].filter(Boolean)).toHaveLength(2);
    });
    it('propagates selectability and producer-supplied boundaries', () => {
        current = render(_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { selectionFlow: "flow", selectionBreakAfter: "soft", selectionJoiner: " ", children: "hello" }), _jsx(Text, { selectionFlow: "flow", children: "world" }), _jsx(Text, { selectable: false, children: " gutter" })] }));
        const frame = getScreenBuffer(current.stdout).frame;
        expect(frame.boundaries[0].find(Boolean)).toMatchObject({
            kind: 'soft',
            joiner: ' ',
        });
        expect(frame.cells[0][0].flowId).toBe(frame.cells[1][0].flowId);
        expect(frame.cells[2].every((cell) => !cell.selectable)).toBe(true);
    });
});
//# sourceMappingURL=screen-buffer.test.js.map