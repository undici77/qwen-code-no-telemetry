/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// Single source of truth: the daemon publisher owns the wire literal in
// acp-bridge's dependency-free `daemonEventTypes` module. We re-export it so the
// validator/reducer below, and the browser consumer via `@qwen-code/sdk/daemon`,
// share the exact same value — a rename can't silently break browser-side dedup.
// The build-time devDep on acp-bridge inlines the value into the published bundle
// (same lightweight mechanism as `@qwen-code/acp-bridge/mcpTimeouts`). A `const`
// keeps its literal type, so it still narrows in `switch (event.type)` and works
// as a `typeof`-d type argument.
import { MID_TURN_MESSAGE_INJECTED_EVENT, PENDING_PROMPT_ADDED_EVENT, PENDING_PROMPT_STARTED_EVENT, PENDING_PROMPT_COMPLETED_EVENT, } from '@qwen-code/acp-bridge/daemonEventTypes';
export { MID_TURN_MESSAGE_INJECTED_EVENT, PENDING_PROMPT_ADDED_EVENT, PENDING_PROMPT_STARTED_EVENT, PENDING_PROMPT_COMPLETED_EVENT, };
export const DAEMON_KNOWN_EVENT_TYPE_VALUES = [
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
    MID_TURN_MESSAGE_INJECTED_EVENT,
    PENDING_PROMPT_ADDED_EVENT,
    PENDING_PROMPT_STARTED_EVENT,
    PENDING_PROMPT_COMPLETED_EVENT,
    'client_evicted',
    'slow_client_warning',
    'stream_error',
    // Emitted when an SSE consumer reconnects with a `Last-Event-ID`
    // past the ring's earliest available id (events were evicted
    // before reconnect). The reducer treats this as "your accumulated
    // state is stale; call `loadSession` and reseed view state before
    // applying any further deltas". Does NOT close the stream — the
    // daemon continues replaying surviving ring frames and live
    // frames, but the reducer auto-skips them until the consumer
    // reseeds state. Synthetic (no `id`) so it doesn't burn a slot
    // in the per-session monotonic sequence.
    'state_resync_required',
    // Synthetic marker prepended to a bounded `/session/:id/load` replay
    // snapshot when older replay history was dropped from the daemon's
    // in-memory window. This is NOT a resync request: consumers should render
    // it as transcript status and continue applying the retained snapshot.
    'history_truncated',
    // MCP guardrail push events. See `mcp_guardrail_events` capability
    // tag. Both fire on the per-session SSE bus; consumers should
    // pre-flight `caps.features.includes('mcp_guardrail_events')`
    // before relying on these for non-snapshot UX (the
    // `GET /workspace/mcp` snapshot still encodes the same state).
    'mcp_budget_warning',
    'mcp_child_refused_batch',
    // Workspace-level mutation signals fanned out through every active
    // session's bus. Non-terminal — informational for adapters that want
    // to render "memory just changed" / "agent X updated" toasts.
    // Read-after-write remains the correctness contract.
    'memory_changed',
    'agent_changed',
    // Workspace-scoped auth device-flow events. These are NOT
    // session-keyed; the session reducer no-ops on them and
    // `reduceDaemonAuthEvent` projects them into a workspace-level
    // state shape (one entry per provider).
    'auth_device_flow_started',
    'auth_device_flow_throttled',
    'auth_device_flow_authorized',
    'auth_device_flow_failed',
    'auth_device_flow_cancelled',
    // Mutation control events.
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
    // Runtime MCP server add/remove events. Fired by
    // `POST /workspace/mcp/servers` on success (including replace and
    // same-fingerprint no-op).
    'mcp_server_added',
    // Counterpart of `mcp_server_added`. Fired by
    // `DELETE /workspace/mcp/servers/:name` when an entry was actually
    // removed. Idempotent skip ('not_present') does NOT emit.
    'mcp_server_removed',
    // Extensions lifecycle events. Fired by background extension install/refresh
    // work. Carries refreshed/failed session counts, and may include install
    // success/failure details.
    'extensions_changed',
    // Multi-client permission coordination events.
    // `permission_partial_vote` only fires under `consensus` policy;
    // `permission_forbidden` fires under `designated` (originator
    // mismatch), `consensus` (anonymous voter or not-in-snapshot), and
    // `local-only` (remote voter). Pre-flight on the
    // `permission_mediation` capability tag before relying on either —
    // older daemons omit both event types.
    'permission_partial_vote',
    'permission_forbidden',
    // Cross-client real-time sync (acp-bridge audit, 2026-05-24).
    // `prompt_cancelled`: broadcast when a prompt is cancelled (explicit
    //   `cancelSession` route OR originator SSE disconnect) so peer
    //   subscribers observe the cancel as a first-class event instead of
    //   inferring it from the absence of further `agent_message_chunk`
    //   frames. Carries envelope-level `originatorClientId` (cancelling
    //   client). Semantic is "cancel requested", not "confirmed".
    // `replay_complete`: id-less sentinel emitted at the end of the
    //   `Last-Event-ID` replay loop so consumers can deterministically
    //   drop a catch-up indicator. Fires on both the clean-replay and the
    //   ring-evicted (`state_resync_required`) paths, and even when there
    //   was nothing to replay (`data.replayedCount === 0`).
    'prompt_cancelled',
    'replay_complete',
    // Daemon assist push events. `followup_suggestion`: server-side
    // ghost-text "what you might want to ask next" suggestion, generated
    // after each end_turn by the ACP child and forwarded through the per-
    // session SSE bus so the webui (and other future daemon adapters)
    // can render the suggestion in their input placeholder. The wire
    // carries only post-filter suggestions (`getFilterReason()===null`);
    // generator-side suppression telemetry stays on the daemon. Old SDK
    // consumers silently drop this event via `asKnownDaemonEvent`
    // returning undefined (no protocol bump required).
    'followup_suggestion',
    'channel_delivery_result',
    'user_shell_command',
    'user_shell_result',
    'turn_complete',
    'turn_error',
    'session_rewound',
    'session_branched',
    // A5 (#4511): synthetic side-channel snapshot yielded after
    // `replay_complete` when `?snapshot=1` is set on the SSE endpoint.
    // Carries `currentModelId` and `currentApprovalMode` so reconnecting
    // clients can seed their reducer without an extra round-trip.
    'session_snapshot',
    'git_branch_changed',
    // Enriched working-tree summary push: the daemon recomputes `git status`
    // in the background (stale-while-revalidate on `GET …/git`) and publishes
    // this only when the summary changed. `data` is a DaemonWorkspaceGitStatus.
    // Old SDK consumers silently drop it via `asKnownDaemonEvent`.
    'git_status_changed',
];
const DAEMON_KNOWN_EVENT_TYPES = new Set(DAEMON_KNOWN_EVENT_TYPE_VALUES);
const MAX_PENDING_PER_SESSION = 64;
/**
 * Bound on `forbiddenVotes` retention. Half of
 * `MAX_PENDING_PER_SESSION` (64) -- forbidden votes are
 * observability records, not pending state, so we keep the smaller
 * bound to avoid blowing the SDK heap on a session that's getting
 * spammed with rejected votes (e.g. an attacker probing
 * `local-only` from a remote IP). Operators with full audit needs
 * should subscribe to the daemon-side audit ring, not the SDK
 * reducer's bounded history.
 */
