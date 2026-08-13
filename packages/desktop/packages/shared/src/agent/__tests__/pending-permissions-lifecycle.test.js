import { afterEach, describe, expect, it, jest } from 'bun:test';
import { QwenAgent } from '../qwen-agent.ts';
import { createMockBackendConfig, createMockSession, createMockWorkspace, } from './test-utils.ts';
function createAgent(permissionMode = 'ask') {
    const agent = new QwenAgent(createMockBackendConfig({
        workspace: createMockWorkspace({
            id: 'workspace-qwen',
            name: 'Qwen Workspace',
            slug: 'qwen-workspace',
            rootPath: '/tmp/qwen-permission-tests',
        }),
        session: createMockSession({
            id: 'session-qwen',
            name: 'Qwen Session',
            workspaceRootPath: '/tmp/qwen-permission-tests',
            permissionMode,
        }),
    }));
    agent.setPermissionMode(permissionMode);
    return agent;
}
function permissionRequest() {
    return {
        toolCall: {
            title: 'Run a command',
            kind: 'execute',
            rawInput: { command: 'npm test' },
            _meta: { toolName: 'shell' },
        },
        options: [
            {
                optionId: 'proceed_once',
                name: 'Allow once',
                kind: 'allow_once',
            },
            { optionId: 'reject_once', name: 'Reject', kind: 'reject_once' },
        ],
    };
}
function internals(agent) {
    return agent;
}
afterEach(() => {
    jest.useRealTimers();
});
describe('QwenAgent pending permission lifecycle', () => {
    it('resolves an answered request once and clears its timeout', async () => {
        jest.useFakeTimers();
        const agent = createAgent();
        agent.onPermissionRequest = ((request) => {
            agent.respondToPermission(request.requestId, true);
        });
        const responsePromise = internals(agent).handlePermissionRequest(permissionRequest());
        expect(await responsePromise).toEqual({
            outcome: { outcome: 'selected', optionId: 'proceed_once' },
        });
        expect(jest.getTimerCount()).toBe(0);
        expect(internals(agent).pendingPermissions.size).toBe(0);
        agent.destroy();
    });
    it('cancels every pending request when destroyed', async () => {
        jest.useFakeTimers();
        const agent = createAgent();
        agent.onPermissionRequest = (() => { });
        const first = internals(agent).handlePermissionRequest(permissionRequest());
        const second = internals(agent).handlePermissionRequest(permissionRequest());
        expect(internals(agent).pendingPermissions.size).toBe(2);
        agent.destroy();
        await expect(first).resolves.toEqual({ outcome: { outcome: 'cancelled' } });
        await expect(second).resolves.toEqual({
            outcome: { outcome: 'cancelled' },
        });
        expect(internals(agent).pendingPermissions.size).toBe(0);
        expect(jest.getTimerCount()).toBe(0);
    });
    it('cancels and removes a request when its response times out', async () => {
        jest.useFakeTimers();
        const agent = createAgent();
        agent.onPermissionRequest = (() => { });
        const responsePromise = internals(agent).handlePermissionRequest(permissionRequest());
        jest.runOnlyPendingTimers();
        await expect(responsePromise).resolves.toEqual({
            outcome: { outcome: 'cancelled' },
        });
        expect(internals(agent).pendingPermissions.size).toBe(0);
        expect(jest.getTimerCount()).toBe(0);
        agent.destroy();
    });
    it('ignores a response that arrives after the request times out', async () => {
        jest.useFakeTimers();
        const agent = createAgent();
        let requestId = '';
        agent.onPermissionRequest = ((request) => {
            requestId = request.requestId;
        });
        const responsePromise = internals(agent).handlePermissionRequest(permissionRequest());
        jest.runOnlyPendingTimers();
        expect(await responsePromise).toEqual({
            outcome: { outcome: 'cancelled' },
        });
        agent.respondToPermission(requestId, true);
        expect(await responsePromise).toEqual({
            outcome: { outcome: 'cancelled' },
        });
        expect(internals(agent).pendingPermissions.size).toBe(0);
        agent.destroy();
    });
    it('does not register a timeout when permission prompts are unset', async () => {
        jest.useFakeTimers();
        const agent = createAgent('allow-all');
        await expect(internals(agent).handlePermissionRequest(permissionRequest())).resolves.toEqual({
            outcome: { outcome: 'selected', optionId: 'proceed_once' },
        });
        expect(jest.getTimerCount()).toBe(0);
        expect(internals(agent).pendingPermissions.size).toBe(0);
        agent.destroy();
    });
});
//# sourceMappingURL=pending-permissions-lifecycle.test.js.map