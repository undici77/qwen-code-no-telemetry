import { jsx as _jsx } from "react/jsx-runtime";
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsContext } from '../contexts/SettingsContext.js';
import { useMouseTrackingEnabled } from './use-mouse-tracking-enabled.js';
const wrapperWith = (ui) => {
    const Wrapper = ({ children }) => (_jsx(SettingsContext.Provider, { value: { merged: { ui } }, children: children }));
    return Wrapper;
};
describe('useMouseTrackingEnabled', () => {
    it('defaults to true with no SettingsProvider', () => {
        const { result } = renderHook(() => useMouseTrackingEnabled());
        expect(result.current).toBe(true);
    });
    it('defaults to true when ui.mouseTracking is unset', () => {
        const { result } = renderHook(() => useMouseTrackingEnabled(), {
            wrapper: wrapperWith({ useTerminalBuffer: true }),
        });
        expect(result.current).toBe(true);
    });
    it('returns false when ui.mouseTracking is false', () => {
        const { result } = renderHook(() => useMouseTrackingEnabled(), {
            wrapper: wrapperWith({ mouseTracking: false }),
        });
        expect(result.current).toBe(false);
    });
    it('returns true when ui.mouseTracking is true', () => {
        const { result } = renderHook(() => useMouseTrackingEnabled(), {
            wrapper: wrapperWith({ mouseTracking: true }),
        });
        expect(result.current).toBe(true);
    });
});
//# sourceMappingURL=use-mouse-tracking-enabled.test.js.map