const MAX_FORBIDDEN_VOTES_PER_SESSION = 32;
/**
 * Event types that the reducer still processes when `awaitingResync`
 * is true. Two categories:
 *
 *   - **`state_resync_required` itself** — so the reducer can update
 *     `lastResyncRequired` / `resyncRequiredCount` for *subsequent*
 *     resync frames (rare but possible: a consumer that reconnects
 *     past the ring twice in succession).
 *   - **Terminal lifecycle frames** — `session_died` / `session_closed`
 *     / `client_evicted` / `stream_error`. Critical end-of-stream
 *     signals that don't depend on prior state being current. UIs
 *     must still see "this session died" even if they were in resync
 *     limbo at the time.
 *
 * Everything else (session_update / permission_* / approval_mode_changed
 * / workspace mutations / mcp guardrail / auth flow events) is auto-
 * skipped while `awaitingResync` is true; `lastEventId` still advances
 * via `advanceLastEventId(base)` so the resync recovery sequence stays
 * monotonic.
 */
const RESYNC_PASSTHROUGH_TYPES = new Set([
    'state_resync_required',
    'history_truncated',
    'session_died',
    'session_closed',
    'client_evicted',
    'stream_error',
    'session_recording_degraded',
    // A5 (#4511): the snapshot is a full-state authoritative frame, not a
    // delta, so it is safe to apply during resync — and it is exactly what
    // lets a client that reconnected past the ring recover currentModelId /
    // approvalMode without waiting for the next loadSession.
    'session_snapshot',
]);
export function createDaemonSessionViewState(seed = {}) {
    return {
        alive: seed.alive ?? true,
        pendingPermissions: { ...seed.pendingPermissions },
        lastEventId: seed.lastEventId,
        sessionId: seed.sessionId,
        currentModelId: seed.currentModelId,
        displayName: seed.displayName,
        recordingDegraded: seed.recordingDegraded ?? false,
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
        permissionVoteProgress: { ...seed.permissionVoteProgress },
        forbiddenVotes: seed.forbiddenVotes ? [...seed.forbiddenVotes] : [],
        forbiddenVoteCount: seed.forbiddenVoteCount ?? 0,
        // Fresh view state always starts without a resync requirement.
        // A consumer calling `createDaemonSessionViewState` after
        // `loadSession` to recover from an earlier resync implicitly
        // clears the flag through this default.
        awaitingResync: seed.awaitingResync ?? false,
        resyncRequiredCount: seed.resyncRequiredCount ?? 0,
        lastResyncRequired: seed.lastResyncRequired,
        historyTruncatedCount: seed.historyTruncatedCount ?? 0,
        lastHistoryTruncated: seed.lastHistoryTruncated,
        lastFollowupSuggestion: seed.lastFollowupSuggestion,
        rewindCount: seed.rewindCount ?? 0,
        lastRewind: seed.lastRewind,
        lastBranch: seed.lastBranch,
    };
}
export function isKnownDaemonEvent(event) {
    return asKnownDaemonEvent(event) !== undefined;
}
export function isDaemonEventType(event, type) {
    const known = asKnownDaemonEvent(event);
    return known?.type === type;
}
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
export function isWorkspaceScopedBudgetEvent(data) {
    return data.scope === 'workspace';
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
        case 'permission_partial_vote':
            return isPermissionPartialVoteData(event.data)
                ? event
                : undefined;
        case 'permission_forbidden':
            return isPermissionForbiddenData(event.data)
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
        case 'session_recording_degraded':
            return isSessionRecordingDegradedData(event.data)
                ? event
                : undefined;
        case 'artifact_changed':
            return isArtifactChangedData(event.data)
                ? event
                : undefined;
        case MID_TURN_MESSAGE_INJECTED_EVENT: {
            const data = asMidTurnMessageInjectedData(event.data);
            return data
                ? { ...event, data }
                : undefined;
        }
        case PENDING_PROMPT_ADDED_EVENT:
            return isPendingPromptAddedData(event.data)
                ? event
                : undefined;
        case PENDING_PROMPT_STARTED_EVENT:
            return isPendingPromptStartedData(event.data)
                ? event
                : undefined;
        case PENDING_PROMPT_COMPLETED_EVENT:
            return isPendingPromptCompletedData(event.data)
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
        case 'state_resync_required':
            return isStateResyncRequiredData(event.data)
                ? event
                : undefined;
        case 'history_truncated':
            return isHistoryTruncatedData(event.data)
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
        case 'settings_changed':
            return event.data != null && typeof event.data === 'object'
                ? event
                : undefined;
        case 'trust_change_requested':
            return isTrustChangeRequestedData(event.data)
                ? event
                : undefined;
        case 'workspace_initialized':
            return isWorkspaceInitializedData(event.data)
                ? event
                : undefined;
        case 'github_setup_completed':
            return isGithubSetupCompletedData(event.data)
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
        case 'mcp_server_changed':
            return isMcpServerChangedData(event.data)
                ? event
                : undefined;
        case 'settings_reloaded':
            return event.data != null && typeof event.data === 'object'
                ? event
                : undefined;
        case 'followup_suggestion':
            return isFollowupSuggestionData(event.data)
                ? event
                : undefined;
        case 'channel_delivery_result':
            return isChannelDeliveryResultData(event.data)
                ? event
                : undefined;
        case 'mcp_server_added':
            return isMcpServerAddedData(event.data)
                ? event
                : undefined;
        case 'mcp_server_removed':
            return isMcpServerRemovedData(event.data)
                ? event
                : undefined;
        case 'extensions_changed':
            return isExtensionsChangedData(event.data)
                ? event
                : undefined;
        case 'turn_complete':
            return isTurnCompleteData(event.data)
                ? event
                : undefined;
        case 'turn_error':
            return isTurnErrorData(event.data)
                ? event
                : undefined;
        case 'session_rewound':
            return isSessionRewoundData(event.data)
                ? event
                : undefined;
        case 'session_snapshot':
            return isSessionSnapshotData(event.data)
                ? event
                : undefined;
        case 'session_branched':
            return isSessionBranchedData(event.data)
                ? event
                : undefined;
        default:
            return undefined;
    }
}
function isSessionRewoundData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['promptId']) &&
        isFiniteNumber(value['targetTurnIndex']) &&
        Array.isArray(value['filesChanged']) &&
        Array.isArray(value['filesFailed']));
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
    // When `awaitingResync` is set, the consumer's accumulated view
    // state is known stale -- the daemon's ring evicted events between
    // the consumer's last delivered id and reconnect. Auto-skip
    // non-terminal delta events (still advance `lastEventId` via
    // `base`) so the consumer doesn't render against stale state.
    // Terminal lifecycle events still apply -- they're critical
    // end-of-stream signals that don't depend on prior state. The
    // flag clears when the consumer calls `loadSession` and
    // reconstructs view state via `createDaemonSessionViewState`.
    if (base.awaitingResync && !RESYNC_PASSTHROUGH_TYPES.has(event.type)) {
        return base;
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
            // Even on the unmatched path (SDK reconnected mid-permission
            // and missed `permission_request`), clear any orphan progress
            // entry that a `permission_partial_vote` may have left behind.
            // Otherwise `permissionVoteProgress[requestId]` persists until
            // session end. The matched path also clears it (below).
            const permissionVoteProgress = { ...base.permissionVoteProgress };
            delete permissionVoteProgress[event.data.requestId];
            if (!(event.data.requestId in base.pendingPermissions)) {
                return {
                    ...base,
                    permissionVoteProgress,
                    unmatchedPermissionResolutionCount: base.unmatchedPermissionResolutionCount + 1,
                    lastUnmatchedPermissionResolutionId: event.data.requestId,
                };
            }
            const pendingPermissions = { ...base.pendingPermissions };
            delete pendingPermissions[event.data.requestId];
            return { ...base, pendingPermissions, permissionVoteProgress };
        }
        case 'permission_already_resolved': {
            // Same as permission_resolved: unconditionally clear any orphan
            // progress entry on the unmatched / matched paths.
            const permissionVoteProgress = { ...base.permissionVoteProgress };
            delete permissionVoteProgress[event.data.requestId];
            if (!(event.data.requestId in base.pendingPermissions)) {
                return {
                    ...base,
                    permissionVoteProgress,
                    unmatchedPermissionResolutionCount: base.unmatchedPermissionResolutionCount + 1,
                    lastUnmatchedPermissionResolutionId: event.data.requestId,
                };
            }
            const pendingPermissions = { ...base.pendingPermissions };
            delete pendingPermissions[event.data.requestId];
            return { ...base, pendingPermissions, permissionVoteProgress };
        }
        case 'permission_partial_vote': {
            // Accumulate consensus vote progress. If the requestId isn't in
            // `pendingPermissions` (race / replay misalignment because the
            // SDK reconnected mid-permission and missed
            // `permission_request`), still record progress here. Both
            // `permission_resolved` and `permission_already_resolved`
            // reducer cases above unconditionally clear any orphan
            // `permissionVoteProgress` entry, so a missed-request reconnect
            // is recovered as soon as the corresponding resolution frame
            // arrives.
            //
            // Stamp the envelope's `originatorClientId` (prompt originator)
            // onto the stored data so view-state consumers can attribute
            // the partial vote to the prompting client. Mirrors the
            // `mergeOriginator` pattern used by approval-mode / tool-toggle
            // / workspace-init / mcp-restart reducer cases.
            return {
                ...base,
                permissionVoteProgress: {
                    ...base.permissionVoteProgress,
                    [event.data.requestId]: mergeOriginator(event.data, event),
                },
            };
        }
        case 'permission_forbidden': {
            // Append to bounded history and bump count. Same
            // mergeOriginator treatment as the partial-vote case above.
            // `event.data` carries the BLOCKED voter's clientId; the
            // envelope's `originatorClientId` carries the prompt originator.
            // Both are useful -- consumers reading view state need the
            // prompt originator without having to keep the original event
            // around.
            const next = base.forbiddenVotes.slice();
            next.push(mergeOriginator(event.data, event));
            while (next.length > MAX_FORBIDDEN_VOTES_PER_SESSION) {
                next.shift();
            }
            return {
                ...base,
                forbiddenVotes: next,
                forbiddenVoteCount: base.forbiddenVoteCount + 1,
            };
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
                permissionVoteProgress: {},
                // Terminal events must also drop `forbiddenVotes` history so
                // adapters reading view state for a dead session don't render
                // stale rejection data.
                forbiddenVotes: [],
                forbiddenVoteCount: 0,
            };
        case 'session_closed':
            return {
                ...base,
                sessionId: event.data.sessionId,
                alive: false,
                terminalEvent: chooseTerminalEvent(base.terminalEvent, event),
                pendingPermissions: {},
                permissionVoteProgress: {},
                // See session_died: clear forbiddenVotes on terminal events.
                forbiddenVotes: [],
                forbiddenVoteCount: 0,
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
                permissionVoteProgress: {},
                // See session_died: clear forbiddenVotes on terminal events.
                forbiddenVotes: [],
                forbiddenVoteCount: 0,
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
                permissionVoteProgress: {},
                // See session_died: clear forbiddenVotes on terminal events.
                forbiddenVotes: [],
                forbiddenVoteCount: 0,
            };
        case 'state_resync_required':
            // Mark the accumulated
            // view state as stale; subsequent non-terminal deltas are
            // auto-skipped at the top-of-reducer gate above until consumer
            // recovery via `loadSession` + `createDaemonSessionViewState`.
            // `alive` and `terminalEvent` are NOT touched — the stream is
            // still healthy; only the consumer's local accumulation is
            // suspect. `pendingPermissions` is intentionally preserved
            // (cleared by `loadSession`-driven recovery, not by the
            // resync signal itself) so we don't synthesize a no-op
            // "permission no longer pending" state transition while the
            // consumer is still figuring out what's real.
            return {
                ...base,
                awaitingResync: true,
                resyncRequiredCount: base.resyncRequiredCount + 1,
                lastResyncRequired: event.data,
            };
        case 'history_truncated':
            return {
                ...base,
                historyTruncatedCount: base.historyTruncatedCount + 1,
                lastHistoryTruncated: event.data,
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
        // For the 5 mutation events, copy `event.originatorClientId`
        // (envelope-level) into the stored snapshot. Without this,
        // consumers reading `lastApprovalModeChange` / `lastToolToggle` /
        // `lastWorkspaceInit` / `lastMcpRestart{,Refused}` cannot tell
        // whether the mutation originated from themselves -- even though
        // the raw event carried that information at the envelope level.
        // `mergeOriginator` preserves any pre-existing
        // `data.originatorClientId` (which the daemon does NOT currently
        // populate, but the field exists on the Data interfaces) and falls
        // back to the envelope.
        case 'approval_mode_changed':
            return {
                ...base,
                approvalMode: event.data.next,
                approvalModeChangedCount: base.approvalModeChangedCount + 1,
                lastApprovalModeChange: mergeOriginator(event.data, event),
            };
        case 'tool_toggled':
            return {
                ...base,
                toolToggleCount: base.toolToggleCount + 1,
                lastToolToggle: mergeOriginator(event.data, event),
            };
        case 'settings_changed':
            return base;
        case 'trust_change_requested':
            return base;
        case 'workspace_initialized':
            // Workspace-scoped fan-out. Non-terminal — just records that a
            // QWEN.md scaffold was performed.
            return {
                ...base,
                workspaceInitCount: base.workspaceInitCount + 1,
                lastWorkspaceInit: mergeOriginator(event.data, event),
            };
        case 'github_setup_completed':
            return base;
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
        case 'followup_suggestion':
            // Daemon assist push: latest suggestion replaces any prior one
            // for this session. Best-effort UX hint — non-terminal,
            // doesn't touch `alive` / `pendingPermissions`. Clients
            // self-invalidate on next sendPrompt (no wire round-trip), so
            // we don't emit "cleared" events on prompt boundaries.
            return {
                ...base,
                lastFollowupSuggestion: event.data,
            };
        case 'turn_complete':
            return {
                ...base,
                lastTurnComplete: event.data,
            };
        case 'turn_error':
            return {
                ...base,
                lastTurnError: event.data,
            };
        // `mid_turn_message_injected` is a transient UX signal (the browser dedupes
        // its own pending queue); like these mcp/settings notices it carries no
        // reduced session-view state.
        case 'mcp_server_added':
        case 'mcp_server_removed':
        case 'mcp_server_changed':
        case 'settings_reloaded':
        case 'extensions_changed':
        case 'artifact_changed':
        case MID_TURN_MESSAGE_INJECTED_EVENT:
        case PENDING_PROMPT_ADDED_EVENT:
        case PENDING_PROMPT_STARTED_EVENT:
        case PENDING_PROMPT_COMPLETED_EVENT:
        case 'channel_delivery_result':
            return base;
        case 'session_rewound':
            return {
                ...base,
                rewindCount: base.rewindCount + 1,
                lastRewind: mergeOriginator(event.data, event),
            };
        case 'session_snapshot':
            return {
                ...base,
                sessionId: event.data.sessionId,
                ...(event.data.currentModelId != null
                    ? { currentModelId: event.data.currentModelId }
                    : {}),
                ...(event.data.currentApprovalMode != null
                    ? { approvalMode: event.data.currentApprovalMode }
                    : {}),
                ...(event.data.recordingDegraded !== undefined
                    ? { recordingDegraded: event.data.recordingDegraded }
                    : {}),
            };
        case 'session_recording_degraded':
            return {
                ...base,
                sessionId: event.data.sessionId,
                recordingDegraded: true,
            };
        case 'session_branched':
            return {
                ...base,
                lastBranch: mergeOriginator(event.data, event),
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
            // Gate stale `started` frames the same way as the matching-flow
            // handlers. SSE reconnect with `Last-Event-ID < started.id`
            // would otherwise replay an old started for the SAME
            // deviceFlowId after the SDK reducer already advanced to a
            // terminal state, resetting the visible status to 'pending'.
            // A stale started for an OLDER flow (different deviceFlowId,
            // lower id than the current flow's lastSeenEventId) similarly
            // gets ignored.
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
            // Enforce monotonicity here too. The deviceFlowId equality
            // check above narrows to "this frame is for the current flow";
            // the id gate then refuses out-of-order replay (e.g. a delayed
            // `authorized` arriving after a more recent `failed` for the
            // same flow, which the daemon's transitionTerminal would never
            // produce but a malformed/synthetic stream could).
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
            // Enforce the monotonicity guarantee that `lastSeenEventId`'s
            // JSDoc documents. Out-of-order delivery (SSE replay-then-live
            // mixing) could otherwise let a stale frame overwrite a newer
            // terminal state. Synthetic frames without an envelope `id`
            // (rawEventId === undefined) bypass the gate -- they originate
            // inside the SDK reducer machinery (e.g. fallback paths) and
            // aren't subject to replay ordering.
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
function isPermissionPartialVoteData(value) {
    // Use `isFiniteNumber` (and integer + non-negative checks) for
    // tally counters so malformed frames carrying NaN / Infinity /
    // fractional values are rejected and counted via
    // `unrecognizedKnownEventCount` instead of landing in reducer state.
    // Matches the validation posture of the sibling
    // `isMcpBudgetWarningData` / `isSlowClientWarningData` helpers.
    if (!isRecord(value) ||
        !isNonEmptyString(value['requestId']) ||
        !isNonEmptyString(value['sessionId']) ||
        !isFiniteNumber(value['votesReceived']) ||
        !isFiniteNumber(value['votesNeeded']) ||
        !isFiniteNumber(value['quorum']) ||
        !Number.isInteger(value['votesReceived']) ||
        !Number.isInteger(value['votesNeeded']) ||
        !Number.isInteger(value['quorum']) ||
        value['votesReceived'] < 0 ||
        value['votesNeeded'] < 0 ||
        value['quorum'] < 1 ||
        !isRecord(value['optionTallies'])) {
        return false;
    }
    // Validate the optionTallies map values are non-negative integers.
    for (const tally of Object.values(value['optionTallies'])) {
        if (typeof tally !== 'number' || !Number.isInteger(tally) || tally < 0) {
            return false;
        }
    }
    return true;
}
function isPermissionForbiddenData(value) {
    if (!isRecord(value) ||
        !isNonEmptyString(value['requestId']) ||
        !isNonEmptyString(value['sessionId'])) {
        return false;
    }
    const reason = value['reason'];
    if (reason !== 'designated_mismatch' && reason !== 'remote_not_allowed') {
        return false;
    }
    // `clientId` is optional but if present must be a non-empty string.
    const clientId = value['clientId'];
    if (clientId !== undefined &&
        (typeof clientId !== 'string' || clientId.length === 0)) {
        return false;
    }
    return true;
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
function isArtifactChangedData(value) {
    if (!isRecord(value) || !isNonEmptyString(value['sessionId'])) {
        return false;
    }
    const change = value['change'];
    if (!isRecord(change) || !isNonEmptyString(change['artifactId'])) {
        return false;
    }
    return (isNonEmptyString(change['action']) &&
        (change['reason'] === undefined || isNonEmptyString(change['reason'])));
}
function asMidTurnMessageInjectedData(value) {
    if (!isRecord(value) ||
        !isNonEmptyString(value['sessionId']) ||
        !Array.isArray(value['messages']) ||
        !value['messages'].every((message) => typeof message === 'string')) {
        return undefined;
    }
    const messageIds = value['messageIds'];
    // `messageIds` is an optional enrichment: a misaligned or malformed batch is
    // dropped (mirroring `parseSidechannelMidTurnInjected`) rather than rejecting
    // the whole event, so a buggy daemon can't silently lose the injection signal.
    const alignedMessageIds = Array.isArray(messageIds) &&
        messageIds.length === value['messages'].length &&
        messageIds.every(isNonEmptyString)
        ? messageIds
        : undefined;
    // Strip the raw `messageIds` before spreading so a malformed batch OMITS the
    // key (matching `parseSidechannelMidTurnInjected`) instead of leaving a
    // present `undefined` that breaks `'messageIds' in data` checks.
    const { messageIds: _rawMessageIds, ...rest } = value;
    return {
        ...rest,
        messages: value['messages'],
        ...(alignedMessageIds ? { messageIds: alignedMessageIds } : {}),
    };
}
function isPendingPromptAddedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['promptId']) &&
        typeof value['text'] === 'string' &&
        typeof value['queuedAt'] === 'number');
}
function isPendingPromptStartedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['promptId']) &&
        typeof value['text'] === 'string');
}
function isPendingPromptCompletedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['promptId']) &&
        (value['state'] === 'completed' || value['state'] === 'removed'));
}
function isClientEvictedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['reason']) &&
        isOptionalNumber(value['droppedAfter']) &&
        isOptionalNumber(value['queueSize']) &&
        isOptionalNumber(value['maxQueued']) &&
        isOptionalNumber(value['queuedBytes']) &&
        isOptionalNumber(value['maxQueuedBytes']) &&
        isOptionalNumber(value['eventBytes']));
}
function isStateResyncRequiredData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['reason']) &&
        isFiniteNumber(value['lastDeliveredId']) &&
        isFiniteNumber(value['earliestAvailableId']));
}
function isHistoryTruncatedData(value) {
    if (!isRecord(value) ||
        value['reason'] !== 'replay_window_exceeded' ||
        !isFiniteNumber(value['truncatedEvents']) ||
        !isFiniteNumber(value['retainedEvents']) ||
        !isFiniteNumber(value['maxBytes']) ||
        typeof value['fullTranscriptAvailable'] !== 'boolean') {
        return false;
    }
    const truncatedTurns = value['truncatedTurns'];
    const scope = value['scope'];
    const maxEvents = value['maxEvents'];
    return (isNonNegativeInteger(value['truncatedEvents']) &&
        isNonNegativeInteger(value['retainedEvents']) &&
        isNonNegativeInteger(value['maxBytes']) &&
        (scope === undefined || isNonEmptyString(scope)) &&
        (maxEvents === undefined || isNonNegativeInteger(maxEvents)) &&
        (truncatedTurns === undefined || isNonNegativeInteger(truncatedTurns)));
}
function isSlowClientWarningData(value) {
    // Mirror the sibling predicates' finite-number guard
    // (`isOptionalNumber` → `isFiniteNumber`): `typeof NaN === 'number'`
    // and `typeof Infinity === 'number'` both pass a bare `typeof`
    // check but would be schema garbage for a queue-size measurement.
    if (!isRecord(value))
        return false;
    const threshold = value['threshold'];
    return (isFiniteNumber(value['queueSize']) &&
        isFiniteNumber(value['maxQueued']) &&
        isFiniteNumber(value['lastEventId']) &&
        isOptionalNumber(value['queuedBytes']) &&
        isOptionalNumber(value['maxQueuedBytes']) &&
        (threshold === undefined ||
            threshold === 'frames' ||
            threshold === 'bytes' ||
            threshold === 'frames_and_bytes'));
}
function isStreamErrorData(value) {
    return isRecord(value) && isNonEmptyString(value['error']);
}
function isMcpBudgetWarningData(value) {
    // `thresholdRatio` is validated as a finite number, NOT pinned to
    // the literal `0.75`. The SDK's role here is wire-shape validation;
    // threshold semantics are owned by the daemon's
    // `MCP_BUDGET_WARN_FRACTION` constant. Pinning the literal in the
    // SDK would mean a daemon-side change to e.g. 0.80 silently routes
    // every warning through `unrecognizedKnownEventCount` -- a
    // cross-package coordination hazard with no operator-visible failure
    // mode.
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
    if (scope === 'managed') {
        const touchedScopes = value['touchedScopes'];
        return (isNonEmptyString(value['source']) &&
            isNonEmptyString(value['taskId']) &&
            Array.isArray(touchedScopes) &&
            touchedScopes.every((s) => s === 'user' || s === 'project'));
    }
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
    // `pending`. The known literals still narrow
    // exhaustively in consumer `switch` statements; unknown kinds fall
    // into the `(string & {})` arm of the union for graceful handling.
    return typeof value === 'string' && value.length > 0;
}
/**
 * Mutation events carry `originatorClientId` at the SSE envelope
 * level, separate from `event.data`. Reducer snapshots store only
 * `event.data`, leaving consumers unable to tell self-originated
 * mutations apart. This helper stamps the envelope's originator onto
 * the stored snapshot, preserving any pre-existing
 * `data.originatorClientId` (which the daemon does not currently
 * populate, but the field is declared on the Data interfaces).
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
function isTrustChangeRequestedData(value) {
    if (!isRecord(value))
        return false;
    const desiredState = value['desiredState'];
    return (isNonEmptyString(value['workspaceCwd']) &&
        (desiredState === 'trusted' || desiredState === 'untrusted') &&
        (value['reason'] === undefined || typeof value['reason'] === 'string'));
}
function isWorkspaceInitializedData(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['path']))
        return false;
    const action = value['action'];
    return action === 'created' || action === 'overwrote' || action === 'noop';
}
function isGithubSetupCompletedData(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['releaseTag']))
        return false;
    if (!isNonEmptyString(value['readmeUrl']))
        return false;
    if (!Array.isArray(value['workflows']))
        return false;
    if (!value['workflows'].every(isGithubSetupWorkflowResult))
        return false;
    if (!isGithubSetupGitignoreResult(value['gitignore']))
        return false;
    return (Array.isArray(value['warnings']) &&
        value['warnings'].every((warning) => typeof warning === 'string'));
}
function isGithubSetupWorkflowResult(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['path']))
        return false;
    const status = value['status'];
    if (status !== 'written' && status !== 'failed')
        return false;
    if (value['sizeBytes'] !== undefined && !isFiniteNumber(value['sizeBytes'])) {
        return false;
    }
    return value['error'] === undefined || typeof value['error'] === 'string';
}
function isGithubSetupGitignoreResult(value) {
    if (!isRecord(value))
        return false;
    if (value['path'] !== '.gitignore')
        return false;
    const status = value['status'];
    return (status === 'created' ||
        status === 'updated' ||
        status === 'unchanged' ||
        status === 'failed' ||
        status === 'skipped');
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
    'authentication_required',
    // Pool-mode hard restart failure (entry's `client.connect()` or
    // rediscover threw). Carried alongside the soft-skip reasons so
    // SDK reducers maintain a single union for narrowing the event's
    // `reason` field.
    'restart_failed',
]);
function isMcpServerRestartRefusedData(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['serverName']))
        return false;
    return (typeof value['reason'] === 'string' &&
        MCP_RESTART_REFUSED_REASONS.has(value['reason']));
}
function isFollowupSuggestionData(value) {
    // `suggestion` must be a non-empty string — the daemon filters
    // rejected suggestions server-side and only emits when accepted,
    // so an empty suggestion on the wire is protocol garbage. Reject
    // it via the unrecognized counter rather than overwriting view
    // state with an empty suggestion.
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['suggestion']) &&
        isNonEmptyString(value['promptId']));
}
// Independent copy of the canonical set in acp-bridge bridgeOptions.ts;
// cross-checked by the daemonEvents test suite.
const CHANNEL_DELIVERY_ERROR_CODES = new Set([
    'channel_worker_unavailable',
    'channel_delivery_timeout',
    'channel_delivery_invalid',
    'channel_delivery_rejected',
    'channel_delivery_queue_full',
    'channel_delivery_failed',
]);
function isChannelDeliveryResultData(value) {
    if (!isRecord(value) ||
        !isNonEmptyString(value['sessionId']) ||
        !isNonEmptyString(value['deliveryId']) ||
        (value['status'] !== 'delivered' &&
            value['status'] !== 'failed' &&
            value['status'] !== 'skipped') ||
        !Object.keys(value).every((key) => [
            'sessionId',
            'deliveryId',
            'source',
            'status',
            'promptId',
            'taskId',
            'firedAt',
            'code',
            'error',
        ].includes(key))) {
        return false;
    }
    const correlationValid = (value['source'] === 'prompt' &&
        isNonEmptyString(value['promptId']) &&
        value['taskId'] === undefined &&
        value['firedAt'] === undefined) ||
        (value['source'] === 'scheduled' &&
            isNonEmptyString(value['taskId']) &&
            isFiniteNumber(value['firedAt']) &&
            value['promptId'] === undefined);
    if (!correlationValid)
        return false;
    if (value['status'] === 'failed') {
        return (typeof value['code'] === 'string' &&
            CHANNEL_DELIVERY_ERROR_CODES.has(value['code']) &&
            isNonEmptyString(value['error']));
    }
    return value['code'] === undefined && value['error'] === undefined;
}
function isMcpServerAddedData(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['name']))
        return false;
    if (typeof value['replaced'] !== 'boolean')
        return false;
    if (typeof value['shadowedSettings'] !== 'boolean')
        return false;
    if (!isFiniteNumber(value['toolCount']))
        return false;
    if (!isNonEmptyString(value['originatorClientId']))
        return false;
    // Transport family must be one of the known kinds. Reject silently
    // for forward-compat (mirrors `isMcpRefusedServerEntry`).
    const transport = value['transport'];
    return (transport === 'stdio' ||
        transport === 'sse' ||
        transport === 'http' ||
        transport === 'websocket' ||
        transport === 'sdk' ||
        transport === 'unknown');
}
function isTurnCompleteData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['stopReason']));
}
function isTurnErrorData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        isNonEmptyString(value['message']));
}
function isMcpServerRemovedData(value) {
    if (!isRecord(value))
        return false;
    if (!isNonEmptyString(value['name']))
        return false;
    if (typeof value['wasShadowingSettings'] !== 'boolean')
        return false;
    if (!isNonEmptyString(value['originatorClientId']))
        return false;
    return true;
}
function isMcpServerChangedData(value) {
    if (!isRecord(value) || !isNonEmptyString(value['serverName'])) {
        return false;
    }
    return (value['action'] === 'approve' ||
        value['action'] === 'enable' ||
        value['action'] === 'disable' ||
        value['action'] === 'authenticate' ||
        value['action'] === 'clear-auth');
}
function isExtensionsChangedData(value) {
    if (!isRecord(value))
        return false;
    if (typeof value['refreshed'] !== 'number')
        return false;
    if (typeof value['failed'] !== 'number')
        return false;
    if (value['status'] !== undefined &&
        value['status'] !== 'installed' &&
        value['status'] !== 'enabled' &&
        value['status'] !== 'disabled' &&
        value['status'] !== 'updated' &&
        value['status'] !== 'uninstalled' &&
        value['status'] !== 'failed') {
        return false;
    }
    if (value['source'] !== undefined && typeof value['source'] !== 'string') {
        return false;
    }
    if (value['name'] !== undefined && typeof value['name'] !== 'string') {
        return false;
    }
    if (value['version'] !== undefined && typeof value['version'] !== 'string') {
        return false;
    }
    if (value['error'] !== undefined && typeof value['error'] !== 'string') {
        return false;
    }
    return true;
}
function isSessionBranchedData(value) {
    if (!isRecord(value))
        return false;
    return (isNonEmptyString(value['sourceSessionId']) &&
        isNonEmptyString(value['newSessionId']) &&
        isNonEmptyString(value['displayName']));
}
function isSessionSnapshotData(value) {
    // `currentModelId` / `currentApprovalMode` are `string | null` on the
    // wire. Validate the types here, not just `sessionId`: the reducer
    // propagates these into `state.currentModelId` / `state.approvalMode`
    // on a `!= null` check alone, so an unchecked non-string (e.g. `42`,
    // `{}`) would land in state and crash downstream `.trim()`-style calls.
    if (!isRecord(value) || !isNonEmptyString(value['sessionId']))
        return false;
    const model = value['currentModelId'];
    const mode = value['currentApprovalMode'];
    const recordingDegraded = value['recordingDegraded'];
    return ((model === null || typeof model === 'string') &&
        (mode === null || typeof mode === 'string') &&
        (recordingDegraded === undefined || typeof recordingDegraded === 'boolean'));
}
function isSessionRecordingDegradedData(value) {
    return (isRecord(value) &&
        isNonEmptyString(value['sessionId']) &&
        value['reason'] === 'write_failed');
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
function isNonNegativeInteger(value) {
    return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
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