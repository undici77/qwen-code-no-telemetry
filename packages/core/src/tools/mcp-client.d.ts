/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { GetPromptResult, JSONRPCMessage, Prompt, ReadResourceResult, Resource } from '@modelcontextprotocol/sdk/types.js';
import type { Config, MCPServerConfig } from '../config/config.js';
import { DiscoveredMCPTool } from './mcp-tool.js';
import { MCPServerStatus } from './mcp-status.js';
export { addMCPStatusChangeListener, getAllMCPServerStatuses, getMCPServerStatus, MCPServerStatus, removeMCPServerStatus, removeMCPStatusChangeListener, updateMCPServerStatus, } from './mcp-status.js';
import type { FunctionDeclaration } from '@google/genai';
import type { PromptRegistry } from '../prompts/prompt-registry.js';
import type { ResourceRegistry } from '../resources/resource-registry.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { ToolRegistry } from './tool-registry.js';
/**
 * Callback type for sending MCP messages to SDK servers via control plane
 */
export type SendSdkMcpMessage = (serverName: string, message: JSONRPCMessage) => Promise<JSONRPCMessage>;
export declare const MCP_DEFAULT_TIMEOUT_MSEC: number;
export declare function getMcpOAuthDialogInstruction(action: 'authenticate' | 're-authenticate', mcpServerName: string): string;
/**
 * Wraps fetch to preserve OAuth challenges before the SDK discards response
 * metadata and to normalize Spring AI-style 400 responses to the SDK's
 * unsupported sentinel for the optional Streamable HTTP GET SSE request.
 *
 * SDK coupling: `StreamableHTTPClientTransport._startOrAuthSse()` treats a
 * 405 response as "GET SSE unsupported" and continues in POST-only mode.
 * If the SDK changes that non-OK handling, update this wrapper in lockstep.
 */
export declare function createStreamableHttpCompatibilityFetch(mcpServerName: string, fetchFn?: typeof fetch, mcpServerConfig?: MCPServerConfig): typeof fetch;
export declare function _setMcpFetchForTest(fn?: typeof fetch): void;
export declare function _resetMcpFetchDispatcherForTest(): void;
export type DiscoveredMCPPrompt = Prompt & {
    serverName: string;
    invoke: (params: Record<string, unknown>) => Promise<GetPromptResult>;
};
/**
 * A resource advertised by an MCP server (`resources/list`), tagged with
 * the originating server so the read path (`readMcpResource`) and the
 * `/mcp` view can address it by `(serverName, uri)`. Unlike prompts,
 * resources carry no bound `invoke` closure — they are read on demand by
 * URI via `ToolRegistry.readMcpResource`.
 */
export type DiscoveredMCPResource = Resource & {
    serverName: string;
};
/**
 * Enum representing the overall MCP discovery state
 */
export declare enum MCPDiscoveryState {
    /** Discovery has not started yet */
    NOT_STARTED = "not_started",
    /** Discovery is currently in progress */
    IN_PROGRESS = "in_progress",
    /** Discovery has completed (with or without errors) */
    COMPLETED = "completed"
}
/**
 * A client for a single MCP server.
 *
 * This class is responsible for connecting to, discovering tools from, and
 * managing the state of a single MCP server.
 */
