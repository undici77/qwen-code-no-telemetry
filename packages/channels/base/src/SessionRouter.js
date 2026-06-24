import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
export class SessionRouter {
    toSession = new Map(); // routing key → session ID
    toTarget = new Map(); // session ID → target
    toCwd = new Map(); // session ID → cwd
    bridge;
    defaultCwd;
    defaultScope;
    channelScopes = new Map();
    persistPath;
    constructor(bridge, defaultCwd, scope = 'user', persistPath) {
        this.bridge = bridge;
        this.defaultCwd = defaultCwd;
        this.defaultScope = scope;
        this.persistPath = persistPath;
    }
    /** Replace the bridge instance (used after crash recovery restart). */
    setBridge(bridge) {
        this.bridge = bridge;
    }
    /** Set scope override for a specific channel. */
    setChannelScope(channelName, scope) {
        this.channelScopes.set(channelName, scope);
    }
    routingKey(channelName, senderId, chatId, threadId) {
        const scope = this.channelScopes.get(channelName) || this.defaultScope;
        switch (scope) {
            case 'thread':
                return `${channelName}:${threadId || chatId}`;
            case 'single':
                return `${channelName}:__single__`;
            case 'user':
            default:
                return `${channelName}:${senderId}:${chatId}`;
        }
    }
    async resolve(channelName, senderId, chatId, threadId, cwd) {
        const key = this.routingKey(channelName, senderId, chatId, threadId);
        const existing = this.toSession.get(key);
        if (existing) {
            return existing;
        }
        const sessionCwd = cwd || this.defaultCwd;
        const sessionId = await this.bridge.newSession(sessionCwd);
        this.toSession.set(key, sessionId);
        this.toTarget.set(sessionId, { channelName, senderId, chatId, threadId });
        this.toCwd.set(sessionId, sessionCwd);
        this.persist();
        return sessionId;
    }
    getTarget(sessionId) {
        return this.toTarget.get(sessionId);
    }
    hasSession(channelName, senderId, chatId) {
        const key = chatId
            ? this.routingKey(channelName, senderId, chatId)
            : `${channelName}:${senderId}`;
        // If chatId is provided, do exact lookup; otherwise prefix-scan for any match
        if (chatId)
            return this.toSession.has(key);
        for (const k of this.toSession.keys()) {
            if (k.startsWith(`${channelName}:${senderId}`))
                return true;
        }
        return false;
    }
    /**
     * Remove session(s) for the given sender. Returns the removed session IDs.
     */
    removeSession(channelName, senderId, chatId) {
        const removedIds = [];
        if (chatId) {
            const key = this.routingKey(channelName, senderId, chatId);
            const sessionId = this.deleteByKey(key);
            if (sessionId)
                removedIds.push(sessionId);
        }
        else {
            // No chatId: remove all sessions for this sender on this channel
            const prefix = `${channelName}:${senderId}`;
            for (const k of [...this.toSession.keys()]) {
                if (k.startsWith(prefix)) {
                    const sessionId = this.deleteByKey(k);
                    if (sessionId)
                        removedIds.push(sessionId);
                }
            }
        }
        if (removedIds.length > 0)
            this.persist();
        return removedIds;
    }
    deleteByKey(key) {
        const sessionId = this.toSession.get(key);
        if (!sessionId)
            return null;
        this.toSession.delete(key);
        this.toTarget.delete(sessionId);
        this.toCwd.delete(sessionId);
        return sessionId;
    }
    /** Get all session entries for crash recovery. */
    getAll() {
        const entries = [];
        for (const [key, sessionId] of this.toSession) {
            const target = this.toTarget.get(sessionId);
            if (target) {
                entries.push({ key, sessionId, target });
            }
        }
        return entries;
    }
    /**
     * Restore session mappings from a previous bridge.
     * Called after bridge restart — attempts loadSession for each saved mapping.
     * Failed loads are silently dropped (new session on next message).
     */
    async restoreSessions() {
        if (!this.persistPath || !existsSync(this.persistPath)) {
            return { restored: 0, failed: 0 };
        }
        let entries;
        try {
            entries = JSON.parse(readFileSync(this.persistPath, 'utf-8'));
        }
        catch {
            return { restored: 0, failed: 0 };
        }
        let restored = 0;
        let failed = 0;
        for (const [key, entry] of Object.entries(entries)) {
            try {
                const sessionId = await this.bridge.loadSession(entry.sessionId, entry.cwd);
                this.toSession.set(key, sessionId);
                this.toTarget.set(sessionId, entry.target);
                this.toCwd.set(sessionId, entry.cwd);
                restored++;
            }
            catch {
                // Session can't be loaded — will create fresh on next message
                failed++;
            }
        }
        // Update persist file to only include successfully restored sessions
        if (failed > 0) {
            this.persist();
        }
        return { restored, failed };
    }
    /** Clear in-memory state and delete persist file. Used on clean shutdown. */
    clearAll() {
        this.toSession.clear();
        this.toTarget.clear();
        this.toCwd.clear();
        if (this.persistPath && existsSync(this.persistPath)) {
            try {
                unlinkSync(this.persistPath);
            }
            catch {
                // best-effort
            }
        }
    }
    persist() {
        if (!this.persistPath)
            return;
        const data = {};
        for (const [key, sessionId] of this.toSession) {
            const target = this.toTarget.get(sessionId);
            if (target) {
                data[key] = {
                    sessionId,
                    target,
                    cwd: this.toCwd.get(sessionId) || this.defaultCwd,
                };
            }
        }
        try {
            writeFileSync(this.persistPath, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch {
            // best-effort — don't break message flow for persistence failure
        }
    }
}
//# sourceMappingURL=SessionRouter.js.map