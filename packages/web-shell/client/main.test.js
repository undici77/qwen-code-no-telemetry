import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const testState = vi.hoisted(() => ({
    props: undefined,
}));
vi.mock('react-dom/client', async (importOriginal) => ({
    ...(await importOriginal()),
    default: { createRoot: () => ({ render: vi.fn() }) },
}));
vi.mock('@qwen-code/webui/daemon-react-sdk', () => ({
    DaemonWorkspaceProvider: ({ children }) => children,
}));
vi.mock('./components/WorkspaceSessionProvider', () => ({
    WorkspaceSessionProvider: (props) => {
        testState.props = props;
        return null;
    },
}));
vi.mock('./config/daemon', () => ({
    getDaemonBaseUrl: () => '',
    getDaemonToken: () => 'token',
    removeDaemonTokenFromUrl: vi.fn(),
    waitForDaemonTokenMessage: vi.fn(),
}));
import { StandaloneApp } from './main';
describe('StandaloneApp', () => {
    let container;
    let root;
    beforeEach(() => {
        testState.props = undefined;
        window.history.replaceState(null, '', '/');
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });
    it('keeps the controlled session target in sync with URL changes', () => {
        act(() => root.render(_jsx(StandaloneApp, { daemonToken: "token" })));
        act(() => {
            testState.props?.webShellProps.onSessionIdChange?.('session-created', 'workspace-1');
        });
        expect(testState.props).toMatchObject({
            sessionId: 'session-created',
            workspaceId: 'workspace-1',
        });
        expect(window.location.pathname).toBe('/session/session-created');
        expect(new URLSearchParams(window.location.search).get('workspace')).toBe('workspace-1');
    });
});
//# sourceMappingURL=main.test.js.map