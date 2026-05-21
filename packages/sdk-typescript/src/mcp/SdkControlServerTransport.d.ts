/**
 * SdkControlServerTransport - bridges MCP Server with Query's control plane
 *
 * Implements @modelcontextprotocol/sdk Transport interface to enable
 * SDK-embedded MCP servers. Messages flow bidirectionally:
 *
 * MCP Server → send() → Query → control_request (mcp_message) → CLI
 * CLI → control_request (mcp_message) → Query → handleMessage() → MCP Server
 */
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
export type SendToQueryCallback = (message: JSONRPCMessage) => Promise<void>;
export interface SdkControlServerTransportOptions {
    sendToQuery: SendToQueryCallback;
    serverName: string;
}
export declare class SdkControlServerTransport {
    sendToQuery: SendToQueryCallback;
    private serverName;
    private started;
    private logger;
    onmessage?: (message: JSONRPCMessage) => void;
    onerror?: (error: Error) => void;
    onclose?: () => void;
    constructor(options: SdkControlServerTransportOptions);
    start(): Promise<void>;
    send(message: JSONRPCMessage): Promise<void>;
    close(): Promise<void>;
    handleMessage(message: JSONRPCMessage): void;
    handleError(error: Error): void;
    isStarted(): boolean;
    getServerName(): string;
}
