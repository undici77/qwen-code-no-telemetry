/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  DaemonEvent,
  DaemonErrorKind,
  DaemonMcpTransport,
  DaemonSessionArtifactChange,
  PermissionOutcome,
} from './types.js';
import {
  MID_TURN_MESSAGE_INJECTED_EVENT,
  PENDING_PROMPT_ADDED_EVENT,
  PENDING_PROMPT_STARTED_EVENT,
  PENDING_PROMPT_COMPLETED_EVENT,
} from '@qwen-code/acp-bridge/daemonEventTypes';
export {
  MID_TURN_MESSAGE_INJECTED_EVENT,
  PENDING_PROMPT_ADDED_EVENT,
  PENDING_PROMPT_STARTED_EVENT,
  PENDING_PROMPT_COMPLETED_EVENT,
};
export declare const DAEMON_KNOWN_EVENT_TYPE_VALUES: readonly [
  'session_update',
  'permission_request',
  'permission_resolved',
  'permission_already_resolved',
  'model_switched',
  'model_switch_failed',
  'session_died',
  'session_closed',
  'session_metadata_updated',
  'session_recording_degraded',
  'artifact_changed',
  'mid_turn_message_injected',
  'pending_prompt_added',
  'pending_prompt_started',
  'pending_prompt_completed',
  'client_evicted',
  'slow_client_warning',
  'stream_error',
  'state_resync_required',
  'history_truncated',
  'mcp_budget_warning',
  'mcp_child_refused_batch',
  'memory_changed',
  'agent_changed',
  'auth_device_flow_started',
  'auth_device_flow_throttled',
  'auth_device_flow_authorized',
  'auth_device_flow_failed',
  'auth_device_flow_cancelled',
  'approval_mode_changed',
  'tool_toggled',
  'settings_changed',
  'trust_change_requested',
  'workspace_initialized',
  'github_setup_completed',
  'mcp_server_restarted',
  'mcp_server_restart_refused',
  'mcp_server_changed',
  'settings_reloaded',
  'mcp_server_added',
  'mcp_server_removed',
  'extensions_changed',
  'permission_partial_vote',
  'permission_forbidden',
  'prompt_cancelled',
  'replay_complete',
  'followup_suggestion',
  'channel_delivery_result',
  'user_shell_command',
  'user_shell_result',
  'turn_complete',
  'turn_error',
  'session_rewound',
  'session_branched',
  'session_snapshot',
  'git_branch_changed',
  'git_status_changed',
];
export type DaemonKnownEventType =
  (typeof DAEMON_KNOWN_EVENT_TYPE_VALUES)[number];
export interface DaemonEventEnvelope<TType extends string, TData>
  extends Omit<DaemonEvent, 'type' | 'data'> {
  type: TType;
  data: TData;
}
export type DaemonSessionUpdateData = Record<string, unknown>;
export interface DaemonPermissionOption {
  optionId: string;
  [key: string]: unknown;
}
export interface DaemonPermissionRequestData {
  requestId: string;
  sessionId: string;
  toolCall: unknown;
  options: DaemonPermissionOption[];
  [key: string]: unknown;
}
export interface DaemonPermissionResolvedData {
  requestId: string;
  outcome: PermissionOutcome;
  [key: string]: unknown;
}
export interface DaemonPermissionAlreadyResolvedData {
  requestId: string;
  sessionId: string;
  outcome: PermissionOutcome;
  [key: string]: unknown;
}
/**
 * `permission_partial_vote` SSE frame fired by the `consensus` policy
 * on every recorded non-resolving vote. The snapshot at
 * `GET /workspace/mcp` (etc.) does NOT carry vote-progress state; SDK
 * consumers reconstruct it from this stream.
 *
 * `votesNeeded` = `quorum - max(tally per option)`, clamped to >=1.
 * `optionTallies` is a per-option count; the leading option is the
 * one with the highest tally (ties broken by first-cast order at the
 * mediator level -- not directly reflected here).
 */
export interface DaemonPermissionPartialVoteData {
  requestId: string;
  sessionId: string;
  votesReceived: number;
  votesNeeded: number;
  quorum: number;
  optionTallies: Record<string, number>;
  /**
   * Stamped from the SSE envelope's `originatorClientId` (= prompt
   * originator) by the session reducer's `mergeOriginator` step so
   * view-state consumers can attribute the partial vote to the
   * prompting client without retaining the original event.
   */
  originatorClientId?: string;
  [key: string]: unknown;
}
/**
 * `permission_forbidden` SSE frame fired when a vote is rejected by
 * the active policy. `clientId` is the rejected voter (omitted when
 * anonymous); `reason` is the closed contract enum.
 *
 * The frame's top-level `originatorClientId` (on the wrapping
 * `DaemonEvent`, not in `data`) stamps the prompt originator -- NOT
 * the rejected voter. Cross-reference `data.clientId` for voter
 * attribution.
 */
export interface DaemonPermissionForbiddenData {
  requestId: string;
  sessionId: string;
  clientId?: string;
  reason: 'designated_mismatch' | 'remote_not_allowed';
  /**
   * Stamped from the SSE envelope's `originatorClientId` (= prompt
   * originator) by the session reducer's `mergeOriginator` step.
   * Distinct from `clientId` (the rejected voter's id) -- both are
   * useful and neither subsumes the other.
   */
  originatorClientId?: string;
  [key: string]: unknown;
}
export interface DaemonModelSwitchedData {
  sessionId: string;
  modelId: string;
  [key: string]: unknown;
}
export interface DaemonModelSwitchFailedData {
  sessionId: string;
  requestedModelId: string;
  error: string;
  [key: string]: unknown;
}
export interface DaemonSessionDiedData {
  sessionId: string;
  reason: string;
  exitCode?: number | null;
  signalCode?: string | null;
  [key: string]: unknown;
}
export type DaemonSessionClosedReason = 'client_close' | (string & {});
export interface DaemonSessionClosedData {
  sessionId: string;
  reason: DaemonSessionClosedReason;
  closedBy?: string;
  [key: string]: unknown;
}
export interface DaemonSessionMetadataUpdatedData {
  sessionId: string;
  displayName?: string;
  [key: string]: unknown;
}
export interface DaemonArtifactChangedData {
  sessionId: string;
  change: DaemonSessionArtifactChange;
  [key: string]: unknown;
}
/**
 * `mid_turn_message_injected` payload. Emitted when the daemon drains
 * browser-queued mid-turn messages into the running turn (web-shell mid-turn
 * drain). It is a transient dedupe signal, not a transcript item: consumers
 * move these messages out of their pending queue so they aren't resent as the
 * next turn. They are not rendered from this event — the message already reached
 * the model mid-turn, and the persisted transcript shows it on reload.
 */
