/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
const DAEMON_KNOWN_EVENT_TYPE_VALUES = [
    'session_update',
    'permission_request',
    'permission_resolved',
    'permission_already_resolved',
    'model_switched',
    'model_switch_failed',
    'session_died',
    'session_closed',
    'session_metadata_updated',
    'client_evicted',
    'slow_client_warning',
    'stream_error',
    // PR 14b — MCP guardrail push events. See `mcp_guardrail_events`
    // capability tag. Both fire on the per-session SSE bus; consumers
    // should pre-flight `caps.features.includes('mcp_guardrail_events')`
    // before relying on these for non-snapshot UX (the `GET /workspace/mcp`
    // snapshot still encodes the same state).
    'mcp_budget_warning',
    'mcp_child_refused_batch',
    // Issue #4175 PR 16: workspace-level mutation signals fanned out
    // through every active session's bus. Non-terminal — informational
    // for adapters that want to render "memory just changed" / "agent X
    // updated" toasts. Read-after-write remains the correctness contract.
    'memory_changed',
    'agent_changed',
    // Issue #4175 PR 21 — workspace-scoped auth device-flow events.
    // These are NOT session-keyed; the session reducer no-ops on them
    // and `reduceDaemonAuthEvent` projects them into a workspace-level
    // state shape (one entry per provider).
    'auth_device_flow_started',
    'auth_device_flow_throttled',
    'auth_device_flow_authorized',
    'auth_device_flow_failed',
    'auth_device_flow_cancelled',
    // #4175 Wave 4 PR 17 — mutation control events.
    'approval_mode_changed',
    'tool_toggled',
    'workspace_initialized',
    'mcp_server_restarted',
    'mcp_server_restart_refused',
];
const DAEMON_KNOWN_EVENT_TYPES = new Set(DAEMON_KNOWN_EVENT_TYPE_VALUES);
const MAX_PENDING_PER_SESSION = 64;
export function createDaemonSessionViewState(seed = {}) {
    return {
        alive: seed.alive ?? true,
        pendingPermissions: { ...seed.pendingPermissions },
        lastEventId: seed.lastEventId,
        sessionId: seed.sessionId,
        currentModelId: seed.currentModelId,
        displayName: seed.displayName,
        lastSessionUpdate: seed.lastSessionUpdate,
        lastModelSwitchFailure: seed.lastModelSwitchFailure,
        terminalEvent: seed.terminalEvent,
        streamError: seed.streamError,
        unrecognizedKnownEventCount: seed.unrecognizedKnownEventCount ?? 0,
        lastUnrecognizedKnownEvent: seed.lastUnrecognizedKnownEvent,
        droppedPermissionRequestCount: seed.droppedPermissionRequestCount ?? 0,
        lastDroppedPermissionRequestId: seed.lastDroppedPermissionRequestId,
        unmatchedPermissionResolutionCount: seed.unmatchedPermissionResolutionCount ?? 0,
        lastUnmatchedPermissionResolutionId: seed.lastUnmatchedPermissionResolutionId,
        slowClientWarningCount: seed.slowClientWarningCount ?? 0,
        lastSlowClientWarning: seed.lastSlowClientWarning,
        mcpBudgetWarningCount: seed.mcpBudgetWarningCount ?? 0,
        lastMcpBudgetWarning: seed.lastMcpBudgetWarning,
        mcpChildRefusedBatchCount: seed.mcpChildRefusedBatchCount ?? 0,
        lastMcpChildRefusedBatch: seed.lastMcpChildRefusedBatch,
        lastWorkspaceMutation: seed.lastWorkspaceMutation,
        lastWorkspaceMutationType: seed.lastWorkspaceMutationType,
        approvalMode: seed.approvalMode,
        approvalModeChangedCount: seed.approvalModeChangedCount ?? 0,
        lastApprovalModeChange: seed.lastApprovalModeChange,
        toolToggleCount: seed.toolToggleCount ?? 0,
        lastToolToggle: seed.lastToolToggle,
        workspaceInitCount: seed.workspaceInitCount ?? 0,
        lastWorkspaceInit: seed.lastWorkspaceInit,
        mcpRestartCount: seed.mcpRestartCount ?? 0,
        lastMcpRestart: seed.lastMcpRestart,
        mcpRestartRefusedCount: seed.mcpRestartRefusedCount ?? 0,
        lastMcpRestartRefused: seed.lastMcpRestartRefused,
    };
}
export function isKnownDaemonEvent(event) {
    return asKnownDaemonEvent(event) !== undefined;
}
export function isDaemonEventType(event, type) {
    const known = asKnownDaemonEvent(event);
    return known?.type === type;
}
export function asKnownDaemonEvent(event) {
    switch (event.type) {
        case 'session_update':
            return isRecord(event.data)
                ? event
                : undefined;
        case 'permission_request':
            return isPermissionRequestData(event.data)
                ? event
                : undefined;
        case 'permission_resolved':
            return isPermissionResolvedData(event.data)
                ? event
                : undefined;
        case 'permission_already_resolved':
            return isPermissionAlreadyResolvedData(event.data)
                ? event
                : undefined;
        case 'model_switched':
            return isModelSwitchedData(event.data)
                ? event
                : undefined;
        case 'model_switch_failed':
            return isModelSwitchFailedData(event.data)
                ? event
                : undefined;
        case 'session_died':
            return isSessionDiedData(event.data)
                ? event
                : undefined;
        case 'session_closed':
            return isSessionClosedData(event.data)
                ? event
                : undefined;
        case 'session_metadata_updated':
            return isSessionMetadataUpdatedData(event.data)
                ? event
                : undefined;
        case 'client_evicted':
            return isClientEvictedData(event.data)
                ? event
                : undefined;
        case 'slow_client_warning':
            return isSlowClientWarningData(event.data)
                ? event
                : undefined;
        case 'stream_error':
            return isStreamErrorData(event.data)
                ? event
                : undefined;
        case 'mcp_budget_warning':
            return isMcpBudgetWarningData(event.data)
                ? event
                : undefined;
        case 'mcp_child_refused_batch':
            return isMcpChildRefusedBatchData(event.data)
                ? event
                : undefined;
        case 'memory_changed':
            return isMemoryChangedData(event.data)
                ? event
                : undefined;
        case 'agent_changed':
            return isAgentChangedData(event.data)
                ? event
                : undefined;
        case 'auth_device_flow_started':
            return isAuthDeviceFlowStartedData(event.data)
                ? event
                : undefined;
        case 'auth_device_flow_throttled':
            return isAuthDeviceFlowThrottledData(event.data)
                ? event
                : undefined;
        case 'auth_device_flow_authorized':
            return isAuthDeviceFlowAuthorizedData(event.data)
                ? event
                : undefined;
        case 'auth_device_flow_failed':
            return isAuthDeviceFlowFailedData(event.data)
                ? event
                : undefined;
        case 'auth_device_flow_cancelled':
            return isAuthDeviceFlowCancelledData(event.data)
                ? event
                : undefined;
        case 'approval_mode_changed':
            return isApprovalModeChangedData(event.data)
                ? event
                : undefined;
        case 'tool_toggled':
            return isToolToggledData(event.data)
                ? event
                : undefined;
        case 'workspace_initialized':
            return isWorkspaceInitializedData(event.data)
                ? event
                : undefined;
        case 'mcp_server_restarted':
            return isMcpServerRestartedData(event.data)
                ? event
                : undefined;
        case 'mcp_server_restart_refused':
            return isMcpServerRestartRefusedData(event.data)
                ? event
                : undefined;
        default:
            return undefined;
    }
}
export function reduceDaemonSessionEvent(state, rawEvent) {
    const base = advanceLastEventId(state, rawEvent.id);
    const event = asKnownDaemonEvent(rawEvent);
    if (!event) {
        if (!isKnownDaemonEventTypeName(rawEvent.type))
            return base;
        return {
            ...base,
            unrecognizedKnownEventCount: base.unrecognizedKnownEventCount + 1,
            lastUnrecognizedKnownEvent: rawEvent,
        };
    }
    switch (event.type) {
        case 'session_update':
            return {
                ...base,
                // ACP SessionNotification carries sessionId at the top level today;
                // keep this aligned with httpAcpBridge's emission shape.
                sessionId: getString(event.data, 'sessionId') ?? base.sessionId,
                lastSessionUpdate: event.data,
            };
        case 'permission_request': {
            const isExistingRequest = event.data.requestId in base.pendingPermissions;
            if (!isExistingRequest &&
                Object.keys(base.pendingPermissions).length >= MAX_PENDING_PER_SESSION) {
                return {
                    ...base,
                    droppedPermissionRequestCount: base.droppedPermissionRequestCount + 1,
                    lastDroppedPermissionRequestId: event.data.requestId,
                };
            }
            return {
                ...base,
                sessionId: event.data.sessionId,
                pendingPermissions: {
                    ...base.pendingPermissions,
                    [event.data.requestId]: clonePermissionRequestData(event.data),
                },
            };
        }
        case 'permission_resolved': {
            if (!(event.data.requestId in base.pendingPermissions)) {
                return {
                    ...base,
                    unmatchedPermissionResolutionCount: base.unmatchedPermissionResolutionCount + 1,
                    lastUnmatchedPermissionResolutionId: event.data.requestId,
                };
            }
            const pendingPermissions = { ...base.pendingPermissions };
            delete pendingPermissions[event.data.requestId];
            return { ...base, pendingPermissions };
        }
        case 'permission_already_resolved': {
            if (!(event.data.requestId in base.pendingPermissions)) {
                return {
                    ...base,
                    unmatchedPermissionResolutionCount: base.unmatchedPermissionResolutionCount + 1,
                    lastUnmatchedPermissionResolutionId: event.data.requestId,
                };
            }
            const pendingPermissions = { ...base.pendingPermissions };
            delete pendingPermissions[event.data.requestId];
            return { ...base, pendingPermissions };
        }
        case 'model_switched':
            return {
                ...base,
                sessionId: event.data.sessionId,
                currentModelId: event.data.modelId,
                lastModelSwitchFailure: undefined,
            };
        case 'model_switch_failed':
            return {
                ...base,
                sessionId: event.data.sessionId,
                lastModelSwitchFailure: event.data,
            };
        case 'session_died':
            return {
                ...base,
                sessionId: event.data.sessionId,
                alive: false,
                terminalEvent: chooseTerminalEvent(base.terminalEvent, event),
                pendingPermissions: {},
            };
        case 'session_closed':
            return {
                ...base,
                sessionId: event.data.sessionId,
                alive: false,
                terminalEvent: chooseTerminalEvent(base.terminalEvent, event),
                pendingPermissions: {},
            };
        case 'session_metadata_updated':
            return {
                ...base,
                sessionId: event.data.sessionId,
                displayName: event.data.displayName,
            };
        case 'client_evicted':
            return {
                ...base,
                alive: false,
                terminalEvent: chooseTerminalEvent(base.terminalEvent, event),
                pendingPermissions: {},
            };
        case 'slow_client_warning':
            // Non-terminal: warning precedes eviction but doesn't close
            // the stream on its own. Count + capture the latest snapshot
            // so adapters can render lag UI (or pre-emptively detach).
            // `alive` and `pendingPermissions` are unchanged.
            return {
                ...base,
                slowClientWarningCount: base.slowClientWarningCount + 1,
                lastSlowClientWarning: event.data,
            };
        case 'stream_error':
            return {
                ...base,
                alive: false,
                terminalEvent: chooseTerminalEvent(base.terminalEvent, event),
                streamError: event.data,
                pendingPermissions: {},
            };
        case 'mcp_budget_warning':
            // Non-terminal: budget pressure is a status signal, not a stream
            // close. Count + capture latest so adapters can render
            // "MCP pressure" UI; `alive` and `pendingPermissions` unchanged.
            return {
                ...base,
                mcpBudgetWarningCount: base.mcpBudgetWarningCount + 1,
                lastMcpBudgetWarning: event.data,
            };
        case 'mcp_child_refused_batch':
            // Non-terminal: refusals are operator-actionable signals (raise
            // budget / drop servers), not stream lifecycle events. The
            // session keeps running with a smaller MCP fleet.
            return {
                ...base,
                mcpChildRefusedBatchCount: base.mcpChildRefusedBatchCount + 1,
                lastMcpChildRefusedBatch: event.data,
            };
        case 'memory_changed':
            // Non-terminal: adapters render a "memory just changed" hint and
            // re-fetch `GET /workspace/memory` to get the canonical state. We
            // don't append to a list — the latest event is enough since the
            // route's read-after-write contract is the source of truth.
            return {
                ...base,
                lastWorkspaceMutation: event.data,
                lastWorkspaceMutationType: 'memory_changed',
            };
        case 'agent_changed':
            // Same shape as `memory_changed` — non-terminal hint that
            // triggers a `GET /workspace/agents` re-fetch.
            return {
                ...base,
                lastWorkspaceMutation: event.data,
                lastWorkspaceMutationType: 'agent_changed',
            };
        // Auth device-flow events are workspace-scoped; the session reducer
        // is a no-op (consume `lastEventId` via `base` and otherwise pass
        // state through). Workspace-level state lives in `DaemonAuthState`
        // and is projected by `reduceDaemonAuthEvent`.
        case 'auth_device_flow_started':
        case 'auth_device_flow_throttled':
        case 'auth_device_flow_authorized':
        case 'auth_device_flow_failed':
        case 'auth_device_flow_cancelled':
            return base;
        // #4282 fold-in 2 (gpt-5.5 SV3): for the 5 PR 17 mutation events,
        // copy `event.originatorClientId` (envelope-level) into the stored
        // snapshot. Without this, consumers reading
        // `lastApprovalModeChange` / `lastToolToggle` / `lastWorkspaceInit`
        // / `lastMcpRestart{,Refused}` cannot tell whether the mutation
        // originated from themselves — even though the raw event carried
        // that information at the envelope level. `mergeOriginator`
        // preserves any pre-existing `data.originatorClientId` (which the
        // daemon does NOT currently populate, but the field exists on the
        // Data interfaces) and falls back to the envelope.
        case 'approval_mode_changed':
            return {
                ...base,
                approvalMode: event.data.next,
                approvalModeChangedCount: base.approvalModeChangedCount + 1,
                lastApprovalModeChange: mergeOriginator(event.data, event),
            };
        case 'tool_toggled':
            // Workspace-scoped — same `tool_toggled` envelope is fan-out to
            // every session, so adapters can render "this tool was disabled
            // by another client" without polling.
            return {
                ...base,
                toolToggleCount: base.toolToggleCount + 1,
                lastToolToggle: mergeOriginator(event.data, event),
            };
        case 'workspace_initialized':
            // Workspace-scoped fan-out. Non-terminal — just records that a
            // QWEN.md scaffold was performed.
            return {
                ...base,
                workspaceInitCount: base.workspaceInitCount + 1,
                lastWorkspaceInit: mergeOriginator(event.data, event),
            };
        case 'mcp_server_restarted':
            return {
                ...base,
                mcpRestartCount: base.mcpRestartCount + 1,
                lastMcpRestart: mergeOriginator(event.data, event),
            };
        case 'mcp_server_restart_refused':
            return {
                ...base,
                mcpRestartRefusedCount: base.mcpRestartRefusedCount + 1,
                lastMcpRestartRefused: mergeOriginator(event.data, event),
            };
        default: {
            const _exhaustive = event;
            return _exhaustive;
        }
    }
}
export function reduceDaemonSessionEvents(events, initialState = createDaemonSessionViewState()) {
    let state = initialState;
    for (const event of events)
        state = reduceDaemonSessionEvent(state, event);
    return state;
}
export function createDaemonAuthState(seed = {}) {
    return { flows: { ...(seed.flows ?? {}) } };
}
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
export function reduceDaemonAuthEvent(state, rawEvent) {
    const event = asKnownDaemonEvent(rawEvent);
    if (!event)
        return state;
    switch (event.type) {
        case 'auth_device_flow_started': {
            // PR #4255 fold-in 8 review thread #2: gate stale `started`
            // frames the same way as the matching-flow handlers. SSE
            // reconnect with `Last-Event-ID < started.id` would otherwise
            // replay an old started for the SAME deviceFlowId after the
            // SDK reducer already advanced to a terminal state, resetting
            // the visible status to 'pending'. A stale started for an
            // OLDER flow (different deviceFlowId, lower id than the
            // current flow's lastSeenEventId) similarly gets ignored.
            const providerId = event.data.providerId;
            const existing = state.flows[providerId];
            if (existing !== undefined &&
                rawEvent.id !== undefined &&
                existing.lastSeenEventId !== undefined &&
                rawEvent.id <= existing.lastSeenEventId) {
                return state;
            }
            return {
                flows: {
                    ...state.flows,
                    [providerId]: {
                        deviceFlowId: event.data.deviceFlowId,
                        status: 'pending',
                        lastSeenEventId: rawEvent.id ?? existing?.lastSeenEventId,
                    },
                },
            };
        }
        case 'auth_device_flow_throttled': {
            const updated = updateMatchingFlow(state, event.data.deviceFlowId, rawEvent.id, (flow) => ({
                ...flow,
                intervalMs: event.data.intervalMs,
                lastSeenEventId: rawEvent.id ?? flow.lastSeenEventId,
            }));
            return updated ?? state;
        }
        case 'auth_device_flow_authorized': {
            const providerId = event.data.providerId;
            const existing = state.flows[providerId];
            if (!existing || existing.deviceFlowId !== event.data.deviceFlowId) {
                return state;
            }
            // PR #4255 fold-in 8 review thread #2: enforce monotonicity
            // here too. The deviceFlowId equality check above narrows to
            // "this frame is for the current flow"; the id gate then
            // refuses out-of-order replay (e.g. a delayed `authorized`
            // arriving after a more recent `failed` for the same flow,
            // which the daemon's transitionTerminal would never produce
            // but a malformed/synthetic stream could).
            if (rawEvent.id !== undefined &&
                existing.lastSeenEventId !== undefined &&
                rawEvent.id <= existing.lastSeenEventId) {
                return state;
            }
            const next = {
                ...existing,
                status: 'authorized',
                authorizedExpiresAt: event.data.expiresAt,
                accountAlias: event.data.accountAlias,
                errorKind: undefined,
                lastSeenEventId: rawEvent.id ?? existing.lastSeenEventId,
            };
            return { flows: { ...state.flows, [providerId]: next } };
        }
        case 'auth_device_flow_failed': {
            // The daemon's status machine reserves 'expired' for the time-based
            // path (now >= expiresAt). Upstream RFC 8628 errors — including
            // `expired_token` — go to 'error' with `errorKind` carrying the
            // distinction. Earlier drafts collapsed `errorKind: 'expired_token'`
            // to status 'expired', which gave SDK consumers a different
            // status than the daemon's GET endpoint reported. Code-reviewer
            // P1-9 / silent-failure D2: align with daemon, surface errorKind
            // separately.
            const updated = updateMatchingFlow(state, event.data.deviceFlowId, rawEvent.id, (flow) => ({
                ...flow,
                status: 'error',
                errorKind: event.data.errorKind,
                hint: event.data.hint,
                lastSeenEventId: rawEvent.id ?? flow.lastSeenEventId,
            }));
            return updated ?? state;
        }
        case 'auth_device_flow_cancelled': {
            const updated = updateMatchingFlow(state, event.data.deviceFlowId, rawEvent.id, (flow) => ({
                ...flow,
                status: 'cancelled',
                lastSeenEventId: rawEvent.id ?? flow.lastSeenEventId,
            }));
            return updated ?? state;
        }
        default:
            return state;
    }
}
export function reduceDaemonAuthEvents(events, initialState = createDaemonAuthState()) {
    let state = initialState;
    for (const event of events)
        state = reduceDaemonAuthEvent(state, event);
    return state;
}
function updateMatchingFlow(state, deviceFlowId, rawEventId, patch) {
    const entries = Object.entries(state.flows);
    for (const [providerId, flow] of entries) {
        if (flow && flow.deviceFlowId === deviceFlowId) {
            // PR #4255 fold-in 8 review thread #2: enforce the
            // monotonicity guarantee that `lastSeenEventId`'s JSDoc
            // documents. Out-of-order delivery (SSE replay-then-live
            // mixing) could otherwise let a stale frame overwrite a
            // newer terminal state. Synthetic frames without an
            // envelope `id` (rawEventId === undefined) bypass the
            // gate — they originate inside the SDK reducer machinery
            // (e.g. fallback paths) and aren't subject to replay
            // ordering.
            if (rawEventId !== undefined &&
                flow.lastSeenEventId !== undefined &&
                rawEventId <= flow.lastSeenEventId) {
                return state;
            }
            return {
                flows: { ...state.flows, [providerId]: patch(flow) },
            };
        }
    }
    return undefined;
}
function isKnownDaemonEventTypeName(type) {
    return DAEMON_KNOWN_EVENT_TYPES.has(type);
}
function isSessionLifecycleTerminal(type) {
    return type === 'session_died' || type === 'session_closed';
}
function chooseTerminalEvent(current, next) {
    if (!current)
        return next;
    if (!isSessionLifecycleTerminal(current.type) &&
        isSessionLifecycleTerminal(next.type)) {
        return next;
    }
    return current;
}
function isPermissionRequestData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['requestId']) &&
        isNonEmptyString(value['sessionId']) &&
        isRecord(value['toolCall']) &&
        Array.isArray(value['options']) &&
        value['options'].every(isPermissionOption));
}
function isPermissionResolvedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['requestId']) &&
        isPermissionOutcome(value['outcome']));
}
function isPermissionAlreadyResolvedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['requestId']) &&
        isNonEmptyString(value['sessionId']) &&
        isPermissionOutcome(value['outcome']));
}
function isModelSwitchedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['modelId']));
}
function isModelSwitchFailedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['requestedModelId']) &&
        isNonEmptyString(value['error']));
}
function isSessionDiedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['reason']) &&
        isOptionalNumberOrNull(value['exitCode']) &&
        isOptionalStringOrNull(value['signalCode']));
}
function isSessionClosedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['reason']) &&
        isOptionalStringOrNull(value['closedBy']));
}
function isSessionMetadataUpdatedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isOptionalStringOrNull(value['displayName']));
}
function isClientEvictedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['reason']) &&
        isOptionalNumber(value['droppedAfter']));
}
function isSlowClientWarningData(value) {
    // Mirror the sibling predicates' finite-number guard
    // (`isOptionalNumber` → `isFiniteNumber`): `typeof NaN === 'number'`
    // and `typeof Infinity === 'number'` both pass a bare `typeof`
    // check but would be schema garbage for a queue-size measurement.
    return (isRecord(value) &&
        isFiniteNumber(value['queueSize']) &&
        isFiniteNumber(value['maxQueued']) &&
        isFiniteNumber(value['lastEventId']));
}
function isStreamErrorData(value) {
    return isRecord(value) && isNonEmptyString(value['error']);
}
function isMcpBudgetWarningData(value) {
    // PR 14b fix (codex round 6): `thresholdRatio` is validated as a
    // finite number, NOT pinned to the literal `0.75`. The SDK's
    // role here is wire-shape validation; threshold semantics are
    // owned by the daemon's `MCP_BUDGET_WARN_FRACTION` constant
    // (`packages/core/src/tools/mcp-client-manager.ts`) and documented
    // in `qwen-serve-protocol.md`. Pinning the literal in the SDK
    // would mean a daemon-side change to e.g. 0.80 silently routes
    // every warning through `unrecognizedKnownEventCount` — a
    // cross-package coordination hazard with no operator-visible
    // failure mode. The `DaemonMcpBudgetWarningData.thresholdRatio`
    // type still narrows to `0.75` for current daemons; future
    // multi-threshold support (e.g. 0.5 critical) would extend the
    // type AND the wire shape via a `severity` discriminator field.
    return (isRecord(value) &&
        isFiniteNumber(value['liveCount']) &&
        isFiniteNumber(value['reservedCount']) &&
        isFiniteNumber(value['budget']) &&
        isFiniteNumber(value['thresholdRatio']) &&
        (value['mode'] === 'warn' || value['mode'] === 'enforce'));
}
function isMcpRefusedServerEntry(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['name']))
        return false;
    if (value['reason'] !== 'budget_exhausted')
        return false;
    // Transport family must be one of the known kinds. Reject silently
    // for forward-compat: a daemon emitting an unknown transport is
    // likely speaking a newer wire than this SDK release.
    const transport = value['transport'];
    return (transport === 'stdio' ||
        transport === 'sse' ||
        transport === 'http' ||
        transport === 'websocket' ||
        transport === 'sdk' ||
        transport === 'unknown');
}
function isMcpChildRefusedBatchData(value) {
    return (isRecord(value) &&
        Array.isArray(value['refusedServers']) &&
        value['refusedServers'].every(isMcpRefusedServerEntry) &&
        isFiniteNumber(value['budget']) &&
        isFiniteNumber(value['liveCount']) &&
        isFiniteNumber(value['reservedCount']) &&
        // `mode` is a literal `'enforce'` — `warn` mode never refuses, so
        // `'warn'`-tagged refusal payloads are protocol garbage. Reject
        // them so the reducer sees the raw event under the
        // `unrecognizedKnownEventCount` branch instead of silently
        // accepting a malformed shape.
        value['mode'] === 'enforce');
}
function isMemoryChangedData(value) {
    if (!isRecord(value))
        return false;
    const scope = value['scope'];
    const mode = value['mode'];
    return ((scope === 'workspace' || scope === 'global') &&
        isNonEmptyString(value['filePath']) &&
        (mode === 'append' || mode === 'replace') &&
        isFiniteNumber(value['bytesWritten']));
}
function isAgentChangedData(value) {
    if (!isRecord(value))
        return false;
    const change = value['change'];
    const level = value['level'];
    return ((change === 'created' || change === 'updated' || change === 'deleted') &&
        isNonEmptyString(value['name']) &&
        (level === 'project' || level === 'user'));
}
function isAuthDeviceFlowStartedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['deviceFlowId']) &&
        isNonEmptyString(value['providerId']) &&
        isFiniteNumber(value['expiresAt']));
}
function isAuthDeviceFlowThrottledData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['deviceFlowId']) &&
        isFiniteNumber(value['intervalMs']));
}
function isAuthDeviceFlowAuthorizedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['deviceFlowId']) &&
        isNonEmptyString(value['providerId']) &&
        isOptionalNumber(value['expiresAt']) &&
        isOptionalStringOrNull(value['accountAlias']));
}
function isAuthDeviceFlowFailedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['deviceFlowId']) &&
        isAuthDeviceFlowErrorKind(value['errorKind']) &&
        isOptionalStringOrNull(value['hint']));
}
function isAuthDeviceFlowCancelledData(value) {
    return isRecord(value) && isNonEmptyString(value['deviceFlowId']);
}
function isAuthDeviceFlowErrorKind(value) {
    // Forward-compat: accept ANY non-empty string. The earlier closed
    // allowlist would silently drop a daemon-emitted `failed` event with
    // a future errorKind (e.g. `rate_limited`) — `asKnownDaemonEvent`
    // would treat it as malformed and `reduceDaemonAuthEvent` never
    // transitions the flow's status, leaving SDK consumers stuck on
    // `pending` (PR #4255 review C2). The known literals still narrow
    // exhaustively in consumer `switch` statements; unknown kinds fall
    // into the `(string & {})` arm of the union for graceful handling.
    return typeof value === 'string' && value.length > 0;
}
/**
 * #4282 fold-in 2 (gpt-5.5 SV3). PR 17 mutation events carry
 * `originatorClientId` at the SSE envelope level, separate from
 * `event.data`. Reducer snapshots used to store only `event.data`,
 * leaving consumers unable to tell self-originated mutations apart.
 * This helper stamps the envelope's originator onto the stored
 * snapshot, preserving any pre-existing `data.originatorClientId`
 * (which the daemon does not currently populate, but the field is
 * declared on the Data interfaces).
 */
