/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AvailableCommand } from '@agentclientprotocol/sdk';
export declare const STATUS_SCHEMA_VERSION: 1;
/**
 * Closed enumeration of structured error categories surfaced on diagnostic
 * status cells. Cells produced by `/workspace/preflight`, `/workspace/env`,
 * and (eventually) the MCP guardrails route share this taxonomy so SDK
 * consumers can branch on a known set rather than parsing free-form strings.
 */
export declare const SERVE_ERROR_KINDS: readonly ["missing_binary", "blocked_egress", "auth_env_error", "init_timeout", "protocol_error", "missing_file", "parse_error", "stat_failed", "budget_exhausted"];
export type ServeErrorKind = (typeof SERVE_ERROR_KINDS)[number];
/**
 * Typed timeout raised by `withTimeout` in the bridge. Lets the diagnostic
 * mapping helper recognize init/heartbeat/extMethod timeouts via `instanceof`
 * instead of regex-matching message strings.
 */
export declare class BridgeTimeoutError extends Error {
    readonly label: string;
    readonly timeoutMs: number;
    constructor(label: string, timeoutMs: number);
}
/**
 * Raised when the bridge observes its ACP child's transport closing while
 * a request is in flight (workspace status, session/* restore, or
 * mid-prompt). Replaces three `new Error('agent channel closed …')` sites
 * so `mapDomainErrorToErrorKind` can recognize the failure via
 * `instanceof` rather than regex-matching `.message`. The `context` suffix
 * preserves the legacy message wording so log greps and existing
 * diagnostic surfaces keep working.
 */
export declare class BridgeChannelClosedError extends Error {
    readonly context: string;
    constructor(context: string);
}
/**
 * Raised by `defaultSpawnChannelFactory` when neither `QWEN_CLI_ENTRY` nor
 * `process.argv[1]` resolves to a path that can be re-spawned for the ACP
 * child. Replaces a generic `new Error(...)` so `mapDomainErrorToErrorKind`
 * can return `'missing_binary'` via `instanceof` rather than regex-matching
 * `.message`. The constructor message is preserved verbatim so existing
 * operator-facing diagnostics stay byte-for-byte compatible.
 */
export declare class MissingCliEntryError extends Error {
    constructor();
}
export declare const SERVE_STATUS_EXT_METHODS: {
    readonly workspaceMcp: "qwen/status/workspace/mcp";
    readonly workspaceSkills: "qwen/status/workspace/skills";
    readonly workspaceProviders: "qwen/status/workspace/providers";
    readonly workspaceMemory: "qwen/status/workspace/memory";
    readonly workspaceAgents: "qwen/status/workspace/agents";
    readonly workspacePreflight: "qwen/status/workspace/preflight";
    readonly sessionContext: "qwen/status/session/context";
    readonly sessionSupportedCommands: "qwen/status/session/supported_commands";
};
/**
 * Control-plane (mutation) ACP extMethods introduced in #4175 Wave 4 PR 17.
 * Distinct from `SERVE_STATUS_EXT_METHODS` so reviewers can grep mutation
 * surface independently from read-only diagnostics. Each route in
 * `server.ts` forwards through the matching extMethod into `acpAgent.ts`
 * which then mutates Config / ToolRegistry / McpClientManager state.
 */
export declare const SERVE_CONTROL_EXT_METHODS: {
    readonly sessionApprovalMode: "qwen/control/session/approval_mode";
    readonly workspaceMcpRestart: "qwen/control/workspace/mcp/restart";
};
export type ServeStatus = 'ok' | 'warning' | 'error' | 'disabled' | 'not_started' | 'unknown';
export interface ServeStatusCell {
    kind: string;
    status: ServeStatus;
    error?: string;
    errorKind?: ServeErrorKind;
    hint?: string;
}
export type ServeMcpDiscoveryState = 'not_started' | 'in_progress' | 'completed';
export type ServeMcpServerRuntimeStatus = 'connected' | 'connecting' | 'disconnected';
export type ServeMcpTransport = 'stdio' | 'sse' | 'http' | 'websocket' | 'sdk' | 'unknown';
export interface ServeWorkspaceMcpServerStatus extends ServeStatusCell {
    kind: 'mcp_server';
    name: string;
    mcpStatus?: ServeMcpServerRuntimeStatus;
    transport: ServeMcpTransport;
    disabled: boolean;
    description?: string;
    extensionName?: string;
    /**
     * Why this server is not live, when known. Distinguishes
     * operator-disabled (`disabled: true` from `disabledMcpServers`
     * config) from PR 14 budget-refused (`status: 'error', errorKind:
     * 'budget_exhausted'`). Operators dashboarding the workspace
     * shouldn't have to cross-reference the `errors[]` or `budgets[]`
     * arrays to render a per-server row correctly.
     */
    disabledReason?: 'config' | 'budget';
}
/** Budget mode for the MCP client guardrails (issue #4175 PR 14). */
export type ServeMcpBudgetMode = 'enforce' | 'warn' | 'off';
/**
 * Workspace-level budget status cell. Surfaced as one entry in
 * `ServeWorkspaceMcpStatus.budgets[]`. The list shape (vs a single
 * `budget?` field) is forward-compat for Wave 5 PR 23, which will
 * add a `scope: 'pool'` cell alongside without a schema bump.
 *
 * Consumers MUST tolerate additional entries with unrecognized
 * `scope` values — drop them rather than failing.
 */
