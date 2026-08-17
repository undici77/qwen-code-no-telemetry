import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
afterEach(() => {
  vi.restoreAllMocks();
});
describe('usePrefersReducedMotion', () => {
  it('updates when the system preference changes', () => {
    let matches = false;
    const listeners = new Set();
    vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_type, listener) => {
        listeners.add(listener);
      },
      removeEventListener: (_type, listener) => {
        listeners.delete(listener);
      },
    }));
    function Harness() {
      const reducedMotion = usePrefersReducedMotion();
      return _jsx('div', { 'data-reduced-motion': reducedMotion });
    }
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(_jsx(Harness, {})));
    expect(
      container
        .querySelector('[data-reduced-motion]')
        ?.getAttribute('data-reduced-motion'),
    ).toBe('false');
    act(() => {
      matches = true;
      for (const listener of listeners) listener();
    });
    expect(
      container
        .querySelector('[data-reduced-motion]')
        ?.getAttribute('data-reduced-motion'),
    ).toBe('true');
    act(() => root.unmount());
    expect(listeners).toHaveLength(0);
  });
});
//# sourceMappingURL=usePrefersReducedMotion.test.js.map