export interface DaemonMidTurnMessageInjectedData {
  sessionId: string;
  messages: string[];
  messageIds?: string[];
  /**
   * Present only on events from older daemons. New daemons publish one
   * session-wide batch and clients reconcile it by message id.
   */
  originatorClientId?: string;
  [key: string]: unknown;
}
export interface DaemonClientEvictedData {
  reason: string;
  droppedAfter?: number;
  queueSize?: number;
  maxQueued?: number;
  queuedBytes?: number;
  maxQueuedBytes?: number;
  eventBytes?: number;
  [key: string]: unknown;
}
export interface DaemonSlowClientWarningData {
  /** Live (non-replay) items currently queued for this subscriber. */
  queueSize: number;
  /** Per-subscriber backlog cap that triggered the warning. */
  maxQueued: number;
  /**
   * Most recent monotonic event id observed by the bus at warning
   * time. Lets the client decide whether to reconnect with a
   * `Last-Event-ID` or detach + drain.
   */
  lastEventId: number;
  /** Approximate serialized bytes queued for this subscriber's live backlog. */
  queuedBytes?: number;
  /** Per-subscriber serialized-byte backlog cap. */
  maxQueuedBytes?: number;
  /** Which backlog threshold caused the warning. */
  threshold?: 'frames' | 'bytes' | 'frames_and_bytes';
  [key: string]: unknown;
}
export interface DaemonStreamErrorData {
  error: string;
  /**
   * Classified error kind from the daemon's `mapDomainErrorToErrorKind`.
   * Typed as the closed `DaemonErrorKind` enum with a `(string & {})`
   * widening for forward-compat. Absent for unclassified errors -- the
   * daemon omits the field rather than stamping a meaningless value.
   * UI consumers key on this for typed retry / remediation rendering
   * (retry on init_timeout vs install on missing_binary, etc.) instead
   * of regex-matching the `error` string.
   */
  errorKind?: DaemonErrorKind | (string & {});
  [key: string]: unknown;
}
/**
 * Payload for the `state_resync_required` synthetic frame the daemon
 * emits when an SSE consumer reconnects with a `Last-Event-ID` past
 * the ring's earliest available id. The reducer auto-skips subsequent
 * delta frames until consumer code calls `loadSession` and reseeds
 * view state -- see `DaemonSessionViewState.awaitingResync`.
 */
export interface DaemonStateResyncRequiredData {
  /**
   * Machine-readable resync reason. One of:
   * - `'ring_evicted'`: consumer's `Last-Event-ID` fell behind the ring's
   *   earliest surviving id (same-epoch gap).
   * - `'epoch_reset'`: consumer's cursor is from a previous bus epoch
   *   (daemon restart rebuilt the EventBus). Triggered either by the
   *   numeric heuristic (`Last-Event-ID` past the bus high-water) or by
   *   an epoch token comparison (`X-Qwen-Event-Epoch` header does not
   *   match the bus's current epoch — see `detail`). The whole fresh
   *   ring is replayed.
   * Reserved for future causes (e.g. `'schema_version_bump'`).
   */
  reason: string;
  /**
   * Optional trigger discriminator on the wire. `'epoch_mismatch'` marks an
   * `'epoch_reset'` produced by the epoch token comparison rather than the
   * numeric heuristic. Operational/wire-level field — UI consumers key on
   * `reason` alone.
   */
  detail?: string;
  /** Consumer's `Last-Event-ID` at reconnect time. */
  lastDeliveredId: number;
  /**
   * The earliest event id still in the daemon's per-session ring at
   * reconnect time. The gap is `[lastDeliveredId + 1,
   * earliestAvailableId - 1]` inclusive.
   */
  earliestAvailableId: number;
  [key: string]: unknown;
}
export interface DaemonHistoryTruncatedData {
  reason: 'replay_window_exceeded';
  scope?: 'live_journal' | (string & {});
  truncatedEvents: number;
  retainedEvents: number;
  maxBytes: number;
  maxEvents?: number;
  truncatedTurns?: number;
  /**
   * Pagination anchor: the last `qwen.session.recordId` observed by the
   * daemon's compaction engine before the truncation point. Present when
   * at least one recordId-bearing `session_update` was ingested or seeded
   * during the engine's lifetime; omitted otherwise. Clients use this as
   * the `beforeRecordId` for `GET /session/:id/transcript` pagination
   * when the retained replay window lost every turn-boundary event
   * (e.g. live-journal truncation during one long in-flight turn).
   */
  recordId?: string;
  fullTranscriptAvailable: boolean;
  [key: string]: unknown;
}
/**
 * Payload for the `mcp_budget_warning` SSE frame. Fired on the upward
 * 75% crossing of `reservedSlots.size / clientBudget`. Re-arms only
 * after the ratio drops below 37.5% -- so a budget that flaps just
 * above the threshold doesn't produce a flood of identical warnings.
 *
 * `liveCount` (CONNECTED clients) and `reservedCount` (configured set,
 * including in-flight reservations) are exposed separately so SDK
 * consumers can render either lens. The snapshot (`GET /workspace/mcp`)
 * is the source of truth for state-after-reconnect; this event is the
 * change-edge.
 *
 * `mode` is `'warn' | 'enforce'` because the warning fires in either
 * mode (only `'off'` skips the state machine entirely).
 */
export interface DaemonMcpBudgetWarningData {
  liveCount: number;
  reservedCount: number;
  budget: number;
  thresholdRatio: 0.75;
  mode: 'warn' | 'enforce';
  /**
   * Scope of the budget event. Absent on older daemons (means
   * `'session'`) and on daemons running with `--no-mcp-pool` or
   * without a configured budget. `'workspace'` indicates the event
   * was fired by the pool's `WorkspaceMcpBudget` and fanned out
   * simultaneously to every attached session -- so the SDK reducer's
   * `mcpBudgetWarningCount` will increment in lockstep across all
   * sessions on this connection. Use `isWorkspaceScopedBudgetEvent`
   * to branch.
   */
  scope?: 'workspace' | 'session';
  [key: string]: unknown;
}
/**
 * Per-server entry inside a `mcp_child_refused_batch` payload.
 * `transport` is the family resolved at refusal time via the daemon's
 * `mcpTransportOf` helper; future refusal causes would extend `reason`
 * beyond `'budget_exhausted'`.
 */
export interface DaemonMcpRefusedServer {
  name: string;
  transport: DaemonMcpTransport;
  reason: 'budget_exhausted';
  [key: string]: unknown;
}
/**
 * Payload for the `mcp_child_refused_batch` SSE frame. Fires once per
 * `discoverAllMcpTools*` pass when at least one server was refused, OR
 * as a length-1 batch on the `readResource` lazy-spawn refusal path.
 * `mode` is the literal `'enforce'` because `warn` mode never refuses
 * (so this event never fires under `warn`).
 */
