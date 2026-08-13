import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The real provider memoizes its actions object; mirror that with a stable
// reference so `load`/`reload` identities stay put (a fresh object each render
// would loop the resource effect).
const { loadDaemonStatus, actions } = vi.hoisted(() => {
    const fn = vi.fn();
    return { loadDaemonStatus: fn, actions: { loadDaemonStatus: fn } };
});
vi.mock('../DaemonWorkspaceProvider.js', () => ({
    useDaemonWorkspaceActions: () => actions,
}));
const { useDaemonStatusReport } = await import('./useDaemonStatusReport.js');
describe('useDaemonStatusReport', () => {
    let container;
    let root;
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        loadDaemonStatus.mockReset();
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });
    it('exposes the loaded data through the `report` alias', async () => {
        // Guards the alias itself: the dialog reads `.report`, but its own test
        // mocks the whole hook, so only this real-hook test catches a regression
        // where `report: result.data` is dropped as "redundant".
        const report = { v: 1, detail: 'summary', status: 'ok', issues: [] };
        loadDaemonStatus.mockResolvedValue(report);
        let result;
        function TestComponent() {
            result = useDaemonStatusReport({ autoLoad: true });
            return null;
        }
        await act(async () => {
            root.render((_jsx(TestComponent, {})));
        });
        expect(result?.report).toBe(report);
        expect(result?.report).toBe(result?.data);
    });
    it('forwards the detail level to loadDaemonStatus (default summary)', async () => {
        loadDaemonStatus.mockResolvedValue({ v: 1, detail: 'full' });
        function Full() {
            useDaemonStatusReport({ autoLoad: true, detail: 'full' });
            return null;
        }
        await act(async () => {
            root.render((_jsx(Full, {})));
        });
        expect(loadDaemonStatus).toHaveBeenCalledWith('full');
        loadDaemonStatus.mockClear();
        loadDaemonStatus.mockResolvedValue({ v: 1, detail: 'summary' });
        function Default() {
            useDaemonStatusReport({ autoLoad: true });
            return null;
        }
        await act(async () => {
            root.render((_jsx(Default, {})));
        });
        expect(loadDaemonStatus).toHaveBeenCalledWith('summary');
    });
});
//# sourceMappingURL=useDaemonStatusReport.test.js.map