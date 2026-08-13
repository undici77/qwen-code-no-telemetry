import { describe, expect, it } from 'bun:test';
import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
import { loadProjectWorkspaceSessionSnapshot } from '../project-session-snapshots';
function makeWorkspace(overrides = {}) {
    return {
        id: 'workspace-local',
        name: 'Local Project',
        slug: 'local-project',
        rootPath: '/tmp/local-project',
        createdAt: 1,
        ...overrides,
    };
}
function makeSession(overrides = {}) {
    return {
        id: 'session-1',
        workspaceId: 'workspace-local',
        messages: [],
        supportsBranching: true,
        name: 'Session One',
        lastMessageAt: 2,
        ...overrides,
    };
}
describe('loadProjectWorkspaceSessionSnapshot', () => {
    it('loads local workspace snapshots through the local workspace API', async () => {
        const calls = [];
        const api = {
            getSessionsForWorkspace: async (workspaceId, options) => {
                calls.push(['getSessionsForWorkspace', workspaceId, options]);
                return [makeSession({ workspaceId })];
            },
            invokeOnServer: async (...args) => {
                calls.push(['invokeOnServer', ...args]);
                return [];
            },
        };
        const metas = await loadProjectWorkspaceSessionSnapshot(makeWorkspace(), api);
        expect(calls).toEqual([['getSessionsForWorkspace', 'workspace-local', { refreshExternal: true }]]);
        expect(metas.map(meta => meta.id)).toEqual(['session-1']);
    });
    it('loads remote workspace snapshots from the remote workspace id', async () => {
        const calls = [];
        const api = {
            getSessionsForWorkspace: async (workspaceId, options) => {
                calls.push(['getSessionsForWorkspace', workspaceId, options]);
                return [];
            },
            invokeOnServer: async (...args) => {
                calls.push(['invokeOnServer', ...args]);
                return [makeSession({ workspaceId: 'remote-workspace', id: 'remote-session' })];
            },
        };
        const metas = await loadProjectWorkspaceSessionSnapshot(makeWorkspace({
            id: 'workspace-remote-local',
            remoteServer: {
                url: 'ws://remote.example',
                token: 'token',
                remoteWorkspaceId: 'remote-workspace',
            },
        }), api);
        expect(calls).toEqual([[
                'invokeOnServer',
                'ws://remote.example',
                'token',
                RPC_CHANNELS.sessions.GET_FOR_WORKSPACE,
                'remote-workspace',
                { refreshExternal: true },
            ]]);
        expect(metas.map(meta => meta.id)).toEqual(['remote-session']);
        expect(metas[0]?.workspaceId).toBe('remote-workspace');
    });
});
//# sourceMappingURL=project-session-snapshots.test.js.map