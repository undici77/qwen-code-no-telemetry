/**
 * QQ Bot channel adapter for Qwen Code.
 *
 * Connects QQ Bot via official QQ Bot WebSocket API.
 * Extends ChannelBase for streaming, access control, and session routing.
 * Supports QR code login, credential persistence, C2C and group chat.
 *
 * Cross-server context continuation: persists SessionRouter mappings and
 * QQ-specific routing state (chatTypeMap, replyMsgId, msgSeqMap) to disk,
 * restoring them on reconnect so conversations survive daemon restarts.
 *
 * @see https://bot.q.qq.com/wiki/develop/api-v2/
 */
import { ChannelBase } from '@qwen-code/channel-base';
import type { ChannelConfig, ChannelBaseOptions, ChannelAgentBridge, ToolCallEvent } from '@qwen-code/channel-base';
export type DeliveryErrorCode = 'RATE_LIMITED' | 'RETRY_EXHAUSTED' | 'FALLBACK_FAILED' | 'ACTIVE_MSG_DISABLED';
export declare class DeliveryError extends Error {
    readonly code: DeliveryErrorCode;
    constructor(code: DeliveryErrorCode, message: string);
}
/** Validate chatId to prevent SSRF when constructing URLs. */
export declare function isValidChatId(id: string): boolean;
export declare class QQChannel extends ChannelBase {
    private ws;
    private accessToken;
    private tokenExpiresAt;
    private tokenRefreshTimer;
    private heartbeatTimer;
    private heartbeatInterval;
    private seq;
    private reconnectAttempts;
    private maxReconnectAttempts;
    /** QQ Bot session_id from READY, used for RESUME on reconnect. */
    private sessionId;
    /** Whether this connection attempt should try RESUME first. */
    private tryResume;
    private readonly qqConfig;
    /** Set when server sends RECONNECT opcode — close handler uses this to force reconnect. */
    private serverRequestedReconnect;
    /** Pending connect promise reject — called when WebSocket closes before READY. */
    private connectReject;
    /** Set to true when channel is disconnected — prevents orphaned connections. */
    private disposed;
    /** Deduplicate inbound messages on reconnect replay (messageId → timestamp). */
    private seenMessages;
    /** Cleanup timer for seenMessages TTL eviction. */
    private seenCleanupTimer;
    /** Timestamp of last received HEARTBEAT_ACK, for zombie-connection detection. */
    private lastHeartbeatAck;
    /** Debounce timer for saveQQState to avoid blocking event loop. */
    private saveTimer;
    /** beforeExit hook to flush state when the event loop drains naturally. Does NOT fire for SIGKILL, OOM kills, or uncaughtException. */
    private beforeExitHook;
    /** Timer for reconnectWithRetry fallback (unref'd so it doesn't block exit). */
    private reconnectTimer;
    /** 30s READY timeout to prevent hanging on gateway without response. */
    private readyTimeout;
    /** Guard against parallel reconnectWithRetry chains from stale close events. */
    private isReconnecting;
    /** Track whether a chatId is a group or C2C for correct API routing. */
    private chatTypeMap;
    /** Track the latest user messageId per chatId for proper reply (msg_id). */
    private replyMsgId;
    /** msg_seq counter per user messageId, for multi-block streaming. */
    private msgSeqMap;
    /** Periodic cleanup timer for expired replyMsgId entries. */
    private replyMsgIdCleanupTimer;
    /** 5-minute TTL for replyMsgId entries and seenMessages dedup. */
    private static readonly REPLY_MSG_ID_TTL_MS;
    /** Idle-flush timeout: buffer is sent after this many ms of silence. */
    private static readonly IDLE_FLUSH_MS;
    /** Max consecutive send failures before the stream is abandoned. */
    private maxFlushRetries;
    /** Retry delay for subsequent attempts (backoff beyond first retry). */
    private static readonly IDLE_FLUSH_BACKOFF_MS;
    /** Max buffer length before forcing an immediate flush. */
    private static readonly MAX_BUFFER_LENGTH;
    /** Per-group bot OPENID map for multi-group support. */
    private botOpenIdByGroup;
    /** Dedup set for unexpected senderOpenId format warnings (key: `${chatId}:${senderOpenId}`). */
    private warnedSenderOpenIds;
    /** Guard: set to true after first READY + session restore completes. */
    private _ready;
    /** Whether this process has never received READY (cold start). */
    private coldStart;
    /** Track per-group active message permission. */
    private groupActiveMsgEnabled;
    /** Lazy cache for compiled keyword trigger RegExp patterns.
     * Built lazily on first access; never invalidated — keywordTriggers is not modified at runtime. */
    private _keywordTriggerCache;
    /** Rate-limit timestamps for keyword non-match log entries (chatId → last log ms). */
    private _lastKeywordNoMatchLog;
    /** Accumulation buffer for cron/non-prompt textChunk events. */
    private cronBuffer;
    /** Named handler for permanent textChunk listener (cron/non-prompt). */
    private _cronTextHandler;
    /** Gate: depth counter for cron-scheduled message flows. >0 means in-flow.
        Prevents phantom cronBuffer entries when textChunk fires during normal
        bridge.prompt() calls (ChannelBase has its own listener there).
        Using a counter instead of a boolean supports concurrent cron flows. */
    private _inCronFlow;
    private cronTextHandlerAttached;
    /** Path to persisted QQ routing state: chatTypeMap, replyMsgId, msgSeqMap. */
    /**
     * Streaming state machine with per-session buffers.
     *
     * Three states for each session:
     *   active   — accumulating chunks in buffer (onResponseChunk extends timer)
     *   flushing — sendMessage() is in-flight (prevents parallel sends)
     *   idle     — waiting for next chunk (timer counting down to idleFlush)
     *
     * Transitions:
     *   active → flushing: idleFlush timer fires, or onToolCall cancels timer
     *   flushing → idle: send settles, idle timer restarts on retry
     *   any → done: onResponseComplete sends remaining content
     *
     * Guards:
     *   - flushingSessions prevents concurrent sends per session
     *   - pendingStreamDelete defers cleanup until in-flight send resolves
     *   - flushedSessions tracks already-sent sessions to skip final fullText
     */
    private streamState;
    private flushingSessions;
    private pendingStreamDelete;
    private _reconnectId;
    private blockStreaming;
    private flushedSessions;
    private readonly qqStatePath;
    /**
     * Path to the global sessions.json managed by start.ts.
     * start.ts deletes it on shutdown, so we back it up.
     */
    private readonly globalSessionsPath;
    /** Backup of sessions.json so conversations survive daemon restarts. */
    private readonly sessionsBackupPath;
    constructor(name: string, config: ChannelConfig & Record<string, unknown>, bridge: ChannelAgentBridge, options?: ChannelBaseOptions);
    private handleCronTextChunk;
    /**
     * Public gate for external cron/scheduler integration.
     * Wraps a cron message flow to activate `_inCronFlow` so that
     * `textChunk` events are captured into the cron accumulation buffer.
     * Uses a depth counter (not boolean) so concurrent cron flows
     * don't stomp each other's `_inCronFlow` state.
     * Always decrements `_inCronFlow` in a `finally` block.
     */
    runCronFlow(fn: () => Promise<void>): Promise<void>;
    /**
     * Override setBridge to re-attach the permanent `_cronTextHandler`
     * after bridge crash-recovery.
     */
    setBridge(bridge: ChannelAgentBridge): void;
    connect(): Promise<void>;
    sendMessage(chatId: string, text: string): Promise<void>;
    /**
     * Resolve API routing: handles disposed check, token refresh, chatId validation,
     * sandbox detection, and C2C/group path selection. Returns null if any guard fails.
     */
    private resolveRoute;
    disconnect(): void;
    /**
     * QQ Bot API V2 does not provide a typing indicator endpoint.
     * ChannelBase calls these hooks to signal prompt start/end;
     * they are intentionally no-ops for this channel.
     */
    protected onPromptStart(_chatId: string, _sessionId: string, _messageId?: string): void;
    protected onPromptEnd(_chatId: string, _sessionId: string, _messageId?: string): void;
    protected onResponseChunk(chatId: string, chunk: string, sessionId: string): void;
    private idleFlush;
    /**
     * Shared send-and-track helper used by idleFlush and onToolCall.
     * Encapsulates .then() (cleanup on success) and .catch() (retry/re-buffer
     * on failure) logic to eliminate duplication.
     */
    private flushAndTrack;
    onToolCall(_chatId: string, event: ToolCallEvent): void;
    protected onResponseBoundary(_chatId: string, sessionId: string): void;
    protected onResponseComplete(chatId: string, fullText: string, sessionId: string): Promise<void>;
    onSessionDied(sessionId: string): void;
    private serializeQQState;
    /** Debounced state persistence with atomic write. */
    private saveQQState;
    /**
     * Attach the permanent textChunk handler for cron/non-prompt messages
     * to the current bridge. No-op if already attached or if cron is disabled.
     */
    private attachCronHandler;
    private _checkGroupAllPolicyRequireMention;
    /**
     * Detach the permanent textChunk handler from the current bridge.
     * No-op if not attached or if cron is disabled.
     */
    private detachCronHandler;
    /** Flush pending state writes immediately (called on disconnect). */
    private flushQQState;
    /**
     * Restore QQ routing state from disk.
     *
     * Validates all restored state extensively — type checks, length bounds,
     * and sanity filters — so a corrupted file produces clean empty maps
     * rather than propagating invalid data.
     */
    private restoreQQState;
    /**
     * Backup the global sessions.json before start.ts deletes it on shutdown.
     * Restored on next connect so conversations survive daemon restarts.
     */
    private backupGlobalSessions;
    private restoreGlobalSessions;
    /**
     * Compatibility repair for legacy restored session state where older router
     * code could keep an empty session id after bridge.loadSession() failed to
     * return a session_id.
     *
     * **Fragile**: accesses SessionRouter's private `toSession`/`toTarget`/`toCwd`
     * maps via type coercion. If SessionRouter internals change, this breaks
     * silently. The only signal will be cross-server conversations failing to
     * restore after daemon restart — no crash, no log.
     *
     * Keep this while old persisted files may still exist.
     */
    private fixRestoredSessions;
    /**
     * Set replyMsgId for a chat, cleaning up the previous entry's msgSeqMap
     * to prevent orphaned entries accumulating over time.
     */
    private setReplyMsgId;
    /**
     * Start periodic cleanup of expired replyMsgId entries.
     * Evicts entries older than 5 minutes every 60 seconds, and cascades
     * to msgSeqMap.
     */
    private startReplyMsgIdCleanup;
    private stopReplyMsgIdCleanup;
    private fetchToken;
    private scheduleTokenRefresh;
    private stopTokenRefresh;
    private connectGateway;
    private dialGateway;
    /**
     * Finalize READY state across cold-start and warm-reconnect paths.
     * Extracted to eliminate triplication in the READY handler.
     */
    private finalizeReady;
    private handleGatewayMessage;
    private sendIdentify;
    /**
     * Reconnect loop with retry on gateway fetch failures.
     * Refreshes token before each attempt, and retries GW HTTP failures
     * with exponential backoff. Keeps retrying until success.
     */
    private reconnectWithRetry;
    private sleep;
    private startHeartbeat;
    private stopHeartbeat;
    private extractBotOpenId;
    /** Check if a message ID was already processed (reconnect replay dedup). */
    private isDuplicate;
    /**
     * Extract common group-message fields shared by handleGroup and handleGroupAll.
     * Returns null when the message has no meaningful text after @-tag stripping.
     */
    private prepareGroupMessage;
    private handleC2C;
    private handleGroup;
    private handleGroupAll;
    private handleGroupAddRobot;
    private handleGroupDelRobot;
    private handleGroupMsgToggle;
}
