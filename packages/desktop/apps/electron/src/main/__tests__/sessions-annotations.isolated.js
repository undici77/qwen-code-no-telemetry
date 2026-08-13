import { describe, expect, it, mock } from 'bun:test';
mock.module('electron', () => ({
    app: {
        isPackaged: false,
        getAppPath: () => process.cwd(),
    },
    nativeImage: {
        createFromPath: () => ({ isEmpty: () => true }),
    },
}));
mock.module('@sentry/electron/main', () => ({
    captureException: () => { },
}));
mock.module('../logger', () => ({
    sessionLog: { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } },
    isDebugMode: false,
    getLogFilePath: () => '/tmp/main.log',
}));
mock.module('../notifications', () => ({
    updateBadgeCount: () => { },
}));
const { SessionManager } = await import('@craft-agent/server-core/sessions');
function makeAnnotation(id, extraMeta) {
    return {
        id,
        schemaVersion: 1,
        createdAt: Date.now(),
        intent: 'highlight',
        body: [{ type: 'highlight' }],
        target: {
            source: { sessionId: 'session-1', messageId: 'msg-1' },
            selectors: [
                { type: 'text-position', start: 0, end: 5 },
                { type: 'text-quote', exact: 'hello' },
            ],
        },
        ...(extraMeta ? { meta: extraMeta } : {}),
    };
}
function createHarness(initialAnnotations = []) {
    const managed = {
        workspace: { id: 'ws-1' },
        messages: [{ id: 'msg-1', content: 'hello world', annotations: initialAnnotations }],
    };
    let persistCalls = 0;
    const events = [];
    const manager = Object.create(SessionManager.prototype);
    manager.sessions = new Map([['session-1', managed]]);
    manager.persistSession = () => { persistCalls += 1; };
    manager.sendEvent = (event, workspaceId) => {
        events.push({ event, workspaceId });
    };
    return {
        manager,
        managed,
        get persistCalls() {
            return persistCalls;
        },
        events,
    };
}
describe('SessionManager annotation validation', () => {
    it('rejects add when per-message annotation limit is reached', () => {
        const existing = Array.from({ length: 200 }, (_, i) => makeAnnotation(`ann-${i}`));
        const h = createHarness(existing);
        h.manager.addMessageAnnotation('session-1', 'msg-1', makeAnnotation('ann-over-limit'));
        expect(h.managed.messages[0].annotations).toHaveLength(200);
        expect(h.persistCalls).toBe(0);
        expect(h.events).toHaveLength(0);
    });
    it('rejects add for oversized annotation payload', () => {
        const h = createHarness([]);
        const oversizedMeta = { blob: 'x'.repeat(40 * 1024) };
        h.manager.addMessageAnnotation('session-1', 'msg-1', makeAnnotation('ann-big', oversizedMeta));
        expect(h.managed.messages[0].annotations).toHaveLength(0);
        expect(h.persistCalls).toBe(0);
        expect(h.events).toHaveLength(0);
    });
    it('rejects update patch with empty selectors array', () => {
        const existing = [makeAnnotation('ann-1')];
        const h = createHarness(existing);
        h.manager.updateMessageAnnotation('session-1', 'msg-1', 'ann-1', {
            target: {
                source: { sessionId: 'session-1', messageId: 'msg-1' },
                selectors: [],
            },
        });
        expect(h.managed.messages[0].annotations).toHaveLength(1);
        expect(h.managed.messages[0].annotations[0]?.id).toBe('ann-1');
        expect(h.persistCalls).toBe(0);
        expect(h.events).toHaveLength(0);
    });
});
//# sourceMappingURL=sessions-annotations.isolated.js.map