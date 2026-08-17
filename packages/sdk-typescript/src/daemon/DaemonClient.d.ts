/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { DaemonAuthFlow } from './DaemonAuthFlow.js';
import { DaemonHttpError } from './DaemonHttpError.js';
import type {
  DaemonSseConnectReason,
  DaemonTransport,
} from './DaemonTransport.js';
export type { DaemonSseConnectReason } from './DaemonTransport.js';
import type {
  DaemonAgentMutationResult,
  DaemonAuthProviderId,
  DaemonAuthProviderCatalog,
  DaemonAuthProviderInstallRequest,
  DaemonAuthProviderInstallResult,
  DaemonAuthStatusSnapshot,
  DaemonCapabilities,
  DaemonCreateAgentRequest,
  DaemonArchiveSessionsResult,
  DaemonWorkspaceGenerationEvent,
  DaemonGeneratedAgentContent,
  DaemonDeviceFlowStartResult,
  DaemonDeviceFlowState,
  DaemonEvent,
  DaemonSessionContextStatus,
  DaemonSessionContextUsageStatus,
  DaemonSessionConfigOptionResult,
  BranchSessionRequest,
  DaemonBranchedSession,
  DaemonSideTaskSession,
  DaemonForkSessionResult,
  DaemonRestoredSession,
  DaemonSession,
  DaemonSessionArchiveState,
  DaemonSessionExportFormat,
  DaemonSessionExportResult,
  DaemonSessionTranscriptPage,
  DaemonSessionTranscriptPageOptions,
  SideTaskSessionRequest,
  DaemonSubagentSessionResolution,
  DaemonSessionGroup,
  DaemonSessionGroupCatalog,
  DaemonSessionGroupInput,
  DaemonSessionGroupUpdate,
  DaemonSessionLspStatus,
  DaemonSessionListPage,
  DaemonSessionListPageOptions,
  DaemonWorkspaceSessionInfo,
  DaemonSessionOrganizationResult,
  DaemonSessionOrganizationUpdate,
  DaemonSessionSummary,
  DaemonSessionSupportedCommandsStatus,
  DaemonSessionStatsStatus,
  DaemonUsageDashboard,
  DaemonUsageRange,
  DaemonStatusReport,
  DaemonStatusReportDetail,
  DaemonSessionTaskStatus,
  DaemonSessionTasksStatus,
  DaemonUpdateAgentRequest,
  DaemonWorkspaceFile,
  DaemonWorkspaceFileBytes,
  DaemonWorkspaceFileEditRequest,
  DaemonWorkspaceFileEditResult,
  DaemonWorkspaceFileUploadRequest,
  DaemonWorkspaceFileUploadResult,
  DaemonWorkspaceFileWriteRequest,
  DaemonWorkspaceFileWriteResult,
  DaemonWorkspaceAgentDetail,
  DaemonWorkspaceAgentsStatus,
  DaemonWorkspaceEnvStatus,
  DaemonWorkspaceGitStatus,
  DaemonWorkspaceGitDiff,
  DaemonWorkspaceGitDiffHunks,
  DaemonGitLog,
  DaemonGitCommitDetail,
  DaemonGitBranchesResult,
  DaemonGitCheckoutResult,
  DaemonGitPushResult,
  DaemonGitPullResult,
  DaemonGitCommitResult,
  DaemonGitHubPullRequestList,
  DaemonGitHubPullRequestCreateResult,
  DaemonWorkspaceMcpStatus,
  DaemonWorkspaceMcpInitializeResult,
  DaemonWorkspaceMcpReloadOptions,
  DaemonWorkspaceMcpToolsStatus,
  DaemonWorkspaceMcpResourcesStatus,
  DaemonWorkspaceMemoryStatus,
  DaemonWorkspacePreflightStatus,
  DaemonWorkspaceProvidersStatus,
  DaemonWorkspaceAcpStatusResult,
  DaemonWorkspaceAcpPreheatResult,
  DaemonWorkspaceSkillsStatus,
  DaemonWorkspaceToolsStatus,
  DaemonWriteMemoryRequest,
  DaemonWriteMemoryResult,
  DaemonWorkspaceMemoryDreamOptions,
  DaemonWorkspaceMemoryDreamTask,
  DaemonWorkspaceMemoryForgetOptions,
  DaemonWorkspaceMemoryForgetTask,
  DaemonWorkspaceMemoryRememberOptions,
  DaemonWorkspaceMemoryRememberTask,
  DaemonWorkspaceCapability,
  DaemonWorkspaceRemovalResult,
  DaemonWorkspaceUpdate,
  HeartbeatResult,
  PermissionResponse,
  PromptContentBlock,
  PromptResult,
  SetModelResult,
  SetSessionLanguageResult,
  SessionMetadataResult,
  DaemonApprovalMode,
  DaemonApprovalModeResult,
  DaemonGithubSetupRequest,
  DaemonGithubSetupResult,
  DaemonInitWorkspaceResult,
  DaemonMcpRestartResult,
  DaemonReloadResponse,
  DaemonChannelDelivery,
  DaemonChannelNotifyRequest,
  DaemonChannelNotifyResult,
  DaemonChannelReloadResult,
  DaemonChannelManagementOptions,
  DaemonChannelMutationResult,
  DaemonChannelPairingApprovalRequest,
  DaemonChannelPairingApprovalResult,
  DaemonChannelPairingApprovalsSnapshot,
  DaemonChannelPairingRequestsSnapshot,
  DaemonChannelPairingRevocationRequest,
  DaemonChannelPairingRevocationResult,
  DaemonChannelsSnapshot,
  DaemonChannelStartupRequest,
  DaemonChannelTypeCatalog,
  DaemonChannelUpsertRequest,
  DaemonRevisionRequest,
  DaemonChannelControlState,
  DaemonChannelSelection,
  DaemonChannelSetResult,
  DaemonChannelStopResult,
  DaemonMcpManageAction,
  DaemonMcpManageResult,
  DaemonSessionBtwResult,
  DaemonSessionGenerationEvent,
  DaemonMidTurnMessageResult,
  DaemonMidTurnMessagesResult,
  DaemonRemoveMidTurnMessageResult,
  DaemonPendingPromptsResult,
  DaemonRemovePendingPromptResult,
  DaemonSessionRecapResult,
  DaemonShellCommandResult,
  DaemonRuntimeMcpAddRequest,
  DaemonRuntimeMcpAddResult,
  DaemonRuntimeMcpRemoveResult,
  DaemonToolToggleResult,
  DaemonSkillBatchToggleResult,
  DaemonSkillToggleResult,
  DaemonSkillInstallRequest,
  DaemonSkillMutationResult,
  DaemonSkillScope,
  DaemonSessionArtifactInput,
  DaemonSessionArtifactMutationResult,
  DaemonSessionArtifactsEnvelope,
  DaemonRewindSnapshotInfo,
  DaemonRewindResult,
  ForkSessionRequest,
  DaemonSessionHooksStatus,
  DaemonWorkspaceExtensionsStatus,
  ExtensionMutationResponse,
  ExtensionInstallRequest,
  ExtensionArchiveInstallRequest,
  ExtensionManagementInstallRequest,
  ExtensionActivationState,
  ExtensionCatalog,
  ExtensionInstallResponse,
  ExtensionInteractionResponse,
  ExtensionInteractionResponseResult,
  ExtensionActiveOperations,
  ExtensionOperationStatus,
  ExtensionScopeRequest,
  ExtensionRefreshResponse,
  ExtensionUpdateCheckResponse,
  WorkspaceExtensionProjection,
  DaemonWorkspaceHooksStatus,
  DaemonPermissionRuleType,
  DaemonPermissionScope,
  DaemonWorkspaceSettingsStatus,
  DaemonWorkspacePermissionsStatus,
  DaemonSettingUpdateResult,
  DaemonModelDeleteRequest,
  DaemonModelDeleteResult,
  DaemonVoiceAudioInput,
  DaemonWorkspaceVoiceStatus,
  DaemonWorkspaceVoiceTranscribeOptions,
  DaemonWorkspaceVoiceTranscriptionResult,
  DaemonWorkspaceVoiceUpdate,
  DaemonLiveMuteUpdate,
  DaemonLiveSetupStatus,
  DaemonLiveSetupUpdate,
  DaemonLiveStatus,
  DaemonWorkspaceTrustChangeRequest,
  DaemonWorkspaceTrustChangeResult,
  DaemonWorkspaceTrustStatus,
  DaemonWorkspaceTrustStatusV2,
  DaemonUnarchiveSessionsResult,
} from './types.js';
/**
 * SDK-side HTTP client for the `qwen serve` daemon. Sibling to
 * `ProcessTransport`: ProcessTransport drives a stdio child running
 * `qwen --input-format stream-json`; DaemonClient hits the daemon's HTTP
 * routes (POST /session, POST /session/:id/prompt, GET /session/:id/events,
 * etc.) and yields ACP-flavored events.
 *
 * The two surfaces are NOT interchangeable — they speak different protocols
 * (stream-json vs ACP NDJSON). DaemonClient lives alongside ProcessTransport
 * so applications that want daemon-mode (cross-client attach, shared MCP
 * pool, network reachability) can opt in without disturbing the existing
 * `query()` flow that subprocess-mode users rely on.
 */
