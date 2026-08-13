/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonEvent } from './types.js';
import type { DaemonTransport, DaemonTransportFetchOptions, DaemonTransportSubscribeOptions } from './DaemonTransport.js';
/**
 * HTTP+SSE ACP transport. Sends JSON-RPC requests via `POST /acp`
 * and receives responses + notifications via a connection-scoped SSE
 * stream at `GET /acp`.
 *
 * Lazy-init: the first `fetch()` call sends `POST /acp { initialize }`
 * (which returns 200 with the initialize result inline), then opens a
 * connection-scoped SSE stream at `GET /acp` for subsequent responses.
 *
 * Subsequent `POST /acp` requests return 202 (ack); the real JSON-RPC
 * response rides an SSE stream. Responses are correlated by `id` using a
 * `Map<id, {resolve, reject}>` shared across both streams.
 *
 * Session events AND session-scoped JSON-RPC responses are received via the
 * session-scoped SSE stream at `GET /acp` (with `Acp-Session-Id`), which is
 * the resumable §1.8 stream the daemon's `replySession` routes session replies
 * onto. `subscribeEvents` reads it and dispatches each frame: a JSON-RPC
 * response resolves its pending request (so e.g. `session/prompt` doesn't hang
 * waiting on a reply it would otherwise never observe), a notification becomes
 * a `DaemonEvent`, and a `session/request_permission` request is surfaced as a
 * `permission_request` event (responding to it is the §1.7 follow-up). The
 * connection-scoped stream still carries replies to connection-level requests
 * (e.g. `initialize`, `session/new`).
 */
export declare class AcpHttpTransport implements DaemonTransport {
    private readonly baseUrl;
    private readonly token;
    private readonly _fetch;
    private _disposed;
    private _initialized;
    private initPromise;
    private nextId;
    private initResult;
    /** Connection id returned by the ACP initialize handshake. */
    private connectionId;
    /** Pending requests awaiting their JSON-RPC response on the SSE stream. */
    private readonly pending;
    /** Abort controller for the connection-scoped SSE stream. */
    private connStreamAbort;
    /**
     * Per-session count of in-progress `subscribeEvents` iterations. When > 0 a
     * consumer is already reading that session's `/acp` stream and routing its
     * JSON-RPC replies to `pending` — so `sendRequest` must NOT open a competing
     * background reply pump (the daemon's session stream is single-reader; a
     * second `GET /acp` would detach the consumer's).
     */
    private readonly activeSessionSubscriptions;
    /**
     * Background reply pumps started by `sendRequest` for a session-scoped
     * request when no consumer subscription is active, keyed by sessionId and
     * reference-counted so concurrent session requests share one pump. The
     * daemon routes replies to `session/prompt` & friends onto the SESSION
     * stream (not the connection stream), so without this a `DaemonClient.prompt`
     * that never iterates `subscribeEvents` would hang forever.
     */
    private readonly sessionReplyPumps;
    readonly type: "acp-http";
    readonly supportsReplay = true;
    readonly restFetch: typeof globalThis.fetch;
    constructor(baseUrl: string, token: string | undefined, fetchFn: typeof globalThis.fetch);
    get connected(): boolean;
    fetch(url: string, init: RequestInit, _opts?: DaemonTransportFetchOptions): Promise<Response>;
    subscribeEvents(sessionId: string, opts?: DaemonTransportSubscribeOptions): AsyncGenerator<DaemonEvent>;
    private subscribeEventsInner;
    dispose(): void;
    private ensureInitialized;
    private initialize;
    /**
     * Open a connection-scoped SSE stream at `GET /acp` with the
     * `Acp-Connection-Id` header. Incoming JSON-RPC responses are
     * matched to pending requests by `id`.
     */
    private openConnStream;
    private pumpConnStream;
    private sendNotification;
    /**
     * Ensure the connection-scoped SSE stream is open. Called lazily on
     * the first sendRequest that needs it (i.e. when the server returns
     * 202, meaning the real response rides the SSE stream).
     */
    private ensureConnStream;
    /**
     * Send a JSON-RPC request via `POST /acp` (returns 202 ack) and wait
     * for the matching response on the connection-scoped SSE stream.
     */
    private sendRequest;
    /**
     * Ensure a background session-reply pump is running for `sessionId`, returning
     * a release callback. Reference-counted: concurrent session requests share one
     * pump and it tears down when the last releases. The pump reads the session
     * `/acp` stream and routes JSON-RPC *responses* to `pending` (mirroring
     * `pumpConnStream`); it ignores events (no consumer) — a consumer that wants
     * events uses `subscribeEvents`, which suppresses this pump entirely.
     *
     * NOTE (daemon-side attach semantics): the pump opens `GET /acp` with
     * `Acp-Session-Id` but NO `Last-Event-ID`, so the daemon does a fresh
     * (non-resumptive) session attach — content events produced before the pump
     * attaches are delivered live, not replayed. A later `subscribeEvents`
     * consumer that resumes with a `Last-Event-ID` therefore won't see those
     * pre-pump content events replayed (they were live-delivered to a pump that
     * only routes JSON-RPC *responses* and drops events). This is fine for the
     * pump's job — resolving a no-subscriber `session/prompt` reply — but a
     * consumer that needs the full event history should open `subscribeEvents`
     * before issuing session RPCs.
     */
    private ensureSessionReplyPump;
    /**
     * Read a session-scoped `/acp` stream purely to route JSON-RPC *responses*
     * (`id`, no `method`) to `pending`. Notifications and agent→client requests
     * (`session/request_permission`, which also carry an `id`) are skipped — the
     * `method` guard prevents a permission request id from being mis-routed onto
     * a pending response slot.
     */
    private pumpSessionReplies;
}