export interface DaemonMcpChildRefusedBatchData {
  refusedServers: DaemonMcpRefusedServer[];
  budget: number;
  liveCount: number;
  reservedCount: number;
  mode: 'enforce';
  /**
   * Same `scope` semantics as `DaemonMcpBudgetWarningData.scope`.
   * Absent on older daemons (means `'session'`); `'workspace'` when
   * fired by the pool's workspace-scoped budget. Workspace-scoped
   * refused_batch events fan out to every attached session, so SDK
   * consumers tracking refusal counts across sessions on the same
   * connection should gate on `scope` when reconciling event-driven
   * state with the snapshot route's `refusedServerNames`.
   */
  scope?: 'workspace' | 'session';
  [key: string]: unknown;
}
/**
 * A `POST /workspace/memory` write completed successfully. `scope`
 * records which file was touched (workspace QWEN.md vs global
 * ~/.qwen/QWEN.md), `mode` is the requested write mode, and
 * `bytesWritten` is the size of the file post-write.
 */
export interface DaemonFileMemoryChangedData {
  scope: 'workspace' | 'global';
  filePath: string;
  mode: 'append' | 'replace';
  bytesWritten: number;
  [key: string]: unknown;
}
export interface DaemonManagedMemoryChangedData {
  scope: 'managed';
  source:
    | 'workspace_memory_remember'
    | 'workspace_memory_forget'
    | 'workspace_memory_dream'
    | (string & {});
  taskId: string;
  touchedScopes: Array<'user' | 'project'>;
  [key: string]: unknown;
}
export type DaemonMemoryChangedData =
  | DaemonFileMemoryChangedData
  | DaemonManagedMemoryChangedData;
/**
 * A workspace agent CRUD mutation completed successfully. `change`
 * discriminates the operation; `level` records whether the project- or
 * user-level definition was touched. Built-in and extension agents are
 * read-only and never appear here.
 */
export interface DaemonAgentChangedData {
  change: 'created' | 'updated' | 'deleted';
  name: string;
  level: 'project' | 'user';
  [key: string]: unknown;
}
/** Auth device-flow event payloads. */
/** Provider id. Open string union for forward-compatible providers; `qwen-oauth`
 *  is the only value v1 currently emits. */
export type DaemonAuthDeviceFlowProviderId = 'qwen-oauth' | (string & {});
export type DaemonAuthDeviceFlowStatus =
  | 'pending'
  | 'authorized'
  | 'expired'
  | 'error'
  | 'cancelled';
/**
 * Known errorKind values surfaced on `auth_device_flow_failed`. The
 * trailing `(string & {})` keeps this as an OPEN union so a daemon
 * adding a new errorKind doesn't get its event silently dropped by an
 * older SDK's type guard -- consumers branching exhaustively on the
 * known literals get the same narrowing as before, while unknown
 * future kinds fall through to a `string` fallback rather than failing
 * `isAuthDeviceFlowFailedData` and being filtered out by
 * `asKnownDaemonEvent`.
 */
export type DaemonAuthDeviceFlowErrorKind =
  | 'expired_token'
  | 'access_denied'
  | 'invalid_grant'
  | 'upstream_error'
  /** Disk-write / `provider.persist()` failure path. The IdP-side token
   *  exchange succeeded but the daemon couldn't durably store credentials
   *  (EACCES, EROFS, ENOSPC, etc.). Distinct from `upstream_error`. */
  | 'persist_failed'
  /** SDK-synthesized when the daemon's GET returns 404 inside
   *  `DaemonAuthFlow.awaitCompletion`. Surfaced from `getDeviceFlowOrSynthetic404`
   *  rather than the daemon -- three reachable causes: (a) the flow expired
   *  past the 5-min terminal grace window and the sweeper reaped it, (b) the
   *  daemon was restarted and lost the in-memory registry, (c) the
   *  `deviceFlowId` was wrong / spoofed. Added to the typed union so SDK
   *  consumers' exhaustive switches narrow it as a known literal instead of
   *  falling into the `(string & {})` fallback arm. */
  | 'not_found_or_evicted'
  | (string & {});
export interface DaemonAuthDeviceFlowStartedData {
  deviceFlowId: string;
  providerId: DaemonAuthDeviceFlowProviderId;
  /** Daemon-clock epoch ms when the flow's `device_code` expires. */
  expiresAt: number;
  [key: string]: unknown;
}
export interface DaemonAuthDeviceFlowThrottledData {
  deviceFlowId: string;
  /** Bumped polling interval after the daemon honored an upstream `slow_down`. */
  intervalMs: number;
  [key: string]: unknown;
}
export interface DaemonAuthDeviceFlowAuthorizedData {
  deviceFlowId: string;
  providerId: DaemonAuthDeviceFlowProviderId;
  /** Credential expiry, daemon clock. Undefined when the IdP omitted `expires_in`. */
  expiresAt?: number;
  /** Best-effort non-PII account label (nickname / uid hash); never email/phone. */
  accountAlias?: string;
  [key: string]: unknown;
}
export interface DaemonAuthDeviceFlowFailedData {
  deviceFlowId: string;
  errorKind: DaemonAuthDeviceFlowErrorKind;
  hint?: string;
  [key: string]: unknown;
}
export interface DaemonAuthDeviceFlowCancelledData {
  deviceFlowId: string;
  [key: string]: unknown;
}
/**
 * Fired after `POST /session/:id/approval-mode` successfully changes a
 * live session's approval mode. `persisted` reflects whether the change
 * was also written to workspace settings (set via the route's optional
 * `persist: true` body flag).
 *
 * `previous` and `next` are typed as `string` here rather than the
 * `DaemonApprovalMode` union so SDK consumers built against an older
 * daemon don't crash on a future fifth mode literal -- the daemon-side
 * enum is the source of truth and SDK reducers should branch on the
 * known values they care about.
 */
export interface DaemonApprovalModeChangedData {
  sessionId: string;
  previous: string;
  next: string;
  persisted: boolean;
  originatorClientId?: string;
  [key: string]: unknown;
}
/**
 * Workspace-scoped: fan-outs to every active session SSE bus when
 * `POST /workspace/tools/:name/enable` mutates the workspace
 * `tools.disabled` settings list. The event is emitted regardless of
 * whether the tool is currently registered -- it communicates intent,
 * not registry state. Live sessions retain already-registered tools;
 * the toggle takes effect on the next ACP child spawn or
 * `ToolRegistry.refresh()`.
 */
