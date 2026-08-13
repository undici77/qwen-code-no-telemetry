import { jsx as _jsx } from "react/jsx-runtime";
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useVirtualViewport, VirtualViewportContext, } from './VirtualViewportContext.js';
const wrapper = (value) => function VirtualViewportWrapper({ children }) {
    return (_jsx(VirtualViewportContext.Provider, { value: value, children: children }));
};
describe('useVirtualViewport', () => {
    it('uses the fallback outside the app provider', () => {
        expect(renderHook(() => useVirtualViewport()).result.current).toBe(false);
        expect(renderHook(() => useVirtualViewport(true)).result.current).toBe(true);
    });
    it('gives the startup decision precedence over the fallback', () => {
        expect(renderHook(() => useVirtualViewport(true), {
            wrapper: wrapper(false),
        }).result.current).toBe(false);
        expect(renderHook(() => useVirtualViewport(false), {
            wrapper: wrapper(true),
        }).result.current).toBe(true);
    });
});
//# sourceMappingURL=VirtualViewportContext.test.js.map