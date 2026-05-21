/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { DaemonAuthFlow } from './DaemonAuthFlow.js';
import type { DaemonAgentMutationResult, DaemonAuthProviderId, DaemonAuthStatusSnapshot, DaemonCapabilities, DaemonCreateAgentRequest, DaemonDeviceFlowStartResult, DaemonDeviceFlowState, DaemonEvent, DaemonSessionContextStatus, DaemonRestoredSession, DaemonSession, DaemonSessionSummary, DaemonSessionSupportedCommandsStatus, DaemonUpdateAgentRequest, DaemonWorkspaceFile, DaemonWorkspaceFileBytes, DaemonWorkspaceFileEditRequest, DaemonWorkspaceFileEditResult, DaemonWorkspaceFileWriteRequest, DaemonWorkspaceFileWriteResult, DaemonWorkspaceAgentDetail, DaemonWorkspaceAgentsStatus, DaemonWorkspaceEnvStatus, DaemonWorkspaceMcpStatus, DaemonWorkspaceMemoryStatus, DaemonWorkspacePreflightStatus, DaemonWorkspaceProvidersStatus, DaemonWorkspaceSkillsStatus, DaemonWriteMemoryRequest, DaemonWriteMemoryResult, HeartbeatResult, PermissionResponse, PromptContentBlock, PromptResult, SetModelResult, SessionMetadataResult, DaemonApprovalMode, DaemonApprovalModeResult, DaemonInitWorkspaceResult, DaemonMcpRestartResult, DaemonToolToggleResult } from './types.js';
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
}
/**
 * Thrown for any non-2xx daemon response. `status` and `body` are surfaced
 * so callers can branch on the standard daemon HTTP semantics (404 missing
 * session, 401 bad token, 400 malformed body, 500 agent failure).
 */