export interface DaemonToolToggledData {
  toolName: string;
  enabled: boolean;
  originatorClientId?: string;
  [key: string]: unknown;
}
export interface DaemonTrustChangeRequestedData {
  workspaceCwd: string;
  desiredState: 'trusted' | 'untrusted';
  reason?: string;
  [key: string]: unknown;
}
/**
 * Workspace-scoped: fan-outs to every active session SSE bus when
 * `POST /workspace/init` is invoked. The `action` field discriminates
 * between three outcomes:
 *
 * - `'created'`: daemon wrote an empty file at the resolved path
 *   (target did not exist).
 * - `'overwrote'`: daemon truncated an existing non-whitespace file
 *   under `force: true`.
 * - `'noop'`: daemon left an existing whitespace-only file alone
 *   (no on-disk change). Still fan-outs the event so cross-client
 *   UIs can render an "init was attempted" hint without polling.
 *
 * The `path` is absolute on the daemon host filesystem (see
 * runtime-locality contract).
 */
export interface DaemonWorkspaceInitializedData {
  path: string;
  action: 'created' | 'overwrote' | 'noop';
  originatorClientId?: string;
  [key: string]: unknown;
}
export interface DaemonGithubSetupCompletedData {
  releaseTag: string;
  readmeUrl: string;
  secretsUrl?: string;
  workflows: Array<{
    sourcePath?: string;
    path: string;
    status: 'written' | 'failed';
    sizeBytes?: number;
    error?: string;
  }>;
  gitignore: {
    path: '.gitignore';
    status: 'created' | 'updated' | 'unchanged' | 'failed' | 'skipped';
    added?: string[];
    error?: string;
  };
  warnings: string[];
  [key: string]: unknown;
}
/**
 * Workspace-scoped: fired when
 * `POST /workspace/mcp/:server/restart` successfully reconnected and
 * rediscovered the named MCP server. `durationMs` measures the full
 * disconnect+reconnect+rediscover sequence on the ACP-child side.
 *
 * Under pool mode, multi-entry restarts fan out one event per entry.
 * `entryIndex` (additive, optional) disambiguates per-entry events
 * when one server name maps to several pool entries with different
 * fingerprints. Single-entry restarts omit the field; SDK reducers
 * that ignore unknown fields keep working.
 */
export interface DaemonMcpServerRestartedData {
  serverName: string;
  durationMs: number;
  originatorClientId?: string;
  entryIndex?: number;
  [key: string]: unknown;
}
/**
 * Workspace-scoped: fired when
 * `POST /workspace/mcp/:server/restart` was a soft skip
 * (`skipped: true`). `reason` is the same closed enum surfaced on
 * the route's response body, so SDK consumers can branch on a single
 * union when reconciling event-driven state with HTTP-call results.
 *
 * Pool-mode hard restart failures fan out one
 * `mcp_server_restart_refused` event per failed entry with
 * `reason: 'restart_failed'` (additive enum value) plus a free-form
 * `details` string carrying the underlying error text. This lets SDK
 * reducers track hard failures alongside the existing soft-skip flow
 * without inventing a new event type. Old SDK reducers that pre-date
 * the additive enum silently drop these events: the
 * `MCP_RESTART_REFUSED_REASONS` closed-set predicate in
 * `isMcpServerRestartRefusedData` rejects unknown reasons, so
 * `parseDaemonEvent` returns undefined and the reducer never sees
 * the event.
 */
export interface DaemonMcpServerRestartRefusedData {
  serverName: string;
  reason:
    | 'in_flight'
    | 'disabled'
    | 'budget_would_exceed'
    | 'authentication_required'
    | 'restart_failed';
  originatorClientId?: string;
  entryIndex?: number;
  details?: string;
  [key: string]: unknown;
}
/**
 * Daemon assist push: a follow-up suggestion generated by the ACP child
 * after an end_turn completes. `suggestion` is already post-filter
 * (`getFilterReason()===null`) and non-empty — the wire never carries
 * rejected suggestions. `promptId` correlates with the just-completed
 * turn (`<sessionId>########<turn>` shape) so clients can suppress
 * stale events that race a fresh user prompt.
 */
export interface DaemonFollowupSuggestionData {
  sessionId: string;
  suggestion: string;
  promptId: string;
  [key: string]: unknown;
}
export type DaemonChannelDeliveryErrorCode =
  | 'channel_worker_unavailable'
  | 'channel_delivery_timeout'
  | 'channel_delivery_invalid'
  | 'channel_delivery_rejected'
  | 'channel_delivery_queue_full'
  | 'channel_delivery_failed';
type DeliveryResultSource =
  | {
      source: 'prompt';
      promptId: string;
    }
  | {
      source: 'scheduled';
      taskId: string;
      firedAt: number;
    };
export type DaemonChannelDeliveryResultData =
  | ({
      sessionId: string;
      deliveryId: string;
      status: 'delivered' | 'skipped';
    } & DeliveryResultSource)
  | ({
      sessionId: string;
      deliveryId: string;
      status: 'failed';
      code: DaemonChannelDeliveryErrorCode;
      error: string;
    } & DeliveryResultSource);
export interface DaemonTurnCompleteData {
  sessionId: string;
  stopReason: string;
  promptId?: string;
  [key: string]: unknown;
}
export interface DaemonTurnErrorData {
  sessionId: string;
  message: string;
  code?: string;
  errorKind?: DaemonErrorKind | (string & {});
  promptId?: string;
  [key: string]: unknown;
}
export interface DaemonSessionRewoundData {
  sessionId: string;
  promptId: string;
  targetTurnIndex: number;
  filesChanged: string[];
  filesFailed: string[];
  originatorClientId?: string;
  [key: string]: unknown;
}
export interface DaemonSessionBranchedData {
  sourceSessionId: string;
  newSessionId: string;
  displayName: string;
  originatorClientId?: string;
  [key: string]: unknown;
}
/**
 * Fired when `POST /workspace/mcp/servers` succeeds, including both
 * fresh additions and replace-on-existing-name. The event fans out to
 * every active session SSE bus.
 */
export interface DaemonMcpServerAddedData {
  readonly name: string;
  readonly transport: DaemonMcpTransport;
  readonly replaced: boolean;
  readonly shadowedSettings: boolean;
  readonly toolCount: number;
  readonly originatorClientId: string;
  [key: string]: unknown;
}
export type DaemonMcpServerAddedEvent = DaemonEventEnvelope<
  'mcp_server_added',
  DaemonMcpServerAddedData
>;
/**
 * Fired when `DELETE /workspace/mcp/servers/:name` actually drops an
 * entry. Idempotent skip ('not_present') does NOT emit this event. The
 * event fans out to every active session SSE bus.
 *
 * `wasShadowingSettings`: true when the removed runtime server was
 *   masking a settings-defined server of the same name -- the settings
 *   entry now takes effect again.
 */
export interface DaemonMcpServerRemovedData {
  readonly name: string;
  readonly wasShadowingSettings: boolean;
  readonly originatorClientId: string;
  [key: string]: unknown;
}
export type DaemonMcpServerRemovedEvent = DaemonEventEnvelope<
  'mcp_server_removed',
  DaemonMcpServerRemovedData
