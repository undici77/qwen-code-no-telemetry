/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonEvent } from './types.js';
import type { DaemonTransport, DaemonTransportFetchOptions, DaemonTransportSubscribeOptions, DaemonTransportType } from './DaemonTransport.js';
/**
 * Factory function that creates a transport given the type hint.
 * The caller supplies this to `AutoReconnectTransport` so the
 * reconnect logic can recreate the preferred transport without
 * importing every concrete class itself.
 */
export type TransportFactory = (type: DaemonTransportType) => DaemonTransport | Promise<DaemonTransport>;
/**
 * Optional wrapper transport that handles reconnection on
 * `DaemonTransportClosedError`.
 *
 * On a transport-closed error:
 *   1. Attempt to recreate the preferred transport via `factory`.
 *   2. If that fails, fall back to a `RestSseTransport` (always works
 *      against a daemon that's still running).
 *   3. Re-initialize the new transport and retry the failed call.
 *
 * **Session-level recovery** (re-attaching the ACP session) is NOT
 * handled here — the caller must `session/load` after the transport
 * layer reconnects. This transport only provides transport-level
 * reconnection.
 */
export declare class AutoReconnectTransport implements DaemonTransport {
    private inner;
    private readonly baseUrl;
    private readonly token;
    private readonly fetchFn;
    private readonly preferredType;
    private readonly factory?;
    private _disposed;
    /** Mutex: only one reconnect attempt at a time. */
    private reconnecting;
    readonly supportsReplay: boolean;
    readonly restFetch: typeof globalThis.fetch;
    constructor(opts: {
        baseUrl: string;
        token?: string;
        fetch?: typeof globalThis.fetch;
        preferredType?: DaemonTransportType;
        factory?: TransportFactory;
        initial?: DaemonTransport;
    });
    get type(): DaemonTransportType;
    get connected(): boolean;
    fetch(url: string, init: RequestInit, opts?: DaemonTransportFetchOptions): Promise<Response>;
    subscribeEvents(sessionId: string, opts?: DaemonTransportSubscribeOptions): AsyncGenerator<DaemonEvent>;
    dispose(): void;
    private reconnect;
    private _doReconnect;
}
