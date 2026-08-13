import { describe, expect, it } from 'bun:test';
import { sessionPersistenceQueue } from '@craft-agent/shared/sessions';
import { createManagedSession, SessionManager, } from './SessionManager.ts';
describe('permission mode persistence', () => {
    it('does not persist sessions when only the global permission mode changes', async () => {
        const workspace = {
            id: 'workspace-mode',
            name: 'Mode Workspace',
            slug: 'mode-workspace',
            rootPath: '/tmp/mode-workspace',
            createdAt: 1,
        };
        const manager = new SessionManager();
        const managed = createManagedSession({
            id: 'session-mode',
            createdAt: 1,
            lastUsedAt: 2,
            lastMessageAt: 2,
            permissionMode: 'ask',
        }, workspace, {
            messages: [
                {
                    id: 'msg-1',
                    role: 'user',
                    content: 'hello',
                    timestamp: 2,
                },
            ],
            messagesLoaded: true,
        });
        const internals = manager;
        internals.sessions.set(managed.id, managed);
        const queue = sessionPersistenceQueue;
        const originalEnqueue = queue.enqueue.bind(sessionPersistenceQueue);
        let enqueueCalls = 0;
        queue.enqueue = (session) => {
            enqueueCalls += 1;
            originalEnqueue(session);
        };
        try {
            await manager.applyGlobalPermissionMode('allow-all');
        }
        finally {
            queue.enqueue = originalEnqueue;
        }
        expect(enqueueCalls).toBe(0);
        expect(managed.permissionMode).toBe('allow-all');
    });
});
//# sourceMappingURL=permission-mode-persistence.test.js.map