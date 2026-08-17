/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AvailableCommand } from '@agentclientprotocol/sdk';
import type { HookEventName } from '@qwen-code/qwen-code-core';
export declare const STATUS_SCHEMA_VERSION: 1;
/**
 * Closed enumeration of structured error categories surfaced on diagnostic
 * status cells. Cells produced by `/workspace/preflight`, `/workspace/env`,
 * and (eventually) the MCP guardrails route share this taxonomy so SDK
 * consumers can branch on a known set rather than parsing free-form strings.
 */
export declare const SERVE_ERROR_KINDS: readonly [
  'missing_binary',
  'blocked_egress',
  'auth_env_error',
  'init_timeout',
  'restore_timeout',
  'protocol_error',
  'missing_file',
  'parse_error',
  'stat_failed',
  'budget_exhausted',
  'mcp_budget_would_exceed',
  'mcp_server_spawn_failed',
  'invalid_config',
  'prompt_deadline_exceeded',
  'writer_idle_timeout',
];
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
export declare class SessionRestoreTimeoutError extends BridgeTimeoutError {
  readonly sessionId: string;
  readonly action: 'load' | 'resume';
  constructor(sessionId: string, action: 'load' | 'resume', timeoutMs: number);
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
  readonly workspaceMcp: 'qwen/status/workspace/mcp';
  readonly workspaceMcpTools: 'qwen/status/workspace/mcp/tools';
  readonly workspaceMcpResources: 'qwen/status/workspace/mcp/resources';
  readonly workspaceSkills: 'qwen/status/workspace/skills';
  readonly workspaceTools: 'qwen/status/workspace/tools';
  readonly workspaceProviders: 'qwen/status/workspace/providers';
  readonly workspaceMemory: 'qwen/status/workspace/memory';
  readonly workspaceAgents: 'qwen/status/workspace/agents';
  readonly workspacePreflight: 'qwen/status/workspace/preflight';
  readonly sessionContext: 'qwen/status/session/context';
  readonly sessionContextUsage: 'qwen/status/session/context_usage';
  readonly sessionSupportedCommands: 'qwen/status/session/supported_commands';
  readonly sessionTasks: 'qwen/status/session/tasks';
  readonly sessionStats: 'qwen/status/session/stats';
  readonly sessionLspStatus: 'qwen/status/session/lsp';
  readonly sessionTranscript: 'qwen/status/session/transcript';
  readonly sessionRewindSnapshots: 'qwen/status/session/rewind_snapshots';
  readonly workspaceHooks: 'qwen/status/workspace/hooks';
  readonly sessionHooks: 'qwen/status/session/hooks';
  readonly workspaceExtensions: 'qwen/status/workspace/extensions';
  readonly workspaceResource: 'qwen/status/workspace/resource';
};
/**
 * Control-plane (mutation) ACP extMethods introduced in Mutation control.
 * Distinct from `SERVE_STATUS_EXT_METHODS` so reviewers can grep mutation
 * surface independently from read-only diagnostics. Each route in
 * `server.ts` forwards through the matching extMethod into `acpAgent.ts`
 * which then mutates Config / ToolRegistry / McpClientManager state.
 */
