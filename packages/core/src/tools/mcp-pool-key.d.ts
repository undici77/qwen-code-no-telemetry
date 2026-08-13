/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type MCPServerConfig } from '../config/config.js';
import type { MCPOAuthConfig } from '../mcp/oauth-provider.js';
import { type McpTransportKind } from './mcp-client-manager.js';
import type { ConnectionId } from './mcp-pool-events.js';
/**
 * Truncated SHA-256 hex (first 16 chars = 64 bits). At realistic pool
 * size (N < 1000 entries per workspace, typically < 100), birthday-
 * collision probability is < 10^-15 — safe to use as map key without
 * a fallback path.
 */
export type PoolKey = string;
/**
 * `McpTransportKind` and `mcpTransportOf` re-exported from
 * `mcp-client-manager.ts` (where they originated as part of the
 * budget guardrail accounting). imports + re-exports
 * via the pool barrel for downstream daemon code.
 */
export { mcpTransportOf, type McpTransportKind } from './mcp-client-manager.js';
/**
 * Default set of transports the pool will share. stdio + websocket
 * are true OS subprocesses whose state is observable and isolatable;
 * HTTP/SSE servers often bind state to the request stream and need
 * explicit operator opt-in. See `docs/design/f2-mcp-transport-pool.md`.
 */
export declare const POOLED_TRANSPORTS_DEFAULT: ReadonlySet<McpTransportKind>;
/**
 * Decide whether a server config is eligible for pool sharing.
 * SDK MCP servers always bypass (per-session by design); other
 * transports gated on the operator's `pooledTransports` selection.
 */
export declare function isPoolable(cfg: MCPServerConfig, pooledTransports: ReadonlySet<McpTransportKind>): boolean;
/**
 * Normalize OAuth config so functionally-equivalent shapes collapse
 * to the same fingerprint. `undefined`, `null`, `{}`, `{enabled: false}`
 * all mean "no OAuth" → all return `null`.
 *
 * Scopes / audiences sorted so callsite order doesn't matter; explicit
 * `null` defaults so an undefined field doesn't change the hash vs an
 * explicitly null one.
 *
 * hash every
 * `MCPOAuthConfig` field (oauth-provider.ts:51-62). Pre-fix only
 * `clientId` / `scopes` / `authorizationUrl` / `tokenUrl` were hashed
 * — so two configs differing ONLY in `clientSecret` / `audiences` /
 * `redirectUri` / `tokenParamName` / `registrationUrl` collapsed to
 * the same fingerprint and shared a pool entry, leaking the first
 * config's effective credentials/audience/redirect into the second
 * session's transport. Especially load-bearing for `clientSecret`
 * (confidential client) and `audiences` (multi-audience tokens).
 */
export declare function canonicalOAuth(o?: MCPOAuthConfig | null): Record<string, unknown> | null;
/**
 * Compute the pool fingerprint for an MCP server config. Two configs
 * with identical transport semantics + auth + env produce the same
 * fingerprint and thus share a pool entry; any divergence creates a
 * distinct entry.
 *
 * Hashed fields (transport-defining):
 *   transport, command, args, cwd, env, url, httpUrl, tcp, headers,
 *   timeout, oauth, authProviderType, targetAudience, targetServiceAccount
 *
 * Excluded fields (per-session filter / metadata; do NOT change the
 * underlying transport):
 *   includeTools, excludeTools, trust, alwaysLoadTools, description,
 *   extensionName,
 *   discoveryTimeoutMs (operational tuning; honored from the first
 *   acquire's config but not in the key — see TODO below)
 *
 * TODO(follow-up): if two sessions race-acquire the same key with
 * different discoveryTimeoutMs values, the first wins. This matches
 * previous behavior (per-session managers each used their own timeout)
 * but could surprise operators tuning per-session. Acceptable for v1.
 */
export declare function fingerprint(cfg: MCPServerConfig): PoolKey;
/**
 * Build the `ConnectionId` from server name + computed fingerprint.
 * Form: `${name}::${fp16hex}`. Same name + different fingerprints
 * (e.g. divergent OAuth tokens or env between sessions) yields
 * distinct ConnectionIds — see global state coexistence for how
 * the global `serverStatuses` Map handles multi-entry name collisions.
 */
export declare function connectionIdOf(serverName: string, cfg: MCPServerConfig): ConnectionId;
/**
 * Parse a ConnectionId back into its components. Useful for status
 * routes that need to surface the (serverName, entryIndex) pair
 * without exposing the raw fingerprint to clients.
 */
export declare function parseConnectionId(id: ConnectionId): {
    serverName: string;
    fingerprint: PoolKey;
};