>;
export interface DaemonMcpServerChangedData {
  readonly serverName: string;
  readonly action:
    | 'approve'
    | 'enable'
    | 'disable'
    | 'authenticate'
    | 'clear-auth';
  readonly originatorClientId?: string;
  [key: string]: unknown;
}
export type DaemonMcpServerChangedEvent = DaemonEventEnvelope<
  'mcp_server_changed',
  DaemonMcpServerChangedData
>;
export interface DaemonExtensionsChangedData {
  readonly refreshed: number;
  readonly failed: number;
  readonly status?:
    | 'installed'
    | 'enabled'
    | 'disabled'
    | 'updated'
    | 'uninstalled'
    | 'failed';
  readonly source?: string;
  readonly name?: string;
  readonly version?: string;
  readonly error?: string;
  [key: string]: unknown;
}
export type DaemonExtensionsChangedEvent = DaemonEventEnvelope<
  'extensions_changed',
  DaemonExtensionsChangedData
>;
export interface DaemonSessionSnapshotData {
  sessionId: string;
  currentModelId: string | null;
  currentApprovalMode: string | null;
  recordingDegraded?: boolean;
  [key: string]: unknown;
}
export interface DaemonSessionRecordingDegradedData {
  sessionId: string;
  reason: 'write_failed';
  [key: string]: unknown;
}
export type DaemonSessionUpdateEvent = DaemonEventEnvelope<
  'session_update',
  DaemonSessionUpdateData
>;
export type DaemonPermissionRequestEvent = DaemonEventEnvelope<
  'permission_request',
  DaemonPermissionRequestData
>;
export type DaemonPermissionResolvedEvent = DaemonEventEnvelope<
  'permission_resolved',
  DaemonPermissionResolvedData
>;
export type DaemonPermissionAlreadyResolvedEvent = DaemonEventEnvelope<
  'permission_already_resolved',
  DaemonPermissionAlreadyResolvedData
>;
export type DaemonPermissionPartialVoteEvent = DaemonEventEnvelope<
  'permission_partial_vote',
  DaemonPermissionPartialVoteData
>;
export type DaemonPermissionForbiddenEvent = DaemonEventEnvelope<
  'permission_forbidden',
  DaemonPermissionForbiddenData
>;
export type DaemonModelSwitchedEvent = DaemonEventEnvelope<
  'model_switched',
  DaemonModelSwitchedData
>;
export type DaemonModelSwitchFailedEvent = DaemonEventEnvelope<
  'model_switch_failed',
  DaemonModelSwitchFailedData
>;
export type DaemonSessionDiedEvent = DaemonEventEnvelope<
  'session_died',
  DaemonSessionDiedData
>;
export type DaemonSessionClosedEvent = DaemonEventEnvelope<
  'session_closed',
  DaemonSessionClosedData
>;
export type DaemonSessionMetadataUpdatedEvent = DaemonEventEnvelope<
  'session_metadata_updated',
  DaemonSessionMetadataUpdatedData
>;
export type DaemonArtifactChangedEvent = DaemonEventEnvelope<
  'artifact_changed',
  DaemonArtifactChangedData
>;
export type DaemonMidTurnMessageInjectedEvent = DaemonEventEnvelope<
  typeof MID_TURN_MESSAGE_INJECTED_EVENT,
  DaemonMidTurnMessageInjectedData
>;
export interface DaemonPendingPromptAddedData {
  sessionId: string;
  promptId: string;
  text: string;
  queuedAt: number;
  [key: string]: unknown;
}
export interface DaemonPendingPromptStartedData {
  sessionId: string;
  promptId: string;
  text: string;
  [key: string]: unknown;
}
export interface DaemonPendingPromptCompletedData {
  sessionId: string;
  promptId: string;
  state: 'completed' | 'removed';
  [key: string]: unknown;
}
export type DaemonPendingPromptAddedEvent = DaemonEventEnvelope<
  typeof PENDING_PROMPT_ADDED_EVENT,
  DaemonPendingPromptAddedData
>;
export type DaemonPendingPromptStartedEvent = DaemonEventEnvelope<
  typeof PENDING_PROMPT_STARTED_EVENT,
  DaemonPendingPromptStartedData
>;
export type DaemonPendingPromptCompletedEvent = DaemonEventEnvelope<
  typeof PENDING_PROMPT_COMPLETED_EVENT,
  DaemonPendingPromptCompletedData
>;
export type DaemonPendingPromptEvent =
  | DaemonPendingPromptAddedEvent
  | DaemonPendingPromptStartedEvent
  | DaemonPendingPromptCompletedEvent;
export type DaemonClientEvictedEvent = DaemonEventEnvelope<
  'client_evicted',
  DaemonClientEvictedData
>;
export type DaemonSlowClientWarningEvent = DaemonEventEnvelope<
  'slow_client_warning',
  DaemonSlowClientWarningData
>;
export type DaemonStreamErrorEvent = DaemonEventEnvelope<
  'stream_error',
  DaemonStreamErrorData
>;
export type DaemonStateResyncRequiredEvent = DaemonEventEnvelope<
  'state_resync_required',
  DaemonStateResyncRequiredData
>;
export type DaemonHistoryTruncatedEvent = DaemonEventEnvelope<
  'history_truncated',
  DaemonHistoryTruncatedData
>;
export type DaemonMcpBudgetWarningEvent = DaemonEventEnvelope<
  'mcp_budget_warning',
  DaemonMcpBudgetWarningData
>;
export type DaemonMcpChildRefusedBatchEvent = DaemonEventEnvelope<
  'mcp_child_refused_batch',
  DaemonMcpChildRefusedBatchData
>;
export type DaemonMemoryChangedEvent = DaemonEventEnvelope<
  'memory_changed',
  DaemonMemoryChangedData
>;
export type DaemonAgentChangedEvent = DaemonEventEnvelope<
  'agent_changed',
  DaemonAgentChangedData
>;
export type DaemonApprovalModeChangedEvent = DaemonEventEnvelope<
  'approval_mode_changed',
  DaemonApprovalModeChangedData
>;
export type DaemonToolToggledEvent = DaemonEventEnvelope<
  'tool_toggled',
  DaemonToolToggledData
>;
export type DaemonSettingsChangedEvent = DaemonEventEnvelope<
  'settings_changed',
  Record<string, unknown>
>;
export type DaemonTrustChangeRequestedEvent = DaemonEventEnvelope<
  'trust_change_requested',
  DaemonTrustChangeRequestedData
>;
export type DaemonWorkspaceInitializedEvent = DaemonEventEnvelope<
  'workspace_initialized',
  DaemonWorkspaceInitializedData
>;
export type DaemonGithubSetupCompletedEvent = DaemonEventEnvelope<
  'github_setup_completed',
  DaemonGithubSetupCompletedData
