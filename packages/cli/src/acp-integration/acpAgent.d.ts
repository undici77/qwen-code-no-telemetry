/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { WorkspaceMcpBudget, type Config, type McpBudgetEvent, type ChatRecord, type ToolInvocationGuard } from '@qwen-code/qwen-code-core';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { AgentSideConnection } from '@agentclientprotocol/sdk';
import type { McpServer, McpServerHttp, McpServerSse, McpServerStdio } from '@agentclientprotocol/sdk';
import type { LoadedSettings } from '../config/settings.js';
import type { CliArgs } from '../config/config.js';
export declare function selectVisibleHistoryRecords(records: ChatRecord[], hideInheritedHistory: boolean): ChatRecord[];
/**
 * Env-var candidates per auth method, used by `buildAuthPreflightCell` for
 * a side-effect-free presence check. Mirrors `AUTH_ENV_MAPPINGS` from
 * `core/src/models/constants.ts` (which isn't on the public package
 * surface). Keep in sync if a new provider is added there. Any auth method
 * not listed here surfaces as `status: 'unknown'` on the cell rather than
 * a false `auth_env_error` — full validation happens at session start.
 *
 * Drift detection: `AUTH_PREFLIGHT_AUDITED_AUTH_TYPES` below lists every
 * `AuthType` enum value that has been triaged for this map (either keyed
 * here, or explicitly waived for non-env-based auth like qwen-oauth). The
 * paired test `AUTH_PREFLIGHT_AUDITED_AUTH_TYPES covers every AuthType`
 * walks the public enum and fails CI when core adds a new auth method
 * without a deliberate decision here.
 */
export declare const AUTH_PREFLIGHT_ENV_KEYS: Readonly<Record<string, readonly string[]>>;
/**
 * Auth methods deliberately not env-keyed (e.g. OAuth-based, credential
 * file). Listed here so the drift test recognizes them as triaged-but-
 * waived rather than a missing entry.
 */
export declare const AUTH_PREFLIGHT_WAIVED_AUTH_TYPES: ReadonlySet<string>;
type DownloadedSkillFile = {
    relativePath: string;
    content: Uint8Array;
};
type QwenSettingValue = string | number | boolean | string[] | undefined;
type QwenCoreSettingKey = 'model.name' | 'fastModel' | 'general.outputLanguage' | 'general.language' | 'tools.approvalMode' | 'general.vimMode' | 'general.enableAutoUpdate' | 'general.showSessionRecap' | 'general.sessionRecapAwayThresholdMinutes' | 'general.terminalBell' | 'general.notificationMode' | 'general.gitCoAuthor.commit' | 'general.gitCoAuthor.pr' | 'general.defaultFileEncoding' | 'context.fileFiltering.respectGitIgnore' | 'context.fileFiltering.respectQwenIgnore' | 'context.fileFiltering.enableFuzzySearch' | 'memory.enableManagedAutoMemory' | 'memory.enableManagedAutoDream' | 'memory.enableAutoSkill' | 'memory.autoSkillConfirm' | 'memory.enableTeamMemory' | 'memory.enableTeamMemorySync' | 'disableAllHooks';
export declare function extractFilesFromTarGz(archiveBytes: Uint8Array, directoryPath: string, limits?: {
    maxCompressedBytes?: number;
    maxDecompressedBytes?: number;
}): Promise<DownloadedSkillFile[]>;
/**
 * Fetch that follows redirects manually, validating every hop stays on an
 * allowed GitHub host over HTTPS. This keeps the SSRF protection of
 * `redirect: 'manual'` (a malicious repo cannot bounce the fetch to an internal
 * endpoint) while still following GitHub's legitimate CDN redirects, which
 * plain `redirect: 'manual'` would surface as a download failure.
 */
export declare function fetchAllowedGitHub(url: string, init?: RequestInit, maxRedirects?: number): Promise<Response>;
export declare function normalizeCoreSettingValue(key: QwenCoreSettingKey, value: unknown): QwenSettingValue;
/**
 * Reverse tool channel (issue #5626, Phase 2). Deliver one JSON-RPC MCP frame
 * for a client-hosted (extension) MCP server UP to the parent serve process
 * over the `qwen/control/client_mcp/message` ext-method, returning the
 * client-hosted server's correlated reply. Shared by the bootstrap
 * (workspace-level) sender in `runAcpAgent` and the per-session sender
 * (`buildClientMcpSender`).
 *
 * The parent's `BridgeClient.extMethod` wraps the reply in `{ payload }`
 * (notifications resolve with a synthetic ack in the same envelope). A missing
 * `connection` (frame arrived before the ACP connection was wired) or a missing
 * `payload` (contract break / older parent) surfaces as a transport error so
 * the agent's MCP client fails fast instead of hanging.
 */
export declare function deliverClientMcpMessage(connection: AgentSideConnection | undefined, serverName: string, message: JSONRPCMessage, sessionId?: string): Promise<JSONRPCMessage>;
/**
 * Build the ACP child's side of the managed guard. It carries no provider
 * endpoint or credential; those remain in the daemon. The private parent
 * validates the session and active prompt before calling its provider.
 */
export declare function createManagedExternalToolGuard(connection: AgentSideConnection): ToolInvocationGuard;
export declare function runAcpAgent(config: Config, settings: LoadedSettings, argv: CliArgs, options?: {
    privateParentCapability?: string;
    externalToolGuardRequired?: boolean;
}): Promise<void>;
export declare function toStdioServer(server: McpServer): McpServerStdio | undefined;
export declare function toSseServer(server: McpServer): (McpServerSse & {
    type: 'sse';
}) | undefined;
export declare function toHttpServer(server: McpServer): (McpServerHttp & {
    type: 'http';
}) | undefined;
/**
 * Construct the workspace-scoped MCP budget controller from env vars.
 * Returns `undefined` when budget is unset or `off` mode. The pool
 * invokes `tryReserve`/`release`; this helper produces the controller
 * and wires the event callback.
 */
export declare function createWorkspaceMcpBudget(onEvent: (event: McpBudgetEvent) => void): WorkspaceMcpBudget | undefined;
export {};