export declare class McpClient {
    private readonly serverName;
    private readonly serverConfig;
    private readonly toolRegistry;
    private readonly promptRegistry;
    private readonly workspaceContext;
    private readonly debugMode;
    private readonly sendSdkMcpMessage?;
    private client;
    private transport;
    private status;
    private isDisconnecting;
    /**
     * captures the most recent error
     * delivered to the SDK Client's `onerror` callback. The pool entry's
     *  silent-drop block (the DISCONNECTED-on-active branch inside
     * `PoolEntry.statusChangeListener`) reads this via
     * `getLastTransportError()` to thread the upstream cause (EPIPE,
     * OAuth 401, server crash) into the `'failed'` event's `lastError`
     * string instead of emitting only the synthetic
     * `'transport disconnected (silent transport drop)'` marker. Reset
     * at the top of `connect()` so a successful reconnect clears stale
     * state. No reset on `disconnect()` — McpClient instances are GC'd
     * at pool entry teardown; field staleness has no observable
     * consumer post-disconnect.
     */
    private lastTransportError?;
    private instructions;
    constructor(serverName: string, serverConfig: MCPServerConfig, toolRegistry: ToolRegistry, promptRegistry: PromptRegistry, workspaceContext: WorkspaceContext, debugMode: boolean, sendSdkMcpMessage?: SendSdkMcpMessage | undefined);
    /**
     * Connects to the MCP server.
     */
    connect(): Promise<void>;
    /**
     * Discovers tools and prompts from the MCP server.
     *
     * On error, the client's status is flipped to DISCONNECTED before the
     * error is re-thrown. Without this, a server that connects successfully
     * but then crashes (or returns no tools, or whose `tools/list` call
     * rejects) would remain `CONNECTED` in the global status registry, and
     * `Config.getFailedMcpServerNames()` — which filters by
     * `status !== CONNECTED` — would silently omit it from the
     * non-interactive failure banner. The caller (manager) still catches
     * and logs; we just need the status registry to reflect reality.
     */
    discover(cliConfig: Config): Promise<void>;
    /**
     * Pure discovery — returns tools and prompts WITHOUT registering them.
     *
     * pool path: a single shared `McpClient` produces this
     * snapshot once; per-session `SessionMcpView` instances each
     * register a filtered/decorated copy into their own registries.
     *
     * Behavior mirrors `discover()` for error handling: status flips to
     * DISCONNECTED on any failure (so the global status registry +
     * `getFailedMcpServerNames()` reflect reality), then re-throws.
     *
     * Returns the same combined "no prompts or tools" error that `discover()`
     * raised previously, so callers that distinguish "server up but empty" from
     * "server down" still get the right signal.
     *
     * @param opts.applyConfigFilters Whether to apply `includeTools` /
     *   `excludeTools` filtering and set the `trust` field on returned
     *   tools at discovery time. Defaults to `true` (legacy `discover()`
     *   semantics). Pool callers pass `false` because per-session
     *   `SessionMcpView.applyTools` is the authoritative filter
     *   (otherwise pool-mode trust + filtering would apply twice
     *   inconsistently across sessions).
     */
    discoverAndReturn(cliConfig: Config, opts?: {
        applyConfigFilters?: boolean;
    }): Promise<{
        tools: DiscoveredMCPTool[];
        prompts: DiscoveredMCPPrompt[];
        resources: DiscoveredMCPResource[];
    }>;
    /**
     * Disconnects from the MCP server.
     *
     * The intentional DISCONNECTED status update must reach the global
     * registry — `getFailedMcpServerNames()` filters on `status !== CONNECTED`
     * and the Footer's MCP health pill subscribes to the registry. Going
     * through `updateStatus()` would have it swallowed by the
     * `isDisconnecting` guard whose only purpose is to suppress LATE writes
     * from a stale `connect()` catch. We therefore write the local field and
     * the global registry directly, then flip `isDisconnecting = true` to
     * shut down propagation from any in-flight `connect()` / `discover()`
     * whose catch will fire after the transport has been torn down.
     */
    disconnect(): Promise<void>;
    /**
     * Returns the current status of the client.
     */
    getStatus(): MCPServerStatus;
    /**
     * The OS pid of the spawned MCP child process, if this is a stdio
     * transport and the child is currently alive. Returns `undefined`
     * for remote transports (sse / http / websocket) and for stdio
     * transports that have not yet connected or have already exited.
     *
     * `PoolEntry.forceShutdown` reads this to enumerate
     * descendant pids (via `listDescendantPids`) before calling
     * `client.disconnect()`, so wrapper processes like
     * `npx @modelcontextprotocol/server-X` and `uvx ...` don't leak.
     */
    getTransportPid(): number | undefined;
    /**
     * expose the most recent SDK Client
     * `onerror` payload so PoolEntry's silent-drop block can thread
     * the upstream cause (EPIPE, OAuth 401, server-side crash) into the
     * `'failed'` event's `lastError` string. Returns `undefined` if no
     * error has been observed since the last `connect()`. Caller falls
     * back to the synthetic marker on `undefined`. Population site: the
     * `client.onerror` arrow inside `connect()` (this file). Consumer:
     * the silent-drop block inside `PoolEntry.statusChangeListener`.
     */
    getLastTransportError(): Error | undefined;
    getInstructions(): string | undefined;
    clearOAuthState(): void;
    readResource(uri: string, options?: {
        signal?: AbortSignal;
    }): Promise<ReadResourceResult>;
    private updateStatus;
    private createTransport;
}
/**
 * Map to track which MCP servers have been discovered to require OAuth
 */
export declare const mcpServerRequiresOAuth: Map<string, boolean>;
/**
 * Get the current MCP discovery state
 */