>;
export type DaemonMcpServerRestartedEvent = DaemonEventEnvelope<
  'mcp_server_restarted',
  DaemonMcpServerRestartedData
>;
export type DaemonMcpServerRestartRefusedEvent = DaemonEventEnvelope<
  'mcp_server_restart_refused',
  DaemonMcpServerRestartRefusedData
>;
export interface DaemonSettingsReloadedData {
  env: {
    updatedKeys: string[];
    removedKeys: string[];
  };
  changedKeys: string[];
  childReloaded: boolean;
  sessionsRefreshed?: string[];
  sessionsSkipped?: string[];
  childError?: string;
  [key: string]: unknown;
}
export type DaemonSettingsReloadedEvent = DaemonEventEnvelope<
  'settings_reloaded',
  DaemonSettingsReloadedData
>;
export type DaemonAuthDeviceFlowStartedEvent = DaemonEventEnvelope<
  'auth_device_flow_started',
  DaemonAuthDeviceFlowStartedData
>;
export type DaemonAuthDeviceFlowThrottledEvent = DaemonEventEnvelope<
  'auth_device_flow_throttled',
  DaemonAuthDeviceFlowThrottledData
>;
export type DaemonAuthDeviceFlowAuthorizedEvent = DaemonEventEnvelope<
  'auth_device_flow_authorized',
  DaemonAuthDeviceFlowAuthorizedData
>;
export type DaemonAuthDeviceFlowFailedEvent = DaemonEventEnvelope<
  'auth_device_flow_failed',
  DaemonAuthDeviceFlowFailedData
>;
export type DaemonAuthDeviceFlowCancelledEvent = DaemonEventEnvelope<
  'auth_device_flow_cancelled',
  DaemonAuthDeviceFlowCancelledData
>;
export type DaemonFollowupSuggestionEvent = DaemonEventEnvelope<
  'followup_suggestion',
  DaemonFollowupSuggestionData
>;
export type DaemonChannelDeliveryResultEvent = DaemonEventEnvelope<
  'channel_delivery_result',
  DaemonChannelDeliveryResultData
>;
export type DaemonTurnCompleteEvent = DaemonEventEnvelope<
  'turn_complete',
  DaemonTurnCompleteData
>;
export type DaemonTurnErrorEvent = DaemonEventEnvelope<
  'turn_error',
  DaemonTurnErrorData
>;
export type DaemonSessionRewoundEvent = DaemonEventEnvelope<
  'session_rewound',
  DaemonSessionRewoundData
>;
export type DaemonSessionSnapshotEvent = DaemonEventEnvelope<
  'session_snapshot',
  DaemonSessionSnapshotData
>;
export type DaemonSessionRecordingDegradedEvent = DaemonEventEnvelope<
  'session_recording_degraded',
  DaemonSessionRecordingDegradedData
>;
export type DaemonSessionBranchedEvent = DaemonEventEnvelope<
  'session_branched',
  DaemonSessionBranchedData
>;
export type DaemonAuthEvent =
  | DaemonAuthDeviceFlowStartedEvent
  | DaemonAuthDeviceFlowThrottledEvent
  | DaemonAuthDeviceFlowAuthorizedEvent
  | DaemonAuthDeviceFlowFailedEvent
  | DaemonAuthDeviceFlowCancelledEvent;
export type DaemonSessionEvent =
  | DaemonSessionUpdateEvent
  | DaemonModelSwitchedEvent
  | DaemonModelSwitchFailedEvent
  | DaemonSessionDiedEvent
  | DaemonSessionClosedEvent
  | DaemonSessionMetadataUpdatedEvent
  | DaemonSessionRecordingDegradedEvent
  | DaemonArtifactChangedEvent
  | DaemonMidTurnMessageInjectedEvent
  | DaemonPendingPromptEvent
  | DaemonChannelDeliveryResultEvent
  | DaemonSessionBranchedEvent;
export type DaemonControlEvent =
  | DaemonPermissionRequestEvent
  | DaemonPermissionResolvedEvent
  | DaemonPermissionAlreadyResolvedEvent
  | DaemonPermissionPartialVoteEvent
  | DaemonPermissionForbiddenEvent
  | DaemonApprovalModeChangedEvent
  | DaemonToolToggledEvent
  | DaemonSettingsChangedEvent
  | DaemonWorkspaceInitializedEvent
  | DaemonGithubSetupCompletedEvent
  | DaemonMcpServerRestartedEvent
  | DaemonMcpServerRestartRefusedEvent
  | DaemonSettingsReloadedEvent
  | DaemonMcpServerAddedEvent
  | DaemonMcpServerRemovedEvent
  | DaemonSessionRewoundEvent;
export type DaemonStreamLifecycleEvent =
  | DaemonClientEvictedEvent
  | DaemonSlowClientWarningEvent
  | DaemonStreamErrorEvent
  | DaemonStateResyncRequiredEvent
  | DaemonHistoryTruncatedEvent;
/**
 * MCP guardrail push events. Grouped as their own union member (rather
 * than folded into `DaemonStreamLifecycleEvent`) because they report
 * McpClientManager state, not the SSE subscriber's queue health or the
 * daemon's stream lifecycle. Adapters that only care about "is the
 * stream alive" can ignore this whole branch.
 */
export type DaemonMcpGuardrailEvent =
  | DaemonMcpBudgetWarningEvent
  | DaemonMcpChildRefusedBatchEvent;
/**
 * Workspace-level mutation signals fanned out through every active
 * session's bus. Non-terminal; clients use them to refresh cached
 * views of workspace memory / agents.
 */
export type DaemonWorkspaceMutationEvent =
  | DaemonMemoryChangedEvent
  | DaemonAgentChangedEvent
  | DaemonTrustChangeRequestedEvent
  | DaemonExtensionsChangedEvent
  | DaemonMcpServerChangedEvent;
/**
 * Daemon assist push events — non-terminal UX hints emitted by the ACP
 * child on the per-session SSE bus. Today only `followup_suggestion`
 * (server-side ghost-text suggestion after each end_turn); the union
 * is reserved for future assist events (e.g. server-side speculation
 * results, contextual help) that share the same "best-effort UX hint,
 * client may ignore" semantics. Adapters that don't render assist
 * hints can ignore this whole branch.
 */
export type DaemonAssistEvent = DaemonFollowupSuggestionEvent;
export type DaemonTurnEvent = DaemonTurnCompleteEvent | DaemonTurnErrorEvent;
export type KnownDaemonEvent =
  | DaemonSessionEvent
  | DaemonControlEvent
  | DaemonStreamLifecycleEvent
  | DaemonMcpGuardrailEvent
  | DaemonWorkspaceMutationEvent
  | DaemonAuthEvent
  | DaemonAssistEvent
  | DaemonTurnEvent
  | DaemonSessionSnapshotEvent;
