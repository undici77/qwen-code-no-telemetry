import type { SessionScope, SessionTarget } from './types.js';
import type { AcpBridge } from './AcpBridge.js';
export declare class SessionRouter {
    private toSession;
    private toTarget;
    private toCwd;
    private bridge;
    private defaultCwd;
    private defaultScope;
    private channelScopes;
    private persistPath;
    constructor(bridge: AcpBridge, defaultCwd: string, scope?: SessionScope, persistPath?: string);
    /** Replace the bridge instance (used after crash recovery restart). */
    setBridge(bridge: AcpBridge): void;
    /** Set scope override for a specific channel. */
    setChannelScope(channelName: string, scope: SessionScope): void;
    private routingKey;
    resolve(channelName: string, senderId: string, chatId: string, threadId?: string, cwd?: string): Promise<string>;
    getTarget(sessionId: string): SessionTarget | undefined;
    hasSession(channelName: string, senderId: string, chatId?: string): boolean;
    /**
     * Remove session(s) for the given sender. Returns the removed session IDs.
     */
    removeSession(channelName: string, senderId: string, chatId?: string): string[];
    private deleteByKey;
    /** Get all session entries for crash recovery. */
    getAll(): Array<{
        key: string;
        sessionId: string;
        target: SessionTarget;
    }>;
    /**
     * Restore session mappings from a previous bridge.
     * Called after bridge restart — attempts loadSession for each saved mapping.
     * Failed loads are silently dropped (new session on next message).
     */
    restoreSessions(): Promise<{
        restored: number;
        failed: number;
    }>;
    /** Clear in-memory state and delete persist file. Used on clean shutdown. */
    clearAll(): void;
    private persist;
}
