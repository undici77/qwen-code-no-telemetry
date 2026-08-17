/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig } from '../config/config.js';
import type { PromptRegistry } from '../prompts/prompt-registry.js';
import type { ResourceRegistry } from '../resources/resource-registry.js';
import type {
  DiscoveredMCPPrompt,
  DiscoveredMCPResource,
} from './mcp-client.js';
import type { DiscoveredMCPTool } from './mcp-tool.js';
import type { ToolRegistry } from './tool-registry.js';
/**
 * Decide whether a tool from a snapshot passes a session's
 * include/exclude filter. Exported for unit-testability and so the
 * future pool/F3 audit path can replay the same predicate.
 *
 * Matches the existing `isEnabled` semantics in `mcp-client.ts` but
 * works against `DiscoveredMCPTool` instead of `FunctionDeclaration`.
 * `excludeTools` wins over `includeTools` when both list the same
 * tool (previous behavior preserved).
 *
 * `serverToolName` is the bare name as advertised by the MCP server.
 * `includeTools` entries may use either the bare name or a
 * `<name>(<args>)` parenthesized form — the parens form is stripped
 * before comparing (matches `mcp-client.ts:isEnabled` history).
 * `excludeTools` is checked via direct equality — no parens-form
 * support, intentionally matching the existing previous behavior so
 * operators don't see semantic divergence between the two filter
 * lists when migrating sessions through pool mode.
 *
 * PR-A-R2 #2: routes through `compiledFilterAccepts(compileNameFilter(...))`
 * so the bulk-path predicate and the exported per-name predicate
 * share one implementation. Set construction is paid per call here
 * (negligible for unit tests / one-off audit-path probes).
 */
export declare function passesSessionFilter(
  tool: DiscoveredMCPTool,
  includeTools?: readonly string[],
  excludeTools?: readonly string[],
): boolean;
/**
 * prompt-side analog
 * of `passesSessionFilter`. Same `excludeTools` / `includeTools`
 * semantics applied to the prompt's `name` field. Reuses the
 * `excludeTools` / `includeTools` config keys rather than inventing
 * separate `excludePrompts` / `includePrompts` keys — most operators
 * intuitively want a single filter knob per server, and prompt names
 * rarely collide with tool names. If a future server advertises
 * a prompt + tool with the SAME name and the operator wants to
 * exclude only the tool (not the prompt), they can switch to the
 * parens form `excludeTools: ['toolName(args)']` which only matches
 * tools (the parens-stripping in `passesSessionFilter` matches
 * `toolName` in the include list, not the exclude list).
 *
 * PR-A-R2 #2: same delegation to the compiled path as
 * `passesSessionFilter`.
 */
export declare function passesSessionPromptFilter(
  promptName: string,
  includeTools?: readonly string[],
  excludeTools?: readonly string[],
): boolean;
/**
 * Per-session, per-server projection of a pool entry's tool, prompt, and
 * resource snapshots into the session-owned registries.
 *
 * commit 2: one shared `McpClient` in the pool produces
 * canonical `toolsSnapshot` / `promptsSnapshot`; N `SessionMcpView`
 * instances each subscribe and call `applyTools` / `applyPrompts`
 * on `toolsChanged` / `promptsChanged` events.
 *
 * Each view:
 *   - Filters by per-session `includeTools` / `excludeTools` (cfg)
 *   - Decorates tools with per-session `trust` and `alwaysLoadTools` via
 *     `tool.withSessionConfig(...)` so two sessions on the same pool entry
 *     can have different metadata without cross-contamination
 *   - Registers into the session's own registries (does NOT touch
 *     the pool's snapshot)
 *   - `teardown()` removes all this view's registrations, used on
 *     `/mcp disable`, session close, or `disconnected` event from pool
 */
