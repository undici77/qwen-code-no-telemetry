/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type MCPServerConfig } from '@qwen-code/qwen-code-core';
export declare const MCP_APPROVALS_FILENAME = "mcpApprovals.json";
/**
 * The user's persisted decision for one project-scoped MCP server. A decision is
 * bound to `hash` — the canonical hash of the exact config the user reviewed. If
 * `.mcp.json` is later edited, the live hash no longer matches and the server is
 * treated as `pending` again (see issue #4615).
 */
export type McpApprovalStatus = 'approved' | 'rejected';
export interface McpApprovalRecord {
    hash: string;
    status: McpApprovalStatus;
}
/** `{ [projectRoot]: { [serverName]: record } }` — user-local, per project. */
export type McpApprovalsConfig = Record<string, Record<string, McpApprovalRecord>>;
export type McpApprovalState = McpApprovalStatus | 'pending';
export interface McpApprovalsError {
    message: string;
    path: string;
}
export declare function getMcpApprovalsPath(): string;
export declare class LoadedMcpApprovals {
    readonly file: {
        path: string;
        config: McpApprovalsConfig;
    };
    readonly errors: McpApprovalsError[];
    constructor(file: {
        path: string;
        config: McpApprovalsConfig;
    }, errors: McpApprovalsError[]);
    /**
     * Live approval state for a project server. Returns `pending` when there is no
     * stored decision OR when the stored decision was bound to a different config
     * hash (i.e. `.mcp.json` changed since approval). This is the hash-binding
     * that makes a config edit require re-approval.
     */
    getState(projectRoot: string, serverName: string, config: MCPServerConfig): McpApprovalState;
    /** Persist an approve/reject decision bound to the current config hash. */
    setState(projectRoot: string, serverName: string, config: MCPServerConfig, status: McpApprovalStatus): Promise<void>;
}
/** FOR TESTING ONLY. Resets the in-memory cache. */
export declare function resetMcpApprovalsForTesting(): void;
export declare function loadMcpApprovals(): LoadedMcpApprovals;
/**
 * Names of gated servers in `mcpServers` that are NOT approved (pending or
 * rejected) for `projectRoot`. Only checked-in / shareable scopes are gated —
 * project `.mcp.json` and workspace `.qwen/settings.json` (see
 * {@link isGatedMcpScope}); user/system/extension servers are ignored. The
 * returned list is what the discovery layer skips
 * (`Config.isMcpServerPendingApproval`). See issue #4615.
 */
export declare function getPendingGatedMcpServers(mcpServers: Record<string, MCPServerConfig>, projectRoot: string): string[];
/**
 * Names of gated servers in `mcpServers` whose state is strictly `pending` —
 * i.e. awaiting a first decision OR a re-decision because a config edit changed
 * the hash their prior decision was bound to. This is what the interactive
 * approval dialog should prompt for.
 *
 * Distinct from {@link getPendingGatedMcpServers}, which is `!== 'approved'` and
 * so also includes `rejected` servers: discovery must keep skipping those, but
 * the dialog must NOT re-prompt them. Using this stricter set to drive the
 * prompt is what lets a config edit re-surface a previously *rejected* server
 * (its hash no longer matches → `pending`) without nagging about a settled
 * rejection. See issue #4615.
 */
export declare function getPromptableMcpServers(mcpServers: Record<string, MCPServerConfig>, projectRoot: string): string[];
export declare function saveMcpApprovals(file: {
    path: string;
    config: McpApprovalsConfig;
}): Promise<void>;
