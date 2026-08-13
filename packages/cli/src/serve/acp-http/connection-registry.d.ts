/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TransportStream } from './transport-stream.js';
/**
 * Invoked when a session/connection tears down while an agent→client
 * request (e.g. a permission prompt) is still outstanding, so the bridge
 * isn't left blocked awaiting a vote that will never arrive.
 */
export type AbandonPendingFn = (req: PendingClientRequest, clientId: string | undefined) => boolean;
/**
 * Best-effort bridge detach for a session's bridge-stamped clientId on
 * teardown. Without it, `session/new`/`load`/`resume`-registered client ids
 * stay visible in `knownClientIds()`/`votersForSession()` after the ACP
 * connection is gone — skewing permission mediation + origin validation.
 * ACP clients can't clean this up themselves (the id isn't on the wire).
 */
export type DetachSessionFn = (sessionId: string, clientId: string | undefined) => void;
/** A pre-attach session frame plus its optional bus event id (SSE cursor). */
interface BufferedSessionFrame {
    frame: unknown;
    id?: number;
    /**
     * For DEFERRED out-of-band replies only (`sendSessionReply`, always id-less):
     * the bus head id at the moment the reply was produced. The reply must not be
     * released to the wire until the pump has delivered every content event up to
     * this id — otherwise a prompt result produced during a slow ring replay could
     * land ahead of tail content that is still queued behind `replay_complete`
     * (§1.8 W1). `undefined` ⇒ release at the next boundary unconditionally.
     */
    anchorId?: number;
}
/**
 * Tracks one logical ACP-over-HTTP connection (RFD #721). A connection is
 * minted at `initialize`, keyed by `Acp-Connection-Id`, and may host many
 * sessions — each with its own session-scoped SSE stream.
 */