export interface ServeMcpBudgetStatusCell extends ServeStatusCell {
    kind: 'mcp_budget';
    /**
     * Identifies which accounting scope this cell describes.
     *
     * **PR 14 v1 emits `'session'`** because each ACP session creates
     * its own `Config`/`McpClientManager` via `acpAgent.newSessionConfig()`
     * — so the budget caps live MCP clients **per session**, not
     * per-workspace. The snapshot reflects the bootstrap session's
     * view; concurrent sessions each enforce their own copy of the
     * cap independently. See `qwen-serve-protocol.md` "PR 14 v1
     * scope: per-session" for the operator-facing rationale.
     *
     * Future PRs:
     *   - Wave 5 PR 23 (shared MCP pool) introduces a workspace-scoped
     *     manager and will emit `'workspace'` (or `'pool'`) cells.
     *   - The `string & {}` widening keeps IDE autocomplete + literal
     *     narrowing for known scopes while allowing unknown scopes
     *     through without a compile-time break — the protocol contract
     *     is "consumers MUST tolerate additional scope values, drop
     *     don't fail."
     */
    scope: 'session' | 'workspace' | (string & {});
    /** Live (CONNECTED) MCP client count at snapshot time. */
    liveCount: number;
    /** Configured cap (positive integer). Absent only when mode is `off`. */
    budget?: number;
    /** Active enforcement mode. `off` mode produces no cell — `budgets: []`. */
    mode: ServeMcpBudgetMode;
    /** Servers refused during the most recent discovery pass. */
    refusedCount: number;
}
export interface ServeWorkspaceMcpStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    workspaceCwd: string;
    initialized: boolean;
    discoveryState?: ServeMcpDiscoveryState;
    servers: ServeWorkspaceMcpServerStatus[];
    errors?: ServeStatusCell[];
    /** PR 14: live MCP client count (sum across all transports). */
    clientCount?: number;
    /** PR 14: configured budget. Absent when no cap was set. */
    clientBudget?: number;
    /** PR 14: active enforcement mode. Absent on pre-PR-14 daemons. */
    budgetMode?: ServeMcpBudgetMode;
    /**
     * PR 14: workspace-level status cells for budget enforcement. Always
     * an array (possibly empty) on post-PR-14 daemons; absent on older
     * daemons. PR 23 will add a `scope: 'pool'` cell alongside.
     */
    budgets?: ServeMcpBudgetStatusCell[];
}
export type ServeSkillLevel = 'project' | 'user' | 'extension' | 'bundled';
export interface ServeWorkspaceSkillStatus extends ServeStatusCell {
    kind: 'skill';
    name: string;
    description: string;
    level: ServeSkillLevel;
    modelInvocable: boolean;
    argumentHint?: string;
    model?: string;
    extensionName?: string;
}
export interface ServeWorkspaceSkillsStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    workspaceCwd: string;
    initialized: boolean;
    skills: ServeWorkspaceSkillStatus[];
    errors?: ServeStatusCell[];
}
export interface ServeWorkspaceProviderCurrent {
    authType?: string;
    modelId?: string;
}
export interface ServeWorkspaceProviderModel {
    modelId: string;
    baseModelId: string;
    name: string;
    description?: string | null;
    contextLimit?: number;
    isCurrent: boolean;
    isRuntime: boolean;
}
export interface ServeWorkspaceProviderStatus extends ServeStatusCell {
    kind: 'model_provider';
    authType: string;
    current: boolean;
    models: ServeWorkspaceProviderModel[];
}
export interface ServeWorkspaceProvidersStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    workspaceCwd: string;
    initialized: boolean;
    current?: ServeWorkspaceProviderCurrent;
    providers: ServeWorkspaceProviderStatus[];
    errors?: ServeStatusCell[];
}
export interface ServeSessionContextStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    sessionId: string;
    workspaceCwd: string;
    state: {
        models?: unknown;
        modes?: unknown;
        configOptions?: unknown[] | null;
        [key: string]: unknown;
    };
}
export interface ServeSessionSupportedCommandsStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    sessionId: string;
    availableCommands: AvailableCommand[];
    availableSkills: string[];
}
/**
 * Issue #4175 PR 16: workspace memory + agents read surfaces.
 *
 * Both shapes mirror the `kind / status / error? / errorKind? / hint?`
 * cell pattern that PR 12's mcp/skills/providers status structures use,
 * so the SDK reducer can render any of these with one pattern.
 */
