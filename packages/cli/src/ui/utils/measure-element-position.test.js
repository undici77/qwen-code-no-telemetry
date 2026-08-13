import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef } from 'react';
import { describe, it, expect } from 'vitest';
import { render, Box, Text } from 'ink';
import { measureElementPosition, layoutRowForEvent, } from './measure-element-position.js';
function createTestStdout() {
    const stdout = Object.create(process.stdout, {
        columns: { value: 80 },
        rows: { value: 24 },
        write: {
            value() {
                return true;
            },
        },
    });
    return { stdout };
}
describe('measureElementPosition', () => {
    it('should return {0,0} for root-level element', async () => {
        const { stdout } = createTestStdout();
        let result = null;
        function Test() {
            const ref = useRef(null);
            useEffect(() => {
                if (ref.current) {
                    result = measureElementPosition(ref.current);
                }
            }, []);
            return (_jsx(Box, { ref: ref, children: _jsx(Text, { children: "hello" }) }));
        }
        const app = render(_jsx(Test, {}), {
            stdout,
            patchConsole: false,
        });
        await new Promise((r) => setTimeout(r, 50));
        app.unmount();
        expect(result).not.toBeNull();
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
    });
    it('should accumulate parent padding/margin offsets', async () => {
        const { stdout } = createTestStdout();
        let result = null;
        function Test() {
            const ref = useRef(null);
            useEffect(() => {
                if (ref.current) {
                    result = measureElementPosition(ref.current);
                }
            }, []);
            return (_jsx(Box, { paddingLeft: 3, paddingTop: 2, children: _jsx(Box, { ref: ref, children: _jsx(Text, { children: "nested" }) }) }));
        }
        const app = render(_jsx(Test, {}), {
            stdout,
            patchConsole: false,
        });
        await new Promise((r) => setTimeout(r, 50));
        app.unmount();
        expect(result).not.toBeNull();
        expect(result.x).toBe(3);
        expect(result.y).toBe(2);
    });
    it('should account for sibling offset', async () => {
        const { stdout } = createTestStdout();
        let result = null;
        function Test() {
            const ref = useRef(null);
            useEffect(() => {
                if (ref.current) {
                    result = measureElementPosition(ref.current);
                }
            }, []);
            return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { height: 3, children: _jsx(Text, { children: "sibling above" }) }), _jsx(Box, { ref: ref, children: _jsx(Text, { children: "target" }) })] }));
        }
        const app = render(_jsx(Test, {}), {
            stdout,
            patchConsole: false,
        });
        await new Promise((r) => setTimeout(r, 50));
        app.unmount();
        expect(result).not.toBeNull();
        expect(result.y).toBe(3);
    });
    it('should return zeroes for unmounted node', () => {
        const fakeNode = {
            yogaNode: undefined,
            parentNode: undefined,
        };
        const result = measureElementPosition(fakeNode);
        expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
});
describe('layoutRowForEvent', () => {
    // A root node whose frame is `frameHeight` rows tall.
    const rootNode = (frameHeight) => ({
        yogaNode: { getComputedHeight: () => frameHeight },
        parentNode: undefined,
    });
    it('maps a 1-based terminal row to a 0-based layout row when the frame fits', () => {
        // Frame fits the terminal → anchor 0 → layout row = terminalRow - 1.
        const node = rootNode(40);
        expect(layoutRowForEvent(node, 1, 40)).toBe(0);
        expect(layoutRowForEvent(node, 6, 40)).toBe(5);
    });
    it('applies the negative anchor correction when the frame overflows', () => {
        // Frame 12 rows, terminal 8 → anchor -4 → +4-row correction.
        const node = rootNode(12);
        // terminalRow 7 → 7 - 1 - (-4) = 10.
        expect(layoutRowForEvent(node, 7, 8)).toBe(10);
    });
});
//# sourceMappingURL=measure-element-position.test.js.map