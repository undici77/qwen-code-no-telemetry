/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonClient } from './DaemonClient.js';
import { type CreateSessionRequest, type PromptRequest, type RestoreSessionRequest, type SubscribeOptions } from './DaemonClient.js';
import type { DaemonEvent, DaemonSessionContextStatus, DaemonSessionState, DaemonSession, DaemonSessionSupportedCommandsStatus, HeartbeatResult, PermissionResponse, PromptResult, SetModelResult, SessionMetadataResult } from './types.js';
export interface DaemonSessionClientOptions {
    client: DaemonClient;
    session: DaemonSession;
    /** ACP state returned by load/resume; empty for create/attach clients. */
    state?: DaemonSessionState;
    /**
     * Seed replay state for callers that persisted the last seen SSE event id.
     * When omitted, the first event subscription starts live. Values must be
     * finite, non-negative integers because the daemon uses these ids as
     * `Last-Event-ID` resume cursors.
     */
    lastEventId?: number;
}
export interface DaemonSessionSubscribeOptions extends SubscribeOptions {
    /**
     * Reuse this client's last seen SSE event id when `lastEventId` is not
     * supplied. Defaults to true so reconnecting client adapters get replay
     * behavior without carrying the id through every call.
     */
    resume?: boolean;
}
/**
 * Session-scoped wrapper around `DaemonClient`.
 *
 * `DaemonClient` mirrors the raw HTTP API and requires a `sessionId` on each
 * method. `DaemonSessionClient` is the adapter-facing layer for TUI, channel,
 * IDE, and web backends: it binds one daemon session, forwards the existing
 * Stage 1 routes, and preserves SSE replay state. It intentionally does not
 * interpret daemon event payloads; typed event reducers belong to the protocol
 * schema layer — see `asKnownDaemonEvent` and `reduceDaemonSessionEvent` in
 * `./events.js` for the typed consumption surface.
 */
export declare class DaemonSessionClient {
    readonly client: DaemonClient;
    readonly session: DaemonSession;
    readonly state: DaemonSessionState;
    private lastSeenEventId;
    private subscriptionActive;
    constructor(opts: DaemonSessionClientOptions);
    /**
     * Creates a new daemon session or attaches to an existing matching session.
     */
    static createOrAttach(client: DaemonClient, req?: CreateSessionRequest, clientId?: string): Promise<DaemonSessionClient>;
    /**
     * Loads an existing daemon session and seeds the first event subscription
     * from the start of the daemon replay ring so history replay frames emitted
     * during `session/load` are visible to this client.
     */
    static load(client: DaemonClient, sessionId: string, req?: RestoreSessionRequest, clientId?: string): Promise<DaemonSessionClient>;
    /**
     * Resumes an existing daemon session without requesting history replay.
     * Seeds the first event subscription from the start of the daemon
     * replay ring (`lastEventId: 0`) symmetric with `load()` — the agent's
     * `unstable_resumeSession` schedules an `available_commands_update`
     * via `setTimeout(0)`, which can publish to the daemon bus between
     * the HTTP response and the consumer's first `events()` call. Seeding
     * ensures that frame is observed instead of dropped.
     */
    static resume(client: DaemonClient, sessionId: string, req?: RestoreSessionRequest, clientId?: string): Promise<DaemonSessionClient>;
    get sessionId(): string;
    get workspaceCwd(): string;
    get attached(): boolean;
    get clientId(): string | undefined;
    get lastEventId(): number | undefined;
    setLastEventId(lastEventId: number | undefined): void;
    prompt(req: PromptRequest, signal?: AbortSignal): Promise<PromptResult>;
    cancel(): Promise<void>;
    /**
     * Bump the daemon's last-seen bookkeeping for this session. Adapters
     * with a long-lived view of a session (TUI/IDE/web) can fire this on
     * an interval to keep diagnostics fresh and feed PR 24 revocation
     * policy. Forwards the bound `clientId` so identified clients update
     * their per-client timestamp instead of just the session-wide one.
     */
    heartbeat(): Promise<HeartbeatResult>;
    setModel(modelId: string): Promise<SetModelResult>;
    context(): Promise<DaemonSessionContextStatus>;
    supportedCommands(): Promise<DaemonSessionSupportedCommandsStatus>;
    respondToPermission(requestId: string, response: PermissionResponse): Promise<boolean>;
    respondToSessionPermission(requestId: string, response: PermissionResponse): Promise<boolean>;
    close(): Promise<void>;
    updateMetadata(metadata: {
        displayName?: string;
    }): Promise<SessionMetadataResult>;
    events(opts?: DaemonSessionSubscribeOptions): AsyncGenerator<DaemonEvent, void, unknown>;
    /**
     * @deprecated Use {@link events} instead. Both methods are equivalent.
     */
    subscribeEvents(opts?: DaemonSessionSubscribeOptions): AsyncGenerator<DaemonEvent, void, unknown>;
    private openEventSubscription;
    private iterateEvents;
}
