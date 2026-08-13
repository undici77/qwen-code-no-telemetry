/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
/** WS frame discriminators owned by this module. */
export declare const CLIENT_MCP_FRAME_TYPES: {
    readonly register: "mcp_register";
    readonly message: "mcp_message";
    readonly unregister: "mcp_unregister";
};
/** Inbound `mcp_register` frame from a client. */
export interface McpRegisterFrame {
    type: 'mcp_register';
    /** Logical server name; tools are discovered via the MCP handshake. */
    server: string;
}
/** Bidirectional `mcp_message` frame (request/response correlated by `id`). */
export interface McpMessageFrame {
    type: 'mcp_message';
    id: string;
    server: string;
    payload: JSONRPCMessage;
}
/** Inbound `mcp_unregister` frame from a client. */
export interface McpUnregisterFrame {
    type: 'mcp_unregister';
    server: string;
}
/**
 * Injection point for the deep wiring into the agent's live MCP stack. An
 * implementation registers an SDK-type runtime MCP server whose discovery /
 * tool calls route through `sendSdkMcpMessage`, and tears it down on
 * unregister / WS close.
 */
export interface ClientMcpServerProvider {
    /**
     * Register a client-hosted MCP server. `sendSdkMcpMessage` is the callback
     * the agent's `SdkControlClientTransport` invokes; it MUST route to this
     * connection's WS. Resolves once the server is registered + discovered.
     */
    registerClientMcpServer(serverName: string, sendSdkMcpMessage: (serverName: string, message: JSONRPCMessage) => Promise<JSONRPCMessage>): Promise<{
        toolCount: number;
    }>;
    /** Remove a previously-registered client-hosted MCP server. Idempotent. */
    unregisterClientMcpServer(serverName: string): Promise<void>;
}
/** A minimal sink for pushing frames down the owning WS. */
export type WsFrameSender = (frame: McpMessageFrame) => void;
/** Outcome of handling one inbound client-MCP frame (for the WS reply). */
export type ClientMcpHandleResult = {
    kind: 'registered';
    server: string;
    toolCount: number;
} | {
    kind: 'unregistered';
    server: string;
} | {
    kind: 'message_resolved';
    id: string;
} | {
    kind: 'ignored';
    reason: string;
} | {
    kind: 'error';
    code: string;
    message: string;
};
/**
 * Per-WS-connection holder for client-hosted MCP servers. One instance per
 * connection; disposed on WS close.
 */
export declare class ClientMcpWsConnection {
    private readonly sendFrame;
    private readonly provider;
    private readonly registrar;
    private disposed;
    constructor(sendFrame: WsFrameSender, provider: ClientMcpServerProvider | undefined);
    /**
     * Route a parsed inbound frame. Returns a structured result the WS layer can
     * turn into an ack/error reply (or ignore). Never throws — protocol errors
     * are returned as `{ kind: 'error' }`.
     */
    handleFrame(frame: {
        type?: unknown;
        server?: unknown;
        id?: unknown;
        payload?: unknown;
    }): Promise<ClientMcpHandleResult>;
    /** Whether a frame's `type` is one this module owns. */
    static isClientMcpFrameType(type: unknown): boolean;
    private handleRegister;
    private handleUnregister;
    private handleMessage;
    /** Currently-registered server names on this connection. */
    registeredServers(): string[];
    /** In-flight `mcp_message` round-trip count (for tests / accounting). */
    pendingCount(): number;
    /**
     * Tear the connection down: reject pending, forget servers, and best-effort
     * remove each from the provider. Idempotent.
     */
    dispose(reason?: string): Promise<void>;
}
