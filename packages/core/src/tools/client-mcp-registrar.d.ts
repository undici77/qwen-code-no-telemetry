/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * ClientMcpRegistrar - reverse tool channel for daemon-direct MCP servers
 * (issue #5626, Phase 2).
 *
 * A connected daemon client (e.g. the Chrome extension) cannot be a listening
 * MCP server, but it CAN host MCP tools that the daemon's agent reaches by
 * carrying `mcp_message` JSON-RPC frames over the client transport (the daemon
 * WS). This registrar reuses the SDK-MCP-server control-plane pattern
 * (`SdkControlClientTransport` + `sendSdkMcpMessage`) WITHOUT binding to the
 * SDK subprocess `Query` control plane.
 *
 * The registrar is transport-agnostic: it owns the per-server pending-request
 * correlation map and produces a `sendSdkMcpMessage(serverName, jsonrpc)`
 * callback. The caller wires `sendFrame` to push an `mcp_message` frame down
 * the actual wire (the daemon WS) and calls `resolveMessage` when the matching
 * response frame arrives. This keeps the wire format (WS vs. anything else) out
 * of core, while the `id`-correlation + timeout + teardown semantics live in
 * one tested place.
 *
 * Data flow (mirrors `docs/05-daemon-direct-architecture.md`):
 *   agent MCP client → SdkControlClientTransport.send
 *     → sendSdkMcpMessage('chrome-tools', jsonrpc)   (this registrar)
 *     → sendFrame({ id, server, payload: jsonrpc })  (caller: WS frame down)
 *     → client: MCP Server.handleMessage → tool executor
 *     → client: response frame { id, server, payload: jsonrpc-result }
 *     → resolveMessage(id, payload)                  (caller)
 *     → resolve the pending sendSdkMcpMessage promise → agent gets the result
 */
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
/** Default ceiling on a single in-flight `mcp_message` round-trip. */
export declare const CLIENT_MCP_MESSAGE_TIMEOUT_MS = 30000;
/**
 * The frame the registrar asks the caller to put on the wire. The caller is
 * responsible for serializing this into a `{ type: 'mcp_message', ... }` WS
 * frame (the `type` discriminator is owned by the WS layer, not core).
 */
export interface ClientMcpFrame {
    /** Correlation id; the response frame MUST echo it back. */
    id: string;
    /** Logical MCP server name the client advertised via `mcp_register`. */
    server: string;
    /** The raw JSON-RPC MCP message to deliver to the client-hosted server. */
    payload: JSONRPCMessage;
}
/**
 * Caller-supplied sink that puts an outbound frame on the wire. Throwing (or
 * a rejected promise) fails the originating `sendSdkMcpMessage` call so the
 * agent's MCP client sees a transport error rather than hanging.
 */
export type ClientMcpFrameSink = (frame: ClientMcpFrame) => void | Promise<void>;
export interface ClientMcpRegistrarOptions {
    /** Puts an outbound `mcp_message` frame on the wire. */
    sendFrame: ClientMcpFrameSink;
    /** Per-message round-trip timeout. Defaults to {@link CLIENT_MCP_MESSAGE_TIMEOUT_MS}. */
    messageTimeoutMs?: number;
}
/**
 * Owns the request/response correlation for one wire (one daemon WS client).
 * A single registrar can host several named MCP servers from the same client
 * — `sendSdkMcpMessage` routes by `serverName`, and teardown is per-server or
 * wholesale (on WS close).
 */
export declare class ClientMcpRegistrar {
    private readonly sendFrame;
    private readonly messageTimeoutMs;
    /** Pending in-flight requests, keyed by correlation id. */
    private readonly pending;
    /** Registered server names (advertised via `mcp_register`). */
    private readonly servers;
    private nextId;
    private closed;
    constructor(options: ClientMcpRegistrarOptions);
    /**
     * Mark a server name as advertised by this client. Idempotent.
     */
    registerServer(serverName: string): void;
    /**
     * Drop a server name and reject any in-flight requests targeting it. Returns
     * `true` if the name was registered. Idempotent for unknown names.
     */
    unregisterServer(serverName: string): boolean;
    /** True if the server name has been advertised and not torn down. */
    hasServer(serverName: string): boolean;
    /** Snapshot of currently-registered server names. */
    registeredServers(): string[];
    /** Count of currently-registered server names (for per-connection caps). */
    serverCount(): number;
    /** Count of in-flight `mcp_message` round-trips (for tests / accounting). */
    pendingCount(): number;
    /**
     * The `SendSdkMcpMessage`-shaped callback to hand to `McpClientManager`
     * (via `addRuntimeMcpServer` with an `isSdkMcpServerConfig`-true config).
     *
     * Sends the JSON-RPC message as an outbound frame and resolves when the
     * client returns the correlated response frame.
     */
    readonly sendSdkMcpMessage: (serverName: string, message: JSONRPCMessage) => Promise<JSONRPCMessage>;
    /**
     * Deliver a response frame from the client. Resolves the matching pending
     * request. Unknown ids are ignored (late response after timeout, or a
     * client→daemon-initiated request the daemon doesn't track — see the
     * architecture note: server→client requests are rare and out of MVP scope).
     *
     * Returns `true` if a pending request was resolved.
     */
    resolveMessage(id: string, payload: JSONRPCMessage): boolean;
    /**
     * Tear the whole channel down (WS close). Rejects every pending request and
     * forgets all server names. Idempotent.
     */
    close(reason?: string): void;
    private failPending;
    private rejectPendingFor;
}
