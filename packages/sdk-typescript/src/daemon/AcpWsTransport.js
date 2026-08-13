/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { DaemonTransportClosedError } from './DaemonTransport.js';
import { denormalizeAcpNotification, } from './AcpEventDenormalizer.js';
import { matchRoute, synthesizeResponse, jsonRpcErrorToHttpStatusWithData, isRecord, } from './acpTransportUtils.js';
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** Maximum queued events per generator before drop-oldest. */
const MAX_GENERATOR_QUEUE_SIZE = 256;
/** Default timeout for the initialize handshake (ms). */
const INIT_TIMEOUT_MS = 30_000;
// ---------------------------------------------------------------------------
// AcpWsTransport
// ---------------------------------------------------------------------------
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
export class AcpWsTransport {
    wsUrl;
    token;
    ws = null;
    _connected = false;
    _disposed = false;
    nextId = 1;
    pending = new Map();
    /**
     * Shared notification stream. Every JSON-RPC notification that
     * arrives on the WS is denormalized into a `DaemonEvent` and
     * pushed into this array of listeners. `subscribeEvents` registers
     * a per-session filter.
     */
    notificationListeners = new Set();
    /**
     * Active async generators. Aborted when the WS closes so parked
     * generators throw `DaemonTransportClosedError` instead of hanging.
     */
    _activeGenerators = new Set();
    /** Cached `initialize` result for `GET /capabilities`. */
    initResult = undefined;
    initPromise = undefined;
    type = 'acp-ws';
    supportsReplay = false;
    restFetch;
    constructor(wsUrl, token, restFetch) {
        this.wsUrl = wsUrl;
        this.token = token;
        // Resolve globalThis.fetch lazily so the transport still constructs in
        // environments where fetch only exists later (or is injected per call).
        this.restFetch =
            restFetch ?? ((input, init) => globalThis.fetch(input, init));
    }
    get connected() {
        return this._connected && !this._disposed;
    }
    async fetch(url, init, _opts) {
        if (this._disposed)
            throw new DaemonTransportClosedError();
        // Ensure WS is connected and initialized.
        await this.ensureConnected();
        // Parse the URL to extract the path relative to the base.
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;
        // Parse the body if present.
        let body;
        if (typeof init.body === 'string') {
            try {
                body = JSON.parse(init.body);
            }
            catch {
                body = init.body;
            }
        }
        const httpMethod = (init.method ?? 'GET').toUpperCase();
        // Match against the route table.
        const match = matchRoute(path, httpMethod);
        if (!match) {
            // Unrecognized route — fall through with an error response.
            return synthesizeResponse(404, {
                error: `No ACP mapping for ${httpMethod} ${path}`,
            });
        }
        const { mapping, segments } = match;
        // The ACP initialize result has a different schema from the daemon
        // capabilities envelope. Prefer the REST discovery response when this
        // transport was constructed with a REST fetch (as negotiateTransport
        // does), and retain the initialize result only as an ACP-only fallback.
        // The envelope must actually carry a `features` array: a reverse proxy
        // or SPA can answer 200 with HTML for unknown paths, and accepting that
        // body would resurface the very `caps.features` TypeError this path
        // exists to avoid.
        if (mapping.method === '_capabilities') {
            try {
                const response = await this.restFetch(url, init);
                if (!response.ok) {
                    if (response.status !== 404)
                        return response;
                }
                else {
                    const envelope = await response.clone().json();
                    if (isRecord(envelope) && Array.isArray(envelope['features'])) {
                        return response;
                    }
                }
            }
            catch {
                // ACP-only deployments can still use the initialize fallback.
            }
            return synthesizeResponse(200, {
                ...(isRecord(this.initResult) ? this.initResult : {}),
                v: 1,
                features: [],
            });
        }
        // For notifications, send and return 204 immediately.
        if (mapping.notification) {
            const params = mapping.extractParams(segments, body, httpMethod, parsedUrl.searchParams);
            const notifMeta = extractHeaderMeta(init.headers);
            if (notifMeta) {
                params['_meta'] = {
                    ...(isRecord(params['_meta']) ? params['_meta'] : {}),
                    ...notifMeta,
                };
            }
            this.sendNotification(mapping.method, params);
            return synthesizeResponse(204, null);
        }
        // Normal request-response.
        const params = mapping.extractParams(segments, body, httpMethod, parsedUrl.searchParams);
        // Forward per-request headers as JSON-RPC _meta so the server can
        // see X-Qwen-Client-Id and similar metadata that HTTP transports
        // carry natively.
        const headerMeta = extractHeaderMeta(init.headers);
        if (headerMeta) {
            params['_meta'] = {
                ...(isRecord(params['_meta']) ? params['_meta'] : {}),
                ...headerMeta,
            };
        }
        const response = await this.sendRequest(mapping.method, params, init.signal ?? undefined, 
        // Extract sessionId for abort→cancel forwarding.
        typeof params.sessionId === 'string'
            ? params.sessionId
            : undefined);
        if (response.error) {
            const errorData = response.error.data;
            const status = isRecord(errorData) && typeof errorData['httpStatus'] === 'number'
                ? errorData['httpStatus']
                : jsonRpcErrorToHttpStatusWithData(response.error.code, response.error.data);
            return synthesizeResponse(status, {
                error: response.error.message,
                ...(response.error.data != null ? { data: response.error.data } : {}),
            });
        }
        return synthesizeResponse(200, response.result);
    }
    async *subscribeEvents(sessionId, opts = {}) {
        if (this._disposed)
            throw new DaemonTransportClosedError();
        // NOTE: `opts.epoch` / `opts.onEpoch` do NOT apply to this transport.
        // The WS stream has no `Last-Event-ID` resume mechanism (it filters a
        // live shared notification stream, never replays), so there is no
        // stale-cursor problem for the epoch token to solve and no HTTP
        // response headers to learn the epoch from. Intentionally ignored
        // rather than silently mis-applied — same policy as `maxQueued` and the
        // REST SSE lifecycle fields (`clientId`, `sseConnectReason`,
        // `previousSseStreamId`, `onSseStreamAccepted`), which are likewise
        // REST-only and unused here.
        await this.ensureConnected();
        // Track this generator so we can abort it when the WS closes.
        const genAbort = new AbortController();
        this._activeGenerators.add(genAbort);
        // Create a queue that the notification listener pushes into.
        // Capped at MAX_GENERATOR_QUEUE_SIZE with drop-oldest to prevent
        // unbounded memory growth if the consumer is slow.
        const queue = [];
        let resolve = null;
        let done = false;
        const listener = (event) => {
            // Filter by session: if the event has a sessionId, only yield
            // if it matches. Workspace-scoped events (no sessionId) pass.
            const data = event.data;
            if (isRecord(data)) {
                const evtSessionId = data['sessionId'];
                if (typeof evtSessionId === 'string' &&
                    evtSessionId.length > 0 &&
                    evtSessionId !== sessionId) {
                    return;
                }
            }
            // Drop oldest if queue is full.
            if (queue.length >= MAX_GENERATOR_QUEUE_SIZE) {
                queue.shift();
            }
            queue.push(event);
            if (resolve) {
                resolve();
                resolve = null;
            }
        };
        this.notificationListeners.add(listener);
        // Wire abort to cleanup.
        const onAbort = () => {
            done = true;
            this.notificationListeners.delete(listener);
            if (resolve) {
                resolve();
                resolve = null;
            }
        };
        if (opts.signal) {
            if (opts.signal.aborted) {
                onAbort();
                this._activeGenerators.delete(genAbort);
                return;
            }
            opts.signal.addEventListener('abort', onAbort, { once: true });
        }
        // Also wire the generator-level abort (fired on WS close).
        genAbort.signal.addEventListener('abort', onAbort, { once: true });
        try {
            while (!done && !this._disposed) {
                // Check if the generator was aborted (WS close).
                if (genAbort.signal.aborted) {
                    throw new DaemonTransportClosedError('WebSocket closed while generator was active');
                }
                if (queue.length > 0) {
                    yield queue.shift();
                    continue;
                }
                // Wait for the next event.
                await new Promise((r) => {
                    resolve = r;
                });
                // Re-check abort after waking up.
                if (genAbort.signal.aborted) {
                    throw new DaemonTransportClosedError('WebSocket closed while generator was active');
                }
            }
        }
        finally {
            this._activeGenerators.delete(genAbort);
            this.notificationListeners.delete(listener);
            if (opts.signal) {
                opts.signal.removeEventListener('abort', onAbort);
            }
            genAbort.signal.removeEventListener('abort', onAbort);
        }
    }
    dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        this._connected = false;
        // Reject all pending requests.
        for (const [, pending] of this.pending) {
            pending.reject(new DaemonTransportClosedError());
        }
        this.pending.clear();
        // Abort all active generators.
        for (const ac of this._activeGenerators) {
            ac.abort();
        }
        // Close the WebSocket.
        if (this.ws) {
            try {
                this.ws.close(1000, 'transport disposed');
            }
            catch {
                /* already closed */
            }
            this.ws = null;
        }
    }
    // -- Internal ----------------------------------------------------------
    async ensureConnected() {
        if (this._connected)
            return;
        if (this.initPromise) {
            await this.initPromise;
            return;
        }
        // Reset on failure so the next call retries instead of parking
        // on a permanently rejected promise.
        this.initPromise = this.connect().catch((err) => {
            this.initPromise = undefined;
            throw err;
        });
        await this.initPromise;
    }
    async connect() {
        return new Promise((resolveConnect, rejectConnect) => {
            // Pass token via Authorization header on the upgrade request.
            // Node >=22 supports an options object as the second argument:
            //   new WebSocket(url, { headers: { ... } })
            // The browser WebSocket API does NOT support custom headers —
            // in browser environments we connect without auth and rely on
            // loopback/proxy auth (see class JSDoc).
            const isBrowser = typeof globalThis.window !== 'undefined' &&
                typeof globalThis.window.document !== 'undefined';
            let ws;
            if (isBrowser || !this.token) {
                ws = new WebSocket(this.wsUrl);
            }
            else {
                // Node: cast through unknown because DOM typings only declare
                // (url, protocols?) — Node accepts an options bag.
                ws = new WebSocket(this.wsUrl, {
                    headers: { Authorization: `Bearer ${this.token}` },
                });
            }
            this.ws = ws;
            // Timeout for the initialize handshake.
            const initTimeout = setTimeout(() => {
                ws.close(1002, 'Initialize timeout');
                rejectConnect(new DaemonTransportClosedError(`WebSocket initialize timed out after ${INIT_TIMEOUT_MS}ms`));
            }, INIT_TIMEOUT_MS);
            ws.onopen = () => {
                this._connected = true;
                // Send initialize request.
                const initId = this.nextId++;
                const initReq = {
                    jsonrpc: '2.0',
                    id: initId,
                    method: 'initialize',
                    params: {
                        clientInfo: { name: 'qwen-code-sdk', version: '1.0.0' },
                    },
                };
                this.pending.set(initId, {
                    resolve: (response) => {
                        clearTimeout(initTimeout);
                        this.initResult = response.result;
                        resolveConnect();
                    },
                    reject: (err) => {
                        clearTimeout(initTimeout);
                        rejectConnect(err);
                    },
                });
                ws.send(JSON.stringify(initReq));
            };
            ws.onmessage = (event) => {
                let msg;
                try {
                    msg = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
                }
                catch {
                    return; // ignore non-JSON messages
                }
                // JSON-RPC response (has `id` field).
                if ('id' in msg && typeof msg['id'] === 'number') {
                    const pending = this.pending.get(msg['id']);
                    if (pending) {
                        this.pending.delete(msg['id']);
                        pending.resolve(msg);
                    }
                    return;
                }
                // JSON-RPC notification (no `id` field, has `method`).
                if ('method' in msg &&
                    typeof msg['method'] === 'string' &&
                    msg['jsonrpc'] === '2.0') {
                    const notification = msg;
                    const daemonEvent = denormalizeAcpNotification(notification);
                    if (daemonEvent) {
                        for (const listener of this.notificationListeners) {
                            try {
                                listener(daemonEvent);
                            }
                            catch {
                                /* swallow listener errors */
                            }
                        }
                    }
                }
            };
            ws.onerror = () => {
                // Node WebSocket may only fire 'error' without 'close' on
                // connection refused / unreachable. Reject the connect
                // promise so the caller doesn't hang forever.
                if (!this._connected) {
                    clearTimeout(initTimeout);
                    rejectConnect(new DaemonTransportClosedError('WebSocket connection failed'));
                }
            };
            ws.onclose = (event) => {
                clearTimeout(initTimeout);
                this._connected = false;
                this.ws = null;
                this.initPromise = undefined;
                const closeError = new DaemonTransportClosedError(`WebSocket closed: ${event.code} ${event.reason}`);
                // Reject all pending requests.
                for (const [, pending] of this.pending) {
                    pending.reject(closeError);
                }
                this.pending.clear();
                // Abort all active generators so they throw instead of parking.
                for (const ac of this._activeGenerators) {
                    ac.abort();
                }
                // If we never connected, reject the connect promise.
                if (!this._disposed) {
                    rejectConnect(closeError);
                }
            };
        });
    }
    sendNotification(method, params) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
            return;
        const msg = {
            jsonrpc: '2.0',
            method,
            params,
        };
        this.ws.send(JSON.stringify(msg));
    }
    async sendRequest(method, params, signal, sessionId) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new DaemonTransportClosedError();
        }
        const id = this.nextId++;
        const req = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };
        return new Promise((resolve, reject) => {
            // Wire abort signal: if the caller aborts a prompt request,
            // send a cancel notification.
            let onAbort;
            if (signal) {
                onAbort = () => {
                    this.pending.delete(id);
                    if (sessionId && method === 'session/prompt') {
                        this.sendNotification('session/cancel', { sessionId });
                    }
                    reject(new DOMException('The operation was aborted', 'AbortError'));
                };
                if (signal.aborted) {
                    onAbort();
                    return;
                }
                signal.addEventListener('abort', onAbort, { once: true });
            }
            this.pending.set(id, {
                resolve: (response) => {
                    if (signal && onAbort) {
                        signal.removeEventListener('abort', onAbort);
                    }
                    resolve(response);
                },
                reject: (err) => {
                    if (signal && onAbort) {
                        signal.removeEventListener('abort', onAbort);
                    }
                    reject(err);
                },
            });
            this.ws.send(JSON.stringify(req));
        });
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Headers forwarded from per-request `init.headers` into JSON-RPC `_meta`. */
const FORWARDED_HEADERS = ['x-qwen-client-id'];
/**
 * Extract metadata-relevant headers from `RequestInit.headers` and
 * return them as a plain object suitable for merging into `_meta`.
 * Returns `undefined` when no relevant headers are present.
 */
function extractHeaderMeta(headers) {
    if (!headers)
        return undefined;
    const meta = {};
    const get = (key) => {
        if (headers instanceof Headers)
            return headers.get(key) ?? undefined;
        if (Array.isArray(headers)) {
            const pair = headers.find(([k]) => k.toLowerCase() === key.toLowerCase());
            return pair ? pair[1] : undefined;
        }
        // Plain object
        const h = headers;
        for (const k of Object.keys(h)) {
            if (k.toLowerCase() === key.toLowerCase())
                return h[k];
        }
        return undefined;
    };
    for (const hdr of FORWARDED_HEADERS) {
        const value = get(hdr);
        if (value !== undefined) {
            // Normalize header name to a camelCase _meta key.
            // 'x-qwen-client-id' → 'clientId'
            if (hdr === 'x-qwen-client-id') {
                meta['clientId'] = value;
            }
        }
    }
    return Object.keys(meta).length > 0 ? meta : undefined;
}
//# sourceMappingURL=AcpWsTransport.js.map