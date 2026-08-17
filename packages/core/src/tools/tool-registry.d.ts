/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FunctionDeclaration } from '@google/genai';
import type {
  AnyDeclarativeTool,
  ToolResult,
  ToolInvocation,
} from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import { type Config } from '../config/config.js';
import type { SendSdkMcpMessage } from './mcp-client.js';
import { McpClientManager } from './mcp-client-manager.js';
import type { EventEmitter } from 'node:events';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
type ToolParams = Record<string, unknown>;
/** Factory function for lazy tool instantiation via dynamic import. */
export type ToolFactory = () => Promise<AnyDeclarativeTool>;
export interface DeferredToolSummary {
  name: string;
  description: string;
  serverName?: string;
}
export declare class DiscoveredTool extends BaseDeclarativeTool<
  ToolParams,
  ToolResult
> {
  private readonly config;
  readonly description: string;
  readonly parameterSchema: Record<string, unknown>;
  constructor(
    config: Config,
    name: string,
    description: string,
    parameterSchema: Record<string, unknown>,
  );
  protected createInvocation(
    params: ToolParams,
  ): ToolInvocation<ToolParams, ToolResult>;
}
export declare class ToolRegistry {
  private tools;
  private factories;
  private inflight;
  private revealedDeferred;
  private config;
  private mcpClientManager;
  constructor(
    config: Config,
    eventEmitter?: EventEmitter,
    sendSdkMcpMessage?: SendSdkMcpMessage,
  );
  private static compareToolsByDeclarationName;
  /**
   * Returns true when `name` is in the Config's `disabledTools` set, in
   * which case `registerTool` / `registerFactory` will skip it. This is
   * the chokepoint for the daemon mutation route at `POST /workspace/
   * tools/:name/enable {enabled:false}`; both
   * built-ins and MCP-discovered tools flow through `registerTool`, so
   * gating here covers every registration path.
   */
  private isToolDisabled;
  /**
   * Registers a tool definition.
   * @param tool - The tool object containing schema and execution logic.
   */
  registerTool(tool: AnyDeclarativeTool): void;
  /**
   * Registers a lazy tool factory. The tool module is not imported and the tool
   * is not instantiated until {@link ensureTool} or {@link warmAll} is called.
   */
  registerFactory(name: string, factory: ToolFactory): void;
  /**
   * Ensures a specific tool is loaded. Returns the cached instance if already
   * loaded, otherwise invokes the factory, caches the result, and returns it.
   * Concurrent calls for the same name share a single in-flight promise so the
   * factory is never executed more than once.
   */
  ensureTool(name: string): Promise<AnyDeclarativeTool | undefined>;
  /**
   * Loads all pending tool factories in parallel. Safe to call multiple times
   * (no-op when all factories have been resolved). Call this before any bulk
   * access such as {@link getAllTools} or {@link getFunctionDeclarations}.
   *
   * @param options.strict - When `true`, re-throws the first factory failure
   *   instead of swallowing it. Use this during startup (e.g. in
   *   `Config.initialize`) so a broken built-in tool surfaces immediately
   *   rather than leaving the session partially initialised.
   */
  warmAll(options?: { strict?: boolean }): Promise<void>;
  /**
   * Copies discovered (non-core) tools from another registry into this one.
   * Used to share MCP/command-discovered tools with per-agent registries
   * that were built with skipDiscovery.
   */
  copyDiscoveredToolsFrom(source: ToolRegistry): void;
  private removeDiscoveredTools;
  /**
   * Removes all tools from a specific MCP server.
   * @param serverName The name of the server to remove tools from.
   */
  removeMcpToolsByServer(serverName: string): void;
  /**
   * Disconnects an MCP server by removing its tools, prompts, and disconnecting the client.
   * Unlike disableMcpServer, this does NOT add the server to the exclusion list.
   * @param serverName The name of the server to disconnect.
   */
  disconnectServer(serverName: string): Promise<void>;
  /**
   * Disables an MCP server by removing its tools, prompts, and disconnecting the client.
   * Also updates the config's exclusion list.
   * @param serverName The name of the server to disable.
   */
  disableMcpServer(serverName: string): Promise<void>;
  /**
   * Returns the manager that owns MCP client lifecycles. Exposed so
   * `Config.initialize()`'s background discovery path can call
   * `discoverAllMcpToolsIncremental` directly without going through
   * `discoverMcpTools` (which would wipe already-registered tools).
   */
  getMcpClientManager(): McpClientManager;
  /**
   * Discovers tools from project (if available and configured).
   * Can be called multiple times to update discovered tools.
   * This will discover tools from the command line and from MCP servers.
   */
  discoverAllTools(): Promise<void>;
  /**
   * Discovers tools from project (if available and configured).
   * Can be called multiple times to update discovered tools.
   * This will NOT discover tools from the command line, only from MCP servers.
   */
  discoverMcpTools(): Promise<void>;
  /**
   * Restarts all MCP servers and re-discovers tools.
   */
  restartMcpServers(): Promise<void>;
  /**
   * Discover or re-discover tools for a single MCP server.
   * @param serverName - The name of the server to discover tools from.
   */
  discoverToolsForServer(serverName: string): Promise<void>;
  private discoverAndRegisterToolsFromCommand;
  /**
   * Retrieves the list of tool schemas (FunctionDeclaration array).
   * Extracts the declarations from the ToolListUnion structure.
   * Includes discovered (vs registered) tools if configured.
   *
   * By default, tools marked `shouldDefer=true` are excluded (they are
   * discovered by the model on demand via the ToolSearch tool). Pass
   * `{ includeDeferred: true }` to include them, e.g. for diagnostics.
   *
   * Tools marked `alwaysLoad=true` are always included regardless of
   * `shouldDefer`.
   *
   * @returns An array of FunctionDeclarations.
   */
  getFunctionDeclarations(options?: {
    includeDeferred?: boolean;
  }): FunctionDeclaration[];
  /**
   * Marks a deferred tool as revealed. Revealed tools are included in
   * {@link getFunctionDeclarations} output for the rest of the session, even
   * though they are normally hidden. Called by the ToolSearch tool after it
   * successfully loads a tool so the model can invoke it on subsequent turns.
   */
  revealDeferredTool(name: string): void;
  /**
   * Removes a single tool from the revealed-deferred set. Used for rollback
   * when a `setTools()` re-sync fails after revealing — leaving the tool
   * "revealed" in the registry while the chat's declaration list never
   * received the schema would mean future ToolSearch keyword queries
   * exclude the tool (per `collectCandidates`'s isDeferredToolRevealed
   * filter), making it unreachable until `/clear`.
   */
  unrevealDeferredTool(name: string): void;
  /** Whether a given tool has been revealed via {@link revealDeferredTool}. */
  isDeferredToolRevealed(name: string): boolean;
  /**
   * Whether a deferred tool is currently hidden from the model's
   * function-declaration list. Returns `true` when the tool:
   * - is deferred (`shouldDefer=true`),
   * - is not always-loaded,
   * - has not been revealed this session, AND
   * - is not in the visibleTools config list.
   */
  isDeferredAndHidden(name: string): boolean;
  /**
   * Clears the set of revealed deferred tools. Called by {@link GeminiClient}
   * when a chat session is reset (e.g. `/clear`) so the new session starts
   * with no revealed tools — the same state as any fresh session.
   */
  clearRevealedDeferredTools(): void;
  /**
   * Returns a lightweight summary of tools that are
   * deferred from the initial function-declaration list. Used to describe the
   * set of on-demand tools in the startup reminder so the model knows what is
   * reachable via ToolSearch. `alwaysLoad` tools and tools listed in
   * {@link Config.getVisibleTools} are excluded.
   */
  getDeferredToolSummary(): DeferredToolSummary[];
  /**
   * Reveals every deferred tool — bundled built-ins and MCP alike — when
   * the combined estimated token footprint of their schemas fits within
   * `budgetTokens`. Every mid-session reveal rewrites the declaration
   * list and invalidates the prompt-cache prefix, so the prefix only
   * stays stable when NOTHING is left for ToolSearch to reveal: a small
   * deferred set is cheaper to declare upfront in full than to load one
   * cache-busting piece at a time. All-or-nothing on purpose — a partial
   * reveal would leave an arbitrary subset behind ToolSearch.
   *
   * Already-revealed tools count toward the total (reveal is
   * idempotent), so repeated calls cannot ratchet past the budget as MCP
   * servers come and go. Returns the number of newly revealed tools.
   */
  preloadDeferredToolsWithinBudget(budgetTokens: number): number;
  getMcpServerInstructions(): Map<string, string>;
  /**
   * Retrieves a filtered list of tool schemas based on a list of tool names.
   * @param toolNames - An array of tool names to include.
   * @returns An array of FunctionDeclarations for the specified tools.
   * @remarks Requires all tool factories to be resolved first. Call
   * {@link warmAll} before invoking this method, otherwise factory-registered
   * tools that have not yet been loaded will be silently omitted.
   */
  getFunctionDeclarationsFiltered(toolNames: string[]): FunctionDeclaration[];
  /**
   * Returns an array of all registered and discovered tool names,
   * including tools that are registered via factory but not yet loaded.
   */
  getAllToolNames(): string[];
  /**
   * Returns an array of all registered and discovered tool instances.
   * @remarks Requires all tool factories to be resolved first. Call
   * {@link warmAll} before invoking this method, otherwise factory-registered
   * tools that have not yet been loaded will be absent from the result.
   */
  getAllTools(): AnyDeclarativeTool[];
  /**
   * Returns an array of tools registered from a specific MCP server.
   */
  getToolsByServer(serverName: string): AnyDeclarativeTool[];
  /**
   * Get the definition of a specific tool.
   */
  getTool(name: string): AnyDeclarativeTool | undefined;
  readMcpResource(
    serverName: string,
    uri: string,
    options?: {
      signal?: AbortSignal;
    },
  ): Promise<ReadResourceResult>;
  /**
   * Stops all MCP clients, disposes tools, and cleans up resources.
   * This method is idempotent and safe to call multiple times.
   */
  stop(): Promise<void>;
}
export {};