export declare function getMCPDiscoveryState(): MCPDiscoveryState;
/**
 * expose a setter so
 * `McpClientManager.discoverAllMcpToolsViaPool` can update the
 * module-global `mcpDiscoveryState`. Pre-fix the pool path only
 * updated the manager-local state, leaving the global at
 * `NOT_STARTED` while pool discovery was running or already
 * complete — `GET /workspace/mcp` and the MCP preflight cell read
 * the global and reported `not_started` for a workspace whose
 * discovery had finished. Per-session managers don't have the
 * concept of "ALL workspace discovery complete" anymore in pool
 * mode, so the pool path becomes the canonical writer when active.
 */
export declare function setMCPDiscoveryState(state: MCPDiscoveryState): void;
export declare function probeMcpServerForOAuth(mcpServerName: string, mcpServerConfig: MCPServerConfig, error?: unknown): Promise<boolean>;
export declare function attemptAutomaticMcpOAuth(mcpServerName: string, mcpServerConfig: MCPServerConfig, allowBrowserLaunch: boolean): Promise<boolean>;
/**
 * Discovers tools from all configured MCP servers and registers them with the tool registry.
 * It orchestrates the connection and discovery process for each server defined in the
 * configuration, as well as any server specified via a command-line argument.
 *
 * @param mcpServers A record of named MCP server configurations.
 * @param mcpServerCommand An optional command string for a dynamically specified MCP server.
 * @param toolRegistry The central registry where discovered tools will be registered.
 * @returns A promise that resolves when the discovery process has been attempted for all servers.
 */
export declare function discoverMcpTools(mcpServers: Record<string, MCPServerConfig>, mcpServerCommand: string | undefined, toolRegistry: ToolRegistry, promptRegistry: PromptRegistry, debugMode: boolean, workspaceContext: WorkspaceContext, cliConfig: Config): Promise<void>;
/** Visible for Testing */
export declare function populateMcpServerCommand(mcpServers: Record<string, MCPServerConfig>, mcpServerCommand: string | undefined, cwd?: string): Record<string, MCPServerConfig>;
/**
 * Connects to an MCP server and discovers available tools, registering them with the tool registry.
 * This function handles the complete lifecycle of connecting to a server, discovering tools,
 * and cleaning up resources if no tools are found.
 *
 * @param mcpServerName The name identifier for this MCP server
 * @param mcpServerConfig Configuration object containing connection details
 * @param toolRegistry The registry to register discovered tools with
 * @param sendSdkMcpMessage Optional callback for SDK MCP servers to route messages via control plane.
 * @returns Promise that resolves when discovery is complete
 */
export declare function connectAndDiscover(mcpServerName: string, mcpServerConfig: MCPServerConfig, toolRegistry: ToolRegistry, promptRegistry: PromptRegistry, debugMode: boolean, workspaceContext: WorkspaceContext, cliConfig: Config, sendSdkMcpMessage?: SendSdkMcpMessage): Promise<void>;
/**
 * Discovers and sanitizes tools from a connected MCP client.
 * It retrieves function declarations from the client, filters out disabled tools,
 * generates valid names for them, and wraps them in `DiscoveredMCPTool` instances.
 *
 * @param mcpServerName The name of the MCP server.
 * @param mcpServerConfig The configuration for the MCP server.
 * @param mcpClient The active MCP client instance.
 * @returns A promise that resolves to an array of discovered and enabled tools.
 * @throws An error if no enabled tools are found or if the server provides invalid function declarations.
 */
export declare function discoverTools(mcpServerName: string, mcpServerConfig: MCPServerConfig, mcpClient: Client, cliConfig: Config, opts?: {
    applyConfigFilters?: boolean;
}): Promise<DiscoveredMCPTool[]>;
/**
 * Pure prompt listing. Asks the MCP server for its prompts and returns
 * enriched `DiscoveredMCPPrompt[]` (with `serverName` + bound `invoke`)
 * WITHOUT registering them anywhere. pool uses this so a single
 * shared transport can produce the snapshot once and let each session's
 * `SessionMcpView` register into its own registry.
 *
 * Returns `[]` on protocol errors or when the server has no prompts —
 * matches `discoverPrompts` swallow-and-continue behavior.
 *
 * We deliberately do NOT gate on `getServerCapabilities()?.prompts`. A
 * non-trivial number of real MCP servers implement `prompts/list` but
 * under-declare (or omit) the `prompts` capability in their `initialize`
 * response; gating on the declared capability made those servers' prompts
 * silently invisible in qwen-code (no `/`-menu entry) while lenient
 * clients still surfaced them. The underlying `mcpClient.request` is the
 * raw `Protocol.request` (the SDK only asserts capabilities for its typed
 * `listPrompts()` helper, which we don't use), so attempting the call is
 * safe: a server that truly lacks prompts answers `-32601 Method not
 * found`, which the catch below swallows silently.
 */