export interface DaemonClientOptions {
  /** Daemon base URL (e.g. `http://127.0.0.1:4170`). Trailing slash is stripped. */
  baseUrl: string;
  /** Bearer token; required for non-loopback daemon binds. */
  token?: string;
  /**
   * Override the global `fetch` for tests. Defaults to `globalThis.fetch`.
   * Note: AbortController/AbortSignal must be Node-native for the default
   * to work (jsdom's polyfill is incompatible with undici).
   */
  fetch?: typeof globalThis.fetch;
  /**
   * Per-call request timeout in milliseconds. Applied to short-lived
   * methods (`health`, `capabilities`, `createOrAttachSession`,
   * `listWorkspaceSessions`, read-only status routes, `setSessionModel`,
   * `cancel`, `respondToPermission`) so an unresponsive daemon doesn't block
   * callers indefinitely. **NOT** applied to `prompt()` — model + tool
   * turns can take minutes, so prompt explicitly bypasses
   * `fetchTimeoutMs`; cancellation is via the optional `signal` arg.
   * Streaming (`subscribeEvents`) is similarly excluded for the
   * long-lived SSE body, though it does apply `fetchTimeoutMs` to the
   * initial connect phase (request → headers received).
   * Defaults to 30s. Set to `0` or `Infinity` to disable.
   */
  fetchTimeoutMs?: number;
  /**
   * Per-session cap on local `prompt()` calls that have been admitted but
   * not completed. For 202 daemons the slot is held until the temporary
   * SSE wait finishes. Defaults to 5. Set to `0` or `Infinity` to
   * disable; `null` is accepted for direct
   * `/capabilities.limits` passthrough.
   */
  maxPendingPromptsPerSession?: number | null;
  /**
   * Pluggable transport. When omitted, a `RestSseTransport` is created
   * automatically — this preserves the existing REST+SSE behavior with
   * zero caller-side changes. Pass an `AcpWsTransport` or
   * `AcpHttpTransport` to use JSON-RPC over WebSocket or HTTP. Rewind APIs
   * intentionally use direct REST even when an ACP transport is configured so
   * owner routing and strict mutation authentication remain authoritative.
   */
  transport?: DaemonTransport;
}
export declare function normalizePendingPromptLimit(
  value: number | null | undefined,
): number;
export { DaemonHttpError } from './DaemonHttpError.js';
/**
 * SDK-side representation of the daemon's `prompt_queue_full` condition.
 * Mirrors the bridge-side `PromptQueueFullError` wire data.
 */
export declare class DaemonPendingPromptLimitError extends Error {
  readonly sessionId: string;
  readonly limit: number;
  readonly pendingCount: number;
  constructor(sessionId: string, limit: number, pendingCount: number);
}
export declare class DaemonSessionIdProtocolError extends Error {
  readonly requestedSessionId: string;
  readonly actualSessionId: string;
  constructor(requestedSessionId: string, actualSessionId: string);
}
export interface DaemonTurnError extends DaemonHttpError {
  _daemonTurnError: true;
}
export declare const EXTENSION_ARCHIVE_UPLOAD_TIMEOUT_MS = 120000;
export declare function isDaemonTurnError(
  error: unknown,
): error is DaemonTurnError;
export interface CreateSessionRequest {
  /**
   * Workspace path the daemon must have registered. When
   * omitted, the SDK sends no `cwd` field and the daemon route falls
   * back to its primary workspace. Pass `caps.workspaceCwd` to be
   * explicit, pass a trusted `caps.workspaces[].cwd` when
   * `multi_workspace_sessions` is advertised, or omit it for the
   * daemon-knows-best path. A non-empty `workspaceCwd` that doesn't
   * canonicalize to a registered workspace yields a
   * `400 workspace_mismatch` `DaemonHttpError`.
   */
  workspaceCwd?: string;
  /**
   * UUID v1-v5 to assign to a new thread session. This is creation, not an
   * idempotent attach; use load/resume after an ambiguous response.
   */
  sessionId?: string;
  modelServiceId?: string;
  /**
   * Per-request session-scope override. The production daemon defaults
   * to `'single'`, which coalesces same-workspace `POST /session` calls
   * into one shared session; passing `sessionScope: 'thread'` here
   * forces a distinct session for this call. The reverse override
   * (per-request `'single'` against a daemon defaulting to `'thread'`)
   * is also supported, though the daemon's default is hardcoded to
   * `'single'` today. Omit
   * to inherit the daemon-wide default.
   *
   * Only `'single'` and `'thread'` are accepted; anything else yields
   * `400 invalid_session_scope`. Old daemons silently
   * ignore the field — clients should pre-flight
   * `caps.features.session_scope_override` before sending.
   */
  sessionScope?: 'single' | 'thread';
  approvalMode?: string;
  /** Immutable creator attribution stored with a newly created session. */
  sourceType?: string;
  /** Optional source-specific identifier. Requires `sourceType`. */
  sourceId?: string;
  /**
   * Create the session in an isolated git worktree. The daemon creates
   * a worktree under `<repoRoot>/.qwen/worktrees/<slug>` and relocates
   * the session's working directory into it. Pass `{}` for an
   * auto-generated slug, or `{ slug: 'my-task' }` for a named one.
   * Requires the workspace to be a git repository. Worktree sessions
   * are always created with `sessionScope: 'thread'`.
   */
  worktree?: {
    slug?: string;
  };
  /**
   * Create a new git branch and check it out before starting the
   * session. The session runs in the same working directory but on
   * the new branch. Mutually exclusive with `worktree`. Branch
   * sessions are always created with `sessionScope: 'thread'`.
   */
  branch?: {
    name: string;
  };
}
export interface RestoreSessionRequest {
  /**
   * Workspace path the daemon must have registered. Omit to let the daemon use
   * its advertised primary workspace, mirroring `createOrAttachSession`.
   */
  workspaceCwd?: string;
  approvalMode?: string;
  /** Latest persisted records to include in the initial load replay. */
  historyPageSize?: number;
  /**
   * Client-side deadline for this restore request. `0` disables the client
   * timer and relies on the daemon's own restore deadline.
   */
  timeoutMs?: number;
}
export interface PromptRequest {
  prompt: PromptContentBlock[];
  /** Deliver the successful final answer directly through a channel worker. */
  delivery?: DaemonChannelDelivery;
  /** Optional ACP _meta passthrough. */
  _meta?: Record<string, unknown> | null;
  /**
   * Per-prompt wallclock cap (positive integer ms).
   * The effective deadline is `min(server flag, this)` — the request
   * can shorten, never extend. When omitted, the server's
   * `--prompt-deadline-ms` flag governs alone (unlimited when both
   * are unset). On expiry the daemon returns 504 +
   * `errorKind: 'prompt_deadline_exceeded'`.
   *
   * Daemons without `prompt_absolute_deadline` capability
   * tag) silently ignore the field — pre-flight
   * `caps.features.includes('prompt_absolute_deadline')` before
   * relying on it.
   */
  deadlineMs?: number;
  [key: string]: unknown;
}
/**
 * 202 Accepted envelope returned by non-blocking
 * `POST /session/:id/prompt`.
 */
