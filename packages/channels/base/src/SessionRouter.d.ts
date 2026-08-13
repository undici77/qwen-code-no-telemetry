import type { SessionScope, SessionTarget } from './types.js';
import type { ChannelAgentBridge } from './ChannelAgentBridge.js';
interface ResolveOptions {
    routingThreadId?: string;
}
export type SessionRecoveryMode = 'eager' | 'lazy';
export interface SessionRouterOptions {
    recoveryMode?: SessionRecoveryMode;
}
export declare class SessionRouter {
    private toSession;
    private toTarget;
    private toCwd;
    private creatingSessions;
    private sessionLoadWindows;
    private readonly liveSessionIds;
    private readonly routeTokens;
    private lifecycleGeneration;
    private bridge;
    private defaultCwd;
    private defaultScope;
    private channelScopes;
    private channelApprovalModes;
    private persistPath;
    private readonly recoveryMode;
    constructor(bridge: ChannelAgentBridge, defaultCwd: string, scope?: SessionScope, persistPath?: string, options?: SessionRouterOptions);
    /** Replace the bridge instance (used after crash recovery restart). */
    setBridge(bridge: ChannelAgentBridge): void;
    /** Set scope override for a specific channel. */
    setChannelScope(channelName: string, scope: SessionScope): void;
    setChannelApprovalMode(channelName: string, approvalMode: string | undefined): void;
    private routingKey;
    private sessionOptions;
    resolve(channelName: string, senderId: string, chatId: string, threadId?: string, cwd?: string, isGroup?: boolean, options?: ResolveOptions): Promise<string>;
    private isLive;
    private createAndStoreSession;
    private loadOrReplaceSession;
    getTarget(sessionId: string): SessionTarget | undefined;
    getSession(channelName: string, senderId: string, chatId: string, threadId?: string): string | undefined;
    hasSession(channelName: string, senderId: string, chatId?: string, threadId?: string): boolean;
    /**
     * Remove session(s) for the given sender. Returns the removed session IDs.
     */
    removeSession(channelName: string, senderId: string, chatId?: string, threadId?: string): string[];
    /** Remove a session mapping by daemon/ACP session ID. */
    removeSessionId(sessionId: string): boolean;
    handleSessionDied(sessionId: string): boolean;
    private deleteByKey;
    private promoteTargetToGroup;
    /** Get all session entries for crash recovery. */
    getAll(): Array<{
        key: string;
        sessionId: string;
        target: SessionTarget;
    }>;
    restoreRoutes(): {
        restored: number;
        dropped: number;
    };
    /**
     * Restore session mappings from a previous bridge.
     * Called after bridge restart — attempts loadSession for each saved mapping.
     * Failed loads are dropped (new session on next message).
     */
    restoreSessions(): Promise<{
        restored: number;
        failed: number;
    }>;
    dispose(): void;
    /** Clear in-memory state and delete persist file. Used on clean shutdown. */
    clearAll(): void;
    private readPersistedEntries;
    private isPersistedEntry;
    private persist;
    private createLiveSession;
    private beginSessionLoad;
    private createSessionOperation;
    private invalidateRouteOperation;
    private invalidateOperation;
    private assertOperationCurrent;
    private assertOperationResultCurrent;
    private releaseRouteToken;
    private scheduleDiscardInvalidatedSession;
    private createSessionReservation;
    private endSessionLoad;
}
export {};
