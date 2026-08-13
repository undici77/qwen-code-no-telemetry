/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonEvent } from './types.js';
import type { DaemonTransport, DaemonTransportFetchOptions, DaemonTransportSubscribeOptions } from './DaemonTransport.js';
/**
 * Default REST+SSE transport. Delegates `fetch()` to the underlying
 * `_fetch` callable and implements `subscribeEvents()` by opening an
 * SSE connection to `GET /session/:id/events`.
 *
 * This is the transport `DaemonClient` uses when no explicit transport
 * is provided — it exactly reproduces the pre-abstraction behavior.
 */
export declare class RestSseTransport implements DaemonTransport {
    private readonly baseUrl;
    private readonly token;
    private readonly _fetch;
    private readonly activeSseRequests;
    private _disposed;
    readonly type: "rest";
    readonly supportsReplay = true;
    readonly restFetch: typeof globalThis.fetch;
    constructor(baseUrl: string, token: string | undefined, fetchFn: typeof globalThis.fetch);
    get connected(): boolean;
    fetch(url: string, init: RequestInit, _opts?: DaemonTransportFetchOptions): Promise<Response>;
    /**
     * Open an SSE stream for the given session. Mirrors the inline
     * logic that previously lived in `DaemonClient.subscribeEvents`:
     *   - connect-phase timeout via AbortController
     *   - `Last-Event-ID` header
     *   - `?maxQueued=N` query param
     *   - content-type validation
     *   - delegation to `parseSseStream`
     */
    subscribeEvents(sessionId: string, opts?: DaemonTransportSubscribeOptions): AsyncGenerator<DaemonEvent>;
    dispose(): void;
}