export declare const SERVE_CONTROL_EXT_METHODS: {
  readonly sessionClose: 'qwen/control/session/close';
  readonly sessionApprovalMode: 'qwen/control/session/approval_mode';
  readonly sessionBranch: 'qwen/control/session/branch';
  readonly sessionSideTask: 'qwen/control/session/side_task';
  readonly sessionForkAgent: 'qwen/control/session/fork_agent';
  readonly sessionRecap: 'qwen/control/session/recap';
  readonly sessionGenerationStart: 'qwen/control/session/generation/start';
  readonly sessionGenerationCancel: 'qwen/control/session/generation/cancel';
  readonly sessionBtw: 'qwen/control/session/btw';
  readonly sessionShellHistory: 'qwen/control/session/shell_history';
  readonly sessionLanguage: 'qwen/control/session/language';
  readonly sessionRewind: 'qwen/control/session/rewind';
  readonly sessionContinue: 'qwen/control/session/continue';
  readonly sessionTitle: 'qwen/control/session/title';
  readonly sessionParent: 'qwen/control/session/parent';
  readonly sessionSource: 'qwen/control/session/source';
  readonly sessionLiveConversation: 'qwen/control/session/live-conversation';
  readonly sessionLiveTranscript: 'qwen/control/session/live-transcript';
  readonly sessionBackgroundNotification: 'qwen/control/session/background_notification';
  readonly sessionArtifactsPersist: 'qwen/control/session/artifacts/persist';
  readonly workspaceMcpRestart: 'qwen/control/workspace/mcp/restart';
  readonly workspaceMcpManage: 'qwen/control/workspace/mcp/manage';
  readonly workspaceMcpInitialize: 'qwen/control/workspace/mcp/initialize';
  readonly workspaceMcpReload: 'qwen/control/workspace/mcp/reload';
  readonly workspaceAgentGenerate: 'qwen/control/workspace/agents/generate';
  readonly workspaceGenerationStart: 'qwen/control/workspace/generation/start';
  readonly workspaceGenerationCancel: 'qwen/control/workspace/generation/cancel';
  readonly workspaceMemoryRememberAvailability: 'qwen/control/workspace/memory/remember/availability';
  readonly workspaceMemoryRemember: 'qwen/control/workspace/memory/remember';
  readonly workspaceMemoryForget: 'qwen/control/workspace/memory/forget';
  readonly workspaceMemoryDream: 'qwen/control/workspace/memory/dream';
  readonly sessionTaskCancel: 'qwen/control/session/task/cancel';
  readonly sessionGoalClear: 'qwen/control/session/goal/clear';
  /**
   * Read a live session's `/goal` state. The active goal lives only in the
   * child's in-memory store, so this is the sole authoritative source for the
   * condition, its running turn count and the judge's last verdict. Params:
   * `{ sessionId }`; result: `{ active: ActiveGoalView | null }`.
   */
  readonly sessionGoalGet: 'qwen/control/session/goal/get';
  readonly sessionMcpRuntimeAdd: 'qwen/control/session/mcp/runtime-add';
  readonly sessionMcpRuntimeRemove: 'qwen/control/session/mcp/runtime-remove';
  readonly workspaceMcpRuntimeAdd: 'qwen/control/workspace/mcp/runtime-add';
  readonly workspaceMcpRuntimeRemove: 'qwen/control/workspace/mcp/runtime-remove';
  readonly workspaceReload: 'qwen/control/workspace/reload';
  readonly workspaceSkillsRefresh: 'qwen/control/workspace/skills/refresh';
  readonly workspaceExtensionsRefresh: 'qwen/control/workspace/extensions/refresh';
  /**
   * Reverse tool channel (issue #5626, Phase 2). Unlike every other entry
   * here — which the PARENT serve process calls DOWN into the `qwen --acp`
   * child — this one is called by the CHILD UP into the parent: a
   * client-hosted (extension) MCP server's `sendSdkMcpMessage` round-trips a
   * JSON-RPC `mcp_message` from the child's `McpClientManager` back to the
   * parent's `ClientMcpRegistrar`, which pushes it down the daemon WS to the
   * client and returns the correlated response. Params: `{ server, payload }`;
   * result: `{ payload }`.
   */
  readonly clientMcpMessage: 'qwen/control/client_mcp/message';
  /**
   * Called by a private ACP CHILD immediately before a tool executor. The
   * parent validates the runtime-owned session/prompt identity, invokes its
   * configured external provider once, and returns allow/deny. Unavailable
   * unless the daemon explicitly enabled required external guarding.
   */
  readonly externalToolGuardPrepare: 'qwen/control/external_tool_guard/prepare';
  readonly sessionCd: 'qwen/control/session/cd';
  /**
   * Also called by the CHILD UP into the parent (like `clientMcpMessage`): the
   * `create_sub_session` tool, running inside a child's agent turn, asks the
   * daemon to spawn a fresh top-level sub-session and run a prompt in it. Params:
   * `{ prompt, completion:'sent'|'first-turn', model?, name?, callerSessionId? }`;
   * result: `{ sessionId, result?, stopReason? }` (result present only for the
   * `first-turn` mode, which waits for the sub-session's first turn to finish).
   */
  readonly createSubSession: 'qwen/control/create-sub-session';
  readonly liveCaptureScreenContext: 'qwen/control/live/capture-screen-context';
  readonly liveTaskTool: 'qwen/control/live/task-tool';
  readonly liveSpeakToUser: 'qwen/control/live/speak-to-user';
  readonly channelDelivery: 'qwen/control/channel-delivery';
};
export type ServeStatus =
  | 'ok'
  | 'warning'
  | 'error'
  | 'disabled'
  | 'not_started'
  | 'unknown';
