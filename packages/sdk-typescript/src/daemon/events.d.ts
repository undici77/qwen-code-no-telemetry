/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonEvent, DaemonMcpTransport, PermissionOutcome } from './types.js';
declare const DAEMON_KNOWN_EVENT_TYPE_VALUES: readonly ["session_update", "permission_request", "permission_resolved", "permission_already_resolved", "model_switched", "model_switch_failed", "session_died", "session_closed", "session_metadata_updated", "client_evicted", "slow_client_warning", "stream_error", "mcp_budget_warning", "mcp_child_refused_batch", "memory_changed", "agent_changed", "auth_device_flow_started", "auth_device_flow_throttled", "auth_device_flow_authorized", "auth_device_flow_failed", "auth_device_flow_cancelled", "approval_mode_changed", "tool_toggled", "workspace_initialized", "mcp_server_restarted", "mcp_server_restart_refused"];
export type DaemonKnownEventType = (typeof DAEMON_KNOWN_EVENT_TYPE_VALUES)[number];
export interface DaemonEventEnvelope<TType extends string, TData> extends Omit<DaemonEvent, 'type' | 'data'> {
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
export interface DaemonClientEvictedData {
    reason: string;
    droppedAfter?: number;
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
    [key: string]: unknown;
}
export interface DaemonStreamErrorData {
    error: string;
    [key: string]: unknown;
}
/**
 * PR 14b: payload for the `mcp_budget_warning` SSE frame. Fired on the
 * upward 75% crossing of `reservedSlots.size / clientBudget`. Re-arms
 * only after the ratio drops below 37.5% — so a budget that flaps just
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
    [key: string]: unknown;
}
/**
 * PR 14b: per-server entry inside a `mcp_child_refused_batch` payload.
 * `transport` is the family resolved at refusal time via the daemon's
 * `mcpTransportOf` helper; future refusal causes (Wave 5+) would
 * extend `reason` beyond `'budget_exhausted'`.
 */
export interface DaemonMcpRefusedServer {
    name: string;
    transport: DaemonMcpTransport;
    reason: 'budget_exhausted';
    [key: string]: unknown;
}
/**
 * PR 14b: payload for the `mcp_child_refused_batch` SSE frame. Fires
 * once per `discoverAllMcpTools*` pass when at least one server was
 * refused, OR as a length-1 batch on the `readResource` lazy-spawn
 * refusal path. `mode` is the literal `'enforce'` because `warn` mode
 * never refuses (so this event never fires under `warn`).
 */
export interface DaemonMcpChildRefusedBatchData {
    refusedServers: DaemonMcpRefusedServer[];
    budget: number;
    liveCount: number;
    reservedCount: number;
    mode: 'enforce';
    [key: string]: unknown;
}
/**
 * Issue #4175 PR 16: a `POST /workspace/memory` write completed
 * successfully. `scope` records which file was touched (workspace QWEN.md
 * vs global ~/.qwen/QWEN.md), `mode` is the requested write mode, and
 * `bytesWritten` is the size of the file post-write.
 */
export interface DaemonMemoryChangedData {
    scope: 'workspace' | 'global';
    filePath: string;
    mode: 'append' | 'replace';
    bytesWritten: number;
    [key: string]: unknown;
}
/**
 * Issue #4175 PR 16: a workspace agent CRUD mutation completed
 * successfully. `change` discriminates the operation; `level` records
 * whether the project- or user-level definition was touched. Built-in
 * and extension agents are read-only and never appear here.
 */
export interface DaemonAgentChangedData {
    change: 'created' | 'updated' | 'deleted';
    name: string;
    level: 'project' | 'user';
    [key: string]: unknown;
}
/** Issue #4175 PR 21 — auth device-flow event payloads. */
/** Provider id. Open string union for forward-compatible providers; `qwen-oauth`
 *  is the only value v1 currently emits. */
export type DaemonAuthDeviceFlowProviderId = 'qwen-oauth' | (string & {});
export type DaemonAuthDeviceFlowStatus = 'pending' | 'authorized' | 'expired' | 'error' | 'cancelled';
/**
 * Known errorKind values surfaced on `auth_device_flow_failed`. The
 * trailing `(string & {})` keeps this as an OPEN union so a daemon
 * adding a new errorKind doesn't get its event silently dropped by an
 * older SDK's type guard — consumers branching exhaustively on the
 * known literals get the same narrowing as before, while unknown
 * future kinds fall through to a `string` fallback rather than failing
 * `isAuthDeviceFlowFailedData` and being filtered out by
 * `asKnownDaemonEvent` (PR #4255 review C2).
 */
export type DaemonAuthDeviceFlowErrorKind = 'expired_token' | 'access_denied' | 'invalid_grant' | 'upstream_error'
/** Disk-write / `provider.persist()` failure path. The IdP-side token
 *  exchange succeeded but the daemon couldn't durably store credentials
 *  (EACCES, EROFS, ENOSPC, etc.). Distinct from `upstream_error`. */
 | 'persist_failed'
/** SDK-synthesized when the daemon's GET returns 404 inside
 *  `DaemonAuthFlow.awaitCompletion`. Surfaced from `getDeviceFlowOrSynthetic404`
 *  rather than the daemon — three reachable causes: (a) the flow expired
 *  past the 5-min terminal grace window and the sweeper reaped it, (b) the
 *  daemon was restarted and lost the in-memory registry, (c) the
 *  `deviceFlowId` was wrong / spoofed. PR #4255 follow-up review thread
 *  (deepseek-v4-pro): added to the typed union so SDK consumers' exhaustive
 *  switches narrow it as a known literal instead of falling into the
 *  `(string & {})` fallback arm. */
 | 'not_found_or_evicted' | (string & {});
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
 * #4175 Wave 4 PR 17. Fired after `POST /session/:id/approval-mode`
 * successfully changes a live session's approval mode. `persisted`
 * reflects whether the change was also written to workspace settings
 * (set via the route's optional `persist: true` body flag).
 *
 * `previous` and `next` are typed as `string` here rather than the
 * `DaemonApprovalMode` union so SDK consumers built against an older
 * daemon don't crash on a future fifth mode literal — the daemon-side
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
 * #4175 Wave 4 PR 17. Workspace-scoped: fan-outs to every active
 * session SSE bus when `POST /workspace/tools/:name/enable` mutates
 * the workspace `tools.disabled` settings list. The event is emitted
 * regardless of whether the tool is currently registered — it
 * communicates intent, not registry state. Live sessions retain
 * already-registered tools; the toggle takes effect on the next ACP
 * child spawn or `ToolRegistry.refresh()`.
 */
export interface DaemonToolToggledData {
    toolName: string;
    enabled: boolean;
    originatorClientId?: string;
    [key: string]: unknown;
}
/**
 * #4175 Wave 4 PR 17. Workspace-scoped: fan-outs to every active
 * session SSE bus when `POST /workspace/init` is invoked. The
 * `action` field discriminates between three outcomes:
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
/**
 * #4175 Wave 4 PR 17. Workspace-scoped: fired when
 * `POST /workspace/mcp/:server/restart` successfully reconnected and
 * rediscovered the named MCP server. `durationMs` measures the full
 * disconnect+reconnect+rediscover sequence on the ACP-child side.
 */
export interface DaemonMcpServerRestartedData {
    serverName: string;
    durationMs: number;
    originatorClientId?: string;
    [key: string]: unknown;
}
/**
 * #4175 Wave 4 PR 17. Workspace-scoped: fired when
 * `POST /workspace/mcp/:server/restart` was a soft skip
 * (`skipped: true`). `reason` is the same closed enum surfaced on
 * the route's response body, so SDK consumers can branch on a single
 * union when reconciling event-driven state with HTTP-call results.
 */
export interface DaemonMcpServerRestartRefusedData {
    serverName: string;
    reason: 'in_flight' | 'disabled' | 'budget_would_exceed';
    originatorClientId?: string;
    [key: string]: unknown;
}
export type DaemonSessionUpdateEvent = DaemonEventEnvelope<'session_update', DaemonSessionUpdateData>;
export type DaemonPermissionRequestEvent = DaemonEventEnvelope<'permission_request', DaemonPermissionRequestData>;
export type DaemonPermissionResolvedEvent = DaemonEventEnvelope<'permission_resolved', DaemonPermissionResolvedData>;
export type DaemonPermissionAlreadyResolvedEvent = DaemonEventEnvelope<'permission_already_resolved', DaemonPermissionAlreadyResolvedData>;
export type DaemonModelSwitchedEvent = DaemonEventEnvelope<'model_switched', DaemonModelSwitchedData>;
export type DaemonModelSwitchFailedEvent = DaemonEventEnvelope<'model_switch_failed', DaemonModelSwitchFailedData>;
export type DaemonSessionDiedEvent = DaemonEventEnvelope<'session_died', DaemonSessionDiedData>;
export type DaemonSessionClosedEvent = DaemonEventEnvelope<'session_closed', DaemonSessionClosedData>;
export type DaemonSessionMetadataUpdatedEvent = DaemonEventEnvelope<'session_metadata_updated', DaemonSessionMetadataUpdatedData>;
export type DaemonClientEvictedEvent = DaemonEventEnvelope<'client_evicted', DaemonClientEvictedData>;
export type DaemonSlowClientWarningEvent = DaemonEventEnvelope<'slow_client_warning', DaemonSlowClientWarningData>;
export type DaemonStreamErrorEvent = DaemonEventEnvelope<'stream_error', DaemonStreamErrorData>;
export type DaemonMcpBudgetWarningEvent = DaemonEventEnvelope<'mcp_budget_warning', DaemonMcpBudgetWarningData>;
export type DaemonMcpChildRefusedBatchEvent = DaemonEventEnvelope<'mcp_child_refused_batch', DaemonMcpChildRefusedBatchData>;
export type DaemonMemoryChangedEvent = DaemonEventEnvelope<'memory_changed', DaemonMemoryChangedData>;
export type DaemonAgentChangedEvent = DaemonEventEnvelope<'agent_changed', DaemonAgentChangedData>;
export type DaemonApprovalModeChangedEvent = DaemonEventEnvelope<'approval_mode_changed', DaemonApprovalModeChangedData>;
export type DaemonToolToggledEvent = DaemonEventEnvelope<'tool_toggled', DaemonToolToggledData>;
export type DaemonWorkspaceInitializedEvent = DaemonEventEnvelope<'workspace_initialized', DaemonWorkspaceInitializedData>;
export type DaemonMcpServerRestartedEvent = DaemonEventEnvelope<'mcp_server_restarted', DaemonMcpServerRestartedData>;
export type DaemonMcpServerRestartRefusedEvent = DaemonEventEnvelope<'mcp_server_restart_refused', DaemonMcpServerRestartRefusedData>;
export type DaemonAuthDeviceFlowStartedEvent = DaemonEventEnvelope<'auth_device_flow_started', DaemonAuthDeviceFlowStartedData>;
export type DaemonAuthDeviceFlowThrottledEvent = DaemonEventEnvelope<'auth_device_flow_throttled', DaemonAuthDeviceFlowThrottledData>;
export type DaemonAuthDeviceFlowAuthorizedEvent = DaemonEventEnvelope<'auth_device_flow_authorized', DaemonAuthDeviceFlowAuthorizedData>;
export type DaemonAuthDeviceFlowFailedEvent = DaemonEventEnvelope<'auth_device_flow_failed', DaemonAuthDeviceFlowFailedData>;
export type DaemonAuthDeviceFlowCancelledEvent = DaemonEventEnvelope<'auth_device_flow_cancelled', DaemonAuthDeviceFlowCancelledData>;
export type DaemonAuthEvent = DaemonAuthDeviceFlowStartedEvent | DaemonAuthDeviceFlowThrottledEvent | DaemonAuthDeviceFlowAuthorizedEvent | DaemonAuthDeviceFlowFailedEvent | DaemonAuthDeviceFlowCancelledEvent;
export type DaemonSessionEvent = DaemonSessionUpdateEvent | DaemonModelSwitchedEvent | DaemonModelSwitchFailedEvent | DaemonSessionDiedEvent | DaemonSessionClosedEvent | DaemonSessionMetadataUpdatedEvent;
export type DaemonControlEvent = DaemonPermissionRequestEvent | DaemonPermissionResolvedEvent | DaemonPermissionAlreadyResolvedEvent | DaemonApprovalModeChangedEvent | DaemonToolToggledEvent | DaemonWorkspaceInitializedEvent | DaemonMcpServerRestartedEvent | DaemonMcpServerRestartRefusedEvent;
export type DaemonStreamLifecycleEvent = DaemonClientEvictedEvent | DaemonSlowClientWarningEvent | DaemonStreamErrorEvent;
/**
 * PR 14b: MCP guardrail push events. Grouped as their own union member
 * (rather than folded into `DaemonStreamLifecycleEvent`) because they
 * report McpClientManager state, not the SSE subscriber's queue health
 * or the daemon's stream lifecycle. Adapters that only care about
 * "is the stream alive" can ignore this whole branch.
 */
export type DaemonMcpGuardrailEvent = DaemonMcpBudgetWarningEvent | DaemonMcpChildRefusedBatchEvent;
/**
 * Issue #4175 PR 16: workspace-level mutation signals fanned out
 * through every active session's bus. Non-terminal; clients use them
 * to refresh cached views of workspace memory / agents.
 */
export type DaemonWorkspaceMutationEvent = DaemonMemoryChangedEvent | DaemonAgentChangedEvent;
export type KnownDaemonEvent = DaemonSessionEvent | DaemonControlEvent | DaemonStreamLifecycleEvent | DaemonMcpGuardrailEvent | DaemonWorkspaceMutationEvent | DaemonAuthEvent;
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
    pendingPermissions: Record<string, DaemonPermissionRequestData>;
    lastSessionUpdate?: DaemonSessionUpdateData;
    lastModelSwitchFailure?: DaemonModelSwitchFailedData;
    terminalEvent?: DaemonSessionDiedEvent | DaemonSessionClosedEvent | DaemonClientEvictedEvent | DaemonStreamErrorEvent;
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
     * PR 14b: count of `mcp_budget_warning` frames this stream has
     * observed. Non-terminal — warning fires on the upward 75% crossing
     * and re-arms below 37.5%, so a flapping budget produces at most
     * one warning per crossing episode. Adapters tap this counter to
     * surface MCP-pressure UI; the snapshot at `GET /workspace/mcp`
     * still carries the authoritative state-after-reconnect.
     */
    mcpBudgetWarningCount: number;
    lastMcpBudgetWarning?: DaemonMcpBudgetWarningData;
    /**
     * PR 14b: count of `mcp_child_refused_batch` frames this stream has
     * observed. Each frame is a single batch (per discovery pass, or
     * length-1 from `readResource`'s lazy-spawn refusal); the count
     * reflects batches not refused-server entries. Mirrors the
     * snapshot's `disabledReason: 'budget'` per-server tag.
     */
    mcpChildRefusedBatchCount: number;
    lastMcpChildRefusedBatch?: DaemonMcpChildRefusedBatchData;
    /**
     * Issue #4175 PR 16: most recent workspace mutation observed on this
     * stream (memory or agent change). Non-terminal — adapters render a
     * "memory just changed" / "agent X updated" toast and re-fetch the
     * relevant workspace status route. Captures only the latest event;
     * older events are not retained because the route's read-after-write
     * contract makes the event a hint, not the source of truth.
     */
    lastWorkspaceMutation?: DaemonMemoryChangedData | DaemonAgentChangedData;
    lastWorkspaceMutationType?: 'memory_changed' | 'agent_changed';
    /**
     * #4175 Wave 4 PR 17. The most recent approval-mode change observed
     * for this session, plus a count for diagnostic UIs that want to
     * render "approval mode toggled N times this session". Non-terminal.
     */
    approvalMode?: string;
    approvalModeChangedCount: number;
    lastApprovalModeChange?: DaemonApprovalModeChangedData;
    /**
     * #4175 Wave 4 PR 17. Workspace-scoped fan-out — every session bus
     * receives `tool_toggled` events so cross-session UIs can update
     * "this tool is disabled in the workspace" badges in real time.
     * Non-terminal.
     */
    toolToggleCount: number;
    lastToolToggle?: DaemonToolToggledData;
    /**
     * #4175 Wave 4 PR 17. Workspace-scoped — every session bus receives
     * `workspace_initialized` events. `lastWorkspaceInit` records the
     * most recent envelope so adapters can render a "QWEN.md was just
     * scaffolded by another client" notice without polling.
     */
    workspaceInitCount: number;
    lastWorkspaceInit?: DaemonWorkspaceInitializedData;
    /**
     * #4175 Wave 4 PR 17. Workspace-scoped MCP restart counters. Only
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
}
export declare function createDaemonSessionViewState(seed?: Partial<DaemonSessionViewState>): DaemonSessionViewState;
export declare function isKnownDaemonEvent(event: DaemonEvent): event is KnownDaemonEvent;
export declare function isDaemonEventType<TType extends KnownDaemonEvent['type']>(event: DaemonEvent, type: TType): event is Extract<KnownDaemonEvent, {
    type: TType;
}>;
export declare function asKnownDaemonEvent(event: DaemonEvent): KnownDaemonEvent | undefined;
export declare function reduceDaemonSessionEvent(state: DaemonSessionViewState, rawEvent: DaemonEvent): DaemonSessionViewState;
export declare function reduceDaemonSessionEvents(events: Iterable<DaemonEvent>, initialState?: DaemonSessionViewState): DaemonSessionViewState;
/** Issue #4175 PR 21 — workspace-scoped auth device-flow state. One entry
 *  per provider; the registry's per-provider singleton constraint is
 *  reflected here so adapters can render `state.flows[providerId]` without
 *  worrying about concurrent flows for the same provider. */
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
     *  frames). PR #4255 round-9 #6: changed from `number` (defaulting
     *  to 0) to `number | undefined` — the daemon-side EventBus assigns
     *  ids ≥ 1, so `0` is a sentinel that has no meaning in real
     *  traffic, but the monotonic gate (`rawEventId <= lastSeenEventId`)
     *  would reject any future synthetic frame using `id: 0`. The gate
     *  already short-circuits on `existing.lastSeenEventId !== undefined`,
     *  so undefined is safe. */
    lastSeenEventId: number | undefined;
    /** Set on `authorized` to the credential's expiry, when known. */
    authorizedExpiresAt?: number;
    /** Best-effort non-PII account label echoed from `authorized`. */
    accountAlias?: string;
}
export interface DaemonAuthState {
    flows: Partial<Record<DaemonAuthDeviceFlowProviderId, DaemonDeviceFlowReducerState>>;
}
export declare function createDaemonAuthState(seed?: Partial<DaemonAuthState>): DaemonAuthState;
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
export declare function reduceDaemonAuthEvent(state: DaemonAuthState, rawEvent: DaemonEvent): DaemonAuthState;
export declare function reduceDaemonAuthEvents(events: Iterable<DaemonEvent>, initialState?: DaemonAuthState): DaemonAuthState;
export {};
