import { describe, expect, it } from 'bun:test';
import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
import { createManagedSession, SessionManager } from './SessionManager.ts';
describe('createManagedSession', () => {
    const workspace = {
        id: 'ws_test',
        name: 'Test Workspace',
        slug: 'test-workspace',
        rootPath: '/tmp/test-workspace',
        createdAt: Date.now(),
    };
    it('normalizes legacy thinkingLevel=think on restore', () => {
        const managed = createManagedSession({
            id: 'session_legacy',
            thinkingLevel: 'think',
        }, workspace);
        expect(managed.thinkingLevel).toBe('medium');
    });
    it('drops invalid thinking levels instead of leaking them into runtime state', () => {
        const managed = createManagedSession({
            id: 'session_invalid',
            thinkingLevel: 'ultra',
        }, workspace);
        expect(managed.thinkingLevel).toBeUndefined();
    });
    it('derives session list metadata from loaded messages when header count is stale', () => {
        const manager = new SessionManager();
        const managed = createManagedSession({
            id: 'session_stale_header',
            createdAt: 1,
            lastUsedAt: 1,
            lastMessageAt: 1,
            messageCount: 0,
        }, workspace, {
            messages: [
                {
                    id: 'msg_1',
                    role: 'user',
                    content: 'hello from optimistic send',
                    timestamp: 2,
                },
            ],
            messagesLoaded: true,
        });
        const internals = manager;
        internals.sessions.set(managed.id, managed);
        const [listed] = manager.getSessions(workspace.id);
        expect(listed?.messages).toEqual([]);
        expect(listed?.messageCount).toBe(1);
        expect(listed?.preview).toBe('hello from optimistic send');
        expect(listed?.lastMessageRole).toBe('user');
    });
    it('routes active session events to the originating client across workspace switches', () => {
        const manager = new SessionManager();
        const pushes = [];
        const internals = manager;
        internals.eventSink = (channel, target, event) => {
            pushes.push({ channel, target, event });
        };
        internals.sessionEventClientIds.set('session_origin', 'client_origin');
        internals.sendEvent({ type: 'complete', sessionId: 'session_origin' }, 'workspace_origin');
        expect(pushes).toEqual([
            {
                channel: RPC_CHANNELS.sessions.EVENT,
                target: {
                    to: 'workspace',
                    workspaceId: 'workspace_origin',
                    exclude: 'client_origin',
                },
                event: {
                    type: 'complete',
                    sessionId: 'session_origin',
                    workspaceId: 'workspace_origin',
                },
            },
            {
                channel: RPC_CHANNELS.sessions.EVENT,
                target: { to: 'client', clientId: 'client_origin' },
                event: {
                    type: 'complete',
                    sessionId: 'session_origin',
                    workspaceId: 'workspace_origin',
                },
            },
        ]);
    });
});
//# sourceMappingURL=create-managed-session.test.js.map