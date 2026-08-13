/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonEvent } from './types.js';
import type { DaemonTransport, DaemonTransportFetchOptions, DaemonTransportSubscribeOptions } from './DaemonTransport.js';
/**
 * WebSocket-based ACP transport. Multiplexes all requests over a
 * single WS connection using JSON-RPC 2.0 framing.
 *
 * Lazy-init: the WebSocket connection is established on the first
 * `fetch()` call. An `initialize` JSON-RPC request is sent on connect. Daemon
 * capabilities use REST discovery, with the initialize result retained only
 * as a fallback for ACP-only deployments.
 *
 * **Browser limitation**: The browser WebSocket API does not support
 * custom headers on the upgrade request. In Node (>=22), the token
 * is passed via an `Authorization` header. In browser environments,
 * the transport connects without auth headers — callers must rely on
 * token-less loopback access or a proxy that injects auth. A future
 * enhancement may use a subprotocol or query-param based token
 * exchange for browser contexts.
 */
export declare class AcpWsTransport implements DaemonTransport {
    private readonly wsUrl;
    private readonly token;
    private ws;
    private _connected;
    private _disposed;
    private nextId;
    private readonly pending;
    /**
     * Shared notification stream. Every JSON-RPC notification that
     * arrives on the WS is denormalized into a `DaemonEvent` and
     * pushed into this array of listeners. `subscribeEvents` registers
     * a per-session filter.
     */
    private readonly notificationListeners;
    /**
     * Active async generators. Aborted when the WS closes so parked
     * generators throw `DaemonTransportClosedError` instead of hanging.
     */
    private readonly _activeGenerators;
    /** Cached `initialize` result for `GET /capabilities`. */
    private initResult;
    private initPromise;
    readonly type: "acp-ws";
    readonly supportsReplay = false;
    readonly restFetch: typeof globalThis.fetch;
    constructor(wsUrl: string, token?: string, restFetch?: typeof globalThis.fetch);
    get connected(): boolean;
    fetch(url: string, init: RequestInit, _opts?: DaemonTransportFetchOptions): Promise<Response>;
    subscribeEvents(sessionId: string, opts?: DaemonTransportSubscribeOptions): AsyncGenerator<DaemonEvent>;
    dispose(): void;
    private ensureConnected;
    private connect;
    private sendNotification;
    private sendRequest;
}
