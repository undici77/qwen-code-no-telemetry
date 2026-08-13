/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
const mockCreateDaemonWorkspaceService = vi.hoisted(() => vi.fn((_deps) => ({})));
vi.mock('./workspace-service/index.js', () => ({
    createDaemonWorkspaceService: mockCreateDaemonWorkspaceService,
}));
const { createServeApp } = await import('./server.js');
const baseOpts = {
    hostname: '127.0.0.1',
    port: 4170,
    mode: 'http-bridge',
};
function makeBridge() {
    return {
        isChannelLive: vi.fn(() => false),
        queryWorkspaceStatus: vi.fn(),
        invokeWorkspaceCommand: vi.fn(),
        refreshExtensionsForAllSessions: vi.fn(async () => ({
            refreshed: 0,
            failed: 0,
        })),
        publishWorkspaceEvent: vi.fn(),
    };
}
describe('createServeApp workspace service wiring', () => {
    it('forwards batch settings persistence to the workspace service', () => {
        mockCreateDaemonWorkspaceService.mockClear();
        const persistSetting = vi.fn(async (_workspace, _scope, _key, _value) => { });
        const persistSettings = vi.fn(async (_workspace, _writes) => { });
        createServeApp(baseOpts, undefined, {
            boundWorkspace: '/workspace',
            bridge: makeBridge(),
            persistSetting,
            persistSettings,
        });
        expect(mockCreateDaemonWorkspaceService).toHaveBeenCalledTimes(1);
        expect(mockCreateDaemonWorkspaceService.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
            persistSetting,
            persistSettings,
        }));
    });
});
//# sourceMappingURL=server-workspace-service.test.js.map