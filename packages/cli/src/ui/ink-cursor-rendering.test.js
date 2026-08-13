import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { act, useState } from 'react';
import ansiEscapes from 'ansi-escapes';
import { Box, render, Static, Text, useCursor } from 'ink';
import { afterEach, describe, expect, it } from 'vitest';
const SHOW_CURSOR = '\u001B[?25h';
const mountedApps = new Set();
afterEach(async () => {
    for (const app of mountedApps) {
        await act(async () => {
            app.unmount();
        });
        await app.waitUntilRenderFlush();
    }
    mountedApps.clear();
});
function createTestStdout(rows = 24) {
    let chunks = [];
    const stdout = Object.create(process.stdout, {
        columns: { value: 80 },
        rows: { value: rows },
        isTTY: { value: true },
        write: {
            value(chunk, encodingOrCallback, callback) {
                chunks.push(String(chunk));
                const done = typeof encodingOrCallback === 'function'
                    ? encodingOrCallback
                    : callback;
                done?.();
                return true;
            },
        },
    });
    return {
        stdout,
        read: () => chunks.join(''),
        reset: () => {
            chunks = [];
        },
    };
}
function expectedCursorSuffix(visibleLines, x = 2) {
    return (ansiEscapes.cursorUp(visibleLines) + ansiEscapes.cursorTo(x) + SHOW_CURSOR);
}
async function mount(node, stdout, incrementalRendering) {
    let app;
    await act(async () => {
        app = render(node, {
            stdout,
            interactive: true,
            incrementalRendering,
            maxFps: 1_000,
            patchConsole: false,
        });
    });
    mountedApps.add(app);
    await app.waitUntilRenderFlush();
    return app;
}
async function updateAndFlush(app, update) {
    await act(async () => {
        update();
    });
    await app.waitUntilRenderFlush();
}
async function unmount(app) {
    await act(async () => {
        app.unmount();
    });
    await app.waitUntilRenderFlush();
    mountedApps.delete(app);
}
describe.each([false, true])('Ink cursor rendering (incrementalRendering: %s)', (incrementalRendering) => {
    it('reasserts the cursor after a sibling-only update', async () => {
        const capture = createTestStdout();
        let updateFooter;
        let cursorRenderCount = 0;
        function CursorOwner() {
            cursorRenderCount++;
            useCursor().setCursorPosition({ x: 2, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        function Footer() {
            const [multiline, setMultiline] = useState(false);
            updateFooter = () => setMultiline(true);
            return _jsx(Text, { children: multiline ? 'footer-a\nfooter-b' : 'footer' });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Footer, {})] }), capture.stdout, incrementalRendering);
        expect(cursorRenderCount).toBe(1);
        capture.reset();
        await updateAndFlush(app, updateFooter);
        expect(cursorRenderCount).toBe(1);
        expect(capture.read()).toContain(expectedCursorSuffix(3));
        await unmount(app);
    });
    it('reasserts the cursor after Static output is appended', async () => {
        const capture = createTestStdout();
        let appendStatic;
        let cursorRenderCount = 0;
        function CursorOwner() {
            cursorRenderCount++;
            useCursor().setCursorPosition({ x: 2, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        function StaticOutput() {
            const [items, setItems] = useState([]);
            appendStatic = () => setItems(['done']);
            return (_jsx(Static, { items: items, children: (item) => _jsx(Text, { children: item }, item) }));
        }
        const app = await mount(_jsxs(_Fragment, { children: [_jsx(StaticOutput, {}), _jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Text, { children: "footer" })] })] }), capture.stdout, incrementalRendering);
        expect(cursorRenderCount).toBe(1);
        capture.reset();
        await updateAndFlush(app, appendStatic);
        expect(cursorRenderCount).toBe(1);
        expect(capture.read()).toContain('done');
        expect(capture.read()).toContain(expectedCursorSuffix(2));
        await unmount(app);
    });
    it('reasserts the cursor after a fullscreen clear and sync', async () => {
        const capture = createTestStdout(2);
        let updateFooter;
        let cursorRenderCount = 0;
        function CursorOwner() {
            cursorRenderCount++;
            useCursor().setCursorPosition({ x: 2, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        function Footer() {
            const [multiline, setMultiline] = useState(false);
            updateFooter = () => setMultiline(true);
            return _jsx(Text, { children: multiline ? 'footer-a\nfooter-b' : 'footer' });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Footer, {})] }), capture.stdout, incrementalRendering);
        expect(cursorRenderCount).toBe(1);
        capture.reset();
        await updateAndFlush(app, updateFooter);
        expect(cursorRenderCount).toBe(1);
        expect(capture.read()).toContain(ansiEscapes.clearTerminal);
        // Fullscreen mode (output >= terminal rows) omits the trailing newline,
        // so the cursor starts one line higher: moveUp = visibleLines - 1 - y.
        expect(capture.read()).toContain(expectedCursorSuffix(2));
        await unmount(app);
    });
    it('positions the hardware cursor at the correct row in fullscreen (y > 0)', async () => {
        // Regression test for QwenLM/qwen-code#7980: in fullscreen mode the
        // output has no trailing newline, so the terminal cursor sits ON the
        // last line rather than one past it. buildCursorSuffix must account
        // for this, otherwise the hardware cursor lands one row too high.
        const capture = createTestStdout(3);
        function CursorOwner() {
            // y=1 — the second row of the 3-line output. With the old bug the
            // escape sequence would move the cursor to y=0 instead.
            useCursor().setCursorPosition({ x: 2, y: 1 });
            return _jsx(Text, { children: "input" });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Text, { children: 'mid\nbottom' })] }), capture.stdout, incrementalRendering);
        // 3 visible lines, fullscreen (3 >= 3 rows), no trailing \n.
        // Terminal cursor after write: line 2. Target: y=1.
        // Correct moveUp = 2 - 1 = 1.
        const output = capture.read();
        expect(output).toContain(ansiEscapes.cursorUp(1) + ansiEscapes.cursorTo(2) + SHOW_CURSOR);
        // The buggy value would have been cursorUp(2) — verify it's absent.
        expect(output).not.toContain(ansiEscapes.cursorUp(2) + ansiEscapes.cursorTo(2) + SHOW_CURSOR);
        await unmount(app);
    });
    it('preserves cursor-only position updates', async () => {
        const capture = createTestStdout();
        let moveCursor;
        function CursorOwner() {
            const [x, setX] = useState(2);
            moveCursor = () => setX(4);
            useCursor().setCursorPosition({ x, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Text, { children: "footer" })] }), capture.stdout, incrementalRendering);
        capture.reset();
        await updateAndFlush(app, moveCursor);
        expect(capture.read()).toContain(expectedCursorSuffix(2, 4));
        await unmount(app);
    });
    it('preserves cursor-only position updates in fullscreen', async () => {
        const capture = createTestStdout(2);
        let moveCursor;
        function CursorOwner() {
            const [x, setX] = useState(2);
            moveCursor = () => setX(4);
            useCursor().setCursorPosition({ x, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Text, { children: "footer" })] }), capture.stdout, incrementalRendering);
        capture.reset();
        await updateAndFlush(app, moveCursor);
        // Fullscreen (2 lines >= 2 rows): no trailing newline, so
        // moveUp = (visibleLines - 1) - y = 1, not visibleLines - y = 2.
        const output = capture.read();
        expect(output).toContain(ansiEscapes.cursorUp(1) + ansiEscapes.cursorTo(4) + SHOW_CURSOR);
        expect(output).not.toContain(ansiEscapes.cursorUp(2) + ansiEscapes.cursorTo(4) + SHOW_CURSOR);
        await unmount(app);
    });
    it('reasserts the latest committed cursor after a later sibling update', async () => {
        const capture = createTestStdout();
        let moveCursor;
        let updateFooter;
        let cursorRenderCount = 0;
        function CursorOwner() {
            cursorRenderCount++;
            const [x, setX] = useState(2);
            moveCursor = () => setX(4);
            useCursor().setCursorPosition({ x, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        function Footer() {
            const [multiline, setMultiline] = useState(false);
            updateFooter = () => setMultiline(true);
            return _jsx(Text, { children: multiline ? 'footer-a\nfooter-b' : 'footer' });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Footer, {})] }), capture.stdout, incrementalRendering);
        await updateAndFlush(app, moveCursor);
        expect(cursorRenderCount).toBe(2);
        capture.reset();
        await updateAndFlush(app, updateFooter);
        expect(cursorRenderCount).toBe(2);
        expect(capture.read()).toContain(expectedCursorSuffix(3, 4));
        await unmount(app);
    });
    it('does not write when a sibling rerenders identical output', async () => {
        const capture = createTestStdout();
        let updateFooter;
        let cursorRenderCount = 0;
        function CursorOwner() {
            cursorRenderCount++;
            useCursor().setCursorPosition({ x: 2, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        function Footer() {
            const [, setVersion] = useState(0);
            updateFooter = () => setVersion((version) => version + 1);
            return _jsx(Text, { children: "footer" });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Footer, {})] }), capture.stdout, incrementalRendering);
        expect(cursorRenderCount).toBe(1);
        capture.reset();
        await updateAndFlush(app, updateFooter);
        expect(cursorRenderCount).toBe(1);
        expect(capture.read()).toBe('');
        await unmount(app);
    });
    it('does not restore a cursor after its owner unmounts', async () => {
        const capture = createTestStdout();
        let removeCursor;
        let updateFooter;
        let cursorRenderCount = 0;
        function CursorOwner() {
            cursorRenderCount++;
            useCursor().setCursorPosition({ x: 2, y: 0 });
            return _jsx(Text, { children: "input" });
        }
        function CursorBoundary() {
            const [mounted, setMounted] = useState(true);
            removeCursor = () => setMounted(false);
            return mounted ? _jsx(CursorOwner, {}) : null;
        }
        function Footer() {
            const [value, setValue] = useState('footer');
            updateFooter = () => setValue('footer-updated');
            return _jsx(Text, { children: value });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorBoundary, {}), _jsx(Footer, {})] }), capture.stdout, incrementalRendering);
        await updateAndFlush(app, removeCursor);
        expect(cursorRenderCount).toBe(1);
        capture.reset();
        await updateAndFlush(app, updateFooter);
        expect(cursorRenderCount).toBe(1);
        const output = capture.read();
        expect(output).toContain('footer-updated');
        expect(output).not.toContain(SHOW_CURSOR);
        await unmount(app);
    });
    it('does not restore a cursor after its owner hides it', async () => {
        const capture = createTestStdout();
        let hideCursor;
        let updateFooter;
        let cursorRenderCount = 0;
        function CursorOwner() {
            const [visible, setVisible] = useState(true);
            hideCursor = () => setVisible(false);
            cursorRenderCount++;
            useCursor().setCursorPosition(visible ? { x: 2, y: 0 } : undefined);
            return _jsx(Text, { children: "input" });
        }
        function Footer() {
            const [value, setValue] = useState('footer');
            updateFooter = () => setValue('footer-updated');
            return _jsx(Text, { children: value });
        }
        const app = await mount(_jsxs(Box, { flexDirection: "column", children: [_jsx(CursorOwner, {}), _jsx(Footer, {})] }), capture.stdout, incrementalRendering);
        await updateAndFlush(app, hideCursor);
        expect(cursorRenderCount).toBe(2);
        capture.reset();
        await updateAndFlush(app, updateFooter);
        expect(cursorRenderCount).toBe(2);
        const output = capture.read();
        expect(output).toContain('footer-updated');
        expect(output).not.toContain(SHOW_CURSOR);
        await unmount(app);
    });
});
//# sourceMappingURL=ink-cursor-rendering.test.js.map