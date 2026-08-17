import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
// @vitest-environment jsdom
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../i18n';
import { WebShellPortalRootContext } from '../portalRoot';
import { PaneHeaderActions } from './PaneHeaderActions';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root = null;
let container = null;
let portalRoot = null;
let resizeCallback = null;
beforeEach(() => {
  resizeCallback = null;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb) {
        resizeCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  portalRoot?.remove();
  root = null;
  container = null;
  portalRoot = null;
  vi.unstubAllGlobals();
});
function render(ui) {
  container = document.createElement('div');
  portalRoot = document.createElement('div');
  portalRoot.dataset.webShellPortalRoot = '';
  document.body.appendChild(container);
  document.body.appendChild(portalRoot);
  root = createRoot(container);
  act(() =>
    root.render(
      _jsx(WebShellPortalRootContext.Provider, {
        value: portalRoot,
        children: _jsx(I18nProvider, { language: 'en', children: ui }),
      }),
    ),
  );
}
function hostEl() {
  return (
    container.querySelector('[data-testid="pane-header-actions-inline"]') ??
    container.querySelector('[data-testid="pane-header-actions-host"]')
  );
}
function stubWidths(opts) {
  const header = container.querySelector('header');
  const host = hostEl();
  Object.defineProperty(header, 'clientWidth', {
    configurable: true,
    value: opts.header,
  });
  if (host) {
    Object.defineProperty(host, 'scrollWidth', {
      configurable: true,
      value: opts.hostActions,
    });
  }
  const trailingEl = container.querySelector(
    '[data-testid="pane-close"]',
  )?.parentElement;
  if (trailingEl) {
    Object.defineProperty(trailingEl, 'offsetWidth', {
      configurable: true,
      value: opts.trailing ?? 26,
    });
  }
  if (opts.workspaceTag != null) {
    const tag = container.querySelector('[data-web-shell-pane-workspace]');
    if (tag) {
      Object.defineProperty(tag, 'offsetWidth', {
        configurable: true,
        value: opts.workspaceTag,
      });
    }
  }
}
function collapse() {
  stubWidths({ header: 200, hostActions: 180, trailing: 26 });
  act(() => {
    resizeCallback?.([], {});
  });
}
describe('PaneHeaderActions', () => {
  it('shows host actions inline when they fit', () => {
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx('button', {
              type: 'button',
              'data-testid': 'host-action',
              children: 'Share',
            }),
          }),
        ],
      }),
    );
    stubWidths({ header: 400, hostActions: 80, trailing: 26 });
    act(() => {
      resizeCallback?.([], {});
    });
    expect(
      container.querySelector('[data-testid="pane-header-actions-inline"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="pane-header-overflow"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="host-action"]')?.textContent,
    ).toBe('Share');
  });
  it('collapses host actions into an overflow menu with menuitems', async () => {
    const onShare = vi.fn();
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx('button', {
              type: 'button',
              'data-testid': 'host-action',
              onClick: onShare,
              children: 'Share',
            }),
          }),
        ],
      }),
    );
    collapse();
    expect(
      container.querySelector('[data-testid="pane-header-actions-inline"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="pane-header-actions-host"]'),
    ).not.toBeNull();
    const overflow = container.querySelector(
      '[data-testid="pane-header-overflow"]',
    );
    expect(overflow).not.toBeNull();
    await act(async () => {
      overflow.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    const menu = document.querySelector(
      '[data-testid="pane-header-overflow-menu"]',
    );
    expect(menu).not.toBeNull();
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toBe('Share');
    await act(async () => {
      items[0].dispatchEvent(
        new MouseEvent('click', { bubbles: true, button: 0 }),
      );
    });
    expect(onShare).toHaveBeenCalledTimes(1);
  });
  it('flattens Fragment children into overflow menuitems', async () => {
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsxs(_Fragment, {
              children: [
                _jsx('button', {
                  type: 'button',
                  'aria-label': 'Env',
                  children: 'Env',
                }),
                _jsx('button', {
                  type: 'button',
                  'aria-label': 'Share',
                  children: 'Share',
                }),
              ],
            }),
          }),
        ],
      }),
    );
    collapse();
    const overflow = container.querySelector(
      '[data-testid="pane-header-overflow"]',
    );
    await act(async () => {
      overflow.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    const menu = document.querySelector(
      '[data-testid="pane-header-overflow-menu"]',
    );
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toBe('Env');
    expect(items[1]?.textContent).toBe('Share');
  });
  it('activates opaque custom host components from the overflow menu', async () => {
    const onShare = vi.fn();
    function ShareButton() {
      return _jsx('button', {
        type: 'button',
        'data-testid': 'host-action',
        onClick: onShare,
        children: 'Share',
      });
    }
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx(ShareButton, {}),
          }),
        ],
      }),
    );
    collapse();
    const overflow = container.querySelector(
      '[data-testid="pane-header-overflow"]',
    );
    await act(async () => {
      overflow.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    const menu = document.querySelector(
      '[data-testid="pane-header-overflow-menu"]',
    );
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toBe('Share');
    await act(async () => {
      items[0].dispatchEvent(
        new MouseEvent('click', { bubbles: true, button: 0 }),
      );
    });
    expect(onShare).toHaveBeenCalledTimes(1);
  });
  it('uses the title attribute as overflow label when no text children', async () => {
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx('button', {
              type: 'button',
              title: 'Export',
              children: _jsx('span', {
                'aria-hidden': 'true',
                children: '\u2913',
              }),
            }),
          }),
        ],
      }),
    );
    collapse();
    const overflow = container.querySelector(
      '[data-testid="pane-header-overflow"]',
    );
    await act(async () => {
      overflow.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    const menu = document.querySelector(
      '[data-testid="pane-header-overflow-menu"]',
    );
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toBe('Export');
  });
  it('falls back to the default label when no label source exists', async () => {
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx('button', { type: 'button' }),
          }),
        ],
      }),
    );
    collapse();
    const overflow = container.querySelector(
      '[data-testid="pane-header-overflow"]',
    );
    await act(async () => {
      overflow.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    const menu = document.querySelector(
      '[data-testid="pane-header-overflow-menu"]',
    );
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toBe('Action');
  });
  it('keeps host action instances mounted across collapse', () => {
    let mounts = 0;
    let unmounts = 0;
    function HostAction() {
      const [clicks, setClicks] = useState(0);
      useEffect(() => {
        mounts += 1;
        return () => {
          unmounts += 1;
        };
      }, []);
      return _jsx('button', {
        type: 'button',
        'data-testid': 'host-action',
        'data-clicks': clicks,
        onClick: () => setClicks((value) => value + 1),
        children: 'Share',
      });
    }
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx(HostAction, {}),
          }),
        ],
      }),
    );
    act(() => {
      container
        .querySelector('[data-testid="host-action"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      container
        .querySelector('[data-testid="host-action"]')
        ?.getAttribute('data-clicks'),
    ).toBe('1');
    collapse();
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
    expect(
      container
        .querySelector('[data-testid="host-action"]')
        ?.getAttribute('data-clicks'),
    ).toBe('1');
  });
  it('reserves width for the workspace tag when measuring', () => {
    render(
      _jsxs('header', {
        children: [
          _jsx('span', {
            'data-web-shell-pane-workspace': true,
            children: 'ws',
          }),
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx('button', {
              type: 'button',
              'data-testid': 'host-action',
              children: 'Share',
            }),
          }),
        ],
      }),
    );
    // Header 300px, actions 140px, tag 80px → available ≈ 122 → collapse
    stubWidths({
      header: 300,
      hostActions: 140,
      trailing: 26,
      workspaceTag: 80,
    });
    act(() => {
      resizeCallback?.([], {});
    });
    expect(
      container.querySelector('[data-testid="pane-header-overflow"]'),
    ).not.toBeNull();
  });
  it('expands host actions back inline when the pane widens', () => {
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx('button', {
              type: 'button',
              'data-testid': 'host-action',
              children: 'Share',
            }),
          }),
        ],
      }),
    );
    collapse();
    expect(
      container.querySelector('[data-testid="pane-header-overflow"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="pane-header-actions-inline"]'),
    ).toBeNull();
    stubWidths({ header: 400, hostActions: 80, trailing: 26 });
    act(() => {
      resizeCallback?.([], {});
    });
    expect(
      container.querySelector('[data-testid="pane-header-actions-inline"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="pane-header-overflow"]'),
    ).toBeNull();
  });
  it('ignores aria-hidden glyphs when labelling overflow items', async () => {
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsx(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: _jsx('button', {
              type: 'button',
              children: _jsx('span', {
                'aria-hidden': 'true',
                children: '\u25C6',
              }),
            }),
          }),
        ],
      }),
    );
    collapse();
    const overflow = container.querySelector(
      '[data-testid="pane-header-overflow"]',
    );
    await act(async () => {
      overflow.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    const menu = document.querySelector(
      '[data-testid="pane-header-overflow-menu"]',
    );
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toBe('Action');
  });
  it('omits non-interactive children from the overflow menu', async () => {
    const onEnv = vi.fn();
    const onShare = vi.fn();
    render(
      _jsxs('header', {
        children: [
          _jsx('span', { children: 'Title' }),
          _jsxs(PaneHeaderActions, {
            trailing: _jsx('button', {
              type: 'button',
              'data-testid': 'pane-close',
              children: 'x',
            }),
            children: [
              _jsx('button', {
                type: 'button',
                'aria-label': 'Env',
                onClick: onEnv,
                children: 'Env',
              }),
              _jsx('span', { 'aria-hidden': 'true', children: '|' }),
              _jsx('button', {
                type: 'button',
                'aria-label': 'Share',
                onClick: onShare,
                children: 'Share',
              }),
            ],
          }),
        ],
      }),
    );
    collapse();
    const overflow = container.querySelector(
      '[data-testid="pane-header-overflow"]',
    );
    await act(async () => {
      overflow.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    const menu = document.querySelector(
      '[data-testid="pane-header-overflow-menu"]',
    );
    const items = menu.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toBe('Env');
    expect(items[1]?.textContent).toBe('Share');
    await act(async () => {
      items[1].dispatchEvent(
        new MouseEvent('click', { bubbles: true, button: 0 }),
      );
    });
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onEnv).not.toHaveBeenCalled();
  });
});
//# sourceMappingURL=PaneHeaderActions.test.js.map