export interface SessionBinding {
    sessionId: string;
    /**
     * The clientId the bridge STAMPED for this session at create/attach.
     * The bridge ignores caller-supplied ids it has never issued and mints
     * a fresh one (returned on `spawnOrAttach`/`loadSession`), so every
     * later per-session call (`sendPrompt`, permission votes, …) must echo
     * THIS id, not the connection's own — otherwise the bridge rejects it
     * with "client id is not registered for session".
     */
    clientId?: string;
    /** Session-scoped SSE stream (the client's `GET /acp` with both headers). */
    stream?: TransportStream;
    /**
     * Frames emitted before the session stream attached, flushed on attach.
     * Each keeps its bus event id (when it has one) so the SSE `id:` resume
     * cursor survives the buffer → live-stream handoff.
     */
    buffer: BufferedSessionFrame[];
    /**
     * Aborts the bridge event subscription tied to the CURRENT session
     * stream. Replaced with a fresh controller on every re-attach — a
     * controller, once aborted (on stream close), can never resume, so
     * reusing it across reconnects would leave the new stream permanently
     * event-starved.
     */
    abort: AbortController;
    /**
     * Aborts the in-flight `session/prompt` for this session. Set by
     * `handlePrompt` while a prompt runs; aborted on `session/cancel` and on
     * session/connection teardown so a disconnecting client doesn't leave
     * the agent burning model quota on a result nobody will read.
     */
    promptAbort?: AbortController;
    /**
     * Armed by `detachSessionStream` when the session stream closes at the
     * transport level (proxy idle-close, network blip) WITHOUT an explicit
     * `session/close`. The binding — ownership, prompt, bridge-client — is kept
     * alive across the window so a reconnect (`attachSessionStream`) can resume
     * (ring replay backfills the gap, §1.8). If no reconnect arrives the timer
     * fires the full teardown, bounding the runaway-prompt cost. Cleared on
     * reconnect and on teardown.
     */
    graceTimer?: ReturnType<typeof setTimeout>;
    /**
     * Set from the CURRENT attach mode on every `attachSessionStream`: armed on a
     * resumptive attach (with a `Last-Event-ID`), cleared on a fresh one (no
     * `Last-Event-ID`) — never a one-way latch, or an aborted resume that skipped
     * its flush would strand the flag and buffer every later reply forever. Also
     * cleared when the ring replay boundary passes (`replay_complete` →
     * `flushBufferedSessionFrames`). While set, OUT-OF-BAND session JSON-RPC
     * replies (`replySession` — e.g. a `session/prompt` result that finishes
     * mid-replay) are deferred into `buffer` instead of written live, so they
     * can't overtake replay frames that haven't been sent yet. The flush boundary
     * is `replay_complete` ONLY: `state_resync_required` is deliberately NOT one —
     * the EventBus emits it BEFORE the replay frames, so flushing there would put
     * deferred replies ahead of replayed content (the §1.8 reordering bug). In-band
     * pump frames (`translateEvent`, including the `replay_complete` frame itself)
     * are unaffected — they're already produced in replay order.
     */
    replayPending?: boolean;
    /**
     * Set after ACP `session/load` when the bridge used response-mode history
     * replay. The first session stream attach rereads the bridge replay snapshot
     * and emits it; the binding keeps only this lightweight marker, not the
     * potentially large replay arrays.
     */
    initialReplayPending?: boolean;
}
/** An agent→client request awaiting the client's JSON-RPC response. */
export interface PendingClientRequest {
    sessionId: string;
    /** Maps the JSON-RPC id we issued back to the bridge's permission id. */
    bridgeRequestId: string;
    kind: 'permission';
}
export interface PendingClientRequestRef {
    conn: AcpConnection;
    id: string;
    req: PendingClientRequest;
}
export interface AcpConnectionDiagnostic {
    connectionIdPrefix: string;
    fromLoopback: boolean;
    destroyed: boolean;
    lastActiveMs: number;
    ownedSessionCount: number;
    sessionBindingCount: number;
    closingSessionCount: number;
    pendingClientRequests: number;
    connectionStreamOpen: boolean;
    sessionStreams: number;
    sseStreams: number;
    wsStreams: number;
    bufferedConnectionFrames: number;
    bufferedSessionFrames: number;
}
export interface ConnectionRegistrySnapshot {
    connectionCount: number;
    connectionCap: number | null;
    connectionStreams: number;
    sessionStreams: number;
    sseStreams: number;
    wsStreams: number;
    pendingClientRequests: number;
    connections: AcpConnectionDiagnostic[];
}
export declare class AcpConnection {
    private readonly onAbandonPending?;
    private readonly onDetachSession?;
    readonly connectionId: string;
    /** Connection-scoped SSE stream (the client's `GET /acp` with only the conn header). */
    connStream?: TransportStream;
    private readonly abortController;
    readonly abortSignal: AbortSignal;
    /** Frames emitted before the connection stream attached, flushed on attach. */
    private readonly connBuffer;
    readonly sessions: Map<string, SessionBinding>;
    /**
     * Sessions this connection created (`session/new`) or explicitly
     * attached to (`session/load`/`resume`). Per-session operations
     * (subscribe, prompt, cancel, …) are gated on membership here so one
     * connection can't drive or eavesdrop on a session it never claimed.
     */
    readonly ownedSessions: Set<string>;
    /**
     * Sessions with an in-flight `session/close` (between the synchronous
     * ownership-revoke and the bridge close + local teardown). `session/load`
     * / `resume` reject for an id in this set so a close racing a re-load
     * can't have its `finally` teardown destroy the freshly-loaded session.
     */
    readonly closingSessions: Set<string>;
    /** Agent→client requests awaiting a client response, keyed by JSON-RPC id. */
    readonly pending: Map<string, PendingClientRequest>;
    /** Daemon-issued client id reused across this connection's bridge calls. */
    readonly clientId: string;
    /**
     * True when the `initialize` POST arrived from a kernel-stamped loopback
     * peer. Threaded into per-session bridge contexts so the `local-only`
     * permission policy can gate votes by transport — mirrors the REST
     * surface's `detectFromLoopback(req)`. NOT derived from forgeable
     * headers (`X-Forwarded-For` etc).
     */
    readonly fromLoopback: boolean;
    /**
     * Set by `destroy()`. An in-flight `session/new`/`load`/`resume` whose
     * bridge call resolves AFTER teardown checks this to kill/detach the
     * late-registered session, so a `DELETE` (or idle sweep) racing a spawn
     * doesn't orphan a child process / phantom clientId.
     */
    destroyed: boolean;
    /**
     * Grace-period reap timer armed when the connection-scoped SSE stream
     * closes; cleared on reconnect (`attachConnStream`) or teardown. Avoids a
     * dead connection locking its `ownedSessions` (and counting against
     * `maxConnections`) for the full 30-min idle TTL.
     */
    connGraceTimer?: ReturnType<typeof setTimeout>;
    /**
     * True once the connection grace timer has fired. The timer is one-shot, so
     * if it fired while a session was still mid-reconnect (`hasRecoverableSession`
     * blocked the reap), nothing would re-check the connection after that session
     * later tore down — it would linger until the 30-min idle sweep. This flag
     * lets `onSessionGraceExpired` (fired when a session grace expires) recognize
     * "the conn grace already elapsed" and run the reap that was deferred.
     */
    connGraceExpired: boolean;
    /**
     * Set by the transport layer (`index.ts`) when the connection grace timer is
     * armed. Invoked after a session's reclaim grace expires so a connection that
     * was blocked from reaping by a then-recoverable session gets re-evaluated
     * instead of leaking until the idle sweep.
     */
    onSessionGraceExpired?: () => void;
    lastActiveMs: number;
    private idCounter;
    constructor(connectionId: string | undefined, fromLoopback: boolean, onAbandonPending?: AbandonPendingFn | undefined, onDetachSession?: DetachSessionFn | undefined);
    /**
     * Allocate a fresh JSON-RPC id for an agent→client request. STRING-typed
     * (`_qwen_perm_<conn>_N`) so it can never collide with a client-originated id —
     * JSON-RPC 2.0 permits clients to use any number (incl. negatives) or
     * string, so a numeric namespace wasn't actually safe.
     */
    nextId(): string;
    touch(): void;
    ownSession(sessionId: string): void;
    ownsSession(sessionId: string): boolean;
    getOrCreateSession(sessionId: string): SessionBinding;
    markInitialReplayPending(sessionId: string): void;
    hasInitialReplayPending(sessionId: string): boolean;
    markInitialReplayComplete(sessionId: string): void;
    getDiagnostic(): AcpConnectionDiagnostic;
    /** Send a frame on the connection-scoped stream (buffer until it attaches). */
    sendConn(frame: unknown): void;
    /** True if any session currently has a live (open) SSE stream. */
    hasLiveSessionStream(): boolean;
    /**
     * True if any session is mid-reconnect: its transport stream detached but
     * its `SESSION_GRACE_MS` reclaim window is still armed (`graceTimer` set),
     * so the binding — ownership + in-flight prompt — is being held open for an
     * imminent resume. The connection reaper must count these as activity:
     * otherwise, when the connection-scoped stream closes first and a session
     * stream detaches just after, the connection grace timer could delete the
     * whole connection (and `destroy()` abort the prompt) while the session is
     * still inside its OWN grace window — the reconnect would then 404.
     */
    hasRecoverableSession(): boolean;
    /** Cancel a pending grace-period reap (e.g. on conn-stream reconnect). */
    clearGraceTimer(): void;
    /** Attach the connection-scoped stream and flush any buffered frames. */
    attachConnStream(stream: TransportStream): void;
    /**
     * Send a frame on a session-scoped stream (buffer until it attaches).
     * LOOKUP-ONLY: drops the frame when the session has no binding — a binding
     * always exists for a live session (created at `session/new`/`load`/
     * `resume`), so a missing one means the session was torn down. Auto-
     * creating here would resurrect a ghost binding (no stream, no owner) that
     * buffers up to 256 late pump/reply frames forever.
     */
    sendSession(sessionId: string, frame: unknown, id?: number): void;
    /**
     * Send an OUT-OF-BAND session JSON-RPC reply (a `session/prompt` result and
     * friends from `replySession`) — id-less on the wire (no ring cursor).
     *
     * Unlike `sendSession`, this defers the reply behind a watermark while a ring
     * replay is catching up. `anchorId` is the bus head id at the moment the reply
     * was produced (every content event that should precede the reply has id ≤
     * `anchorId`). The reply is held until the pump has DELIVERED through that id
     * (`releaseDeferredSessionReplies`), so a prompt that finishes during a slow
     * replay can't land ahead of tail content still queued behind `replay_complete`
     * (§1.8 W1 — the truncated-body reordering).
     *
     * It defers when EITHER a resume replay is in flight (`replayPending`) OR the
     * stream is detached OR replies are already queued ahead of it (`buffer` not
     * empty) — that last case keeps a just-produced reply from overtaking an
     * earlier one still waiting on its watermark. Once the buffer drains and replay
     * is done, replies go straight to the wire (steady state, unchanged from a
     * non-resumed stream).
     */
    sendSessionReply(sessionId: string, frame: unknown, anchorId?: number): void;
    /**
     * Release deferred out-of-band replies (`sendSessionReply`) whose watermark
     * (`anchorId`) the pump has now passed: every leading id-less buffer entry
     * with `anchorId ≤ deliveredId` is flushed to the live stream, in order. The
     * pump calls this after delivering each content event (and at `replay_complete`
     * with the last replayed id), so each reply lands immediately AFTER the last
     * content event that preceded it — never ahead of tail content still queued.
     *
     * Stops at the first entry that is id-bearing (not a deferred reply) or whose
     * anchor is still ahead of `deliveredId`, preserving stream order. No-op if the
     * stream isn't live (the entries stay buffered for the next attach).
     */
    releaseDeferredSessionReplies(sessionId: string, deliveredId: number): void;
    /**
     * Attach a session-scoped stream: close any prior stream, abort the prior
     * subscription, install the caller's FRESH AbortController (the old one is
     * aborted and can never resume — reusing it would leave the new stream
     * event-starved), flush buffered frames, and return the binding.
     */
    attachSessionStream(sessionId: string, stream: TransportStream, abort: AbortController, resumeFromEventId?: number): SessionBinding;
    /**
     * The ring replay drained (`replay_complete`): stop deferring NEW replies that
     * are anchored within the replayed range, and release every buffered reply
     * whose watermark the replay already passed (`anchorId ≤ lastReplayedId`).
     *
     * Replies anchored ABOVE the replayed range stay buffered — their content
     * hasn't been delivered yet because the turn was still running at reconnect
     * (the content flows as LIVE events after `replay_complete`). The per-event
     * `releaseDeferredSessionReplies` calls drain those as the matching live
     * content arrives, so a result produced during a slow replay still lands after
     * its tail content (§1.8 W1), not at the boundary.
     */
    endReplayDeferral(sessionId: string, lastReplayedId: number, evictionOccurred?: boolean): void;
    /**
     * Final, UNCONDITIONAL flush of everything still buffered — used when the pump
     * ends with no more events coming (clean iterator end / live-only subscription
     * with no replay boundary). Releases any remaining deferred replies regardless
     * of watermark: their anchored content will never arrive, so holding them
     * would strand the result forever.
     *
     * No-op if the session has no live stream (frames stay buffered for the next
     * attach) — but `replayPending` is cleared regardless, since no replay is in
     * flight once the pump has settled.
     *
     * The frames are enqueued synchronously, in buffer order: `SseStream`
     * serializes every `send` through one `writeChain`, so wire order is fixed by
     * call order here. We deliberately do NOT `await` each `send` between `shift`s
     * — doing so would open a window where a live event arriving mid-drain enqueues
     * BETWEEN two deferred frames, reordering the very replies this deferral exists
     * to keep in order (§1.8 W1).
     */
    flushBufferedSessionFrames(sessionId: string): void;
    /**
     * Transport-level session-stream close (proxy idle-close / network blip) —
     * as opposed to an explicit `session/close`. Detaches ONLY the stream and
     * its event subscription while KEEPING the binding, ownership, the in-flight
     * prompt, and the bridge-client registration, so a reconnect within
     * `graceMs` can resume (ring replay backfills the gap — §1.8). If no
     * reconnect arrives, the grace timer runs the full `closeSessionStream`
     * teardown, bounding the runaway-prompt cost. Identity-guarded: a stale
     * stream's close can't detach a newer reconnect's stream.
     */
    detachSessionStream(sessionId: string, stream: TransportStream, graceMs: number): void;
    closeSessionStream(sessionId: string): void;
    destroy(): void;
    private teardownBinding;
    /**
     * Cancel + drop any pending agent→client requests for a closing session.
     * This is the LAST-RESORT recovery path: `resolveClientResponse` retains a
     * pending entry on double-failure (vote AND cancel both threw) precisely so
     * this teardown sweep can retry the cancel. We always drop the entry here
     * (the connection is going away — there is no further retry after teardown),
     * but if the cancel itself still fails (triple-failure) the bridge mediator
     * may be stuck awaiting a vote that will never arrive, so log it for the
     * operator rather than failing silently.
     */
    private abandonPendingForSession;
}
/**
 * Registry of live ACP connections with an idle-TTL sweep. The sweep is
 * defensive: a well-behaved client `DELETE /acp`s, but a crashed client
 * that never closes its streams would otherwise leak connection state.
 */
