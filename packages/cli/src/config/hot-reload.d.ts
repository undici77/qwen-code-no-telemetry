/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config, type MCPServerConfig } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from './settings.js';
import type { SettingsWatcher } from './settingsWatcher.js';
/**
 * The three connection-admission lists discovery consults to decide whether a
 * given MCP server may connect. Distinct from the `mcpServers` config map:
 * these govern *whether* to connect, the map governs *which servers and how*.
 */
export interface McpGating {
    excluded?: string[];
    allowed?: string[];
    pending?: string[];
}
/**
 * Whether two `mcpServers` maps are equivalent. `fast-deep-equal` is
 * insensitive to object key order (so reordering servers / fields in
 * settings.json is not a false positive) but sensitive to array order (so
 * `args` order — which is semantically meaningful — is). `undefined` ≡ `{}`.
 */
export declare function mcpServersEqual(a: Record<string, MCPServerConfig> | undefined, b: Record<string, MCPServerConfig> | undefined): boolean;
/**
 * Whether two admission-list snapshots are equivalent. `excluded` / `pending`
 * are sets (order-irrelevant) where `undefined` ≡ `[]` (both mean "no entries").
 * `allowed` is different: an absent allow-list (`undefined`) means "allow all",
 * but an explicit empty allow-list (`[]`) means "deny all" — so for `allowed`,
 * absent and empty are NOT equal (otherwise editing `mcp.allowed` to `[]` would
 * be treated as a no-op and the deny-all never reconciles). `fast-deep-equal`
 * is array-order-sensitive, so sort copies before comparing.
 */
export declare function mcpGatingEqual(a: McpGating, b: McpGating): boolean;
/**
 * Recompute the connection-admission lists from the *current* settings. Runtime
 * edits to `mcp.allowed` / `mcp.excluded` take effect immediately, with two
 * deliberate rules:
 *
 * - **`allowed` empty vs absent**: an absent `mcp.allowed` means "allow all"
 *   (`undefined`); an explicit `mcp.allowed: []` means "deny all" (`[]` is
 *   preserved, NOT collapsed to `undefined`), matching the boot-time semantics
 *   of `getMcpServers()` (an empty allow-list filters everything out).
 * - **CLI allow-list is an upper bound (K)**: if launched with
 *   `--allowed-mcp-server-names`, `bootAllowed` is that flag value and the
 *   settings-derived allow-list is intersected with it — a settings edit may
 *   narrow within the launch bound but never widen beyond it. With no settings
 *   allow-list, the boot bound applies in full. Without the flag (`bootAllowed`
 *   undefined), settings fully drive admission.
 *
 * The pending list is always recomputed per #4615 so a hot-reload never
 * connects an unapproved gated server.
 */
export declare function recomputeMcpGating(settings: LoadedSettings, assembled: Record<string, MCPServerConfig>, cwd: string, bootAllowed: readonly string[] | undefined, isYolo: boolean): McpGating;
/**
 * Subscribe the running {@link Config} to settings changes so MCP servers
 * reconnect / disconnect / restart without a session restart (issue #3696
 * sub-task 3). Called once at startup, after `settingsWatcher.startWatching()`;
 * returns a disposer that unsubscribes.
 *
 * On each settings change the callback rebuilds the assembled MCP map the same
 * way Config boot did (so top-tier CLI/session servers and `.mcp.json` gating
 * stay correct), recomputes the admission lists, and only reconciles when the
 * servers or the admission lists actually changed — unrelated edits (theme,
 * skills, …) are ignored. The watcher already debounces (300ms) and serializes
 * its listeners; re-entrancy during an in-flight reconcile is coalesced inside
 * `Config.reinitializeMcpServers`.
 */
export declare function registerMcpHotReload(watcher: SettingsWatcher, settings: LoadedSettings, config: Config, topTierMcpServers: Record<string, MCPServerConfig> | undefined): () => void;