export interface ServeStatusCell {
  kind: string;
  status: ServeStatus;
  error?: string;
  errorKind?: ServeErrorKind;
  hint?: string;
}
export type ServeMcpDiscoveryState =
  | 'not_started'
  | 'in_progress'
  | 'completed';
export type ServeMcpServerRuntimeStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected';
export type ServeMcpTransport =
  | 'stdio'
  | 'sse'
  | 'http'
  | 'websocket'
  | 'sdk'
  | 'unknown';
export interface ServeWorkspaceMcpServerStatus extends ServeStatusCell {
  kind: 'mcp_server';
  name: string;
  mcpStatus?: ServeMcpServerRuntimeStatus;
  transport: ServeMcpTransport;
  disabled: boolean;
  hasOAuthTokens?: boolean;
  requiresAuth?: boolean;
  approvalState?: 'pending' | 'rejected';
  authenticationState?: 'pending' | 'succeeded' | 'failed';
  authenticationError?: string;
  source?: 'user' | 'project' | 'extension';
  configOrigin?:
    | 'user_settings'
    | 'workspace_settings'
    | 'project_mcp_json'
    | 'system_settings'
    | 'extension'
    | 'runtime';
  removable?: boolean;
  config?: {
    command?: string;
    args?: string[];
    httpUrl?: string;
    url?: string;
    cwd?: string;
  };
  description?: string;
  extensionName?: string;
  /**
   * Count of MCP resources (`resources/list`) this server advertises,
   * from the workspace `ResourceRegistry`. Rides the existing status
   * payload so dashboards can show a "Resources: N" line and gate a
   * resource-browser affordance without a separate fetch. Absent on
   * older daemons; present (including `0`) on newer daemons for
   * non-disabled servers. The full list is fetched lazily via
   * `qwen/status/workspace/mcp/resources`.
   */
  resourceCount?: number;
  /**
   * Count of MCP prompts (`prompts/list`) this server advertises, from
   * the workspace `PromptRegistry`. Inline-only (there is no prompt
   * drill-down endpoint — prompts surface as slash commands), so this
   * count is the sole signal a dashboard has. Absent on older daemons;
   * present (including `0`) on newer daemons for non-disabled servers.
   */
  promptCount?: number;
  /**
   * Why this server is not live, when known. Distinguishes
   * operator-disabled (`disabled: true` from `disabledMcpServers`
   * config) from The budget feature budget-refused (`status: 'error', errorKind:
   * 'budget_exhausted'`). Operators dashboarding the workspace
   * shouldn't have to cross-reference the `errors[]` or `budgets[]`
   * arrays to render a per-server row correctly.
   */
  disabledReason?: 'config' | 'budget';
  /**
   * Pool-mode workspaces can hold multiple
   * `PoolEntry` instances under the same `name` when sessions inject
   * different fingerprints (e.g. per-session OAuth headers). Absent on
   * older daemons and on daemons with `QWEN_SERVE_NO_MCP_POOL=1`;
   * present (≥1) when the pool advertises `mcp_workspace_pool`.
   * Operators use this to render an "N entries" badge or drill into
   * `entrySummary` for the per-entry breakdown.
   */
  entryCount?: number;
  /**
   * Per-entry breakdown for multi-entry server
   * names. `entryIndex` is a stable opaque integer assigned at entry
   * creation (V21-7) — NOT the raw fingerprint, which would leak
   * OAuth/env rotation timing through snapshot diffs. `refs` is the
   * count of sessions currently attached. `status` is the per-entry
   * runtime status (`connected` / `connecting` / `disconnected`) so
   * dashboards can show per-entry health when the aggregated
   * `mcpStatus` rolls up to `connected` while one entry is still
   * reconnecting.
   *
   * Old SDK clients ignore the field per the additive-only protocol
   * contract; new clients gate UI on `entryCount > 1`. The pair
   * (`entryCount`, `entrySummary`) is always present together when
   * advertised — `mcp_workspace_pool` capability tag implies both.
   */
  entrySummary?: ReadonlyArray<{
    entryIndex: number;
    refs: number;
    status: ServeMcpServerRuntimeStatus;
  }>;
}
/** Budget mode for the MCP client guardrails. */
export type ServeMcpBudgetMode = 'enforce' | 'warn' | 'off';
/**
 * MCP budget status cell. Surfaced as one entry in
 * `ServeWorkspaceMcpStatus.budgets[]`. Daemons advertising
 * `mcp_workspace_pool` emit workspace-scoped accounting; the legacy no-pool
 * fallback emits session-scoped accounting.
 *
 * Consumers MUST tolerate additional entries with unrecognized
 * `scope` values — drop them rather than failing.
 */
