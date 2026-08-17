import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { StrictMode, useMemo } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
const mocks = vi.hoisted(() => ({
  workspace: {
    client: undefined,
    workspaceCwd: '/primary',
    actions: {
      deleteSession: vi.fn(),
      deleteSessions: vi.fn(),
      archiveSession: vi.fn(),
      unarchiveSession: vi.fn(),
    },
  },
  useSessions: vi.fn(() => ({
    deleteSession: vi.fn(),
    deleteSessions: vi.fn(),
    archiveSession: vi.fn(),
    unarchiveSession: vi.fn(),
    exportSession: vi.fn(),
    loadSession: vi.fn(),
    resumeSession: vi.fn(),
    newSession: vi.fn(),
    releaseSession: vi.fn(),
  })),
}));
vi.mock('@qwen-code/webui/daemon-react-sdk', () => ({
  useSessions: mocks.useSessions,
  useWorkspace: () => mocks.workspace,
}));
const { useSessionCatalogQuery, useWebShellSessions } = await import(
  './session-catalog-hooks'
);
let root;
let container;
let legacy;
beforeEach(() => {
  legacy = vi.fn();
  mocks.workspace.actions.deleteSession.mockReset();
  mocks.workspace.actions.deleteSessions.mockReset();
  mocks.workspace.actions.archiveSession.mockReset();
  mocks.workspace.actions.unarchiveSession.mockReset();
  mocks.workspace.client = {
    listWorkspaceSessionsPage: legacy,
    workspaceByCwd: vi.fn(() => ({
      listWorkspaceSessionsPage: vi.fn(),
    })),
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function QueryProbe({ id }) {
  const query = useMemo(
    () => ({
      routeKind: 'legacy',
      workspaceCwd: '/work',
      options: { pageSize: 25, archiveState: 'active' },
    }),
    [],
  );
  const result = useSessionCatalogQuery(mocks.workspace.client, query, {
    autoLoad: true,
  });
  return _jsx('span', {
    'data-testid': id,
    children: result.sessions[0]?.sessionId,
  });
}
describe('session catalog hooks', () => {
  it('shares one request across StrictMode consumers and remounts', async () => {
    const response = deferred();
    legacy.mockReturnValue(response.promise);
    act(() => {
      root.render(
        _jsxs(StrictMode, {
          children: [
            _jsx(QueryProbe, { id: 'first' }),
            _jsx(QueryProbe, { id: 'second' }),
          ],
        }),
      );
    });
    expect(legacy).toHaveBeenCalledTimes(1);
    await act(async () => {
      response.resolve({ sessions: [{ sessionId: 'shared' }] });
      await response.promise;
    });
    expect(container.textContent).toBe('sharedshared');
    act(() => root.unmount());
    root = createRoot(container);
    act(() => {
      root.render(
        _jsx(StrictMode, { children: _jsx(QueryProbe, { id: 'remounted' }) }),
      );
    });
    expect(legacy).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('shared');
  });
  it('provides the legacy Web Shell facade without dropping page metadata', async () => {
    legacy.mockResolvedValue({
      sessions: [{ sessionId: 'primary' }],
      nextCursor: 'next',
      liveMergeFailed: true,
      truncated: true,
    });
    function FacadeProbe() {
      const result = useWebShellSessions({
        autoLoad: true,
        pageSize: 25,
        archiveState: 'active',
        sourceType: 'default',
      });
      return _jsxs('span', {
        children: [
          result.sessions[0]?.sessionId,
          ':',
          result.nextCursor,
          ':',
          String(result.liveMergeFailed),
          ':',
          String(result.truncated),
        ],
      });
    }
    await act(async () => {
      root.render(_jsx(FacadeProbe, {}));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(legacy).toHaveBeenCalledWith('/primary', {
      pageSize: 25,
      archiveState: 'active',
      sourceType: 'default',
    });
    expect(container.textContent).toBe('primary:next:true:true');
  });
  it('runs mutations directly and performs only the Store resynchronization', async () => {
    legacy.mockResolvedValue({ sessions: [{ sessionId: 'primary' }] });
    mocks.workspace.actions.deleteSession.mockResolvedValue(true);
    let facade;
    function FacadeProbe() {
      facade = useWebShellSessions({ autoLoad: true });
      return null;
    }
    await act(async () => {
      root.render(_jsx(FacadeProbe, {}));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(legacy).toHaveBeenCalledTimes(1);
    await act(async () => {
      await facade.deleteSession('primary');
    });
    expect(mocks.workspace.actions.deleteSession).toHaveBeenCalledWith(
      'primary',
    );
    expect(
      mocks.useSessions.mock.results.at(-1)?.value.deleteSession,
    ).not.toHaveBeenCalled();
    expect(legacy).toHaveBeenCalledTimes(2);
  });
  it('keeps the legacy reload contract when a list request fails', async () => {
    legacy.mockRejectedValue(new Error('offline'));
    let facade;
    function FacadeProbe() {
      facade = useWebShellSessions();
      return null;
    }
    act(() => root.render(_jsx(FacadeProbe, {})));
    let result;
    await act(async () => {
      result = await facade.reload();
    });
    expect(result).toBeUndefined();
  });
});
//# sourceMappingURL=session-catalog-hooks.test.js.map