export type ServeContextFileScope = 'workspace' | 'global';
export interface ServeWorkspaceMemoryFile {
    kind: 'memory_file';
    /** Absolute path to the discovered memory file. */
    path: string;
    /**
     * 'workspace' for files under the bound workspace tree, 'global' for
     * `~/.qwen/QWEN.md` style entries. Helps adapters render scope chips.
     */
    scope: ServeContextFileScope;
    /** Size in bytes of the file's serialized contents on disk. */
    bytes: number;
}
export interface ServeWorkspaceMemoryStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    workspaceCwd: string;
    initialized: boolean;
    files: ServeWorkspaceMemoryFile[];
    /** Total bytes across all hierarchical files (sum of `files[].bytes`). */
    totalBytes: number;
    /**
     * Number of merged QWEN.md / AGENTS.md files the loader pulled in.
     * Mirrors `LoadServerHierarchicalMemoryResponse.fileCount`.
     */
    fileCount: number;
    /** Baseline path-rule count from `.qwen/rules/`. */
    ruleCount: number;
    errors?: ServeStatusCell[];
}
/**
 * Storage level for a subagent definition surfaced through
 * `GET /workspace/agents` and the per-`agentType` detail route.
 *
 * `project` / `user` / `builtin` are the values the daemon actually
 * returns today. `extension` and `session` are forward-compat slots:
 * the daemon-scoped `SubagentManager` runs against a stub `Config`
 * whose `getActiveExtensions()` returns `[]`, and session-level
 * subagents live in a runtime-only cache no CRUD route reads.
 * Mirrors `DaemonAgentLevel` in `@qwen-code/sdk` so route + SDK
 * consumers see the same forward-compat union.
 */
export type ServeAgentLevel = 'project' | 'user' | 'builtin' | 'extension' | 'session';
export interface ServeWorkspaceAgentSummary {
    kind: 'agent';
    name: string;
    description: string;
    level: ServeAgentLevel;
    isBuiltin: boolean;
    /** Whether this agent restricts the tool set via `tools:` frontmatter. */
    hasTools: boolean;
    model?: string;
    color?: string;
    background?: boolean;
    approvalMode?: string;
    extensionName?: string;
    /** Absolute path to the file backing this agent (or sentinel for built-ins). */
    filePath?: string;
}
export interface ServeWorkspaceAgentDetail extends ServeWorkspaceAgentSummary {
    systemPrompt: string;
    tools?: string[];
    disallowedTools?: string[];
    runConfig?: {
        max_time_minutes?: number;
        max_turns?: number;
    };
}
export interface ServeWorkspaceAgentsStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    workspaceCwd: string;
    agents: ServeWorkspaceAgentSummary[];
    errors?: ServeStatusCell[];
}
export declare function createIdleWorkspaceMemoryStatus(workspaceCwd: string): ServeWorkspaceMemoryStatus;
export declare function createIdleWorkspaceAgentsStatus(workspaceCwd: string): ServeWorkspaceAgentsStatus;
export declare function createIdleWorkspaceMcpStatus(workspaceCwd: string): ServeWorkspaceMcpStatus;
export declare function createIdleWorkspaceSkillsStatus(workspaceCwd: string): ServeWorkspaceSkillsStatus;
export declare function createIdleWorkspaceProvidersStatus(workspaceCwd: string): ServeWorkspaceProvidersStatus;
/**
 * #4175 PR 22b/2: idle envelope for `/workspace/env` when the bridge
 * has no `DaemonStatusProvider` injected (Mode A in-process consumers,
 * tests, embedded callers that don't need daemon-host cells). Single
 * construction site so future optional-field additions to
 * `ServeWorkspaceEnvStatus` only need updating in one place — the
 * production builder in `cli/src/serve/envSnapshot.ts buildEnvStatusFromProcess`
 * and this helper would otherwise diverge silently (TS won't flag a
 * missing optional field).
 *
 * Note: `initialized: true` matches `buildEnvStatusFromProcess` —
 * the daemon answers env from `process.*` state without consulting
 * ACP, so even an "empty" envelope is initialized.
 */