export interface ServeMcpBudgetStatusCell extends ServeStatusCell {
  kind: 'mcp_budget';
  /**
   * Identifies which accounting scope this cell describes.
   *
   * `'workspace'` means sessions inside the selected runtime share an MCP pool
   * and budget. `'session'` is the legacy per-session manager used when
   * `mcp_workspace_pool` is absent.
   *
   * The `string & {}` widening keeps IDE autocomplete + literal narrowing for
   * known scopes while allowing unknown scopes through without a compile-time
   * break. Consumers drop unrecognized scopes rather than failing.
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
  /** The budget feature: live MCP client count (sum across all transports). */
  clientCount?: number;
  /** The budget feature: configured budget. Absent when no cap was set. */
  clientBudget?: number;
  /** The budget feature: active enforcement mode. Absent on older daemons. */
  budgetMode?: ServeMcpBudgetMode;
  /**
   * The budget feature: workspace-level status cells for budget enforcement. Always
   * an array (possibly empty) on newer daemons; absent on older
   * daemons. A future version may add a `scope: 'pool'` cell alongside.
   */
  budgets?: ServeMcpBudgetStatusCell[];
}
export interface ServeWorkspaceMcpToolStatus {
  name: string;
  serverToolName?: string;
  description?: string;
  schema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  isValid: boolean;
  invalidReason?: string;
}
export interface ServeWorkspaceMcpToolsStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  serverName: string;
  initialized: boolean;
  acpChannelLive: boolean;
  tools: ServeWorkspaceMcpToolStatus[];
  errors?: ServeStatusCell[];
}
/**
 * One resource advertised by an MCP server (`resources/list`). Mirrors
 * the `MCPResourceDisplayInfo` the TUI `/mcp` dialog renders: metadata
 * only (no content). The content is read on demand in-chat via the
 * `@<serverName>:<uri>` reference, which the frontend reconstructs from
 * `serverName` (the parent `ServeWorkspaceMcpResourcesStatus`) + `uri`.
 */
export interface ServeWorkspaceMcpResourceStatus {
  uri: string;
  name?: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
}
/**
 * Drill-down payload for `GET /workspace/mcp/:server/resources`. Mirrors
 * `ServeWorkspaceMcpToolsStatus` — resources are a per-server drill-down
 * exactly like tools, kept off the base `/workspace/mcp` status so that
 * frequently-polled payload stays lean.
 */
export interface ServeWorkspaceMcpResourcesStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  serverName: string;
  initialized: boolean;
  acpChannelLive: boolean;
  resources: ServeWorkspaceMcpResourceStatus[];
  errors?: ServeStatusCell[];
}
export type ServeSkillLevel = 'project' | 'user' | 'extension' | 'bundled';
export interface ServeWorkspaceSkillStatus extends ServeStatusCell {
  kind: 'skill';
  name: string;
  description: string;
  level: ServeSkillLevel;
  modelInvocable: boolean;
  disabledReason?: 'hard' | 'default' | 'inactive_extension';
  lockedScope?: 'system' | 'user' | 'systemDefaults';
  userInvocable?: false;
  installedPath?: string;
  argumentHint?: string;
  model?: string;
  extensionName?: string;
}
export interface ServeWorkspaceSkillsRefreshResult {
  sessionsRefreshed: number;
  sessionsFailed: number;
  configsRefreshed?: number;
  configsFailed?: number;
  reason?: ServeWorkspaceSkillsRefreshReason;
}
export type ServeWorkspaceSkillsRefreshReason = 'settings' | 'content' | 'all';
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
  baseUrl?: string;
  fastModelId?: string;
  visionModelId?: string;
}
export interface ServeWorkspaceProviderModel {
  modelId: string;
  baseModelId: string;
  name: string;
  description?: string | null;
  contextLimit?: number;
  modalities?: {
    image?: boolean;
    pdf?: boolean;
    audio?: boolean;
    video?: boolean;
  };
  baseUrl?: string;
  envKey?: string;
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
  acpChannelLive?: boolean;
  current?: ServeWorkspaceProviderCurrent;
  approvalMode?: string;
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
export interface ServeContextCategoryBreakdown {
  systemPrompt: number;
  builtinTools: number;
  mcpTools: number;
  memoryFiles: number;
  skills: number;
  messages: number;
  freeSpace: number;
  autocompactBuffer: number;
}
export interface ServeContextToolDetail {
  name: string;
  tokens: number;
}
export interface ServeContextMemoryDetail {
  path: string;
  tokens: number;
}
export interface ServeContextSkillDetail {
  name: string;
  tokens: number;
  loaded?: boolean;
  bodyTokens?: number;
}
export interface ServeSessionContextUsage {
  modelName: string;
  totalTokens: number;
  contextWindowSize: number;
  breakdown: ServeContextCategoryBreakdown;
  builtinTools: ServeContextToolDetail[];
  mcpTools: ServeContextToolDetail[];
  memoryFiles: ServeContextMemoryDetail[];
  skills: ServeContextSkillDetail[];
  isEstimated?: boolean;
  showDetails?: boolean;
}
export interface ServeSessionContextUsageStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  sessionId: string;
  workspaceCwd: string;
  usage: ServeSessionContextUsage;
  formattedText: string;
}
export interface ServeSessionSupportedCommandsStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  sessionId: string;
  availableCommands: AvailableCommand[];
  availableSkills: string[];
}
export interface ServeLspServerStatus {
  name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY' | 'FAILED';
  languages: string[];
  transport?: string;
  command?: string;
  error?: string;
}
export interface ServeSessionLspStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  sessionId: string;
  workspaceCwd: string;
  enabled: boolean;
  configuredServers: number;
  readyServers: number;
  failedServers: number;
  inProgressServers: number;
  notStartedServers: number;
  statusUnavailable?: true;
  initializationError?: string;
  servers: ServeLspServerStatus[];
}
export type ServeSessionTaskLifecycleStatus =
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type ServeSessionProcessTaskLifecycleStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';
export interface ServeSessionAgentTaskStatus {
  kind: 'agent';
  id: string;
  label: string;
  description: string;
  status: ServeSessionTaskLifecycleStatus;
  startTime: number;
  endTime?: number;
  runtimeMs: number;
  outputFile?: string;
  subagentType?: string;
  isBackgrounded: boolean;
  error?: string;
  resumeBlockedReason?: string;
  stats?: {
    totalTokens: number;
    toolUses: number;
    durationMs: number;
  };
  recentActivities?: Array<{
    name: string;
    description: string;
    at: number;
  }>;
  prompt?: string;
  /** Tool call in the parent session that launched this agent. */
  toolUseId?: string;
  /**
   * `id` of the agent task that spawned this one; absent for agents
   * launched by the top-level session. Mirrors `AgentTask.parentAgentId`
   * (a `null` there serializes as absent here). Lets clients render the
   * roster as a tree.
   */
  parentAgentId?: string;
  /**
   * Display name (`subagentType`) of the spawning agent, captured at
   * registration time so it survives the parent's eviction. Display-only.
   */
  parentName?: string;
  /** Launch depth (0-based; 0 = spawned by the top-level session). */
  depth?: number;
}
export interface ServeSessionShellTaskStatus {
  kind: 'shell';
  id: string;
  label: string;
  description: string;
  status: ServeSessionProcessTaskLifecycleStatus;
  startTime: number;
  endTime?: number;
  runtimeMs: number;
  outputFile?: string;
  command: string;
  cwd: string;
  pid?: number;
  exitCode?: number;
  error?: string;
}
export interface ServeSessionMonitorTaskStatus {
  kind: 'monitor';
  id: string;
  label: string;
  description: string;
  status: ServeSessionProcessTaskLifecycleStatus;
  startTime: number;
  endTime?: number;
  runtimeMs: number;
  command: string;
  pid?: number;
  eventCount: number;
  lastEventTime: number;
  droppedLines: number;
  exitCode?: number;
  error?: string;
  ownerAgentId?: string;
  toolUseId?: string;
}
export type ServeSessionTaskStatus =
  | ServeSessionAgentTaskStatus
  | ServeSessionShellTaskStatus
  | ServeSessionMonitorTaskStatus;