function mergeOriginator(data, event) {
    if (data.originatorClientId !== undefined)
        return data;
    if (event.originatorClientId === undefined)
        return data;
    return { ...data, originatorClientId: event.originatorClientId };
}
function isApprovalModeChangedData(value) {
    // `previous` and `next` are typed as bare strings in the public
    // shape (forward-compat for a future fifth approval-mode literal),
    // so the predicate only checks the structural envelope here.
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['previous']) &&
        isNonEmptyString(value['next']) &&
        typeof value['persisted'] === 'boolean');
}
function isToolToggledData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['toolName']) &&
        typeof value['enabled'] === 'boolean');
}
function isWorkspaceInitializedData(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['path']))
        return false;
    const action = value['action'];
    return action === 'created' || action === 'overwrote' || action === 'noop';
}
function isMcpServerRestartedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['serverName']) &&
        isFiniteNumber(value['durationMs']));
}
const MCP_RESTART_REFUSED_REASONS = new Set([
    'in_flight',
    'disabled',
    'budget_would_exceed',
]);
function isMcpServerRestartRefusedData(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['serverName']))
        return false;
    return (typeof value['reason'] === 'string' &&
        MCP_RESTART_REFUSED_REASONS.has(value['reason']));
}
function isPermissionOption(value) {
    return isRecord(value) && isNonEmptyString(value['optionId']);
}
function isPermissionOutcome(value) {
    if (!isRecord(value))
        return false;
    if (value['outcome'] === 'cancelled')
        return true;
    // Empty option ids are intentionally rejected even though the structural
    // type is just string; daemon permission options must be selectable.
    return value['outcome'] === 'selected' && isNonEmptyString(value['optionId']);
}
function getString(record, key) {
    const value = record[key];
    return typeof value === 'string' ? value : undefined;
}
function isOptionalNumber(value) {
    return value === undefined || isFiniteNumber(value);
}
function isOptionalNumberOrNull(value) {
    return value === undefined || value === null || isFiniteNumber(value);
}
function isOptionalStringOrNull(value) {
    return value === undefined || value === null || typeof value === 'string';
}
function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
function isRecord(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function advanceLastEventId(state, eventId) {
    if (eventId === undefined || !Number.isFinite(eventId))
        return state;
    const lastEventId = Math.max(state.lastEventId ?? 0, eventId);
    if (lastEventId === state.lastEventId)
        return state;
    return { ...state, lastEventId };
}
function clonePermissionRequestData(data) {
    return {
        ...data,
        options: data.options.map((option) => ({ ...option })),
    };
}
//# sourceMappingURL=events.js.map