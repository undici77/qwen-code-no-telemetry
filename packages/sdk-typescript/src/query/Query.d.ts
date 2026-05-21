/**
 * Query class - Main orchestrator for SDK
 *
 * Manages SDK workflow, routes messages, and handles lifecycle.
 * Implements AsyncIterator protocol for message consumption.
 */
import type { SDKMessage, SDKUserMessage } from '../types/protocol.js';
import type { Transport } from '../transport/Transport.js';
import type { QueryOptions } from '../types/types.js';
export declare class Query implements AsyncIterable<SDKMessage> {
    private transport;
    private options;
    private sessionId;
    private inputStream;
    private sdkMessages;
    private abortController;
    private pendingControlRequests;
    private pendingMcpResponses;
    private sdkMcpTransports;
    private sdkMcpServers;
    readonly initialized: Promise<void>;
    private closed;
    private messageRouterStarted;
    private firstResultReceivedPromise?;
    private firstResultReceivedResolve?;
    private readonly isSingleTurn;
    private abortHandler;
    constructor(transport: Transport, options: QueryOptions, singleTurn?: boolean);
    private initializeSdkMcpServers;
    /**
     * Handle response messages from SDK MCP servers
     *
     * When an MCP server sends a response via transport.send(), this callback
     * routes it back to the pending request that's waiting for it.
     */
    private handleMcpServerResponse;
    /**
     * Get SDK MCP servers config for CLI initialization
     *
     * Only SDK servers are sent in the initialize request.
     */
    private getSdkMcpServersForCli;
    /**
     * Get external MCP servers (non-SDK) that should be managed by the CLI
     */
    private getMcpServersForCli;
    private initialize;
    private startMessageRouter;
    private routeMessage;
    private handleControlRequest;
    private handlePermissionRequest;
    private handleMcpMessage;
    private handleMcpRequest;
    private handleControlResponse;
    private handleControlCancelRequest;
    private sendControlRequest;
    private sendControlResponse;
    close(): Promise<void>;
    private readSdkMessages;
    next(...args: [] | [unknown]): Promise<IteratorResult<SDKMessage>>;
    return(value?: unknown): Promise<IteratorResult<SDKMessage>>;
    throw(e?: unknown): Promise<IteratorResult<SDKMessage>>;
    [Symbol.asyncIterator](): AsyncIterator<SDKMessage>;
    streamInput(messages: AsyncIterable<SDKUserMessage>): Promise<void>;
    endInput(): void;
    interrupt(): Promise<void>;
    setPermissionMode(mode: string): Promise<void>;
    setModel(model: string): Promise<void>;
    /**
     * Get context usage breakdown from the CLI
     *
     * @param showDetails Display hint for per-item breakdowns (data is always complete)
     * @returns Promise resolving to context usage data
     * @throws Error if query is closed
     */
    getContextUsage(showDetails?: boolean): Promise<Record<string, unknown> | null>;
    /**
     * Get list of control commands supported by the CLI
     *
     * @returns Promise resolving to list of supported command names
     * @throws Error if query is closed
     */
    supportedCommands(): Promise<Record<string, unknown> | null>;
    /**
     * Get the status of MCP servers
     *
     * @returns Promise resolving to MCP server status information
     * @throws Error if query is closed
     */
    mcpServerStatus(): Promise<Record<string, unknown> | null>;
    getSessionId(): string;
    isClosed(): boolean;
}
