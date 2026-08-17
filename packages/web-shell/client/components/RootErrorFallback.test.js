import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';
import { RootErrorFallback } from './RootErrorFallback';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mounted = [];
function mount(node) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  const entry = { container, root };
  mounted.push(entry);
  return entry;
}
afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
// Mirror the top-level wiring in index.tsx / main.tsx: the boundary wraps the
// whole App and renders RootErrorFallback (with retry) on a render-phase crash.
function RootBoundary({ children, language }) {
  return _jsx(ErrorBoundary, {
    label: 'web-shell-root',
    fallback: (error, reset) =>
      _jsx(RootErrorFallback, {
        error: error,
        onRetry: reset,
        language: language,
      }),
    children: children,
  });
}
describe('RootErrorFallback', () => {
  it('renders English copy by default', () => {
    const { container } = mount(
      _jsx(RootErrorFallback, {
        error: new Error('boom detail'),
        onRetry: () => {},
      }),
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Something went wrong');
    expect(alert?.textContent).toContain('Try again');
  });
  it('shows the raw error message only in dev, never in production', () => {
    vi.stubEnv('DEV', true);
    const dev = mount(
      _jsx(RootErrorFallback, {
        error: new Error('boom detail'),
        onRetry: () => {},
      }),
    );
    expect(dev.container.textContent).toContain('boom detail');
    vi.stubEnv('DEV', false);
    const prod = mount(
      _jsx(RootErrorFallback, {
        error: new Error('boom detail'),
        onRetry: () => {},
      }),
    );
    expect(prod.container.textContent).not.toContain('boom detail');
    // The user-facing copy still renders in production.
    expect(prod.container.textContent).toContain('Something went wrong');
    expect(prod.container.textContent).toContain('Try again');
  });
  it('renders zh-CN copy when language is zh-CN', () => {
    const { container } = mount(
      _jsx(RootErrorFallback, {
        error: new Error('x'),
        onRetry: () => {},
        language: 'zh-CN',
      }),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '出了点问题',
    );
  });
  it('catches an App-level render crash instead of white-screening', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function BrokenApp() {
      throw new Error('app render exploded');
    }
    const { container } = mount(
      _jsx(RootBoundary, { children: _jsx(BrokenApp, {}) }),
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Something went wrong');
    expect(alert?.textContent).toContain('app render exploded');
  });
  it('recovers when the user clicks "Try again" after the cause is gone', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // External switch the child reads at render time. The boundary's reset()
    // re-renders the children; flipping this before the click lets the now-
    // healthy App mount.
    let shouldThrow = true;
    function FlakyApp() {
      if (shouldThrow) throw new Error('transient');
      return _jsx('div', { 'data-testid': 'app', children: 'recovered' });
    }
    const { container } = mount(
      _jsx(RootBoundary, { children: _jsx(FlakyApp, {}) }),
    );
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="app"]')).toBeNull();
    shouldThrow = false;
    const retryButton = container.querySelector('button');
    expect(retryButton).not.toBeNull();
    act(() => {
      retryButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="app"]')?.textContent).toBe(
      'recovered',
    );
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
//# sourceMappingURL=RootErrorFallback.test.js.map