export declare class SessionMcpView {
  private readonly sessionToolRegistry;
  private readonly sessionPromptRegistry;
  private readonly sessionResourceRegistry;
  readonly sessionId: string;
  readonly serverName: string;
  private cfg;
  private metadataKey;
  /**
   * @param sessionToolRegistry The session-owned ToolRegistry; receives
   *   filtered + trust-decorated `DiscoveredMCPTool` instances.
   * @param sessionPromptRegistry The session-owned PromptRegistry; receives
   *   prompts selected by the same name filter as tools.
   * @param sessionResourceRegistry The session-owned ResourceRegistry;
   *   receives the full resource snapshot because tool-name filters do not
   *   apply to resource URIs.
   * @param sessionId Stamped onto debug logs for cross-session
   *   correlation; not used for routing (pool's reverse index handles that).
   * @param serverName Server name as advertised in the per-session
   *   merged mcpServers map; used as the key into the registries'
   *   `removeMcpToolsByServer` / `removePromptsByServer` cleanup paths.
   * @param cfg The session's view of this server's config, source of
   *   `includeTools` / `excludeTools` / `trust` / `alwaysLoadTools`.
   */
  constructor(
    sessionToolRegistry: ToolRegistry,
    sessionPromptRegistry: PromptRegistry,
    sessionResourceRegistry: ResourceRegistry,
    sessionId: string,
    serverName: string,
    cfg: MCPServerConfig,
  );
  /**
   * Replace this session's registered tools for `serverName` with a
   * filtered+decorated copy of `snapshot`. Idempotent: re-apply on
   * `toolsChanged` first removes any prior registration then registers
   * the new set, so a server that hot-removes a tool propagates correctly.
   */
  applyTools(snapshot: readonly DiscoveredMCPTool[]): void;
  /**
   * Replace this session's registered prompts for `serverName` with
   * `snapshot`. Apply the same `excludeTools` / `includeTools`
   * filter the tool path uses. Pre-fix prompts were
   * registered unconditionally — a session restricting tools to a
   * subset still received every prompt the server advertised, AND
   * each prompt's bound `invoke` closure over the pool's shared
   * `Client` reached the same server state/credentials as the
   * more-trusted sibling. Now the filter rejects prompts the
   * session has explicitly excluded; un-listed prompts pass when
   * `includeTools` is unset (matching the tool path's lenient default).
   *
   * Note: prompts carry a bound `invoke` closure over the pool's
   * shared `Client`. When the pool reconnects (new client instance),
   * the snapshot is re-emitted via `promptsChanged`, and this method
   * re-registers with the new bound invokes — stale invokes from a
   * prior generation are dropped via `removePromptsByServer`.
   */
  applyPrompts(snapshot: readonly DiscoveredMCPPrompt[]): void;
  /**
   * Replace this session's registered resources for `serverName` with
   * `snapshot`. Idempotent (removes prior registration first), mirroring
   * `applyPrompts` / `applyTools` so a hot-changed or reconnected server
   * propagates correctly.
   *
   * Unlike `applyTools` / `applyPrompts`, resources are NOT run through the
   * `includeTools` / `excludeTools` filter: those knobs match tool (and
   * prompt) NAMES, whereas a resource's identity is its URI. Filtering URIs
   * by a tool-name allow/deny list is semantically meaningless and would
   * only ever drop a resource whose URI coincidentally equalled a filtered
   * tool name. The full set is fanned out to every session.
   *
   * An EMPTY snapshot is a no-op (does not clear): `discoverAndReturn` /
   * `listMcpResources` swallow a transient `resources/list` failure to `[]`,
   * so on a pool restart the snapshot may be empty because the list call
   * failed, not because the server has no resources. Wiping the session's
   * resources on every failed re-read would be silent data loss. This mirrors
   * the `resources.length > 0` guard in the non-pool `McpClient.discover()`.
   * (`applyTools` / `applyPrompts` keep their pre-existing clear-on-empty
   * behavior — the transient-failure exposure there is out of scope for the
   * resource feature this PR adds.) Trade-off: a server that legitimately
   * drops to zero resources keeps the prior set until a non-empty snapshot.
   */
  applyResources(snapshot: readonly DiscoveredMCPResource[]): void;
  /**
   * Update the session's view of this server's config (e.g. when
   * `/mcp` tweaks `includeTools` at runtime). Re-apply uses the new
   * filter against the most recent snapshot.
   *
   * The caller is responsible for invoking `applyTools` / `applyPrompts` /
   * `applyResources` with the current snapshots when this method returns true.
   * The captured key also detects callers that mutate and resubmit the same
   * config object.
   */
  updateConfig(cfg: MCPServerConfig): boolean;
  /**
   * Tear down this view's registrations. Called on:
   *   - Session close (full teardown via pool's `releaseSession`)
   *   - `/mcp disable <serverName>` for this session
   *   - Permanent pool entry failure (subscribers should drop the
   *     server from their UI rather than show stale tools)
   *
   * Safe to call multiple times (delegates to idempotent
   * `removeMcpToolsByServer` / `removePromptsByServer`).
   */
  teardown(): void;
}