export declare function listMcpPrompts(mcpServerName: string, mcpClient: Client): Promise<DiscoveredMCPPrompt[]>;
/**
 * Discovers prompts AND registers them into the supplied PromptRegistry.
 * Thin wrapper over `listMcpPrompts` that preserves the historical
 * `Promise<Prompt[]>` signature (used by `connectAndDiscover`, standalone
 * qwen, and existing tests). New code should prefer `listMcpPrompts`
 * for testability.
 *
 * @param mcpServerName The name of the MCP server.
 * @param mcpClient The active MCP client instance.
 * @param promptRegistry The registry to register discovered prompts into.
 */
export declare function discoverPrompts(mcpServerName: string, mcpClient: Client, promptRegistry: PromptRegistry): Promise<Prompt[]>;
/**
 * Invokes a prompt on a connected MCP client.
 *
 * @param mcpServerName The name of the MCP server.
 * @param mcpClient The active MCP client instance.
 * @param promptName The name of the prompt to invoke.
 * @param promptParams The parameters to pass to the prompt.
 * @returns A promise that resolves to the result of the prompt invocation.
 */
export declare function invokeMcpPrompt(mcpServerName: string, mcpClient: Client, promptName: string, promptParams: Record<string, unknown>): Promise<GetPromptResult>;
/**
 * Lists resources advertised by an MCP server (`resources/list`) WITHOUT
 * registering them anywhere — the pool uses this so a single shared
 * transport can produce the snapshot once and let each session register
 * into its own registry. Mirrors `listMcpPrompts`.
 *
 * As with prompts, we do NOT gate on `getServerCapabilities()?.resources`:
 * some servers expose resources but under-declare the capability, and the
 * raw `mcpClient.request` does not assert capabilities. A server with no
 * resources answers `-32601 Method not found`, swallowed below.
 *
 * Note: cursor pagination is not followed (matching `listMcpPrompts`);
 * only the first page of resources is returned. Servers that paginate
 * their resource list would have later pages omitted — acceptable parity
 * with the prompt path and rare in practice.
 */
export declare function listMcpResources(mcpServerName: string, mcpClient: Client): Promise<DiscoveredMCPResource[]>;
/**
 * Discovers resources AND registers them into the supplied
 * `ResourceRegistry`. Thin wrapper over `listMcpResources`, mirroring
 * `discoverPrompts`.
 *
 * @param mcpServerName The name of the MCP server.
 * @param mcpClient The active MCP client instance.
 * @param resourceRegistry The registry to register discovered resources into.
 */
export declare function discoverResources(mcpServerName: string, mcpClient: Client, resourceRegistry: ResourceRegistry): Promise<DiscoveredMCPResource[]>;
/**
 * @visiblefortesting
 * Checks if the MCP server configuration has a network transport URL (SSE or HTTP).
 * @param config The MCP server configuration.
 * @returns True if a `url` or `httpUrl` is present, false otherwise.
 */
export declare function hasNetworkTransport(config: MCPServerConfig): boolean;
/**
 * Creates and connects an MCP client to a server based on the provided configuration.
 * It determines the appropriate transport (Stdio, SSE, or Streamable HTTP) and
 * establishes a connection. It also applies a patch to handle request timeouts.
 *
 * @param mcpServerName The name of the MCP server, used for logging and identification.
 * @param mcpServerConfig The configuration specifying how to connect to the server.
 * @param sendSdkMcpMessage Optional callback for SDK MCP servers to route messages via control plane.
 * @returns A promise that resolves to a connected MCP `Client` instance.
 * @throws An error if the connection fails or the configuration is invalid.
 */
export declare function connectToMcpServer(mcpServerName: string, mcpServerConfig: MCPServerConfig, debugMode: boolean, workspaceContext: WorkspaceContext, sendSdkMcpMessage?: SendSdkMcpMessage): Promise<Client>;
/** Visible for Testing */
export declare function createTransport(mcpServerName: string, mcpServerConfig: MCPServerConfig, debugMode: boolean, sendSdkMcpMessage?: SendSdkMcpMessage): Promise<Transport>;
/** Visible for testing */
export declare function isEnabled(funcDecl: FunctionDeclaration, mcpServerName: string, mcpServerConfig: MCPServerConfig): boolean;
