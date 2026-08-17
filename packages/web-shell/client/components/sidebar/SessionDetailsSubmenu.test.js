import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
const { dropdownMenu } = vi.hoisted(() => ({
  dropdownMenu: {
    subContentProps: null,
    subContentPropsHistory: [],
    open: false,
    onOpenChange: null,
    copyItemOnSelect: null,
    portalRoot: null,
  },
}));
vi.mock('../ui/dropdown-menu', () => {
  function DropdownMenuSub({
    children,
    open = false,
    onOpenChange = () => {},
  }) {
    dropdownMenu.open = open;
    dropdownMenu.onOpenChange = onOpenChange;
    return dropdownMenu.portalRoot
      ? createPortal(children, dropdownMenu.portalRoot)
      : children;
  }
  const DropdownMenuSubTrigger = forwardRef(function DropdownMenuSubTrigger(
    { onClick, ...props },
    ref,
  ) {
    return _jsx('button', {
      ...props,
      ref: ref,
      type: 'button',
      onClick: (event) => {
        onClick?.(event);
        const nextOpen = !dropdownMenu.open;
        dropdownMenu.onOpenChange?.(nextOpen);
      },
    });
  });
  function DropdownMenuSubContent({
    children,
    avoidCollisions,
    collisionBoundary,
    collisionPadding,
    updatePositionStrategy,
    className,
  }) {
    const subContentProps = {
      avoidCollisions,
      collisionBoundary,
      collisionPadding,
      updatePositionStrategy,
      className,
    };
    dropdownMenu.subContentProps = subContentProps;
    dropdownMenu.subContentPropsHistory.push(subContentProps);
    return _jsx('div', {
      'data-slot': 'dropdown-menu-sub-content',
      className: className,
      children: children,
    });
  }
  function DropdownMenuItem({ children, onSelect, ...props }) {
    dropdownMenu.copyItemOnSelect = onSelect ?? null;
    return _jsx('div', { role: 'menuitem', ...props, children: children });
  }
  return {
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuItem,
  };
});
const { I18nProvider } = await import('../../i18n');
const { SessionDetailsSubmenu } = await import('./SessionDetailsSubmenu');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const session = {
  sessionId:
    'session-id-that-remains-complete-when-the-visible-value-is-truncated',
  displayName: 'Long running session',
  clientCount: 2,
  hasActivePrompt: true,
};
let root;
let container;
let webShellRoot;
let portalRoot;
let onError;
let getCollisionBoundary;
let clipboardDescriptor;
function render(sessionOverride = session) {
  act(() => {
    root.render(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx('div', {
          ref: (element) => {
            if (element) {
              webShellRoot = element;
            }
          },
          'data-web-shell-root': true,
          children: _jsx('aside', {
            children: _jsx(SessionDetailsSubmenu, {
              session: sessionOverride,
              label: 'Long running session',
              completedUnread: true,
              onError: onError,
              getCollisionBoundary: getCollisionBoundary,
            }),
          }),
        }),
      }),
    );
  });
}
function getMenuItem(label) {
  const item = portalRoot.querySelector(
    `[role="menuitem"][aria-label="${label}"]`,
  );
  expect(item).not.toBeNull();
  return item;
}
function getStatus() {
  const status = portalRoot.querySelector('[role="status"]');
  expect(status).not.toBeNull();
  return status;
}
async function openDetails() {
  const details = Array.from(portalRoot.querySelectorAll('button')).find(
    (button) => button.textContent?.includes('Details'),
  );
  expect(details).not.toBeUndefined();
  await click(details);
}
async function click(element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
  });
}
async function selectCopy() {
  const onSelect = dropdownMenu.copyItemOnSelect;
  expect(onSelect).not.toBeNull();
  const event = new Event('select', { cancelable: true });
  await act(async () => {
    onSelect(event);
    await Promise.resolve();
  });
  return event;
}
function mockClipboard(writeText) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  portalRoot = document.createElement('div');
  portalRoot.dataset.webShellPortalRoot = '';
  document.body.appendChild(portalRoot);
  root = createRoot(container);
  onError = vi.fn();
  getCollisionBoundary = vi.fn(() => webShellRoot);
  clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  dropdownMenu.subContentProps = null;
  dropdownMenu.subContentPropsHistory = [];
  dropdownMenu.open = false;
  dropdownMenu.onOpenChange = null;
  dropdownMenu.copyItemOnSelect = null;
  dropdownMenu.portalRoot = portalRoot;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  portalRoot.remove();
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, 'clipboard');
  }
  vi.restoreAllMocks();
});
describe('SessionDetailsSubmenu', () => {
  it('uses the non-portal WebShell root for narrow-screen collision flipping', async () => {
    render();
    dropdownMenu.subContentPropsHistory = [];
    await openDetails();
    const firstOpenProps = dropdownMenu.subContentPropsHistory.at(0);
    const subContentProps = dropdownMenu.subContentProps;
    expect(getCollisionBoundary).toHaveBeenCalled();
    expect(firstOpenProps.collisionBoundary).toBe(webShellRoot);
    expect(subContentProps.avoidCollisions).toBe(true);
    expect(subContentProps.collisionBoundary).toBe(webShellRoot);
    expect(subContentProps.collisionBoundary).not.toBe(portalRoot);
    expect(subContentProps.collisionPadding).toBe(8);
    expect(subContentProps.updatePositionStrategy).toBe('always');
  });
  it('copies the complete session ID through the copy menu item', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render();
    await openDetails();
    expect(getMenuItem('Copy session ID')).not.toBeNull();
    expect(getStatus().textContent).toBe('');
    const selectEvent = await selectCopy();
    expect(selectEvent.defaultPrevented).toBe(true);
    expect(writeText).toHaveBeenCalledWith(session.sessionId);
    expect(getStatus().textContent).toBe('Session ID copied');
    expect(getStatus().getAttribute('aria-live')).toBe('polite');
  });
  it('clears copied feedback when Details closes or its session changes', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render();
    await openDetails();
    await selectCopy();
    expect(getStatus().textContent).toBe('Session ID copied');
    await openDetails();
    expect(getStatus().textContent).toBe('');
    await openDetails();
    await selectCopy();
    expect(getStatus().textContent).toBe('Session ID copied');
    render({ ...session, sessionId: 'different-session-id' });
    expect(getStatus().textContent).toBe('');
  });
  it('ignores a pending copy result after Details closes and reopens', async () => {
    const pendingCopy = deferred();
    mockClipboard(vi.fn().mockReturnValue(pendingCopy.promise));
    render();
    await openDetails();
    await selectCopy();
    await openDetails();
    await openDetails();
    await act(async () => {
      pendingCopy.resolve(undefined);
      await pendingCopy.promise;
    });
    expect(getStatus().textContent).toBe('');
    expect(onError).not.toHaveBeenCalled();
  });
  it('only applies the latest copy attempt for the current session', async () => {
    const firstCopy = deferred();
    const secondCopy = deferred();
    const staleError = new Error('stale clipboard failure');
    mockClipboard(
      vi
        .fn()
        .mockReturnValueOnce(firstCopy.promise)
        .mockReturnValueOnce(secondCopy.promise),
    );
    render();
    await openDetails();
    await selectCopy();
    await selectCopy();
    await act(async () => {
      secondCopy.resolve(undefined);
      await secondCopy.promise;
    });
    expect(getStatus().textContent).toBe('Session ID copied');
    await act(async () => {
      firstCopy.reject(staleError);
      await firstCopy.promise.catch(() => undefined);
    });
    expect(getStatus().textContent).toBe('Session ID copied');
    expect(onError).not.toHaveBeenCalled();
  });
  it('ignores a pending copy failure after the session changes', async () => {
    const pendingCopy = deferred();
    const staleError = new Error('stale clipboard failure');
    mockClipboard(vi.fn().mockReturnValue(pendingCopy.promise));
    render();
    await openDetails();
    await selectCopy();
    render({ ...session, sessionId: 'different-session-id' });
    await act(async () => {
      pendingCopy.reject(staleError);
      await pendingCopy.promise.catch(() => undefined);
    });
    expect(getStatus().textContent).toBe('');
    expect(onError).not.toHaveBeenCalled();
  });
  it('reports clipboard failures through the existing error path', async () => {
    const error = new Error('clipboard denied');
    mockClipboard(vi.fn().mockRejectedValue(error));
    render();
    await openDetails();
    await selectCopy();
    expect(getStatus().textContent).toBe('');
    expect(onError).toHaveBeenCalledWith(error, 'Failed to copy session ID');
  });
  it('reports an unavailable clipboard through the existing error path', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    render();
    await openDetails();
    await selectCopy();
    expect(getStatus().textContent).toBe('');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Clipboard API is unavailable' }),
      'Failed to copy session ID',
    );
  });
});
//# sourceMappingURL=SessionDetailsSubmenu.test.js.map
