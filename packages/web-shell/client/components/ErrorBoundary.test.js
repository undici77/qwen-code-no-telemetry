import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mounted = [];
function render(node) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(node));
    mounted.push({ root, container });
    return container;
}
afterEach(() => {
    for (const { root, container } of mounted.splice(0)) {
        act(() => root.unmount());
        container.remove();
    }
    vi.restoreAllMocks();
});
function Boom({ explode }) {
    if (explode)
        throw new Error('kaboom');
    return _jsx("div", { "data-testid": "ok", children: "healthy" });
}
describe('ErrorBoundary', () => {
    it('renders children when nothing throws', () => {
        const container = render(_jsx(ErrorBoundary, { fallback: _jsx("div", { "data-testid": "fallback" }), children: _jsx(Boom, { explode: false }) }));
        expect(container.querySelector('[data-testid="ok"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="fallback"]')).toBeNull();
    });
    it('renders the fallback when a child throws', () => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        const container = render(_jsx(ErrorBoundary, { fallback: _jsx("div", { "data-testid": "fallback", children: "down" }), children: _jsx(Boom, { explode: true }) }));
        expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="ok"]')).toBeNull();
    });
    it('passes the captured error to a render-prop fallback', () => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        const container = render(_jsx(ErrorBoundary, { fallback: (error) => _jsx("div", { "data-testid": "fallback", children: error.message }), children: _jsx(Boom, { explode: true }) }));
        expect(container.querySelector('[data-testid="fallback"]')?.textContent).toBe('kaboom');
    });
    it('logs the error with the configured label prefix', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        render(_jsx(ErrorBoundary, { label: "message:assistant", fallback: _jsx("div", {}), children: _jsx(Boom, { explode: true }) }));
        expect(spy.mock.calls.some(([first]) => typeof first === 'string' &&
            first.includes('[web-shell] message:assistant failed:'))).toBe(true);
    });
    it('recovers when resetKeys change after an error', () => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        mounted.push({ root, container });
        act(() => root.render(_jsx(ErrorBoundary, { resetKeys: [1], fallback: _jsx("div", { "data-testid": "fallback" }), children: _jsx(Boom, { explode: true }) })));
        expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
        // Same key + now-healthy child: the boundary is still latched on the error,
        // so the fallback persists until a reset key actually changes.
        act(() => root.render(_jsx(ErrorBoundary, { resetKeys: [1], fallback: _jsx("div", { "data-testid": "fallback" }), children: _jsx(Boom, { explode: false }) })));
        expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="ok"]')).toBeNull();
        // Changed key clears the error and re-mounts the (now healthy) child.
        act(() => root.render(_jsx(ErrorBoundary, { resetKeys: [2], fallback: _jsx("div", { "data-testid": "fallback" }), children: _jsx(Boom, { explode: false }) })));
        expect(container.querySelector('[data-testid="ok"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="fallback"]')).toBeNull();
    });
    it('keeps showing the fallback when a stable broken child never changes', () => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        mounted.push({ root, container });
        const tree = (_jsx(ErrorBoundary, { resetKeys: [1], fallback: _jsx("div", { "data-testid": "fallback" }), children: _jsx(Boom, { explode: true }) }));
        act(() => root.render(tree));
        act(() => root.render(tree));
        expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
    });
});
//# sourceMappingURL=ErrorBoundary.test.js.map