export interface DaemonSessionViewState {
  lastEventId?: number;
  sessionId?: string;
  /**
   * False once this stream observes a terminal frame. For client_evicted and
   * stream_error this only describes the current stream, not the remote
   * daemon session's lifetime.
   */
  alive: boolean;
  currentModelId?: string;
  displayName?: string;
  recordingDegraded: boolean;
  pendingPermissions: Record<string, DaemonPermissionRequestData>;
  lastSessionUpdate?: DaemonSessionUpdateData;
  lastModelSwitchFailure?: DaemonModelSwitchFailedData;
  terminalEvent?:
    | DaemonSessionDiedEvent
    | DaemonSessionClosedEvent
    | DaemonClientEvictedEvent
    | DaemonStreamErrorEvent;
  streamError?: DaemonStreamErrorData;
  unrecognizedKnownEventCount: number;
  lastUnrecognizedKnownEvent?: DaemonEvent;
  droppedPermissionRequestCount: number;
  lastDroppedPermissionRequestId?: string;
  unmatchedPermissionResolutionCount: number;
  lastUnmatchedPermissionResolutionId?: string;
  /**
   * Count of `slow_client_warning` frames this stream has observed.
   * Non-terminal — warnings precede eviction but don't themselves
   * close the stream. Adapters tap this counter to surface "your
   * stream is lagging" UI before `client_evicted` arrives.
   */
  slowClientWarningCount: number;
  lastSlowClientWarning?: DaemonSlowClientWarningData;
  /**
   * Count of `mcp_budget_warning` frames this stream has observed.
   * Non-terminal -- warning fires on the upward 75% crossing and
   * re-arms below 37.5%, so a flapping budget produces at most one
   * warning per crossing episode. Adapters tap this counter to surface
   * MCP-pressure UI; the snapshot at `GET /workspace/mcp` still carries
   * the authoritative state-after-reconnect.
   *
   * **Workspace-scope multiplier**: when the daemon advertises
   * `mcp_workspace_pool` and the budget is workspace-scoped
   * (`scope: 'workspace'` on the event payload), a SINGLE underlying
   * budget crossing fans out as N notifications -- one per attached
   * session. Each session's reducer increments its OWN counter
   * independently, so this counter is per-stream NOT per-budget-event.
   * Consumers aggregating `mcpBudgetWarningCount` across multiple
   * sessions on the same connection will count an N* multiplier; gate
   * on `isWorkspaceScopedBudgetEvent` (or branch on
   * `lastMcpBudgetWarning?.scope === 'workspace'`) and divide by the
   * active session count if a workspace-level "events fired" tally is
   * needed. The per-stream counter remains the right shape for "did
   * THIS session see budget pressure" UI.
   */
  mcpBudgetWarningCount: number;
  lastMcpBudgetWarning?: DaemonMcpBudgetWarningData;
  /**
   * Count of `mcp_child_refused_batch` frames this stream has
   * observed. Each frame is a single batch (per discovery pass, or
   * length-1 from `readResource`'s lazy-spawn refusal); the count
   * reflects batches not refused-server entries. Mirrors the
   * snapshot's `disabledReason: 'budget'` per-server tag.
   *
   * **Workspace-scope multiplier**: same N* fan-out semantics as
   * `mcpBudgetWarningCount` -- one workspace-scoped refused_batch
   * event becomes N reducer increments across N attached sessions on
   * the daemon's connection.
   */
  mcpChildRefusedBatchCount: number;
  lastMcpChildRefusedBatch?: DaemonMcpChildRefusedBatchData;
  /**
   * Most recent workspace mutation observed on this stream (memory or
   * agent change). Non-terminal -- adapters render a "memory just
   * changed" / "agent X updated" toast and re-fetch the relevant
   * workspace status route. Captures only the latest event; older
   * events are not retained because the route's read-after-write
   * contract makes the event a hint, not the source of truth.
   */
  lastWorkspaceMutation?: DaemonMemoryChangedData | DaemonAgentChangedData;
  lastWorkspaceMutationType?: 'memory_changed' | 'agent_changed';
  /**
   * The most recent approval-mode change observed for this session,
   * plus a count for diagnostic UIs that want to render "approval mode
   * toggled N times this session". Non-terminal.
   */
  approvalMode?: string;
  approvalModeChangedCount: number;
  lastApprovalModeChange?: DaemonApprovalModeChangedData;
  /**
   * Workspace-scoped fan-out -- every session bus receives
   * `tool_toggled` events so cross-session UIs can update "this tool
   * is disabled in the workspace" badges in real time. Non-terminal.
   */
  toolToggleCount: number;
  lastToolToggle?: DaemonToolToggledData;
  /**
   * Workspace-scoped -- every session bus receives
   * `workspace_initialized` events. `lastWorkspaceInit` records the
   * most recent envelope so adapters can render a "QWEN.md was just
   * scaffolded by another client" notice without polling.
   */
  workspaceInitCount: number;
  lastWorkspaceInit?: DaemonWorkspaceInitializedData;
  /**
   * Workspace-scoped MCP restart counters. Only
   * `mcp_server_restarted` increments `mcpRestartCount`; soft skips
   * (`mcp_server_restart_refused`) increment `mcpRestartRefusedCount`
   * separately so adapters can distinguish "the user kept hitting
   * restart but it's been refused" from "we've actually rotated the
   * server N times."
   */
  mcpRestartCount: number;
  lastMcpRestart?: DaemonMcpServerRestartedData;
  mcpRestartRefusedCount: number;
  lastMcpRestartRefused?: DaemonMcpServerRestartRefusedData;
  /**
   * Per-pending consensus vote progress, keyed by `requestId`.
   * Updated on every `permission_partial_vote` frame; cleared when
   * the corresponding `permission_resolved` /
   * `permission_already_resolved` arrives. Daemons running
   * non-consensus policies never populate this map.
   */
  permissionVoteProgress: Record<string, DaemonPermissionPartialVoteData>;
  /**
   * Bounded history of recent `permission_forbidden` events on this
   * session -- first 32 retained, oldest evicted on overflow. Adapters
   * use this to render "client X tried to vote but was rejected"
   * notices for the session.
   */
  forbiddenVotes: readonly DaemonPermissionForbiddenData[];
  /**
   * Total `permission_forbidden` event count this stream has observed
   * (including ones evicted from `forbiddenVotes`).
   */
  forbiddenVoteCount: number;
  /**
   * Set to true when the reducer observes a `state_resync_required`
   * frame from the daemon
   * (consumer reconnected with `Last-Event-ID` past the daemon's
   * ring eviction point — events between last-delivered and ring-
   * head were lost, so the accumulated view state is stale relative
   * to the daemon's truth).
   *
   * While true, the reducer **auto-skips** all non-terminal delta
   * events (still advances `lastEventId`) to prevent the consumer
   * from rendering against a known-stale state. Terminal lifecycle
   * events (`session_died` / `session_closed` / `client_evicted` /
   * `stream_error`) still apply because they're critical end-of-
   * stream signals that don't depend on prior state being current.
   *
   * Consumer recovery: when this is true, call `loadSession` to
   * fetch the daemon's canonical session snapshot, then reconstruct
   * view state via `createDaemonSessionViewState({...loaded state})`.
   * The fresh state seed clears the flag implicitly (a new reducer
   * instance starts fresh).
   */
  awaitingResync: boolean;
  /**
   * Count of `state_resync_required` frames this stream has observed.
   * Typically 0 (no resync) or 1 (single ring-eviction event);
   * higher counts indicate the consumer is reconnecting repeatedly
   * past the ring boundary, which is itself a debuggable signal
   * (network instability or ring sizing wrong for the workload).
   */
  resyncRequiredCount: number;
  /** Most recent resync payload (reason + gap range). */
  lastResyncRequired?: DaemonStateResyncRequiredData;
  /**
   * Count of `history_truncated` markers observed from bounded replay
   * snapshots. This is informational only and does not imply stale local state
   * or trigger resync recovery.
   */
  historyTruncatedCount: number;
  /** Most recent bounded replay-window marker. */
  lastHistoryTruncated?: DaemonHistoryTruncatedData;
  /**
   * Daemon assist push: most recent `followup_suggestion` observed on
   * this session. Adapters render it as ghost-text in the input
   * placeholder; clients self-invalidate on next sendPrompt (no
   * server round-trip needed). `promptId` correlates with the turn
   * that produced the suggestion. Undefined until the daemon emits
   * at least one suggestion.
   */
  lastFollowupSuggestion?: DaemonFollowupSuggestionData;
  lastTurnComplete?: DaemonTurnCompleteData;
  lastTurnError?: DaemonTurnErrorData;
  rewindCount: number;
  lastRewind?: DaemonSessionRewoundData;
  lastBranch?: DaemonSessionBranchedData;
}
export declare function createDaemonSessionViewState(
  seed?: Partial<DaemonSessionViewState>,
): DaemonSessionViewState;
export declare function isKnownDaemonEvent(
  event: DaemonEvent,
): event is KnownDaemonEvent;
export declare function isDaemonEventType<
  TType extends KnownDaemonEvent['type'],