export declare function createIdleEnvStatus(workspaceCwd: string, acpChannelLive: boolean): ServeWorkspaceEnvStatus;
/**
 * Discriminant for diagnostic cells emitted by `/workspace/env`.
 * `env_var` cells are presence-only (the daemon never echoes secret values
 * even when redacted). The other kinds expose non-sensitive values like
 * runtime tag, platform, redacted proxy host, and sandbox profile name.
 */
export type ServeEnvKind = 'runtime' | 'platform' | 'sandbox' | 'proxy' | 'env_var';
export interface ServeEnvCell extends ServeStatusCell {
    kind: ServeEnvKind;
    /** Stable identifier within the kind (e.g. env-var name, proxy var name). */
    name: string;
    present?: boolean;
    /** Non-sensitive value; ALWAYS omitted for kind='env_var'. */
    value?: string;
}
export interface ServeWorkspaceEnvStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    workspaceCwd: string;
    /** Always true — the daemon answers env without consulting ACP. */
    initialized: true;
    /** Whether an ACP channel is currently live; informational only. */
    acpChannelLive: boolean;
    cells: ServeEnvCell[];
    errors?: ServeStatusCell[];
}
/**
 * Discriminant for diagnostic cells emitted by `/workspace/preflight`. Cells
 * with `locality: 'daemon'` are answered by the bridge process directly and
 * are always populated. Cells with `locality: 'acp'` require a live ACP child
 * — when the daemon is idle they are emitted with `status: 'not_started'`.
 */
export type ServePreflightKind = 'node_version' | 'cli_entry' | 'workspace_dir' | 'ripgrep' | 'git' | 'npm' | 'auth' | 'mcp_discovery' | 'skills' | 'providers' | 'tool_registry' | 'egress';
export interface ServePreflightCell extends ServeStatusCell {
    kind: ServePreflightKind;
    locality: 'daemon' | 'acp';
    /** Free-form structured detail (versions, counts, etc.). Never carries secret values. */
    detail?: Record<string, unknown>;
}
export interface ServeWorkspacePreflightStatus {
    v: typeof STATUS_SCHEMA_VERSION;
    workspaceCwd: string;
    /** Always true — daemon-level cells are populated regardless of ACP state. */
    initialized: true;
    acpChannelLive: boolean;
    cells: ServePreflightCell[];
    errors?: ServeStatusCell[];
}
/**
 * The six preflight kinds that require a live ACP child to populate. Shared
 * between `createIdleAcpPreflightCells` (idle placeholder) and the
 * ACP-side `buildAcpPreflightCells` builder so the two sides cannot drift
 * — a future contributor adding a new ACP kind in one place sees the
 * other surface immediately.
 */
export declare const ACP_PREFLIGHT_KINDS: readonly ["auth", "mcp_discovery", "skills", "providers", "tool_registry", "egress"];
/**
 * The narrow union of ACP-locality preflight kinds. Useful for callers
 * that need to dispatch on every ACP kind exhaustively (e.g. the
 * `Record<AcpPreflightKind, …>` builder map in `acpAgent.ts`).
 */
export type AcpPreflightKind = (typeof ACP_PREFLIGHT_KINDS)[number];
/**
 * Idle ACP cells: emitted when the daemon has no live ACP child. The bridge
 * stitches these in alongside its daemon-level cells so `/workspace/preflight`
 * always returns a complete cell set without spawning a child.
 */
export declare function createIdleAcpPreflightCells(): ServePreflightCell[];
/**
 * Map a thrown domain error onto one of the closed `ServeErrorKind` literals
 * so diagnostic cells can render structured remediation. Recognition is
 * `instanceof`-based for bridge-owned errors; cross-package classes
 * (`SkillError`, `TrustGateError`, model-config) are matched by `.code` or
 * `.name` because bundle duplication can break `instanceof` symmetry.
 *
 * Returns `undefined` when no rule matches; callers should leave `errorKind`
 * unset rather than coercing an unrelated error into a misleading category.
 */
export declare function mapDomainErrorToErrorKind(err: unknown): ServeErrorKind | undefined;
