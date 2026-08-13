/**
 * Query class - Main orchestrator for SDK
 *
 * Manages SDK workflow, routes messages, and handles lifecycle.
 * Implements AsyncIterator protocol for message consumption.
 */
import type { SDKMessage, SDKUserMessage } from '../types/protocol.js';
import type { Transport } from '../transport/Transport.js';
import type { QueryOptions, EffortStatus, EffortTier } from '../types/types.js';
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
    private initialEffortStatus;
    private closed;
    private messageRouterStarted;
    private transportReadFinalized;
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
    private finishTransportRead;
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
    /**
     * Continue the most recent unfinished turn without appending a synthetic user
     * message. Output arrives as regular messages on this Query's async iterator.
     */
    continueLastTurn(): Promise<Record<string, unknown> | null>;
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
     * Set the reasoning effort tier at runtime.
     *
     * @param effort - One of 'low', 'medium', 'high', 'xhigh', 'max'
     * @returns `true` when the tier is active. Use {@link setEffortStatus} to
     * distinguish disabled thinking from a higher-priority wire override.
     */
    setEffort(effort: EffortTier): Promise<boolean>;
    /** Set the reasoning effort and return the effective wire status. */
    setEffortStatus(effort: EffortTier): Promise<EffortStatus>;
    /** Return the server-reported status for the initial effort request. */
    getInitialEffortStatus(): EffortStatus | undefined;
    /**
     * Get the list of models available for the current auth type.
     *
     * @returns Promise resolving to available models data
     * @throws Error if query is closed
     */
    getAvailableModels(): Promise<Record<string, unknown> | null>;
    /**
     * Get usage dashboard data from the CLI.
     *
     * @param range - Time range for usage data: 'today' (default), 'week', 'month', 'all'
     * @returns Promise resolving to usage dashboard data
     * @throws Error if query is closed
     */
    getUsageInfo(range?: 'today' | 'week' | 'month' | 'all'): Promise<Record<string, unknown> | null>;
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
