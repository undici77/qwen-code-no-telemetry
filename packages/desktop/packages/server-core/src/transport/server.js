/**
 * WsRpcServer — WebSocket-based RPC server.
 *
 * Owns ALL transport concerns: connection lifecycle, handshake, heartbeat,
 * optional auth, request dispatching, and push routing.
 *
 * Same class used locally (127.0.0.1, no auth) and remotely (0.0.0.0, auth).
 */
import { WebSocketServer } from 'ws';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { randomUUID } from 'node:crypto';
import { PROTOCOL_VERSION, HEARTBEAT_INTERVAL_MS, HEARTBEAT_MAX_MISSED, EVENT_BUFFER_MAX_SIZE, EVENT_BUFFER_TTL_MS, DISCONNECTED_CLIENT_TTL_MS, } from '@craft-agent/shared/protocol';
import { serializeEnvelope, deserializeEnvelope } from './codec';
import { createLogger } from '@craft-agent/shared/utils';
const transportLog = createLogger('ws-rpc-server');
// ---------------------------------------------------------------------------
// WsRpcServer
// ---------------------------------------------------------------------------
export class WsRpcServer {
    wss = null;
    httpServer = null;
    httpsServer = null;
    clients = new Map();
    handlers = new Map();
    pendingInvokes = new Map();
    heartbeatTimer = null;
    _port = 0;
    _protocol = 'ws';
    /** Recently disconnected clients retained for reconnect replay. */
    disconnectedClients = new Map();
    host;
    requestedPort;
    requireAuth;
    validateToken;
    validateSessionCookie;
    serverId;
    tlsOptions;
    serverVersion;
    maxClients;
    onClientConnected;
    onClientDisconnected;
    httpHandler;
    constructor(opts) {
        this.host = opts?.host ?? '127.0.0.1';
        this.requestedPort = opts?.port ?? 0;
        this.requireAuth = opts?.requireAuth ?? false;
        this.validateToken = opts?.validateToken ?? null;
        this.validateSessionCookie = opts?.validateSessionCookie ?? null;
        this.serverId = opts?.serverId ?? 'local';
        this.serverVersion = opts?.serverVersion ?? '';
        this.tlsOptions = opts?.tls ?? null;
        this.maxClients = opts?.maxClients ?? 50;
        this.onClientConnected = opts?.onClientConnected;
        this.onClientDisconnected = opts?.onClientDisconnected;
        this.httpHandler = opts?.httpHandler;
    }
    /** The actual port the server is listening on (available after listen()). */
    get port() {
        return this._port;
    }
    /** The protocol the server is using: 'wss' when TLS is configured, 'ws' otherwise. */
    get protocol() {
        return this._protocol;
    }
    /** Number of currently connected (handshake-completed) clients. */
    getConnectedClientCount() {
        return this.clients.size;
    }
    // -------------------------------------------------------------------------
    // RpcServer interface
    // -------------------------------------------------------------------------
    handle(channel, handler) {
        if (this.handlers.has(channel)) {
            throw new Error(`Handler already registered for channel: ${channel}`);
        }
        this.handlers.set(channel, handler);
    }
    push(channel, target, ...args) {
        const timestamp = Date.now();
        for (const client of this.clients.values()) {
            if (!this.matchesTarget(client, target))
                continue;
            this.bufferAndMaybeSendEvent(client, channel, args, timestamp, true);
        }
        for (const { client } of this.disconnectedClients.values()) {
            if (!this.matchesTarget(client, target))
                continue;
            this.bufferAndMaybeSendEvent(client, channel, args, timestamp, false);
        }
    }
    invokeClient(clientId, channel, ...args) {
        return new Promise((resolve, reject) => {
            const client = this.clients.get(clientId);
            // Check connection
            if (!client) {
                const err = new Error(`Client not connected: ${clientId}`);
                err.code = 'CLIENT_DISCONNECTED';
                reject(err);
                return;
            }
            // Check capability
            if (!client.capabilities.has(channel)) {
                const err = new Error(`Client lacks capability: ${channel}`);
                err.code = 'CAPABILITY_UNAVAILABLE';
                reject(err);
                return;
            }
            const id = randomUUID();
            const timeout = setTimeout(() => {
                this.pendingInvokes.delete(id);
                const err = new Error(`Client request timeout: ${channel} (30000ms)`);
                err.code = 'CLIENT_REQUEST_TIMEOUT';
                reject(err);
            }, 30_000);
            this.pendingInvokes.set(id, { clientId, resolve, reject, timeout });
            const envelope = {
                id,
                type: 'request',
                channel,
                args,
                serverId: this.serverId,
            };
            this.safeSend(client.ws, serializeEnvelope(envelope));
        });
    }
    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    async listen() {
        return new Promise((resolve, reject) => {
            if (this.tlsOptions) {
                // TLS mode: create HTTPS server, attach WebSocketServer to it.
                // When httpHandler is set, regular HTTP requests are served by it
                // (e.g. WebUI), while ws intercepts WebSocket upgrade requests.
                this._protocol = 'wss';
                this.httpsServer = createHttpsServer({
                    cert: this.tlsOptions.cert,
                    key: this.tlsOptions.key,
                    ca: this.tlsOptions.ca,
                    passphrase: this.tlsOptions.passphrase,
                }, this.httpHandler);
                this.wss = new WebSocketServer({ server: this.httpsServer });
                this.httpsServer.on('error', (err) => reject(err));
                this.httpsServer.listen(this.requestedPort, this.host, () => {
                    const addr = this.httpsServer.address();
                    if (typeof addr === 'object' && addr) {
                        this._port = addr.port;
                    }
                    this.startHeartbeat();
                    resolve();
                });
            }
            else if (this.httpHandler) {
                // Plain WS + HTTP handler: create an HTTP server for both.
                this._protocol = 'ws';
                this.httpServer = createHttpServer(this.httpHandler);
                this.wss = new WebSocketServer({ server: this.httpServer });
                this.httpServer.on('error', (err) => reject(err));
                this.httpServer.listen(this.requestedPort, this.host, () => {
                    const addr = this.httpServer.address();
                    if (typeof addr === 'object' && addr) {
                        this._port = addr.port;
                    }
                    this.startHeartbeat();
                    resolve();
                });
            }
            else {
                // Plain WS mode, no HTTP handler
                this._protocol = 'ws';
                this.wss = new WebSocketServer({
                    host: this.host,
                    port: this.requestedPort,
                });
                this.wss.on('listening', () => {
                    const addr = this.wss.address();
                    if (typeof addr === 'object' && addr) {
                        this._port = addr.port;
                    }
                    this.startHeartbeat();
                    resolve();
                });
                this.wss.on('error', (err) => {
                    reject(err);
                });
            }
            this.wss.on('connection', (ws, req) => {
                this.onConnection(ws, req.headers.cookie ?? null);
            });
        });
    }
    close() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        // Reject all pending invokes before tearing down connections
        for (const [id, pending] of this.pendingInvokes) {
            clearTimeout(pending.timeout);
            const err = new Error('Server shutting down');
            err.code = 'CLIENT_DISCONNECTED';
            pending.reject(err);
            this.pendingInvokes.delete(id);
        }
        for (const client of this.clients.values()) {
            client.ws.terminate();
        }
        this.clients.clear();
        // Clean up disconnected client timers
        for (const entry of this.disconnectedClients.values()) {
            clearTimeout(entry.timer);
        }
        this.disconnectedClients.clear();
        this.wss?.close();
        this.wss = null;
        this.httpServer?.close();
        this.httpServer = null;
        this.httpsServer?.close();
        this.httpsServer = null;
    }
    // -------------------------------------------------------------------------
    // Connection handling
    // -------------------------------------------------------------------------
    onConnection(ws, upgradeRequestCookie) {
        // Reject if at capacity
        if (this.maxClients > 0 && this.clients.size >= this.maxClients) {
            transportLog.warn('Connection rejected: at capacity', {
                maxClients: this.maxClients,
                current: this.clients.size,
            });
            ws.close(4008, 'Server at capacity');
            return;
        }
        let handshakeCompleted = false;
        let handshakeTimeout = null;
        // Give the client 5 seconds to send a handshake
        handshakeTimeout = setTimeout(() => {
            if (!handshakeCompleted) {
                ws.close(4001, 'Handshake timeout');
            }
        }, 5_000);
        ws.on('message', async (raw) => {
            let envelope;
            try {
                envelope = deserializeEnvelope(raw.toString());
            }
            catch {
                ws.close(4002, 'Invalid JSON');
                return;
            }
            if (!handshakeCompleted) {
                if (envelope.type !== 'handshake') {
                    ws.close(4003, 'Expected handshake');
                    return;
                }
                if (handshakeTimeout) {
                    clearTimeout(handshakeTimeout);
                    handshakeTimeout = null;
                }
                // Protocol version check (required)
                if (!envelope.protocolVersion || typeof envelope.protocolVersion !== 'string') {
                    this.sendError(ws, envelope.id, 'PROTOCOL_VERSION_UNSUPPORTED', `Missing protocolVersion. Server protocol ${PROTOCOL_VERSION}`);
                    ws.close(4004, 'Protocol version unsupported');
                    return;
                }
                const clientMajor = parseInt(envelope.protocolVersion.split('.')[0], 10);
                const serverMajor = parseInt(PROTOCOL_VERSION.split('.')[0], 10);
                if (clientMajor !== serverMajor) {
                    this.sendError(ws, envelope.id, 'PROTOCOL_VERSION_UNSUPPORTED', `Server protocol ${PROTOCOL_VERSION}, client ${envelope.protocolVersion}`);
                    ws.close(4004, 'Protocol version unsupported');
                    return;
                }
                // Auth check — bearer token OR session cookie (web UI)
                if (this.requireAuth) {
                    let authenticated = false;
                    // 1. Try bearer token (standard path)
                    if (envelope.token && this.validateToken) {
                        authenticated = await this.validateToken(envelope.token);
                    }
                    // 2. Fallback: try session cookie from HTTP upgrade request (web UI path)
                    if (!authenticated && this.validateSessionCookie && upgradeRequestCookie) {
                        authenticated = await this.validateSessionCookie(upgradeRequestCookie);
                    }
                    if (!authenticated) {
                        const reason = envelope.token ? 'Invalid token' : 'Token required';
                        this.sendError(ws, envelope.id, 'AUTH_FAILED', reason);
                        ws.close(4005, 'Auth failed');
                        return;
                    }
                }
                // ── Reconnect attempt ──
                if (envelope.reconnectClientId && envelope.lastSeq != null) {
                    const entry = this.disconnectedClients.get(envelope.reconnectClientId);
                    if (entry) {
                        const prevClient = entry.client;
                        // Identity must match (workspace + webContentsId)
                        const identityMatch = prevClient.workspaceId === (envelope.workspaceId ?? null) &&
                            prevClient.webContentsId === (envelope.webContentsId ?? null);
                        if (identityMatch) {
                            // Valid reconnect — prepare client state but do NOT add to
                            // this.clients yet. The client stays in disconnectedClients
                            // during replay so that push() can't interleave new events
                            // between replayed ones. (Currently safe due to Node.js
                            // single-threading, but this ordering makes the invariant
                            // explicit and future-proof.)
                            clearTimeout(entry.timer);
                            prevClient.ws = ws;
                            prevClient.alive = true;
                            prevClient.missedPongs = 0;
                            handshakeCompleted = true;
                            // Determine replay vs stale using the per-client delivery sequence.
                            // Retained buffers continue collecting events while the client is disconnected,
                            // but TTL eviction still applies during the reconnect window.
                            this.evictBuffer(prevClient);
                            const lastSeq = envelope.lastSeq;
                            const hasMissedEvents = lastSeq < prevClient.lastSentSeq;
                            const firstBufferedSeq = prevClient.eventBuffer[0]?.seq;
                            const canReplay = !hasMissedEvents
                                ? true
                                : firstBufferedSeq != null && lastSeq >= firstBufferedSeq - 1;
                            if (canReplay) {
                                const replayEvents = prevClient.eventBuffer.filter(e => e.seq > lastSeq);
                                const ack = {
                                    id: envelope.id,
                                    type: 'handshake_ack',
                                    protocolVersion: PROTOCOL_VERSION,
                                    serverVersion: this.serverVersion || undefined,
                                    clientId: prevClient.id,
                                    registeredChannels: [...this.handlers.keys()],
                                    reconnected: true,
                                };
                                this.safeSend(ws, serializeEnvelope(ack));
                                // Replay missed events in order
                                for (const event of replayEvents) {
                                    this.safeSend(ws, event.data);
                                }
                                transportLog.info('Client reconnected with replay', {
                                    clientId: prevClient.id,
                                    replayedCount: replayEvents.length,
                                    lastSeq,
                                });
                            }
                            else {
                                // Buffer evicted — client must full-refresh
                                const ack = {
                                    id: envelope.id,
                                    type: 'handshake_ack',
                                    protocolVersion: PROTOCOL_VERSION,
                                    serverVersion: this.serverVersion || undefined,
                                    clientId: prevClient.id,
                                    registeredChannels: [...this.handlers.keys()],
                                    reconnected: true,
                                    stale: true,
                                };
                                this.safeSend(ws, serializeEnvelope(ack));
                                transportLog.info('Client reconnected as stale', {
                                    clientId: prevClient.id,
                                    lastSeq,
                                    firstBufferedSeq,
                                    lastSentSeq: prevClient.lastSentSeq,
                                });
                            }
                            // Atomic state transition: move from disconnected → active
                            // AFTER replay is complete so push() can't target this client mid-replay.
                            this.disconnectedClients.delete(envelope.reconnectClientId);
                            this.clients.set(prevClient.id, prevClient);
                            this.setupClientHandlers(ws, prevClient);
                            this.onClientConnected?.({
                                clientId: prevClient.id,
                                webContentsId: prevClient.webContentsId,
                                workspaceId: prevClient.workspaceId,
                            });
                            return;
                        }
                        // Identity mismatch — fall through to fresh connect
                        transportLog.warn('Reconnect identity mismatch', {
                            reconnectClientId: envelope.reconnectClientId,
                        });
                    }
                    // reconnectClientId not found — fall through to fresh connect
                }
                // ── Normal fresh connect ──
                const clientId = randomUUID();
                const client = {
                    id: clientId,
                    ws,
                    workspaceId: envelope.workspaceId ?? null,
                    webContentsId: envelope.webContentsId ?? null,
                    capabilities: new Set(envelope.clientCapabilities ?? []),
                    missedPongs: 0,
                    alive: true,
                    eventBuffer: [],
                    lastAckedSeq: 0,
                    lastSentSeq: 0,
                };
                this.clients.set(clientId, client);
                handshakeCompleted = true;
                // Send handshake_ack
                const ack = {
                    id: envelope.id,
                    type: 'handshake_ack',
                    protocolVersion: PROTOCOL_VERSION,
                    serverVersion: this.serverVersion || undefined,
                    clientId,
                    registeredChannels: [...this.handlers.keys()],
                };
                this.safeSend(ws, serializeEnvelope(ack));
                // Notify lifecycle listener
                transportLog.info('Client connected', {
                    clientId,
                    webContentsId: client.webContentsId,
                    workspaceId: client.workspaceId,
                });
                this.onClientConnected?.({
                    clientId,
                    webContentsId: client.webContentsId,
                    workspaceId: client.workspaceId,
                });
                this.setupClientHandlers(ws, client);
                return;
            }
            // Post-handshake: find the client for this ws
            const client = this.findClientByWs(ws);
            if (!client) {
                ws.close(4006, 'Unknown client');
                return;
            }
            if (envelope.type === 'request') {
                await this.onRequest(client, envelope);
            }
            else if (envelope.type === 'response') {
                this.onClientResponse(envelope);
            }
            else if (envelope.type === 'sequence_ack') {
                const ackSeq = envelope.lastSeq;
                if (typeof ackSeq === 'number' && ackSeq > client.lastAckedSeq) {
                    client.lastAckedSeq = ackSeq;
                    // Evict acknowledged events
                    const buf = client.eventBuffer;
                    let removeCount = 0;
                    while (removeCount < buf.length && buf[removeCount].seq <= ackSeq) {
                        removeCount++;
                    }
                    if (removeCount > 0) {
                        buf.splice(0, removeCount);
                    }
                }
            }
        });
        ws.on('error', () => {
            // Connection errors are handled by the close event
        });
    }
    // -------------------------------------------------------------------------
    // Request dispatching
    // -------------------------------------------------------------------------
    /** Server-side timeout for RPC handler execution (ms). */
    static HANDLER_TIMEOUT_MS = 150_000;
    async onRequest(client, envelope) {
        const { channel, id, args } = envelope;
        if (!channel) {
            this.sendResponseError(client.ws, id, undefined, 'CHANNEL_NOT_FOUND', 'Missing channel');
            return;
        }
        const handler = this.handlers.get(channel);
        if (!handler) {
            this.sendResponseError(client.ws, id, channel, 'CHANNEL_NOT_FOUND', `No handler for: ${channel}`);
            return;
        }
        const ctx = {
            clientId: client.id,
            workspaceId: client.workspaceId,
            webContentsId: client.webContentsId,
        };
        try {
            const result = await Promise.race([
                handler(ctx, ...(args ?? [])),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`Handler timeout: ${channel} (${WsRpcServer.HANDLER_TIMEOUT_MS}ms)`)), WsRpcServer.HANDLER_TIMEOUT_MS)),
            ]);
            const response = {
                id,
                type: 'response',
                channel,
                result,
            };
            this.safeSend(client.ws, serializeEnvelope(response));
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const code = err?.code ?? 'HANDLER_ERROR';
            this.sendResponseError(client.ws, id, channel, code, message);
        }
    }
    // -------------------------------------------------------------------------
    // Heartbeat
    // -------------------------------------------------------------------------
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            for (const [, client] of this.clients) {
                // Skip sockets that are already closing/closed (e.g. terminated on a previous tick)
                if (client.ws.readyState !== client.ws.OPEN)
                    continue;
                if (!client.alive) {
                    client.missedPongs++;
                    if (client.missedPongs >= HEARTBEAT_MAX_MISSED) {
                        // Let the close handler (setupClientHandlers) handle all cleanup:
                        // clients.delete, buffer retention for reconnect, onClientDisconnected.
                        client.ws.terminate();
                        continue;
                    }
                }
                client.alive = false;
                client.ws.ping();
            }
        }, HEARTBEAT_INTERVAL_MS);
    }
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    /** Wire up close + pong handlers for a WebSocket ↔ ClientConnection pair. */
    setupClientHandlers(ws, client) {
        ws.on('close', () => {
            transportLog.info('Client disconnected', { clientId: client.id });
            this.clients.delete(client.id);
            // Retain buffer for potential reconnect
            const timer = setTimeout(() => {
                this.disconnectedClients.delete(client.id);
            }, DISCONNECTED_CLIENT_TTL_MS);
            this.disconnectedClients.set(client.id, { client, timer });
            // Cap disconnectedClients to prevent unbounded growth
            if (this.disconnectedClients.size > 50) {
                const oldestKey = this.disconnectedClients.keys().next().value;
                if (oldestKey) {
                    const oldest = this.disconnectedClients.get(oldestKey);
                    if (oldest)
                        clearTimeout(oldest.timer);
                    this.disconnectedClients.delete(oldestKey);
                }
            }
            this.rejectPendingInvokesForClient(client.id);
            this.onClientDisconnected?.(client.id);
        });
        ws.on('pong', () => {
            client.alive = true;
            client.missedPongs = 0;
        });
    }
    /** Assign a per-client seq, retain the event for replay, and optionally send it immediately. */
    bufferAndMaybeSendEvent(client, channel, args, timestamp, shouldSend) {
        client.lastSentSeq += 1;
        const seq = client.lastSentSeq;
        const envelope = {
            id: randomUUID(),
            type: 'event',
            channel,
            args,
            serverId: this.serverId,
            seq,
        };
        const data = serializeEnvelope(envelope);
        client.eventBuffer.push({ seq, data, timestamp });
        this.evictBuffer(client);
        if (shouldSend) {
            this.safeSend(client.ws, data);
        }
    }
    /** Evict stale/oversized entries from a client's event buffer via batch splice. */
    evictBuffer(client) {
        const buf = client.eventBuffer;
        if (buf.length === 0)
            return;
        const now = Date.now();
        let removeCount = 0;
        // Evict by TTL
        while (removeCount < buf.length &&
            now - buf[removeCount].timestamp > EVENT_BUFFER_TTL_MS) {
            removeCount++;
        }
        // Evict by size (keep at most EVENT_BUFFER_MAX_SIZE after TTL eviction)
        const remaining = buf.length - removeCount;
        if (remaining > EVENT_BUFFER_MAX_SIZE) {
            removeCount += remaining - EVENT_BUFFER_MAX_SIZE;
        }
        // Single splice instead of O(n) shift loop
        if (removeCount > 0) {
            buf.splice(0, removeCount);
        }
    }
    matchesTarget(client, target) {
        switch (target.to) {
            case 'all':
                return target.exclude ? client.id !== target.exclude : true;
            case 'workspace':
                if (target.exclude && client.id === target.exclude)
                    return false;
                return client.workspaceId === target.workspaceId;
            case 'client':
                return client.id === target.clientId;
            default:
                return false;
        }
    }
    /** Update a client's workspaceId (called after SWITCH_WORKSPACE so push routing stays correct). */
    updateClientWorkspace(clientId, workspaceId) {
        const client = this.clients.get(clientId);
        if (client) {
            client.workspaceId = workspaceId;
        }
    }
    findClientByWs(ws) {
        for (const client of this.clients.values()) {
            if (client.ws === ws)
                return client;
        }
        return undefined;
    }
    /** Handler/request errors — sent as type:'response' with error field. */
    sendResponseError(ws, id, channel, code, message) {
        const envelope = {
            id,
            type: 'response',
            channel,
            error: { code, message },
        };
        this.safeSend(ws, serializeEnvelope(envelope));
    }
    /** Protocol-level errors only (handshake rejection, version mismatch). May close connection. */
    sendError(ws, id, code, message) {
        const envelope = {
            id,
            type: 'error',
            error: { code, message },
        };
        this.safeSend(ws, serializeEnvelope(envelope));
    }
    onClientResponse(envelope) {
        const pending = this.pendingInvokes.get(envelope.id);
        if (!pending)
            return;
        this.pendingInvokes.delete(envelope.id);
        clearTimeout(pending.timeout);
        if (envelope.error) {
            const err = new Error(envelope.error.message);
            err.code = envelope.error.code;
            err.data = envelope.error.data;
            pending.reject(err);
        }
        else {
            pending.resolve(envelope.result);
        }
    }
    rejectPendingInvokesForClient(clientId) {
        for (const [id, pending] of this.pendingInvokes) {
            if (pending.clientId !== clientId)
                continue;
            clearTimeout(pending.timeout);
            const err = new Error(`Client disconnected: ${clientId}`);
            err.code = 'CLIENT_DISCONNECTED';
            pending.reject(err);
            this.pendingInvokes.delete(id);
        }
    }
    safeSend(ws, data) {
        if (ws.readyState === ws.OPEN) {
            ws.send(data);
        }
    }
}
//# sourceMappingURL=server.js.map