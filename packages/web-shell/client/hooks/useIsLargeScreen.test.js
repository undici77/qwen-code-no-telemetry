import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useIsLargeScreen } from './useIsLargeScreen';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const originalMatchMedia = window.matchMedia;
let root = null;
let container = null;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  window.matchMedia = originalMatchMedia;
});
function installMatchMedia(initial) {
  let matches = initial;
  let listeners = [];
  const mql = {
    get matches() {
      return matches;
    },
    media: '',
    onchange: null,
    addEventListener: (_type, cb) => listeners.push(cb),
    removeEventListener: (_type, cb) => {
      listeners = listeners.filter((l) => l !== cb);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return {
    set(next) {
      matches = next;
      act(() => {
        listeners.forEach((l) => l({ matches }));
      });
    },
  };
}
function Probe() {
  const isLarge = useIsLargeScreen();
  return _jsx('span', { 'data-testid': 'value', children: String(isLarge) });
}
function render() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(_jsx(Probe, {})));
}
function value() {
  return (
    container?.querySelector('[data-testid="value"]')?.textContent ?? undefined
  );
}
describe('useIsLargeScreen', () => {
  it('seeds synchronously from the initial media match', () => {
    installMatchMedia(true);
    render();
    expect(value()).toBe('true');
  });
  it('starts false on small screens', () => {
    installMatchMedia(false);
    render();
    expect(value()).toBe('false');
  });
  it('reacts to viewport crossing the breakpoint', () => {
    const media = installMatchMedia(true);
    render();
    expect(value()).toBe('true');
    media.set(false);
    expect(value()).toBe('false');
    media.set(true);
    expect(value()).toBe('true');
  });
  it('degrades to false when matchMedia is unavailable', () => {
    // Some locked-down/embedded browsers omit matchMedia entirely.
    window.matchMedia = undefined;
    render();
    expect(value()).toBe('false');
  });
});
//# sourceMappingURL=useIsLargeScreen.test.js.map