export interface ServeSessionTasksStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  sessionId: string;
  now: number;
  tasks: ServeSessionTaskStatus[];
}
export interface ServeSessionStatsModelMetrics {
  api: {
    totalRequests: number;
    totalErrors: number;
    totalLatencyMs: number;
  };
  tokens: {
    prompt: number;
    candidates: number;
    total: number;
    cached: number;
    thoughts: number;
  };
}
export interface ServeSessionStatsToolByName {
  count: number;
  success: number;
  fail: number;
  durationMs: number;
  decisions: {
    accept: number;
    reject: number;
    modify: number;
    auto_accept: number;
  };
}
export interface ServeSessionStatsSkillByName {
  count: number;
  success: number;
  fail: number;
}
export interface ServeSessionStatsStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  sessionId: string;
  workspaceCwd: string;
  sessionStartTimeMs: number;
  durationMs: number;
  promptCount: number;
  models: Record<string, ServeSessionStatsModelMetrics>;
  tools: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    totalDurationMs: number;
    byName: Record<string, ServeSessionStatsToolByName>;
  };
  files: {
    totalLinesAdded: number;
    totalLinesRemoved: number;
  };
  skills: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    byName: Record<string, ServeSessionStatsSkillByName>;
  };
}
/**
 * Workspace memory + agents read surfaces.
 *
 * Both shapes mirror the `kind / status / error? / errorKind? / hint?`
 * cell pattern that The mcp/skills/providers status structures use,
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
export type ServeAgentLevel =
  | 'project'
  | 'user'
  | 'builtin'
  | 'extension'
  | 'session';
export interface ServeWorkspaceAgentSummary {
  kind: 'agent';
  name: string;
  description: string;
  level: ServeAgentLevel;
  isBuiltin: boolean;
  /** Whether this agent restricts the tool set via `tools:` frontmatter. */
  hasTools: boolean;
  tools?: string[];
  disallowedTools?: string[];
  model?: string;
  color?: string;
  background?: boolean;
  approvalMode?: string;
  permissionMode?: string;
  maxTurns?: number;
  mcpServerNames?: string[];
  hookEvents?: string[];
  runConfig?: {
    max_time_minutes?: number;
    max_turns?: number;
  };
  extensionName?: string;
  /** Absolute path to the file backing this agent (or sentinel for built-ins). */
  filePath?: string;
}
export interface ServeWorkspaceAgentDetail extends ServeWorkspaceAgentSummary {
  systemPrompt: string;
  mcpServers?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
}
export interface ServeWorkspaceAgentsStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  agents: ServeWorkspaceAgentSummary[];
  errors?: ServeStatusCell[];
}
export type ServeHookMatcherKind =
  | 'toolName'
  | 'agentType'
  | 'trigger'
  | 'sessionTrigger'
  | 'error'
  | 'notificationType'
  | 'commandName'
  | 'filePath';