export declare class DaemonHttpError extends Error {
    readonly status: number;
    readonly body: unknown;
    constructor(status: number, body: unknown, message: string);
}
export interface CreateSessionRequest {
    /**
     * Workspace path the daemon must be bound to (per #3803 §02). When
     * omitted, the SDK sends no `cwd` field and the daemon route falls
     * back to its boot-time `boundWorkspace`. Pass `caps.workspaceCwd`
     * to be explicit, or omit it for the daemon-knows-best path. A
     * non-empty `workspaceCwd` that doesn't canonicalize to the
     * daemon's bound path yields a `400 workspace_mismatch`
     * `DaemonHttpError`.
     */
    workspaceCwd?: string;
    modelServiceId?: string;
    /**
     * Per-request session-scope override. The production daemon defaults
     * to `'single'`, which coalesces same-workspace `POST /session` calls
     * into one shared session; passing `sessionScope: 'thread'` here
     * forces a distinct session for this call. The reverse override
     * (per-request `'single'` against a daemon defaulting to `'thread'`)
     * is also supported, though the daemon's default is hardcoded to
     * `'single'` today (#4175 may add a CLI flag in a follow-up). Omit
     * to inherit the daemon-wide default.
     *
     * Only `'single'` and `'thread'` are accepted; anything else yields
     * `400 invalid_session_scope`. Old daemons (pre-#4175 PR 5) silently
     * ignore the field — clients should pre-flight
     * `caps.features.session_scope_override` before sending.
     */
    sessionScope?: 'single' | 'thread';
}
export interface RestoreSessionRequest {
    /**
     * Workspace path the daemon must be bound to. Omit to let the daemon use
     * its advertised bound workspace, mirroring `createOrAttachSession`.
     */
    workspaceCwd?: string;
}
export interface PromptRequest {
    prompt: PromptContentBlock[];
    /** Optional ACP _meta passthrough. */
    _meta?: Record<string, unknown> | null;
    [key: string]: unknown;
}
export interface SubscribeOptions {
    /** Resume from after this event id (`Last-Event-ID` header). */
    lastEventId?: number;
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
}
export declare class DaemonClient {
    private readonly baseUrl;
    private readonly token;
    private readonly _fetch;
    private readonly fetchTimeoutMs;
    private _authFlow?;
    /**
     * High-level auth helper (issue #4175 PR 21). Wraps the four
     * `*DeviceFlow*` methods with a `start(...).awaitCompletion()` shape
     * for the common "log in remotely" UX. Lazy-constructed.
     */
    get auth(): DaemonAuthFlow;
    constructor(opts: DaemonClientOptions);
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
    health(): Promise<{
        status: string;
    }>;
    capabilities(): Promise<DaemonCapabilities>;
    workspaceMcp(): Promise<DaemonWorkspaceMcpStatus>;
    workspaceSkills(): Promise<DaemonWorkspaceSkillsStatus>;
    workspaceProviders(): Promise<DaemonWorkspaceProvidersStatus>;
    readWorkspaceFile(filePath: string, opts?: {
        maxBytes?: number;
        line?: number;
        limit?: number;
    }, clientId?: string): Promise<DaemonWorkspaceFile>;
    readWorkspaceFileBytes(filePath: string, opts?: {
        offset?: number;
        maxBytes?: number;
    }, clientId?: string): Promise<DaemonWorkspaceFileBytes>;
    writeWorkspaceFile(req: DaemonWorkspaceFileWriteRequest, clientId?: string): Promise<DaemonWorkspaceFileWriteResult>;
    editWorkspaceFile(req: DaemonWorkspaceFileEditRequest, clientId?: string): Promise<DaemonWorkspaceFileEditResult>;
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
     * after iteration 1 in this release. PR 16.5 will lift the cap
     * once auto-memory CRUD lands.
     */
    workspaceMemory(): Promise<DaemonWorkspaceMemoryStatus>;
    /**
     * Append to or replace `QWEN.md` at workspace or global scope.
     * Strict mutation gate (`token_required` on no-token loopback
     * defaults). When the daemon advertises `workspace_memory`, expect
     * 200 with `{ ok, filePath, bytesWritten, mode }`; older daemons
     * without the capability return 404.
     */
    writeWorkspaceMemory(req: DaemonWriteMemoryRequest, clientId?: string): Promise<DaemonWriteMemoryResult>;
    listWorkspaceAgents(): Promise<DaemonWorkspaceAgentsStatus>;
    /**
     * Create a project- or user-level subagent. 409 `agent_already_exists`
     * when a same-name agent is already registered at the chosen level;
     * 422 `invalid_config` for validation failures.
     */
    createWorkspaceAgent(req: DaemonCreateAgentRequest, clientId?: string): Promise<DaemonAgentMutationResult>;
    getWorkspaceAgent(agentType: string): Promise<DaemonWorkspaceAgentDetail>;
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
    updateWorkspaceAgent(agentType: string, req: DaemonUpdateAgentRequest, opts?: {
        scope?: 'workspace' | 'global';
    }, clientId?: string): Promise<DaemonAgentMutationResult>;
    /**
     * Delete a project- or user-level subagent definition. Optional
     * `scope` query narrows deletion to one level when the same name
     * exists at both. Idempotent for SDK callers — both 204 (deleted)
     * and 404 (already gone) resolve successfully.
     */
    deleteWorkspaceAgent(agentType: string, opts?: {
        scope?: 'workspace' | 'global';
    }, clientId?: string): Promise<void>;
    workspaceEnv(): Promise<DaemonWorkspaceEnvStatus>;
    workspacePreflight(): Promise<DaemonWorkspacePreflightStatus>;
    createOrAttachSession(req: CreateSessionRequest, clientId?: string): Promise<DaemonSession>;
    /**
     * Enumerate live sessions in the given workspace. Used by session-picker
     * UIs. Returns an empty list (not 404) when the workspace has no sessions.
     */
    listWorkspaceSessions(workspaceCwd: string): Promise<DaemonSessionSummary[]>;
    loadSession(sessionId: string, req?: RestoreSessionRequest, clientId?: string): Promise<DaemonRestoredSession>;
    resumeSession(sessionId: string, req?: RestoreSessionRequest, clientId?: string): Promise<DaemonRestoredSession>;
    sessionContext(sessionId: string, clientId?: string): Promise<DaemonSessionContextStatus>;
    sessionSupportedCommands(sessionId: string, clientId?: string): Promise<DaemonSessionSupportedCommandsStatus>;
    /**
     * Shared transport for `loadSession` / `resumeSession`. Both routes
     * share an identical wire shape (POST /session/:id/{load|resume}
     * with optional `cwd` body) and identical error envelopes from the
     * daemon, so they collapse into a single fetch path that only
     * differs in the URL suffix and the route name reported on errors.
     */
    private restoreSession;
    /**
     * #4175 Wave 4 PR 17. Change the approval mode of a live session.
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
    setSessionApprovalMode(sessionId: string, mode: DaemonApprovalMode, opts?: {
        persist?: boolean;
        clientId?: string;
    }): Promise<DaemonApprovalModeResult>;
    /**
     * #4175 Wave 4 PR 17. Toggle a tool name in the workspace's
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
    setWorkspaceToolEnabled(toolName: string, enabled: boolean, opts?: {
        clientId?: string;
    }): Promise<DaemonToolToggleResult>;
    /**
     * #4175 Wave 4 PR 17. Restart a configured MCP server through the
     * ACP child's `McpClientManager`. The daemon pre-checks the live
     * budget snapshot from PR 14 v1; soft refusals (in-flight discovery,
     * disabled server, budget would exceed under `enforce` mode) come
     * back as 200 OK with `{restarted: false, skipped: true, reason}`.
     * Only hard errors (unknown server name, no live ACP channel)
     * surface as non-2xx.
     *
     * Pre-flight `caps.features.workspace_mcp_restart` before calling.
     */
    restartMcpServer(serverName: string, opts?: {
        clientId?: string;
    }): Promise<DaemonMcpRestartResult>;
    /**
     * #4175 Wave 4 PR 17. Scaffold a `QWEN.md` at the daemon's bound
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
    /**
     * Switch the active model for a session. Backed by ACP's currently-unstable
     * `unstable_setSessionModel`; the daemon also publishes a `model_switched`
     * event so cross-client UIs can update.
     */
    setSessionModel(sessionId: string, modelId: string, clientId?: string): Promise<SetModelResult>;
    /**
     * Send a prompt to the agent. Long-lived: a model + tool turn can
     * take minutes, so this method bypasses `fetchTimeoutMs` (which
     * would force a default 30s deadline that's too short for normal
     * use). Cancellation is via the optional `signal` — when it fires,
     * the daemon receives the underlying TCP close and forwards an
     * ACP `cancel` notification to the agent, resolving the prompt
     * with `stopReason: 'cancelled'`. `cancel(sessionId)` is the
     * out-of-band alternative.
     */
    prompt(sessionId: string, req: PromptRequest, signal?: AbortSignal, clientId?: string): Promise<PromptResult>;
    /**
     * Bump the daemon's last-seen bookkeeping for this session. The
     * route is short-lived — drives diagnostics and future revocation
     * policy (Wave 5 PR 24) — so it goes through the standard
     * `fetchTimeoutMs`. Older daemons (pre-PR 9) return 404 for
     * `/heartbeat`; clients should pre-flight
     * `caps.features.client_heartbeat` before calling.
     */
    heartbeat(sessionId: string, clientId?: string): Promise<HeartbeatResult>;
    cancel(sessionId: string, clientId?: string): Promise<void>;
    subscribeEvents(sessionId: string, opts?: SubscribeOptions): AsyncGenerator<DaemonEvent>;
    /**
     * Cast a permission vote. Returns true when the daemon accepted the vote,
     * false on 404 (request unknown or already resolved by another client —
     * the typical "lost the race" outcome under multi-client fan-out).
     */
    respondToPermission(requestId: string, response: PermissionResponse, clientId?: string): Promise<boolean>;
    /**
     * Cast a permission vote against an explicit daemon session. New clients
     * should prefer this once `capabilities.features` includes
     * `session_permission_vote`; the legacy request-id-only route remains for
     * older daemons.
     */
    respondToSessionPermission(sessionId: string, requestId: string, response: PermissionResponse, clientId?: string): Promise<boolean>;
    /**
     * Close a daemon session. The daemon treats DELETE as idempotent for SDK
     * callers: both 204 (closed) and 404 (already gone) resolve successfully.
     */
    closeSession(sessionId: string, clientId?: string): Promise<void>;
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
    getDeviceFlow(deviceFlowId: string, opts?: {
        clientId?: string;
        signal?: AbortSignal;
    }): Promise<DaemonDeviceFlowState>;
    /**
     * Cancel a pending device-flow. Idempotent: terminal entries return
     * 204 (no-op); unknown ids return 404 — both resolve here, matching
     * the SDK's `closeSession` shape.
     */
    cancelDeviceFlow(deviceFlowId: string, opts?: {
        clientId?: string;
    }): Promise<void>;
    /** Snapshot of persisted auth credentials + currently pending device-flows. */
    getAuthStatus(opts?: {
        clientId?: string;
    }): Promise<DaemonAuthStatusSnapshot>;
    /**
     * Patch mutable session metadata and return the effective stored metadata
     * reported by the daemon.
     */
    updateSessionMetadata(sessionId: string, metadata: {
        displayName?: string;
    }, clientId?: string): Promise<SessionMetadataResult>;
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
export declare function composeAbortSignals(signals: AbortSignal[]): AbortSignal;
