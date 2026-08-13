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
import { useDaemonResource } from './useDaemonResource.js';
function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
describe('useDaemonResource', () => {
    let container;
    let root;
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });
    it('loads data on autoLoad', async () => {
        const load = vi.fn().mockResolvedValue('hello');
        let result;
        function TestComponent() {
            result = useDaemonResource(load, { autoLoad: true });
            return null;
        }
        await act(async () => {
            root.render((_jsx(TestComponent, {})));
        });
        expect(result?.data).toBe('hello');
        expect(result?.loading).toBe(false);
    });
    it('does not load when enabled is false', async () => {
        const load = vi.fn().mockResolvedValue('hello');
        let result;
        function TestComponent() {
            result = useDaemonResource(load, { autoLoad: true, enabled: false });
            return null;
        }
        await act(async () => {
            root.render((_jsx(TestComponent, {})));
        });
        expect(load).not.toHaveBeenCalled();
        expect(result?.data).toBeUndefined();
    });
    it('reports error on load failure', async () => {
        const load = vi.fn().mockRejectedValue(new Error('network error'));
        let result;
        function TestComponent() {
            result = useDaemonResource(load, { autoLoad: true });
            return null;
        }
        await act(async () => {
            root.render((_jsx(TestComponent, {})));
        });
        expect(result?.error?.message).toBe('network error');
        expect(result?.loading).toBe(false);
    });
    it('stale response does not overwrite fresh data', async () => {
        const deferred1 = createDeferred();
        const deferred2 = createDeferred();
        let callCount = 0;
        const load = vi.fn(() => {
            callCount++;
            return callCount === 1 ? deferred1.promise : deferred2.promise;
        });
        let result;
        let reloadFn;
        function TestComponent() {
            const r = useDaemonResource(load, { autoLoad: false, enabled: true });
            result = r;
            reloadFn = r.reload;
            return null;
        }
        await act(async () => {
            root.render((_jsx(TestComponent, {})));
        });
        // Fire two reloads in quick succession
        let p1;
        let p2;
        act(() => {
            p1 = reloadFn();
            p2 = reloadFn();
        });
        // Resolve the second (newer) request first
        await act(async () => {
            deferred2.resolve('fresh');
        });
        await act(async () => {
            await p2;
        });
        expect(result?.data).toBe('fresh');
        // Now resolve the first (stale) request — it should be ignored
        await act(async () => {
            deferred1.resolve('stale');
        });
        await act(async () => {
            await p1;
        });
        expect(result?.data).toBe('fresh');
    });
    it('stale error does not overwrite fresh data', async () => {
        const deferred1 = createDeferred();
        const deferred2 = createDeferred();
        let callCount = 0;
        const load = vi.fn(() => {
            callCount++;
            return callCount === 1 ? deferred1.promise : deferred2.promise;
        });
        let result;
        let reloadFn;
        function TestComponent() {
            const r = useDaemonResource(load, { autoLoad: false, enabled: true });
            result = r;
            reloadFn = r.reload;
            return null;
        }
        await act(async () => {
            root.render((_jsx(TestComponent, {})));
        });
        let p1;
        let p2;
        act(() => {
            p1 = reloadFn();
            p2 = reloadFn();
        });
        // Resolve the second request successfully
        await act(async () => {
            deferred2.resolve('fresh');
        });
        await act(async () => {
            await p2;
        });
        expect(result?.data).toBe('fresh');
        expect(result?.error).toBeUndefined();
        // First request fails — should not set error state
        await act(async () => {
            deferred1.reject(new Error('stale error'));
        });
        await act(async () => {
            await p1;
        });
        expect(result?.data).toBe('fresh');
        expect(result?.error).toBeUndefined();
    });
});
//# sourceMappingURL=useDaemonResource.test.js.map