export interface ServeHookEventMeta {
  description: string;
  matcherKind?: ServeHookMatcherKind;
}
export interface ServeCommandHookConfig {
  type: 'command';
  command: string;
  name?: string;
  description?: string;
  timeout?: number;
  env?: Record<string, string>;
  async?: boolean;
  shell?: 'bash' | 'powershell';
  statusMessage?: string;
}
export interface ServeHttpHookConfig {
  type: 'http';
  url: string;
  name?: string;
  description?: string;
  timeout?: number;
  headers?: Record<string, string>;
  allowedEnvVars?: string[];
  if?: string;
  statusMessage?: string;
  once?: boolean;
}
export interface ServeFunctionHookConfig {
  type: 'function';
  id?: string;
  name?: string;
  description?: string;
  timeout?: number;
  errorMessage?: string;
  statusMessage?: string;
}
export interface ServePromptHookConfig {
  type: 'prompt';
  prompt: string;
  name?: string;
  description?: string;
  timeout?: number;
  model?: string;
  statusMessage?: string;
}
export interface ServeUnknownHookConfig {
  type: string;
  name?: string;
  description?: string;
  timeout?: number;
  statusMessage?: string;
}
export type ServeHookConfig =
  | ServeCommandHookConfig
  | ServeHttpHookConfig
  | ServeFunctionHookConfig
  | ServePromptHookConfig
  | ServeUnknownHookConfig;
export type ServeHookSource =
  | 'project'
  | 'user'
  | 'system'
  | 'extensions'
  | 'session';
export interface ServeHookEntry {
  kind: 'hook';
  eventName: string;
  config: ServeHookConfig;
  source: ServeHookSource;
  matcher?: string;
  sequential?: boolean;
  enabled: boolean;
  hookId?: string;
  skillRoot?: string;
}
export interface ServeWorkspaceHooksStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  initialized: boolean;
  disabled: boolean;
  hooks: ServeHookEntry[];
  events: Record<string, ServeHookEventMeta>;
  errors?: ServeStatusCell[];
}
export interface ServeSessionHooksStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  sessionId: string;
  workspaceCwd: string;
  disabled: boolean;
  hooks: ServeHookEntry[];
  errors?: ServeStatusCell[];
}
export declare const IDLE_HOOK_EVENTS: Record<
  HookEventName,
  ServeHookEventMeta
>;
export type ServeExtensionInstallType =
  | 'git'
  | 'local'
  | 'link'
  | 'github-release'
  | 'npm'
  | 'archive-url';
export type ServeExtensionOriginSource =
  | 'QwenCode'
  | 'Claude'
  | 'Gemini'
  | 'Qoder'
  | 'AgentPlugins';
export interface ServeExtensionCapabilities {
  mcpServerCount: number;
  skillCount: number;
  agentCount: number;
  hookCount: number;
  commandCount: number;
  contextFileCount: number;
  channelCount: number;
  hasSettings: boolean;
}
export type ServeExtensionUpdateState =
  | 'checking for updates'
  | 'updated, needs restart'
  | 'updated with warnings'
  | 'updating'
  | 'updated'
  | 'update available'
  | 'up to date'
  | 'error'
  | 'not updatable'
  | 'unknown';