>(
  event: DaemonEvent,
  type: TType,
): event is Extract<
  KnownDaemonEvent,
  {
    type: TType;
  }
>;
/**
 * Branch on whether an MCP guardrail event is scoped to the entire
 * workspace (one shared budget across all sessions on this daemon's
 * connection) or per-session (one budget per ACP child). SDK reducers
 * maintain a single counter (`mcpBudgetWarningCount` /
 * `mcpChildRefusedBatchCount`) regardless of scope, but UI consumers
 * rendering "this workspace just hit budget pressure" vs "this session
 * just got refused" can use this helper to disambiguate.
 *
 * Returns `true` only when the event carries an explicit
 * `scope === 'workspace'`. Daemons running with `--no-mcp-pool` / no
 * configured budget keep the field absent (semantically `'session'`);
 * this helper returns `false` for those cases so existing UI logic
 * ("treat all events as per-session") keeps working without a code
 * change.
 *
 * Accepts both `mcp_budget_warning` and `mcp_child_refused_batch`
 * data shapes -- the only two events that carry the `scope` field
 * today.
 */
export declare function isWorkspaceScopedBudgetEvent(
  data: DaemonMcpBudgetWarningData | DaemonMcpChildRefusedBatchData,
): boolean;
export declare function asKnownDaemonEvent(
  event: DaemonEvent,
): KnownDaemonEvent | undefined;
export declare function reduceDaemonSessionEvent(
  state: DaemonSessionViewState,
  rawEvent: DaemonEvent,
): DaemonSessionViewState;
export declare function reduceDaemonSessionEvents(
  events: Iterable<DaemonEvent>,
  initialState?: DaemonSessionViewState,
): DaemonSessionViewState;
/** Workspace-scoped auth device-flow state. One entry per provider;
 *  the registry's per-provider singleton constraint is reflected here so
 *  adapters can render `state.flows[providerId]` without worrying about
 *  concurrent flows for the same provider. */
export interface DaemonDeviceFlowReducerState {
  deviceFlowId: string;
  status: DaemonAuthDeviceFlowStatus;
  errorKind?: DaemonAuthDeviceFlowErrorKind;
  hint?: string;
  /** Most recent `intervalMs` reported by `auth_device_flow_throttled`. */
  intervalMs?: number;
  /** Most recent SSE event id observed for this flow (NOT a wall-clock
   *  timestamp). Used as a monotonic counter so out-of-order delivery
   *  doesn't let a stale frame overwrite a newer one. `undefined` if
   *  the underlying envelope omitted `id` (synthetic / SDK-internal
   *  frames). Typed as `number | undefined` rather than defaulting to
   *  0 because the daemon-side EventBus assigns ids >= 1, so `0` has
   *  no meaning in real traffic and would break the monotonic gate for
   *  synthetic frames. The gate already short-circuits on
   *  `existing.lastSeenEventId !== undefined`, so undefined is safe. */
  lastSeenEventId: number | undefined;
  /** Set on `authorized` to the credential's expiry, when known. */
  authorizedExpiresAt?: number;
  /** Best-effort non-PII account label echoed from `authorized`. */
  accountAlias?: string;
}
export interface DaemonAuthState {
  flows: Partial<
    Record<DaemonAuthDeviceFlowProviderId, DaemonDeviceFlowReducerState>
  >;
}
export declare function createDaemonAuthState(
  seed?: Partial<DaemonAuthState>,
): DaemonAuthState;
/**
 * Apply a single auth device-flow event to a workspace-scoped auth state.
 * Non-auth events (sessions, control, lifecycle) pass through unchanged so
 * adapters can fan one event stream into both `reduceDaemonSessionEvent`
 * (per session) and `reduceDaemonAuthEvent` (workspace-wide) without
 * filtering ahead of time.
 *
 * Edge cases:
 *   - `throttled` / `authorized` / `failed` / `cancelled` for a deviceFlowId
 *     not matching the current `flows[providerId]` are dropped: by the time
 *     they arrive, that flow's terminal-grace window has already expired or
 *     the SDK has rebased onto a newer flow. Silently ignoring stale events
 *     is the correct behavior here (events are non-authoritative; the
 *     daemon's GET .../device-flow/:id is the source of truth).
 */
export declare function reduceDaemonAuthEvent(
  state: DaemonAuthState,
  rawEvent: DaemonEvent,
): DaemonAuthState;
export declare function reduceDaemonAuthEvents(
  events: Iterable<DaemonEvent>,
  initialState?: DaemonAuthState,
): DaemonAuthState;