export interface NonBlockingPromptAccepted {
  promptId: string;
  lastEventId: number;
  /**
   * Epoch token of the bus that produced `lastEventId`. Clients that seed
   * an SSE resume cursor from this envelope should pass it back via
   * {@link SubscribeOptions.epoch} so a daemon restart in between is
   * detected (`state_resync_required` reason `epoch_reset`). Absent on
   * older daemons.
   */
  eventEpoch?: string;
}
export interface SubscribeOptions {
  /** Resume from after this event id (`Last-Event-ID` header). */
  lastEventId?: number;
  /**
   * Epoch token of the bus that produced {@link lastEventId}, learned from
   * a load/resume response (`eventEpoch`), a 202 prompt envelope, or a
   * previous subscription's `X-Qwen-Event-Epoch` response header. Sent
   * alongside `Last-Event-ID`; a daemon whose bus epoch differs forces a
   * resync instead of guessing from event-id arithmetic. Ignored without
   * {@link lastEventId}; old daemons ignore the header entirely.
   */
  epoch?: string;
  /**
   * Receives the daemon's current bus epoch when the subscription learns
   * it from the `X-Qwen-Event-Epoch` response header. Persist it and pass
   * it back via {@link epoch} on reconnect.
   */
  onEpoch?: (epoch: string) => void;
  /** Aborts the subscription cleanly. */
  signal?: AbortSignal;
  /**
   * Per-subscriber backlog cap requested from the daemon. Forwarded as
   * `?maxQueued=N` on `GET /session/:id/events`. Daemon-side range is
   * `[16, 2048]` (default 256); out-of-range or non-decimal values get
   * a `400 invalid_max_queued` response. Old daemons without the
   * `slow_client_warning` capability silently ignore the param — SDK
   * clients should pre-flight `caps.features.slow_client_warning`
   * before opting in. Useful for cold reconnects with a large
   * `Last-Event-ID: 0` replay backlog so the force-pushed replay
   * frames don't trip the warn / eviction path on the first publish.
   */
  maxQueued?: number;
  /** Client identity forwarded on REST/SSE subscriptions. */
  clientId?: string;
  /** Diagnostic-only reason for opening this REST/SSE connection. */
  sseConnectReason?: DaemonSseConnectReason;
  /** Diagnostic-only predecessor of this REST/SSE connection. */
  previousSseStreamId?: string;
  /**
   * Called after a REST/SSE handshake is accepted. The id is undefined when
   * an older daemon or intermediary omits a valid stream-id response header.
   */
  onSseStreamAccepted?: (streamId: string | undefined) => void;
}
export declare class DaemonClient {
  private readonly baseUrl;
  private readonly token;
  private readonly _fetch;
  private readonly fetchTimeoutMs;
  private readonly hasExplicitFetchTimeout;
  private cachedSessionRestoreTimeoutMs;
  private readonly promptLimit;
  private readonly promptCounts;
  /**
   * Pluggable transport layer. Defaults to `RestSseTransport` when
   * no explicit transport is supplied — preserving the pre-abstraction
   * REST+SSE behavior with zero breaking changes.
   */
  readonly transport: DaemonTransport;
  private _authFlow?;
  /**
   * High-level auth helper. Wraps the four
   * `*DeviceFlow*` methods with a `start(...).awaitCompletion()` shape
   * for the common "log in remotely" UX. Lazy-constructed.
   */
  get auth(): DaemonAuthFlow;
  constructor(opts: DaemonClientOptions);
  get maxPendingPromptsPerSession(): number;
  /** @internal */
  reservePromptSlot(sessionId: string, limit?: number): () => void;
  /**
   * Wrap a fetch call with the per-client `fetchTimeoutMs`. If the caller
   * passes their own `signal`, both signals abort the request via
   * `AbortSignal.any`, so caller cancellation and the per-call timeout
   * compose. Streaming endpoints (subscribeEvents) call `_fetch` directly
   * to skip the timeout — long-lived SSE connections must not be killed
   * by it.
   */
  private fetchWithTimeout;
  private headers;
  private failOnError;
  private jsonRequest;
  /** @internal */
  workspaceJsonRequest<T>(
    workspaceSelector: string,
    path: string,
    label: string,
    opts?: {
      method?: string;
      body?: unknown;
      clientId?: string;
      timeoutMs?: number;
      mode?: 'transport' | 'rest';
      signal?: AbortSignal;
    },
  ): Promise<T>;
  /** @internal */
  sessionExportRequest(
    path: string,
    label: string,
    opts?: {
      format?: DaemonSessionExportFormat;
      clientId?: string;
    },
  ): Promise<DaemonSessionExportResult>;
  /** @internal */
  workspaceNoContentRequest(
    workspaceSelector: string,
    path: string,
    label: string,
    opts?: {
      method?: string;
      clientId?: string;
      timeoutMs?: number;
      okNotFoundCode?: string;
    },
  ): Promise<void>;
  workspaceById(workspaceId: string): WorkspaceDaemonClient;
  workspaceByCwd(workspaceCwd: string): WorkspaceDaemonClient;
  health(): Promise<{
    status: string;
  }>;
  capabilities(): Promise<DaemonCapabilities>;
  /**
   * Send text directly through the primary workspace's channel worker.
   * This does not create or prompt an Agent session. Pre-flight the
   * `channel_delivery` capability before calling across mixed daemon versions.
   * A successful capability check does not guarantee worker liveness; callers
   * must treat 503 `channel_worker_unavailable` as an expected outcome.
   */
  notify(
    req: DaemonChannelNotifyRequest,
    opts?: {
      timeoutMs?: number;
    },
  ): Promise<DaemonChannelNotifyResult>;
  requireCapability(capability: string): Promise<void>;
  /**
   * Consolidated daemon status report (`GET /daemon/status`). The default
   * `summary` detail reads cheap in-memory counters; `full` adds per-session,
   * ACP-connection, auth, and workspace diagnostics sections.
   */
  daemonStatus(detail?: DaemonStatusReportDetail): Promise<DaemonStatusReport>;
  /**
   * Aggregate local token-usage dashboard (`GET /usage/dashboard`): the
   * selected range's flattened totals plus a trailing per-day heatmap, read
   * from the durable local usage history (global, cross-project). `range`
   * scopes the summary (default `today`); `heatmapDays` sets the heatmap
   * window (default ~6 months, server-clamped to 1..366).
   */
  usageDashboard(opts?: {
    range?: DaemonUsageRange;
    heatmapDays?: number;
  }): Promise<DaemonUsageDashboard>;
  workspaceMcp(): Promise<DaemonWorkspaceMcpStatus>;
  initializeWorkspaceMcp(): Promise<DaemonWorkspaceMcpInitializeResult>;
  reloadWorkspaceMcp(
    options?: DaemonWorkspaceMcpReloadOptions,
  ): Promise<DaemonWorkspaceMcpInitializeResult>;
  workspaceGit(opts?: { wait?: boolean }): Promise<DaemonWorkspaceGitStatus>;
  workspaceGitDiff(): Promise<DaemonWorkspaceGitDiff>;
  workspaceGitDiffFile(
    path: string,
    oldPath?: string,
  ): Promise<DaemonWorkspaceGitDiffHunks>;
  workspaceGitLog(
    limit?: number,
    skip?: number,
    range?: string,
  ): Promise<DaemonGitLog>;
  workspaceGitCommitDetail(sha: string): Promise<DaemonGitCommitDetail>;
  workspaceGitBranches(): Promise<DaemonGitBranchesResult>;
  workspaceGitCheckout(ref: string): Promise<DaemonGitCheckoutResult>;
  workspaceGitCreateBranch(
    name: string,
    startPoint?: string,
  ): Promise<DaemonGitCheckoutResult>;
  workspaceGitPush(opts?: {
    setUpstream?: boolean;
    force?: boolean;
  }): Promise<DaemonGitPushResult>;
  workspaceGitPull(opts?: {
    rebase?: boolean;
    fetchOnly?: boolean;
  }): Promise<DaemonGitPullResult>;
  workspaceGitCommit(
    message: string,
    opts?: {
      all?: boolean;
    },
  ): Promise<DaemonGitCommitResult>;
  workspaceMcpTools(serverName: string): Promise<DaemonWorkspaceMcpToolsStatus>;
  workspaceMcpResources(
    serverName: string,
  ): Promise<DaemonWorkspaceMcpResourcesStatus>;
  workspaceSkills(): Promise<DaemonWorkspaceSkillsStatus>;
  workspaceAcpPreheat(
    timeoutMs?: number,
  ): Promise<DaemonWorkspaceAcpPreheatResult>;
  workspaceAcpStatus(): Promise<DaemonWorkspaceAcpStatusResult>;
  workspaceProviders(): Promise<DaemonWorkspaceProvidersStatus>;
  workspaceHooks(): Promise<DaemonWorkspaceHooksStatus>;
  sessionHooks(sessionId: string): Promise<DaemonSessionHooksStatus>;
  workspaceExtensions(): Promise<DaemonWorkspaceExtensionsStatus>;
  installExtension(
    params: ExtensionInstallRequest,
    clientId?: string,
  ): Promise<ExtensionInstallResponse>;
  installExtensionArchive(
    params: ExtensionArchiveInstallRequest,
    clientId?: string,
  ): Promise<ExtensionInstallResponse>;
  extensionOperationStatus(
    operationId: string,
  ): Promise<ExtensionOperationStatus>;
  activeExtensionOperations(): Promise<ExtensionActiveOperations>;
  respondToExtensionInteraction(
    operationId: string,
    interactionId: string,
    response: ExtensionInteractionResponse,
    clientId?: string,
  ): Promise<ExtensionInteractionResponseResult>;
  checkExtensionUpdates(
    clientId?: string,
  ): Promise<ExtensionUpdateCheckResponse>;
  refreshExtensions(clientId?: string): Promise<ExtensionRefreshResponse>;
  enableExtension(
    name: string,
    params: ExtensionScopeRequest,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  disableExtension(
    name: string,
    params: ExtensionScopeRequest,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  updateExtension(
    name: string,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  uninstallExtension(
    name: string,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  extensionCatalog(): Promise<ExtensionCatalog>;
  installUserExtension(
    params: ExtensionManagementInstallRequest,
    clientId?: string,
  ): Promise<ExtensionInstallResponse>;
  checkUserExtensionUpdates(
    clientId?: string,
  ): Promise<ExtensionInstallResponse>;
  updateUserExtension(
    extensionId: string,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  uninstallUserExtension(
    extensionId: string,
    clientId?: string,
  ): Promise<ExtensionMutationResponse | undefined>;
  setExtensionDefaultActivation(
    extensionId: string,
    state: ExtensionActivationState,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  extensionOperation(
    operationId: string,
    signal?: AbortSignal,
  ): Promise<ExtensionOperationStatus>;
  waitForExtensionOperation(
    handle: ExtensionInstallResponse,
    options?: {
      pollIntervalMs?: number;
      timeoutMs?: number;
      signal?: AbortSignal;
    },
  ): Promise<ExtensionOperationStatus>;
  readWorkspaceFile(
    filePath: string,
    opts?: {
      maxBytes?: number;
      line?: number;
      limit?: number;
      cursor?: string;
    },
    clientId?: string,
  ): Promise<DaemonWorkspaceFile>;
  readWorkspaceFileBytes(
    filePath: string,
    opts?: {
      offset?: number;
      maxBytes?: number;
    },
    clientId?: string,
  ): Promise<DaemonWorkspaceFileBytes>;
  fileStat(filePath: string): Promise<unknown>;
  dirList(dirPath: string): Promise<unknown>;
  /**
   * Directory-name suggestions for an absolute path prefix, for flows that
   * pick a path outside any registered workspace (e.g. "Add workspace").
   */
  workspacePathSuggestions(prefix: string): Promise<unknown>;
  workspaceDirectoryPicker(): Promise<unknown>;
  glob(pattern: string): Promise<unknown>;
  writeWorkspaceFile(
    req: DaemonWorkspaceFileWriteRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceFileWriteResult>;
  editWorkspaceFile(
    req: DaemonWorkspaceFileEditRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceFileEditResult>;
  /**
   * Upload binary bytes to the workspace. Shared raw-POST core used by both
   * the legacy-primary `uploadWorkspaceFile` and the workspace-qualified
   * variant, parameterized by URL path + route label. Keeps auth headers,
   * timeout/abort composition, progress transport, and `DaemonHttpError`
   * construction in one place.
   *
   * Uses `XMLHttpRequest` when `req.onProgress` is provided (`fetch` exposes
   * no upload progress); plain `fetch` otherwise. Progress is browser-only:
   * requesting it where `XMLHttpRequest` is unavailable fails before sending.
   *
   * @internal
   */
  uploadFileToPath(
    uploadPath: string,
    label: string,
    req: DaemonWorkspaceFileUploadRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceFileUploadResult>;
  private uploadWithProgress;
  uploadWorkspaceFile(
    req: DaemonWorkspaceFileUploadRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceFileUploadResult>;
  /**
   * Fetch the daemon's `QWEN.md` / `AGENTS.md` snapshot. Read-only;
   * pre-flight `caps.features.workspace_memory` before calling
   * against an unknown daemon. Returns `initialized: false` and an
   * empty `files` array when no memory files exist at the bound
   * workspace root or `~/.qwen`.
   *
   * v1 discovers files at the bound workspace ROOT only, plus the
   * user's global `~/.qwen` directory — it does NOT walk parent
   * directories or recurse into the workspace tree. The route's
   * companion helper `walkWorkspaceForMemory` keeps a guarded
   * upward-walk loop body for a future hierarchical mode but breaks
   * after iteration 1 in this release.
   */
  workspaceMemory(): Promise<DaemonWorkspaceMemoryStatus>;
  /**
   * Append to or replace `QWEN.md` at workspace or global scope.
   * Strict mutation gate (`token_required` on no-token loopback
   * defaults). When the daemon advertises `workspace_memory`, expect
   * 200 with `{ ok, filePath, bytesWritten, mode }`; older daemons
   * without the capability return 404.
   */
  writeWorkspaceMemory(
    req: DaemonWriteMemoryRequest,
    clientId?: string,
  ): Promise<DaemonWriteMemoryResult>;
  /**
   * Queue a hidden managed-memory remember task for the daemon's bound
   * workspace. This does not require an existing session; callers should
   * poll `getWorkspaceMemoryRememberTask()` until the task is terminal.
   */
  rememberWorkspaceMemory(
    content: string,
    opts?: DaemonWorkspaceMemoryRememberOptions,
  ): Promise<DaemonWorkspaceMemoryRememberTask>;
  getWorkspaceMemoryRememberTask(
    taskId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonWorkspaceMemoryRememberTask>;
  forgetWorkspaceMemory(
    query: string,
    opts?: DaemonWorkspaceMemoryForgetOptions,
  ): Promise<DaemonWorkspaceMemoryForgetTask>;
  getWorkspaceMemoryForgetTask(
    taskId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonWorkspaceMemoryForgetTask>;
  dreamWorkspaceMemory(
    opts?: DaemonWorkspaceMemoryDreamOptions,
  ): Promise<DaemonWorkspaceMemoryDreamTask>;
  getWorkspaceMemoryDreamTask(
    taskId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonWorkspaceMemoryDreamTask>;
  listWorkspaceAgents(): Promise<DaemonWorkspaceAgentsStatus>;
  /**
   * Create a project- or user-level subagent. 409 `agent_already_exists`
   * when a same-name agent is already registered at the chosen level;
   * 422 `invalid_config` for validation failures.
   */
  createWorkspaceAgent(
    req: DaemonCreateAgentRequest,
    clientId?: string,
  ): Promise<DaemonAgentMutationResult>;
  generateWorkspaceAgent(
    description: string,
    clientId?: string,
  ): Promise<DaemonGeneratedAgentContent>;
  private generateContentEvents;
  generateWorkspaceContent(
    prompt: string,
    opts?: {
      signal?: AbortSignal;
      clientId?: string;
    },
  ): AsyncGenerator<DaemonWorkspaceGenerationEvent>;
  getWorkspaceAgent(
    agentType: string,
    opts?: {
      scope?: 'workspace' | 'global';
    },
  ): Promise<DaemonWorkspaceAgentDetail>;
  /**
   * Update a project- or user-level subagent definition. Built-in /
   * extension / session-level agents are read-only and return 403
   * `agent_readonly`; missing agents return 404 `agent_not_found`.
   *
   * Optional `scope` mirrors the delete helper: when a project agent
   * shadows a user-level agent of the same name, pass
   * `{ scope: 'global' }` to update the user-level definition
   * specifically. Without the scope the daemon resolves through the
   * default precedence (project > user) and updates the project entry.
   */
  updateWorkspaceAgent(
    agentType: string,
    req: DaemonUpdateAgentRequest,
    opts?: {
      scope?: 'workspace' | 'global';
    },
    clientId?: string,
  ): Promise<DaemonAgentMutationResult>;
  /**
   * Delete a project- or user-level subagent definition. Optional
   * `scope` query narrows deletion to one level when the same name
   * exists at both. Idempotent for SDK callers — both 204 (deleted)
   * and 404 (already gone) resolve successfully.
   */
  deleteWorkspaceAgent(
    agentType: string,
    opts?: {
      scope?: 'workspace' | 'global';
    },
    clientId?: string,
  ): Promise<void>;
  workspaceEnv(): Promise<DaemonWorkspaceEnvStatus>;
  workspacePreflight(): Promise<DaemonWorkspacePreflightStatus>;
  workspaceTools(): Promise<DaemonWorkspaceToolsStatus>;
  createOrAttachSession(
    req: CreateSessionRequest,
    clientId?: string,
  ): Promise<DaemonSession>;
  /**
   * Enumerate the session catalog for a workspace. Used by session-picker UIs.
   * Returns an empty list (not 404) when the workspace has no sessions.
   */
  listWorkspaceSessions(
    workspaceCwd: string,
    options?: {
      pageSize?: number;
      archiveState?: DaemonSessionArchiveState;
      parentSessionId?: string;
      sourceType?: string;
      sourceId?: string;
    },
  ): Promise<DaemonSessionSummary[]>;
  listWorkspaceSessionsPage(
    workspaceCwd: string,
    options?: DaemonSessionListPageOptions,
  ): Promise<DaemonSessionListPage>;
  listSessionGroups(workspaceCwd: string): Promise<DaemonSessionGroupCatalog>;
  createSessionGroup(
    workspaceCwd: string,
    input: DaemonSessionGroupInput,
  ): Promise<DaemonSessionGroup>;
  updateSessionGroup(
    workspaceCwd: string,
    groupId: string,
    update: DaemonSessionGroupUpdate,
  ): Promise<DaemonSessionGroup>;
  deleteSessionGroup(
    workspaceCwd: string,
    groupId: string,
  ): Promise<{
    deleted: boolean;
  }>;
  updateSessionOrganization(
    sessionId: string,
    update: DaemonSessionOrganizationUpdate,
    clientId?: string,
  ): Promise<DaemonSessionOrganizationResult>;
  loadSession(
    sessionId: string,
    req?: RestoreSessionRequest,
    clientId?: string,
  ): Promise<DaemonRestoredSession>;
  exportSession(
    sessionId: string,
    opts?: {
      format?: DaemonSessionExportFormat;
      clientId?: string;
    },
  ): Promise<DaemonSessionExportResult>;
  getSessionTranscriptPage(
    sessionId: string,
    opts?: DaemonSessionTranscriptPageOptions,
  ): Promise<DaemonSessionTranscriptPage>;
  resolveSubagentSession(
    sessionId: string,
    subagentRef: string,
    clientId?: string,
  ): Promise<DaemonSubagentSessionResolution>;
  cancelSubagentSession(
    sessionId: string,
    subagentRef: string,
    clientId?: string,
  ): Promise<{
    cancelled: boolean;
  }>;
  resumeSession(
    sessionId: string,
    req?: RestoreSessionRequest,
    clientId?: string,
  ): Promise<DaemonRestoredSession>;
  branchSession(
    sessionId: string,
    req?: BranchSessionRequest,
    clientId?: string,
  ): Promise<DaemonBranchedSession>;
  createSideTaskSession(
    sessionId: string,
    req?: SideTaskSessionRequest,
    clientId?: string,
  ): Promise<DaemonSideTaskSession>;
  forkSession(
    sessionId: string,
    req: ForkSessionRequest,
    clientId?: string,
  ): Promise<DaemonForkSessionResult>;
  sessionContext(
    sessionId: string,
    clientId?: string,
  ): Promise<DaemonSessionContextStatus>;
  /**
   * Read the current in-memory runtime status for one live daemon session.
   */
  sessionStatus(
    sessionId: string,
    clientId?: string,
  ): Promise<DaemonSessionSummary>;
  sessionContextUsage(
    sessionId: string,
    opts?: {
      detail?: boolean;
    },
    clientId?: string,
  ): Promise<DaemonSessionContextUsageStatus>;
  sessionSupportedCommands(
    sessionId: string,
    clientId?: string,
  ): Promise<DaemonSessionSupportedCommandsStatus>;
  sessionTasks(
    sessionId: string,
    clientId?: string,
  ): Promise<DaemonSessionTasksStatus>;
  sessionLspStatus(
    sessionId: string,
    clientId?: string,
  ): Promise<DaemonSessionLspStatus>;
  sessionTaskCancel(
    sessionId: string,
    taskId: string,
    kind: DaemonSessionTaskStatus['kind'],
    clientId?: string,
  ): Promise<{
    cancelled: boolean;
  }>;
  sessionGoalClear(
    sessionId: string,
    clientId?: string,
  ): Promise<{
    cleared: boolean;
    condition?: string;
  }>;
  sessionStats(
    sessionId: string,
    clientId?: string,
  ): Promise<DaemonSessionStatsStatus>;
  /**
   * Shared transport for `loadSession` / `resumeSession`. Both routes
   * share an identical wire shape (POST /session/:id/{load|resume}
   * with optional `cwd` body) and identical error envelopes from the
   * daemon, so they collapse into a single fetch path that only
   * differs in the URL suffix and the route name reported on errors.
   */
  private restoreSession;
  private resolveRestoreTimeoutMs;
  /**
   * Change the approval mode of a live session.
   * The daemon applies the change in the ACP child's per-session
   * `Config` and publishes an `approval_mode_changed` event. Pass
   * `opts.persist: true` to also write `tools.approvalMode` to the
   * workspace settings file (default is ephemeral so a remote caller
   * does not pollute the user's host settings unless asked).
   *
   * Pre-flight `caps.features.session_approval_mode_control` before
   * calling — older daemons reject the route with 404.
   *
   * The trust-folder gate inside core's `setApprovalMode` rejects
   * privileged modes in untrusted folders; the route surfaces that
   * with HTTP 403 + `errorKind: 'auth_env_error'`.
   */
  setSessionApprovalMode(
    sessionId: string,
    mode: DaemonApprovalMode,
    opts?: {
      persist?: boolean;
      clientId?: string;
    },
  ): Promise<DaemonApprovalModeResult>;
  getRewindSnapshots(sessionId: string): Promise<{
    snapshots: DaemonRewindSnapshotInfo[];
  }>;
  rewindSession(
    sessionId: string,
    promptId: string,
    opts?: {
      clientId?: string;
      rewindFiles?: boolean;
    },
  ): Promise<DaemonRewindResult>;
  /**
   * Generate a one-sentence "where did I leave off"
   * recap of the session. Wraps `generateSessionRecap` (core/services/
   * sessionRecap.ts) via an ACP control-channel ext-method, so the
   * summary is computed against the active GeminiClient chat history
   * inside the daemon's ACP child.
   *
   * Non-strict mutation gate — posture matches `/session/:id/prompt`
   * (the route costs tokens but mutates no state). Calls `_fetch`
   * directly without the per-call `fetchTimeoutMs` wrapper because the
   * underlying side-query can take longer than the default 30s under
   * a slow model. Older daemons (pre-recap support) return 404 —
   * pre-flight `caps.features.session_recap` before calling.
   *
   * Cancellation: the optional `signal` aborts only the LOCAL HTTP
   * fetch. It does NOT propagate to the daemon — the bridge-side wait
   * continues until the 60s `SESSION_RECAP_TIMEOUT_MS` backstop, and
   * the side-query inside the ACP child always runs to completion (no
   * cross-process abort plumbing in v1). A future request-id-based
   * cancel ext-method will plumb a real signal end-to-end if/when the
   * bandwidth cost justifies it.
   *
   * `recap` may be `null` on too-short histories or transient model
   * failures (a 200 response with `recap: null`), per the best-effort
   * contract of the core helper.
   */
  recapSession(
    sessionId: string,
    opts?: {
      signal?: AbortSignal;
      clientId?: string;
    },
  ): Promise<DaemonSessionRecapResult>;
  generateSessionContent(
    sessionId: string,
    prompt: string,
    opts?: {
      signal?: AbortSignal;
      clientId?: string;
    },
  ): AsyncGenerator<DaemonSessionGenerationEvent>;
  btwSession(
    sessionId: string,
    question: string,
    opts?: {
      signal?: AbortSignal;
      clientId?: string;
    },
  ): Promise<DaemonSessionBtwResult>;
  /**
   * Queue a user message typed while the session's turn is still running. The
   * ACP child drains it between tool batches so the model sees it before the
   * turn ends. Every accepted request is daemon-owned; a caller-supplied id
   * makes ambiguous retries idempotent.
   */
  enqueueMidTurnMessage(
    sessionId: string,
    message: string,
    opts?: {
      signal?: AbortSignal;
      clientId?: string;
      messageId?: string;
    },
  ): Promise<DaemonMidTurnMessageResult>;
  removeMidTurnMessage(
    sessionId: string,
    messageId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonRemoveMidTurnMessageResult>;
  /**
   * Fetch the mid-turn reconciliation snapshot for a session: messages still
   * waiting in the daemon queue plus bounded terminal id rings.
   * Callers reconcile against this
   * instead of resending accepted messages at the idle boundary. Only available
   * when the daemon advertises `session_mid_turn_message_query` — older
   * daemons answer 404 and callers keep the legacy behavior.
   */
  getMidTurnMessages(
    sessionId: string,
    opts?: {
      clientId?: string;
      signal?: AbortSignal;
    },
  ): Promise<DaemonMidTurnMessagesResult>;
  /**
   * List prompts in the daemon's per-session pending queue. Includes the
   * currently running prompt (`state: 'running'`) and any FIFO-waiting
   * prompts (`state: 'queued'`). Returns an empty array when no prompts
   * are pending.
   */
  getPendingPrompts(
    sessionId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonPendingPromptsResult>;
  /**
   * Remove a specific prompt from the daemon's pending queue. For queued
   * prompts this aborts them so the FIFO skips dispatch; for the running
   * prompt this triggers a cancel. Returns `{ removed: false }` when the
   * promptId is not found.
   */
  removePendingPrompt(
    sessionId: string,
    promptId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonRemovePendingPromptResult>;
  /**
   * Execute a direct daemon-side shell command for a session. The daemon must
   * be started with direct session shell enabled and bearer auth configured;
   * callers must also provide a client id already bound to this session.
   * Prefer `DaemonSessionClient.shellCommand()` when available because it
   * forwards the session-bound client id automatically.
   */
  shellCommand(
    sessionId: string,
    command: string,
    opts?: {
      signal?: AbortSignal;
      clientId?: string;
    },
  ): Promise<DaemonShellCommandResult>;
  /**
   * Toggle a tool name in the workspace's
   * `tools.disabled` settings list. Strict-gated mutation route — the
   * daemon must be configured with a bearer token. The daemon writes
   * the settings file directly and fan-outs a `tool_toggled` event to
   * every live session SSE bus.
   *
   * Already-registered tools in active sessions are NOT retroactively
   * unregistered. The toggle takes effect on the next ACP child spawn
   * — listeners that need the live tool list to reflect the change
   * should also `POST /workspace/mcp/:server/restart` (when the tool
   * is MCP-discovered) or open a new session.
   *
   * Pre-flight `caps.features.workspace_tool_toggle` before calling.
   */
  setWorkspaceToolEnabled(
    toolName: string,
    enabled: boolean,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonToolToggleResult>;
  /**
   * Toggle a user-invocable skill in workspace `skills.disabled` settings.
   * Active ACP sessions refresh their skill validation and command lists before
   * the response returns; `activation` reports deferred or partial refreshes.
   *
   * Pre-flight `caps.features.includes('workspace_skill_toggle')` before calling.
   */
  setWorkspaceSkillEnabled(
    skillName: string,
    enabled: boolean,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonSkillToggleResult>;
  /**
   * Toggle up to 100 user-invocable skills and return every target outcome.
   *
   * Pre-flight
   * `caps.features.includes('workspace_skill_batch_toggle')` before calling.
   */
  setWorkspaceSkillsEnabled(
    skillNames: readonly string[],
    enabled: boolean,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonSkillBatchToggleResult>;
  installWorkspaceSkill(
    request: DaemonSkillInstallRequest,
  ): Promise<DaemonSkillMutationResult>;
  deleteWorkspaceSkill(
    skillName: string,
    scope: DaemonSkillScope,
  ): Promise<DaemonSkillMutationResult>;
  workspaceSettings(opts?: {
    clientId?: string;
  }): Promise<DaemonWorkspaceSettingsStatus>;
  setWorkspaceSetting(
    scope: 'workspace' | 'user',
    key: string,
    value: unknown,
    opts?: {
      clientId?: string;
      mcpServerMutation?: {
        operation: 'set' | 'remove';
        name: string;
      };
    },
  ): Promise<DaemonSettingUpdateResult>;
  deleteModel(
    target: DaemonModelDeleteRequest,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonModelDeleteResult>;
  workspaceVoice(clientId?: string): Promise<DaemonWorkspaceVoiceStatus>;
  setWorkspaceVoice(
    update: DaemonWorkspaceVoiceUpdate,
    clientId?: string,
  ): Promise<DaemonWorkspaceVoiceStatus>;
  transcribeWorkspaceVoice(
    audio: DaemonVoiceAudioInput,
    opts: DaemonWorkspaceVoiceTranscribeOptions,
  ): Promise<DaemonWorkspaceVoiceTranscriptionResult>;
  liveStatus(clientId?: string): Promise<DaemonLiveStatus>;
  liveSetupStatus(clientId?: string): Promise<DaemonLiveSetupStatus>;
  updateLiveSetup(
    update: DaemonLiveSetupUpdate,
    clientId?: string,
  ): Promise<DaemonLiveSetupStatus>;
  retryLiveHostInstall(clientId?: string): Promise<DaemonLiveSetupStatus>;
  launchLiveHost(clientId?: string): Promise<DaemonLiveSetupStatus>;
  startLive(
    mode?: 'resume' | 'new',
    clientId?: string,
  ): Promise<DaemonLiveStatus>;
  stopLive(clientId?: string): Promise<DaemonLiveStatus>;
  setLiveMute(
    update: DaemonLiveMuteUpdate,
    clientId?: string,
  ): Promise<DaemonLiveStatus>;
  setLiveShortcut(
    shortcut: string,
    clientId?: string,
  ): Promise<DaemonLiveStatus>;
  /** @internal */
  workspaceVoiceTranscriptionRequest(
    workspaceSelector: string,
    audio: DaemonVoiceAudioInput,
    opts: DaemonWorkspaceVoiceTranscribeOptions,
  ): Promise<DaemonWorkspaceVoiceTranscriptionResult>;
  private voiceTranscriptionRequest;
  workspaceTrust(opts?: {
    clientId?: string;
    statusVersion?: 1;
  }): Promise<DaemonWorkspaceTrustStatus>;
  workspaceTrust(opts: {
    clientId?: string;
    statusVersion: 2;
  }): Promise<DaemonWorkspaceTrustStatus | DaemonWorkspaceTrustStatusV2>;
  requestWorkspaceTrustChange(
    request: DaemonWorkspaceTrustChangeRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceTrustChangeResult>;
  workspacePermissions(opts?: {
    clientId?: string;
  }): Promise<DaemonWorkspacePermissionsStatus>;
  /**
   * Replace one permission rule list.
   *
   * `capabilities.features` including `workspace_permissions` means the
   * daemon exposes the permissions surface. A write still needs a live ACP
   * session so the active child can receive the update; without one the
   * daemon rejects the request with `permission_session_required`.
   */
  setWorkspacePermissionRules(
    scope: DaemonPermissionScope,
    ruleType: DaemonPermissionRuleType,
    rules: readonly string[],
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonWorkspacePermissionsStatus>;
  /**
   * Convenience helper that appends a single rule to the specified scope/type
   * list. Performs a non-atomic read-modify-write: GETs the current rules,
   * appends the new rule locally, then POSTs the full replacement list.
   *
   * @remarks Not safe for concurrent use — a concurrent modification between
   * the GET and POST will be silently overwritten (lost-update / TOCTOU).
   */
  addWorkspacePermissionRule(
    scope: DaemonPermissionScope,
    ruleType: DaemonPermissionRuleType,
    rule: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonWorkspacePermissionsStatus>;
  /**
   * Convenience helper that removes a single rule from the specified scope/type
   * list. Performs a non-atomic read-modify-write: GETs the current rules,
   * removes the rule locally, then POSTs the full replacement list.
   *
   * @remarks Not safe for concurrent use — a concurrent modification between
   * the GET and POST will be silently overwritten (lost-update / TOCTOU).
   */
  removeWorkspacePermissionRule(
    scope: DaemonPermissionScope,
    ruleType: DaemonPermissionRuleType,
    rule: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonWorkspacePermissionsStatus>;
  /**
   * Restart a configured MCP server through the ACP child's
   * `McpClientManager`. The daemon pre-checks the live budget
   * snapshot; soft refusals (in-flight discovery,
   * disabled server, budget would exceed under `enforce` mode) come
   * back as 200 OK with `{restarted: false, skipped: true, reason}`.
   * Only hard errors (unknown server name, no live ACP channel)
   * surface as non-2xx.
   *
   * The daemon-side restart waits up to 5 minutes for stdio MCP
   * discovery; the SDK default allows that budget plus 30s headroom
   * so a slow but valid restart isn't
   * aborted client-side while the daemon continues working. Callers can pass a custom
   * `timeoutMs` when their threat model needs a tighter cap, or `0`
   * to disable the timeout entirely.
   *
   * `entryIndex` targets one pooled entry by index. Use `'*'` to
   * restart all entries for a pooled server.
   *
   * Pre-flight `caps.features.workspace_mcp_restart` before calling.
   */
  restartMcpServer(
    serverName: string,
    opts?: {
      clientId?: string;
      entryIndex?: number | '*';
      timeoutMs?: number;
    },
  ): Promise<DaemonMcpRestartResult>;
  reload(opts?: {
    clientId?: string;
    timeoutMs?: number;
  }): Promise<DaemonReloadResponse>;
  /**
   * Reload the daemon-managed channel worker: the daemon stops and relaunches
   * it so it re-reads settings.json (channels / proxy / per-channel model).
   * Requires an enabled runtime selection; otherwise the route responds 409.
   * Pre-flight the dynamic `channel_reload` capability.
   */
  reloadChannelWorker(opts?: {
    clientId?: string;
    timeoutMs?: number;
  }): Promise<DaemonChannelReloadResult>;
  getChannelWorkerControl(opts?: {
    clientId?: string;
    timeoutMs?: number;
  }): Promise<DaemonChannelControlState>;
  setChannelWorkerSelection(
    selection: DaemonChannelSelection,
    opts?: {
      clientId?: string;
      timeoutMs?: number;
    },
  ): Promise<DaemonChannelSetResult>;
  stopChannelWorker(opts?: {
    clientId?: string;
    timeoutMs?: number;
  }): Promise<DaemonChannelStopResult>;
  workspaceChannelTypes(
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelTypeCatalog>;
  workspaceChannels(
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelsSnapshot>;
  upsertWorkspaceChannel(
    name: string,
    request: DaemonChannelUpsertRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  deleteWorkspaceChannel(
    name: string,
    request: DaemonRevisionRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  setWorkspaceChannelStartup(
    name: string,
    request: DaemonChannelStartupRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  startWorkspaceChannel(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  stopWorkspaceChannel(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  restartWorkspaceChannel(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  workspaceChannelPairingRequests(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingRequestsSnapshot>;
  approveWorkspaceChannelPairing(
    name: string,
    request: DaemonChannelPairingApprovalRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingApprovalResult>;
  workspaceChannelPairingApprovals(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingApprovalsSnapshot>;
  revokeWorkspaceChannelPairingApproval(
    name: string,
    request: DaemonChannelPairingRevocationRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingRevocationResult>;
  private workspaceChannelAction;
  manageMcpServer(
    serverName: string,
    action: DaemonMcpManageAction,
    opts?: {
      clientId?: string;
      timeoutMs?: number;
    },
  ): Promise<DaemonMcpManageResult>;
  /**
   * Add (or replace) a runtime MCP server. The daemon
   * validates the config, starts the server, and emits an
   * `mcp_server_added` SSE event to all live sessions. Callers
   * pre-flight `caps.features.mcp_server_runtime_mutation` before
   * calling — older daemons return 404.
   */
  addRuntimeMcpServer(
    request: DaemonRuntimeMcpAddRequest,
    opts?: {
      clientId?: string;
      timeoutMs?: number;
    },
  ): Promise<DaemonRuntimeMcpAddResult>;
  /**
   * Remove a runtime MCP server by name. The daemon
   * tears down the server process, removes it from the runtime
   * overlay, and emits an `mcp_server_removed` SSE event. Idempotent
   * at the HTTP level: if the server was never present the daemon
   * returns 200 with `{ skipped: true, reason: 'not_present' }`.
   * Pre-flight `caps.features.mcp_server_runtime_mutation` before
   * calling.
   */
  removeRuntimeMcpServer(
    name: string,
    opts?: {
      clientId?: string;
      timeoutMs?: number;
    },
  ): Promise<DaemonRuntimeMcpRemoveResult>;
  /**
   * Scaffold a `QWEN.md` at the daemon's bound
   * workspace root. Mechanical only — does NOT invoke the LLM. The
   * daemon writes an empty file; clients that want AI-driven content
   * fill should follow up with `POST /session/:id/prompt`.
   *
   * Default refuses to overwrite — when the file exists with non-
   * whitespace content the daemon returns 409
   * `workspace_init_conflict` with the existing path and size in the
   * body. Pass `opts.force: true` to overwrite unconditionally.
   *
   * Pre-flight `caps.features.workspace_init` before calling.
   */
  initWorkspace(opts?: {
    force?: boolean;
    clientId?: string;
  }): Promise<DaemonInitWorkspaceResult>;
  setupGithub(
    params: DaemonGithubSetupRequest,
    clientId?: string,
  ): Promise<DaemonGithubSetupResult>;
  /**
   * Switch the active model for a session. Backed by ACP's currently-unstable
   * `unstable_setSessionModel`; the daemon also publishes a `model_switched`
   * event so cross-client UIs can update.
   */
  setSessionModel(
    sessionId: string,
    modelId: string,
    clientId?: string,
  ): Promise<SetModelResult>;
  setSessionConfigOption(
    sessionId: string,
    configId: 'reasoning_effort',
    value: string,
    clientId?: string,
  ): Promise<DaemonSessionConfigOptionResult>;
  setSessionLanguage(
    sessionId: string,
    language: string,
    opts?: {
      syncOutputLanguage?: boolean;
      clientId?: string;
    },
  ): Promise<SetSessionLanguageResult>;
  /**
   * Send a prompt to the agent. Supports both blocking (legacy 200)
   * and non-blocking (202 + SSE `turn_complete`) daemon responses.
   *
   * For 202 daemons this opens a **temporary** SSE subscription to
   * await the matching `turn_complete`/`turn_error`. Callers that
   * already manage a long-lived SSE subscription (e.g.
   * `DaemonSessionClient`) should prefer {@link promptNonBlocking}
   * and correlate via their existing event stream to avoid the extra
   * connection.
   */
  prompt(
    sessionId: string,
    req: PromptRequest,
    signal?: AbortSignal,
    clientId?: string,
  ): Promise<PromptResult>;
  /**
   * Fire-and-forget prompt trigger. Returns the 202 acceptance
   * envelope (`{ promptId, lastEventId }`) without waiting for the
   * turn to complete. The caller is responsible for observing
   * `turn_complete` / `turn_error` on the session's SSE stream,
   * matching by `promptId`.
   *
   * This is the recommended path for callers that already maintain a
   * long-lived SSE subscription (like `DaemonSessionClient`) —
   * avoids the extra SSE connection that {@link prompt} opens for
   * the temporary 202 fallback.
   *
   * Falls back to `prompt()` for legacy 200 daemons.
   *
   * Note: this method does not enforce the local pending-prompt cap.
   * Callers that need early-fail behavior should use {@link prompt} or
   * reserve a slot before calling this method.
   */
  promptNonBlocking(
    sessionId: string,
    req: PromptRequest,
    signal?: AbortSignal,
    clientId?: string,
  ): Promise<NonBlockingPromptAccepted | PromptResult>;
  private _awaitTurnComplete;
  /**
   * Bump the daemon's last-seen bookkeeping for this session. The
   * route is short-lived — drives diagnostics and future revocation
   * policy -- so it goes through the standard
   * `fetchTimeoutMs`. Older daemons return 404 for
   * `/heartbeat`; clients should pre-flight
   * `caps.features.client_heartbeat` before calling.
   */
  heartbeat(sessionId: string, clientId?: string): Promise<HeartbeatResult>;
  cancel(sessionId: string, clientId?: string): Promise<void>;
  subscribeEvents(
    sessionId: string,
    opts?: SubscribeOptions,
  ): AsyncGenerator<DaemonEvent>;
  /**
   * Cast a permission vote. Returns true when the daemon accepted the vote,
   * false on 404 (request unknown or already resolved by another client —
   * the typical "lost the race" outcome under multi-client fan-out).
   */
  respondToPermission(
    requestId: string,
    response: PermissionResponse,
    clientId?: string,
  ): Promise<boolean>;
  /**
   * Cast a permission vote against an explicit daemon session. New clients
   * should prefer this once `capabilities.features` includes
   * `session_permission_vote`; the legacy request-id-only route remains for
   * older daemons.
   */
  respondToSessionPermission(
    sessionId: string,
    requestId: string,
    response: PermissionResponse,
    clientId?: string,
  ): Promise<boolean>;
  /**
   * Close a daemon session. The daemon treats DELETE as idempotent for SDK
   * callers: both 204 (closed) and 404 (already gone) resolve successfully.
   */
  closeSession(sessionId: string, clientId?: string): Promise<void>;
  detachSession(sessionId: string, clientId?: string): Promise<void>;
  deleteSessionsData(
    sessionIds: string[],
    clientId?: string,
  ): Promise<{
    removed: string[];
    notFound: string[];
    errors: Array<{
      sessionId: string;
      error: string;
    }>;
  }>;
  archiveSessionsData(
    sessionIds: string[],
    clientId?: string,
  ): Promise<DaemonArchiveSessionsResult>;
  unarchiveSessionsData(
    sessionIds: string[],
    clientId?: string,
  ): Promise<DaemonUnarchiveSessionsResult>;
  /**
   * Start an OAuth device-flow login for the given provider. The daemon
   * polls the IdP in the background and emits typed `auth_device_flow_*`
   * SSE events; callers can also poll `getDeviceFlow(...)`.
   *
   * Per-provider singleton: a repeat call while a flow is already pending
   * for the same provider is an idempotent take-over and returns the
   * existing entry rather than starting a fresh IdP request. The
   * `attached` field on the result distinguishes the two cases.
   */
  startDeviceFlow(opts: {
    providerId: DaemonAuthProviderId;
    clientId?: string;
  }): Promise<DaemonDeviceFlowStartResult>;
  getDeviceFlow(
    deviceFlowId: string,
    opts?: {
      clientId?: string;
      signal?: AbortSignal;
    },
  ): Promise<DaemonDeviceFlowState>;
  /**
   * Cancel a pending device-flow. Idempotent: terminal entries return
   * 204 (no-op); unknown ids return 404 — both resolve here, matching
   * the SDK's `closeSession` shape.
   */
  cancelDeviceFlow(
    deviceFlowId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<void>;
  /** Snapshot of persisted auth credentials + currently pending device-flows. */
  getAuthStatus(opts?: {
    clientId?: string;
  }): Promise<DaemonAuthStatusSnapshot>;
  getAuthProviders(): Promise<DaemonAuthProviderCatalog>;
  installAuthProvider(
    req: DaemonAuthProviderInstallRequest,
  ): Promise<DaemonAuthProviderInstallResult>;
  addWorkspace(
    cwd: string,
    options?: {
      persist?: boolean;
      displayName?: string;
    },
  ): Promise<{
    id: string;
    cwd: string;
    displayName?: string;
    primary: boolean;
    trusted: boolean;
    persisted?: boolean;
  }>;
  updateWorkspace(
    workspaceSelector: string,
    update: DaemonWorkspaceUpdate,
  ): Promise<DaemonWorkspaceCapability>;
  /** Requests a process-local workspace in a daemon-managed empty directory. */
  addScratchWorkspace(): Promise<{
    id: string;
    cwd: string;
    primary: boolean;
    trusted: boolean;
    persisted: false;
  }>;
  /**
   * Release transport resources (WS close, etc.). Idempotent.
   * After `dispose()`, further calls to `fetch` / `subscribeEvents`
   * on the underlying transport throw `DaemonTransportClosedError`.
   */
  dispose(): void;
  listSessionArtifacts(
    sessionId: string,
    clientId?: string,
  ): Promise<DaemonSessionArtifactsEnvelope>;
  addSessionArtifact(
    sessionId: string,
    artifact: DaemonSessionArtifactInput,
    clientId?: string,
  ): Promise<DaemonSessionArtifactMutationResult>;
  removeSessionArtifact(
    sessionId: string,
    artifactId: string,
    clientId?: string,
  ): Promise<DaemonSessionArtifactMutationResult>;
  /**
   * Patch mutable session metadata and return the effective stored metadata
   * reported by the daemon.
   */
  updateSessionMetadata(
    sessionId: string,
    metadata: {
      displayName?: string;
    },
    clientId?: string,
  ): Promise<SessionMetadataResult>;
}
export declare class WorkspaceDaemonClient {
  private readonly client;
  private readonly workspaceSelector;
  constructor(client: DaemonClient, workspaceSelector: string);
  workspaceMcp(): Promise<DaemonWorkspaceMcpStatus>;
  /**
   * Send text directly through this exact workspace's channel worker.
   * A successful capability pre-flight does not guarantee worker liveness;
   * callers must treat 503 `channel_worker_unavailable` as an expected outcome.
   */
  notify(
    req: DaemonChannelNotifyRequest,
    opts?: {
      timeoutMs?: number;
    },
  ): Promise<DaemonChannelNotifyResult>;
  workspaceChannelTypes(
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelTypeCatalog>;
  workspaceChannels(
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelsSnapshot>;
  upsertWorkspaceChannel(
    name: string,
    request: DaemonChannelUpsertRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  deleteWorkspaceChannel(
    name: string,
    request: DaemonRevisionRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  setWorkspaceChannelStartup(
    name: string,
    request: DaemonChannelStartupRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  startWorkspaceChannel(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  stopWorkspaceChannel(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  restartWorkspaceChannel(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelMutationResult>;
  workspaceChannelPairingRequests(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingRequestsSnapshot>;
  approveWorkspaceChannelPairing(
    name: string,
    request: DaemonChannelPairingApprovalRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingApprovalResult>;
  workspaceChannelPairingApprovals(
    name: string,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingApprovalsSnapshot>;
  revokeWorkspaceChannelPairingApproval(
    name: string,
    request: DaemonChannelPairingRevocationRequest,
    opts?: DaemonChannelManagementOptions,
  ): Promise<DaemonChannelPairingRevocationResult>;
  private channelAction;
  private channelRequest;
  initializeWorkspaceMcp(): Promise<DaemonWorkspaceMcpInitializeResult>;
  reloadWorkspaceMcp(
    options?: DaemonWorkspaceMcpReloadOptions,
  ): Promise<DaemonWorkspaceMcpInitializeResult>;
  workspaceVoice(clientId?: string): Promise<DaemonWorkspaceVoiceStatus>;
  setWorkspaceVoice(
    update: DaemonWorkspaceVoiceUpdate,
    clientId?: string,
  ): Promise<DaemonWorkspaceVoiceStatus>;
  transcribeWorkspaceVoice(
    audio: DaemonVoiceAudioInput,
    opts: DaemonWorkspaceVoiceTranscribeOptions,
  ): Promise<DaemonWorkspaceVoiceTranscriptionResult>;
  liveStatus(clientId?: string): Promise<DaemonLiveStatus>;
  liveSetupStatus(clientId?: string): Promise<DaemonLiveSetupStatus>;
  updateLiveSetup(
    update: DaemonLiveSetupUpdate,
    clientId?: string,
  ): Promise<DaemonLiveSetupStatus>;
  retryLiveHostInstall(clientId?: string): Promise<DaemonLiveSetupStatus>;
  launchLiveHost(clientId?: string): Promise<DaemonLiveSetupStatus>;
  startLive(
    mode?: 'resume' | 'new',
    clientId?: string,
  ): Promise<DaemonLiveStatus>;
  stopLive(clientId?: string): Promise<DaemonLiveStatus>;
  setLiveMute(
    update: DaemonLiveMuteUpdate,
    clientId?: string,
  ): Promise<DaemonLiveStatus>;
  setLiveShortcut(
    shortcut: string,
    clientId?: string,
  ): Promise<DaemonLiveStatus>;
  workspaceGit(opts?: {
    cwd?: string;
    wait?: boolean;
  }): Promise<DaemonWorkspaceGitStatus>;
  workspaceGitDiff(cwd?: string): Promise<DaemonWorkspaceGitDiff>;
  workspaceGitDiffFile(
    path: string,
    oldPath?: string,
    cwd?: string,
  ): Promise<DaemonWorkspaceGitDiffHunks>;
  workspaceGitLog(
    limit?: number,
    skip?: number,
    cwd?: string,
    range?: string,
  ): Promise<DaemonGitLog>;
  workspaceGitCommitDetail(
    sha: string,
    cwd?: string,
  ): Promise<DaemonGitCommitDetail>;
  workspaceGitBranches(cwd?: string): Promise<DaemonGitBranchesResult>;
  workspaceGitCheckout(
    ref: string,
    cwd?: string,
  ): Promise<DaemonGitCheckoutResult>;
  workspaceGitCreateBranch(
    name: string,
    startPoint?: string,
    cwd?: string,
  ): Promise<DaemonGitCheckoutResult>;
  workspaceGitPush(
    opts?: {
      setUpstream?: boolean;
      force?: boolean;
    },
    cwd?: string,
  ): Promise<DaemonGitPushResult>;
  workspaceGitPull(
    opts?: {
      rebase?: boolean;
      fetchOnly?: boolean;
    },
    cwd?: string,
  ): Promise<DaemonGitPullResult>;
  workspaceGitCommit(
    message: string,
    opts?: {
      all?: boolean;
    },
    cwd?: string,
  ): Promise<DaemonGitCommitResult>;
  workspaceGitHubPullRequests(): Promise<DaemonGitHubPullRequestList>;
  workspaceGitHubCreatePullRequest(
    opts: {
      title: string;
      body?: string;
      base?: string;
      head?: string;
    },
    cwd?: string,
  ): Promise<DaemonGitHubPullRequestCreateResult>;
  workspaceGitHubDefaultBranch(): Promise<{
    branch: string;
  }>;
  workspaceSkills(): Promise<DaemonWorkspaceSkillsStatus>;
  workspaceProviders(): Promise<DaemonWorkspaceProvidersStatus>;
  workspaceHooks(): Promise<DaemonWorkspaceHooksStatus>;
  workspaceEnv(): Promise<DaemonWorkspaceEnvStatus>;
  workspacePreflight(): Promise<DaemonWorkspacePreflightStatus>;
  workspaceTools(): Promise<DaemonWorkspaceToolsStatus>;
  workspaceMemory(): Promise<DaemonWorkspaceMemoryStatus>;
  remove(options?: {
    force?: boolean;
    timeoutMs?: number;
  }): Promise<DaemonWorkspaceRemovalResult>;
  writeWorkspaceMemory(
    req: Omit<DaemonWriteMemoryRequest, 'scope'> & {
      scope?: 'workspace';
    },
    clientId?: string,
  ): Promise<DaemonWriteMemoryResult>;
  listWorkspaceAgents(): Promise<DaemonWorkspaceAgentsStatus>;
  createWorkspaceAgent(
    req: Omit<DaemonCreateAgentRequest, 'scope'> & {
      scope?: 'workspace' | 'project';
    },
    clientId?: string,
  ): Promise<DaemonAgentMutationResult>;
  getWorkspaceAgent(agentType: string): Promise<DaemonWorkspaceAgentDetail>;
  updateWorkspaceAgent(
    agentType: string,
    req: DaemonUpdateAgentRequest,
    opts?: {
      scope?: 'workspace' | 'project';
      clientId?: string;
    },
  ): Promise<DaemonAgentMutationResult>;
  deleteWorkspaceAgent(
    agentType: string,
    opts?: {
      scope?: 'workspace' | 'project';
      clientId?: string;
    },
  ): Promise<void>;
  listWorkspaceSessionsPage(
    options?: DaemonSessionListPageOptions,
  ): Promise<DaemonSessionListPage>;
  listWorkspaceSessions(
    options?: DaemonSessionListPageOptions,
  ): Promise<DaemonSessionSummary[]>;
  getWorkspaceSessionInfo(): Promise<DaemonWorkspaceSessionInfo>;
  /**
   * Read one page from an active persisted session transcript in this
   * workspace.
   * The daemon performs replay locally without attaching to the session or
   * starting ACP. This method always uses native REST transport.
   */
  getSessionTranscriptPage(
    sessionId: string,
    opts?: DaemonSessionTranscriptPageOptions,
  ): Promise<DaemonSessionTranscriptPage>;
  /** Export an active persisted session from this registered workspace. */
  exportSession(
    sessionId: string,
    opts?: {
      format?: DaemonSessionExportFormat;
      clientId?: string;
    },
  ): Promise<DaemonSessionExportResult>;
  /** Export an archived persisted session from this registered workspace. */
  exportArchivedSession(
    sessionId: string,
    opts?: {
      format?: DaemonSessionExportFormat;
      clientId?: string;
    },
  ): Promise<DaemonSessionExportResult>;
  listSessionGroups(): Promise<DaemonSessionGroupCatalog>;
  createSessionGroup(
    input: DaemonSessionGroupInput,
  ): Promise<DaemonSessionGroup>;
  updateSessionGroup(
    groupId: string,
    update: DaemonSessionGroupUpdate,
  ): Promise<DaemonSessionGroup>;
  deleteSessionGroup(groupId: string): Promise<{
    deleted: boolean;
  }>;
  updateSessionOrganization(
    sessionId: string,
    update: DaemonSessionOrganizationUpdate,
    clientId?: string,
  ): Promise<DaemonSessionOrganizationResult>;
  deleteSessionsData(
    sessionIds: string[],
    clientId?: string,
  ): Promise<{
    removed: string[];
    notFound: string[];
    errors: Array<{
      sessionId: string;
      error: string;
    }>;
  }>;
  archiveSessionsData(
    sessionIds: string[],
    clientId?: string,
  ): Promise<DaemonArchiveSessionsResult>;
  unarchiveSessionsData(
    sessionIds: string[],
    clientId?: string,
  ): Promise<DaemonUnarchiveSessionsResult>;
  readWorkspaceFile(
    filePath: string,
    opts?: {
      maxBytes?: number;
      line?: number;
      limit?: number;
      cursor?: string;
    },
    clientId?: string,
  ): Promise<DaemonWorkspaceFile>;
  readWorkspaceFileBytes(
    filePath: string,
    opts?: {
      offset?: number;
      maxBytes?: number;
    },
    clientId?: string,
  ): Promise<DaemonWorkspaceFileBytes>;
  fileStat(filePath: string): Promise<unknown>;
  dirList(dirPath: string): Promise<unknown>;
  glob(
    pattern: string,
    opts?: {
      maxResults?: number;
      signal?: AbortSignal;
    },
  ): Promise<unknown>;
  writeWorkspaceFile(
    req: DaemonWorkspaceFileWriteRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceFileWriteResult>;
  editWorkspaceFile(
    req: DaemonWorkspaceFileEditRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceFileEditResult>;
  uploadWorkspaceFile(
    req: DaemonWorkspaceFileUploadRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceFileUploadResult>;
  workspaceSettings(opts?: {
    clientId?: string;
  }): Promise<DaemonWorkspaceSettingsStatus>;
  setWorkspaceSetting(
    scope: 'workspace',
    key: string,
    value: unknown,
    opts?: {
      clientId?: string;
      mcpServerMutation?: {
        operation: 'set' | 'remove';
        name: string;
      };
    },
  ): Promise<DaemonSettingUpdateResult>;
  workspaceTrust(opts?: {
    clientId?: string;
    statusVersion?: 1;
  }): Promise<DaemonWorkspaceTrustStatus>;
  workspaceTrust(opts: {
    clientId?: string;
    statusVersion: 2;
  }): Promise<DaemonWorkspaceTrustStatus | DaemonWorkspaceTrustStatusV2>;
  requestWorkspaceTrustChange(
    request: DaemonWorkspaceTrustChangeRequest,
    clientId?: string,
  ): Promise<DaemonWorkspaceTrustChangeResult>;
  workspacePermissions(opts?: {
    clientId?: string;
  }): Promise<DaemonWorkspacePermissionsStatus>;
  setWorkspacePermissionRules(
    ruleType: DaemonPermissionRuleType,
    rules: readonly string[],
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonWorkspacePermissionsStatus>;
  setWorkspaceToolEnabled(
    toolName: string,
    enabled: boolean,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonToolToggleResult>;
  setWorkspaceSkillEnabled(
    skillName: string,
    enabled: boolean,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonSkillToggleResult>;
  setWorkspaceSkillsEnabled(
    skillNames: readonly string[],
    enabled: boolean,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonSkillBatchToggleResult>;
  restartMcpServer(
    serverName: string,
    opts?: {
      clientId?: string;
      entryIndex?: number | '*';
      timeoutMs?: number;
    },
  ): Promise<DaemonMcpRestartResult>;
  reload(opts?: {
    clientId?: string;
    timeoutMs?: number;
  }): Promise<DaemonReloadResponse>;
  initWorkspace(opts?: {
    force?: boolean;
    clientId?: string;
  }): Promise<DaemonInitWorkspaceResult>;
  workspaceExtensions(): Promise<WorkspaceExtensionProjection>;
  setExtensionActivation(
    extensionId: string,
    state: ExtensionActivationState,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  clearExtensionActivation(
    extensionId: string,
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  refreshExtensionRuntime(
    clientId?: string,
  ): Promise<ExtensionMutationResponse>;
  private get;
  private post;
}
/**
 * `AbortSignal.timeout` is in every Node version this package supports
 * (`engines.node >=22.0.0` ships it natively). The feature-detect below
 * is defensive against non-Node runtimes — browsers / edge workers /
 * stripped-down V8 hosts that may consume the SDK and ship an
 * incomplete `AbortSignal` shape.
 */
export declare function abortTimeout(ms: number): AbortSignal;
/**
 * `AbortSignal.any` is available natively in every Node version this
 * package supports (`engines.node >=22.0.0` ships it). The polyfill
 * branch below is defensive against non-Node runtimes (browsers /
 * edge workers / stripped-down V8 hosts) that may consume the SDK
 * and lack `AbortSignal.any` — without it those callers would throw
 * `TypeError: AbortSignal.any is not a function` on every
 * non-streaming method.
 *
 * The polyfill creates a fresh controller and forwards the first abort
 * from any input signal, including any that are already aborted at call
 * time. It does NOT support every native edge-case (cleanup of remaining
 * listeners after the first fire is best-effort), but for `fetch`-style
 * single-shot use the difference is invisible.
 */
export declare function composeAbortSignals(
  signals: AbortSignal[],
): AbortSignal;
/**
 * Check whether a daemon SSE event is a `turn_complete` or
 * `turn_error` matching `promptId`. Returns `PromptResult` on
 * `turn_complete`, throws `DaemonHttpError` on `turn_error`,
 * returns `undefined` for non-matching / unrelated events.
 *
 * Extracted so both `DaemonClient._awaitTurnComplete` (temporary SSE
 * fallback) and `DaemonSessionClient.prompt` (existing subscription
 * path) share the same matching logic.
 */
export declare function matchTurnEvent(
  event: DaemonEvent,
  promptId: string,
): PromptResult | undefined;
export declare function isNonBlockingAccepted(
  result: NonBlockingPromptAccepted | PromptResult,
): result is NonBlockingPromptAccepted;