export interface ServeExtensionDetails {
  mcpServers: string[];
  commands: string[];
  skills: string[];
  agents: string[];
  contextFiles: string[];
  settings: string[];
}
export interface ServeExtensionEntry {
  kind: 'extension';
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  version: string;
  isActive: boolean;
  path: string;
  source?: string;
  installType?: ServeExtensionInstallType;
  originSource?: ServeExtensionOriginSource;
  ref?: string;
  autoUpdate?: boolean;
  updateState?: ServeExtensionUpdateState;
  capabilities: ServeExtensionCapabilities;
  details?: ServeExtensionDetails;
}
export interface ServeWorkspaceExtensionsStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  initialized: boolean;
  extensions: ServeExtensionEntry[];
  errors?: ServeStatusCell[];
}
export declare function createIdleWorkspaceExtensionsStatus(
  workspaceCwd: string,
): ServeWorkspaceExtensionsStatus;
export declare function createIdleWorkspaceHooksStatus(
  workspaceCwd: string,
): ServeWorkspaceHooksStatus;
export declare function createIdleWorkspaceMemoryStatus(
  workspaceCwd: string,
): ServeWorkspaceMemoryStatus;
export declare function createIdleWorkspaceAgentsStatus(
  workspaceCwd: string,
): ServeWorkspaceAgentsStatus;
export declare function createIdleWorkspaceMcpStatus(
  workspaceCwd: string,
): ServeWorkspaceMcpStatus;
export declare function createIdleWorkspaceSkillsStatus(
  workspaceCwd: string,
): ServeWorkspaceSkillsStatus;
export declare function createIdleWorkspaceProvidersStatus(
  workspaceCwd: string,
): ServeWorkspaceProvidersStatus;
/**
 * Idle envelope for `/workspace/env` when the bridge
 * has no `DaemonStatusProvider` injected (Mode A in-process consumers,
 * tests, embedded callers that don't need daemon-host cells). Single
 * construction site so future optional-field additions to
 * `ServeWorkspaceEnvStatus` only need updating in one place — the
 * production builder in `cli/src/serve/env-snapshot.ts buildEnvStatusFromProcess`
 * and this helper would otherwise diverge silently (TS won't flag a
 * missing optional field).
 *
 * Note: `initialized: true` matches `buildEnvStatusFromProcess` —
 * the daemon answers env from `process.*` state without consulting
 * ACP, so even an "empty" envelope is initialized.
 */
export declare function createIdleEnvStatus(
  workspaceCwd: string,
  acpChannelLive: boolean,
): ServeWorkspaceEnvStatus;
/**
 * Discriminant for diagnostic cells emitted by `/workspace/env`.
 * `env_var` cells are presence-only (the daemon never echoes secret values
 * even when redacted). The other kinds expose non-sensitive values like
 * runtime tag, platform, redacted proxy host, and sandbox profile name.
 */
export type ServeEnvKind =
  | 'runtime'
  | 'platform'
  | 'sandbox'
  | 'proxy'
  | 'env_var'
  | 'memory';
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
export interface ServeWorkspaceToolStatus {
  name: string;
  displayName?: string;
  description?: string;
  enabled: boolean;
}
export interface ServeWorkspaceToolsStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  initialized: true;
  acpChannelLive: boolean;
  tools: ServeWorkspaceToolStatus[];
  errors?: ServeStatusCell[];
}
/**
 * Discriminant for diagnostic cells emitted by `/workspace/preflight`. Cells
 * with `locality: 'daemon'` are answered by the bridge process directly and
 * are always populated. Cells with `locality: 'acp'` require a live ACP child
 * — when the daemon is idle they are emitted with `status: 'not_started'`.
 */
export type ServePreflightKind =
  | 'node_version'
  | 'cli_entry'
  | 'workspace_dir'
  | 'ripgrep'
  | 'git'
  | 'npm'
  | 'auth'
  | 'mcp_discovery'
  | 'skills'
  | 'providers'
  | 'tool_registry'
  | 'egress';
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
export declare const ACP_PREFLIGHT_KINDS: readonly [
  'auth',
  'mcp_discovery',
  'skills',
  'providers',
  'tool_registry',
  'egress',
];
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
export declare function mapDomainErrorToErrorKind(
  err: unknown,
): ServeErrorKind | undefined;
