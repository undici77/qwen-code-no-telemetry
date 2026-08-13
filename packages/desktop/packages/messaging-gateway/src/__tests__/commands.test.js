import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BindingStore } from '../binding-store';
import { Commands } from '../commands';
function makeSession(id, name, lastMessageAt) {
    return {
        id,
        name,
        workspaceId: 'ws1',
        workspaceName: 'Workspace',
        messages: [],
        createdAt: lastMessageAt - 1000,
        updatedAt: lastMessageAt,
        lastMessageAt,
        isArchived: false,
    };
}
function makeSessionManager(sessions) {
    return {
        getSessions: () => sessions,
        getSession: async (sessionId) => sessions.find((session) => session.id === sessionId) ?? null,
        createSession: async () => { throw new Error('not implemented'); },
        sendMessage: async () => { },
        cancelProcessing: async () => { },
        respondToPermission: () => true,
    };
}
function makeAdapter(platform, inlineButtons) {
    const sent = [];
    return {
        platform,
        capabilities: {
            messageEditing: inlineButtons,
            inlineButtons,
            maxButtons: 10,
            maxMessageLength: 4096,
            markdown: platform === 'telegram' ? 'v2' : 'whatsapp',
            webhookSupport: false,
        },
        sent,
        async initialize() { },
        async destroy() { },
        isConnected() { return true; },
        onMessage() { },
        onButtonPress() { },
        async sendText(_channelId, text) {
            sent.push(text);
            return { platform, channelId: 'chan-1', messageId: String(sent.length) };
        },
        async editMessage() { },
        async sendButtons(_channelId, text) {
            sent.push(text);
            return { platform, channelId: 'chan-1', messageId: String(sent.length) };
        },
        async sendTyping() { },
        async sendFile() {
            return { platform, channelId: 'chan-1', messageId: String(sent.length + 1) };
        },
    };
}
function makeMessage(text) {
    return {
        platform: 'whatsapp',
        channelId: 'chan-1',
        messageId: 'm1',
        senderId: 'u1',
        senderName: 'Alice',
        text,
        timestamp: Date.now(),
        raw: {},
    };
}
const tempDirs = [];
afterEach(() => {
    for (const dir of tempDirs.splice(0))
        rmSync(dir, { recursive: true, force: true });
});
function makeStore() {
    const dir = mkdtempSync(join(tmpdir(), 'commands-bind-'));
    tempDirs.push(dir);
    return new BindingStore(dir);
}
describe('Commands', () => {
    it('binds by numbered recent-session index on non-inline platforms', async () => {
        const sessions = [
            makeSession('sess-1', 'Old', 100),
            makeSession('sess-2', 'Newest', 200),
        ];
        const store = makeStore();
        const commands = new Commands(makeSessionManager(sessions), store, 'ws1');
        const adapter = makeAdapter('whatsapp', false);
        await commands.handleCommand(adapter, makeMessage('/bind 1'));
        expect(store.findByChannel('whatsapp', 'chan-1')?.sessionId).toBe('sess-2');
        expect(adapter.sent.at(-1)).toContain('Newest');
    });
    it('lists numbered recent sessions with usable /bind instructions on WhatsApp', async () => {
        const sessions = [
            makeSession('sess-1', 'Alpha', 100),
            makeSession('sess-2', 'Beta', 200),
        ];
        const store = makeStore();
        const commands = new Commands(makeSessionManager(sessions), store, 'ws1');
        const adapter = makeAdapter('whatsapp', false);
        await commands.handleCommand(adapter, makeMessage('/bind'));
        expect(adapter.sent[0]).toContain('1. Beta (sess-2)');
        expect(adapter.sent[0]).toContain('/bind <number>');
    });
});
//# sourceMappingURL=commands.test.js.map