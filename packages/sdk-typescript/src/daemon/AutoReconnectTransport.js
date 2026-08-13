/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { DaemonTransportClosedError } from './DaemonTransport.js';
import { RestSseTransport } from './RestSseTransport.js';
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
export class AutoReconnectTransport {
    inner;
    baseUrl;
    token;
    fetchFn;
    preferredType;
    factory;
    _disposed = false;
    /** Mutex: only one reconnect attempt at a time. */
    reconnecting;
    supportsReplay;
    restFetch;
    constructor(opts) {
        this.baseUrl = opts.baseUrl;
        this.token = opts.token;
        this.fetchFn =
            opts.fetch ??
                opts.initial?.restFetch ??
                globalThis.fetch.bind(globalThis);
        this.restFetch = this.fetchFn;
        this.preferredType = opts.preferredType ?? 'rest';
        this.factory = opts.factory;
        this.inner =
            opts.initial ??
                new RestSseTransport(this.baseUrl, this.token, this.fetchFn);
        this.supportsReplay = this.inner.supportsReplay;
    }
    get type() {
        return this.inner.type;
    }
    get connected() {
        return !this._disposed && this.inner.connected;
    }
    async fetch(url, init, opts) {
        if (this._disposed)
            throw new DaemonTransportClosedError();
        try {
            return await this.inner.fetch(url, init, opts);
        }
        catch (err) {
            if (err instanceof DaemonTransportClosedError && !this._disposed) {
                await this.reconnect();
                return this.inner.fetch(url, init, opts);
            }
            throw err;
        }
    }
    async *subscribeEvents(sessionId, opts = {}) {
        if (this._disposed)
            throw new DaemonTransportClosedError();
        try {
            yield* this.inner.subscribeEvents(sessionId, opts);
        }
        catch (err) {
            if (err instanceof DaemonTransportClosedError && !this._disposed) {
                await this.reconnect();
                yield* this.inner.subscribeEvents(sessionId, opts);
            }
            else {
                throw err;
            }
        }
    }
    dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        this.inner.dispose();
    }
    // -- Internal ----------------------------------------------------------
    async reconnect() {
        // Mutex: if a reconnect is already in progress, wait for it
        // instead of starting a concurrent attempt (reconnect storm).
        if (this.reconnecting)
            return this.reconnecting;
        this.reconnecting = this._doReconnect().finally(() => {
            this.reconnecting = undefined;
        });
        return this.reconnecting;
    }
    async _doReconnect() {
        // Dispose the old transport.
        try {
            this.inner.dispose();
        }
        catch {
            /* already disposed */
        }
        // Try preferred transport via factory.
        if (this.factory) {
            try {
                this.inner = await this.factory(this.preferredType);
                return;
            }
            catch {
                // Factory failed — fall back to REST.
            }
        }
        // Fallback: create a fresh RestSseTransport.
        this.inner = new RestSseTransport(this.baseUrl, this.token, this.fetchFn);
    }
}
//# sourceMappingURL=AutoReconnectTransport.js.map