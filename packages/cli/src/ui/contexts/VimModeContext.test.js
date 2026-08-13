import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression tests for vim Esc key isolation.
 *
 * Guards against Esc leaking from vim INSERT mode into AppContainer's
 * escape handler (cancel stream / "Press Esc again to clear").
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { act } from 'react';
import { VimModeProvider, useVimModeState, useVimModeActions, } from './VimModeContext.js';
function makeSettings(vimEnabled = true) {
    return {
        merged: { general: { vimMode: vimEnabled } },
        setValue: vi.fn().mockResolvedValue(undefined),
    };
}
describe('VimModeContext — Esc key isolation in INSERT mode', () => {
    it('setVimMode should be available and callable', () => {
        const settings = makeSettings(true);
        let capturedSetVimMode = null;
        function Capture() {
            const { setVimMode } = useVimModeActions();
            capturedSetVimMode = setVimMode;
            return _jsx(Text, { children: "ok" });
        }
        render(_jsx(VimModeProvider, { settings: settings, children: _jsx(Capture, {}) }));
        expect(capturedSetVimMode).toBeTypeOf('function');
        expect(() => {
            act(() => {
                capturedSetVimMode('NORMAL');
            });
        }).not.toThrow();
    });
    it('setVimMode reference should be stable across re-renders', () => {
        const settings = makeSettings(true);
        const refs = [];
        function Capture() {
            const { setVimMode } = useVimModeActions();
            refs.push(setVimMode);
            return _jsx(Text, { children: "ok" });
        }
        const { rerender } = render(_jsx(VimModeProvider, { settings: settings, children: _jsx(Capture, {}) }));
        rerender(_jsx(VimModeProvider, { settings: settings, children: _jsx(Capture, {}) }));
        expect(refs.length).toBeGreaterThanOrEqual(2);
        expect(refs[0]).toBe(refs[refs.length - 1]);
    });
    it('Actions consumers should NOT re-render when mode changes', () => {
        const settings = makeSettings(true);
        const actionsSpy = vi.fn();
        let setVimModeRef = () => { };
        function ActionsCapture() {
            const { setVimMode } = useVimModeActions();
            setVimModeRef = setVimMode;
            actionsSpy();
            return _jsx(Text, { children: "ok" });
        }
        render(_jsx(VimModeProvider, { settings: settings, children: _jsx(ActionsCapture, {}) }));
        act(() => {
            setVimModeRef('INSERT');
        });
        actionsSpy.mockClear();
        // Simulate Esc in INSERT mode → NORMAL
        act(() => {
            setVimModeRef('NORMAL');
        });
        // Actions consumer must NOT re-render — this is the key invariant.
        // If it re-renders, AppContainer would also re-render on every Esc,
        // causing the "Press Esc again" leak.
        expect(actionsSpy.mock.calls.length).toBe(0);
    });
    it('State consumers should re-render when mode changes', () => {
        const settings = makeSettings(true);
        const stateSpy = vi.fn();
        let setVimModeRef = () => { };
        function StateCapture() {
            const { vimMode } = useVimModeState();
            setVimModeRef = useVimModeActions().setVimMode;
            stateSpy();
            return _jsx(Text, { children: vimMode });
        }
        render(_jsx(VimModeProvider, { settings: settings, children: _jsx(StateCapture, {}) }));
        act(() => {
            setVimModeRef('INSERT');
        });
        stateSpy.mockClear();
        act(() => {
            setVimModeRef('NORMAL');
        });
        // State consumer should re-render to reflect the new mode
        expect(stateSpy.mock.calls.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=VimModeContext.test.js.map