export declare class ConnectionRegistry {
    private readonly onAbandonPending?;
    private readonly onDetachSession?;
    private readonly maxConnections;
    private readonly idleTtlMs;
    private readonly byId;
    private readonly sweepTimer;
    constructor(onAbandonPending?: AbandonPendingFn | undefined, onDetachSession?: DetachSessionFn | undefined, maxConnections?: number, idleTtlMs?: number);
    /**
     * Mint a connection, or return `undefined` when the live-connection cap
     * is reached (the caller answers `503`). Bounds an `initialize` flood from
     * growing the registry without limit through the full TTL window.
     */
    create(fromLoopback: boolean): AcpConnection | undefined;
    get(connectionId: string | undefined): AcpConnection | undefined;
    findPendingClientRequest(id: string): PendingClientRequestRef | undefined;
    /**
     * Locate a pending permission entry matching `requestId` (a bridge
     * `bridgeRequestId`, i.e. a per-request `randomUUID()`) and optionally
     * `sessionId`, returning the first match.
     *
     * NOTE: `requestId` is unique per *request*, not per *pending entry*. The
     * per-entry unique id is the `conn.pending` map key
     * (`_qwen_perm_<connectionId>_N`), which is NOT what is matched here. A
     * `permission_request` is delivered to every live subscriber of its session,
     * so when connections co-own a session (multi-client attach) each mints its
     * own entry sharing the same `bridgeRequestId`. More than one entry can
     * therefore match, so this is a *read-only locator* for deriving a session /
     * ownership from a wire `requestId`. To DELETE a resolved entry, act on the
     * specific `conn`/map-key the caller already holds (see
     * `AcpDispatcher.dropOwnPendingPermission`) — never delete by re-matching
     * here, which could hit a sibling co-owner's entry.
     */
    findPendingPermission(requestId: string, sessionId?: string): PendingClientRequestRef | undefined;
    delete(connectionId: string): boolean;
    get size(): number;
    /** The configured concurrent-connection cap (for operator-facing logs). */
    get connectionCap(): number;
    getSnapshot(): ConnectionRegistrySnapshot;
    clear(): void;
    dispose(): void;
    private sweep;
}
export {};
