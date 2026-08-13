/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type HttpAcpBridge } from '@qwen-code/acp-bridge/bridgeTypes';
import { type WorkspaceFileSystemFactory } from '../fs/index.js';
import { type WorkspaceRememberTaskLane } from '../workspace-remember.js';
import { type RequestedSessionIdAdmission } from '../session-id-admission.js';
import type { DeviceFlowRegistry } from '../auth/device-flow.js';
import { SessionArchiveCoordinator } from '../server/session-archive.js';
import type { DaemonWorkspaceService } from '../workspace-service/types.js';
import type { AcpConnection, ConnectionRegistry } from './connection-registry.js';
import { type JsonRpcInbound, type JsonRpcRequest } from './json-rpc.js';
/**
 * Validate an optional `cwd` param the same way the REST `POST /session`
 * route does: when present it must be a string, ≤ PATH_MAX, and absolute.
 * Closes the body-amplification DoS the REST code documents. Returns the
 * bound workspace when omitted.
 */
export declare function parseOptionalWorkspaceCwd(params: Record<string, unknown>, boundWorkspace: string): string;
/**
 * Map a thrown error to a JSON-RPC error code + a client-safe message.
 * Param-validation errors are echoed (they describe the client's own bad
 * input); bridge/internal errors are coded by class name with their
 * message preserved (the daemon's trust boundary is the bearer token, so
 * the operator-facing message is not a cross-tenant leak), and anything
 * unrecognized collapses to a generic INTERNAL_ERROR string.
 */
export declare function toRpcError(err: unknown): {
    code: number;
    message: string;
    data?: Record<string, unknown>;
};
/**
 * The ACP protocol version this transport speaks (ACP stable = 1).
 */
export declare const ACP_PROTOCOL_VERSION = 1;
export interface LiveSessionIsolation {
    materializeConversationDirectory(sessionId: string): Promise<string>;
    isSessionActive?(sessionId: string): boolean;
}
interface AcpSessionRuntimeContext {
    readonly bridge: HttpAcpBridge;
    readonly sessionRuntimeBaseDir: string;
    readonly workspaceId?: string;
}
/**
 * Routes JSON-RPC messages between the HTTP transport and the
 * `HttpAcpBridge`. Inbound client messages map to bridge calls; the
 * bridge's `BridgeEvent`s map back to JSON-RPC frames on the matching
 * session stream (see the design doc §4 translation table).
 */
export declare class AcpDispatcher {
    private readonly bridge;
    private readonly boundWorkspace;
    private readonly getEnv;
    private readonly workspace;
    private readonly workspaceRememberLane;
    private readonly requestedSessionIdAdmission;
    private readonly fsFactory?;
    private readonly deviceFlowRegistry?;
    private readonly sessionShellCommandEnabled;
    private readonly registry?;
    private readonly archiveCoordinator;
    private readonly isWorkspaceTrusted;
    private readonly captureGenerationAssertion;
    private readonly liveSessionIsolation?;
    private readonly sessionRuntimeBaseDir;
    private readonly getSessionRuntimeContext;
    private readonly agentManager;
    constructor(bridge: HttpAcpBridge, boundWorkspace: string, getEnv: () => Readonly<NodeJS.ProcessEnv>, workspace: DaemonWorkspaceService, workspaceRememberLane: WorkspaceRememberTaskLane, requestedSessionIdAdmission: RequestedSessionIdAdmission, fsFactory?: WorkspaceFileSystemFactory | undefined, deviceFlowRegistry?: DeviceFlowRegistry | undefined, sessionShellCommandEnabled?: boolean, registry?: ConnectionRegistry | undefined, archiveCoordinator?: SessionArchiveCoordinator, isWorkspaceTrusted?: () => boolean, captureGenerationAssertion?: () => (() => void) | undefined, liveSessionIsolation?: LiveSessionIsolation | undefined, sessionRuntimeBaseDir?: string, getSessionRuntimeContext?: () => AcpSessionRuntimeContext);
    private invalidateSessionLists;
    private runWithSessionListInvalidation;
    private removeOrphanSession;
    private killOrphanSession;
    /**
     * Build the `WorkspaceRequestContext` for workspace-scoped operations
     * routed through the workspace service. The ACP dispatch has no session
     * context, so `sessionId` is omitted.
     */
    private wsCtx;
    private parseBoundWorkspaceParam;
    private parseSessionWorkspaceCwd;
    private parseSessionIds;
    private rejectActiveLiveSessionMutation;
    private serializeSessionErrors;
    /**
     * Build the bridge context for a per-session call. Echoes the clientId the
     * bridge STAMPED at create/attach (the connection's own id is unregistered
     * and would be rejected) and threads `fromLoopback` so the `local-only`
     * permission policy can gate votes by transport — symmetric with the REST
     * surface's `detectFromLoopback(req)`.
     *
     * Throws when no stamped clientId is present: the only callers reach here
     * AFTER `requireOwned`, so the binding must exist and carry the bridge's
     * id. A missing id means an invariant broke (a `session/new`/`load` that
     * didn't record it) — fail loud rather than silently send an unregistered
     * id whose rejection surfaces asynchronously, far from the cause.
     */
    private sessionCtx;
    /**
     * The session's ACP-shaped config options supported by this HTTP transport
     * (currently model and mode), read from the child's own session state.
     * Every response built from this helper (`session/new`,
     * `session/load`/`session/resume`, `session/fork`, and the
     * `session/set_config_option` result) is gated to the ids the transport
     * can route. Raw-state surfaces (context status, REST load/resume state)
     * intentionally carry the child's full unfiltered set — they report session
     * state. Best-effort — `undefined` on error.
     */
    private configOptionsFor;
    /**
     * Extract ACP-standard `SessionModelState` from configOptions.
     * ConfigOptions carry model info as `{ category: 'model', type: 'select',
     * currentValue, options }`. Maps to `{ currentModelId, availableModels }`.
     */
    private extractModelState;
    /**
     * Extract ACP-standard `SessionModeState` from configOptions.
     * ConfigOptions carry mode info as `{ category: 'mode', type: 'select',
     * currentValue, options }`. Maps to `{ currentModeId, availableModes }`.
     */
    private extractModeState;
    /**
     * Cancel a permission request the client abandoned (closed its stream /
     * connection before voting), so the bridge isn't left blocked. Invoked
     * by the connection-registry teardown path.
     */
    cancelAbandonedPermission(req: {
        sessionId: string;
        bridgeRequestId: string;
    }, clientId: string | undefined): boolean;
    /**
     * Build the `initialize` result advertising standard + `_qwen` caps.
     * Negotiates the protocol version: we only implement stable V1, so we
     * clamp to `[1, ACP_PROTOCOL_VERSION]` — a client asking for 0/negative
     * (ACP marks V0 a pre-release fallback) or a future version gets `1`
     * rather than an echoed version we don't actually implement.
     */
    buildInitializeResult(connectionId: string, requestedVersion?: unknown): Record<string, unknown>;
    /**
     * Gate a per-session operation on connection ownership. Sends a JSON-RPC
     * error and returns false when this connection never created/attached
     * the session (prevents driving or eavesdropping on another
     * connection's session). `session/new|load|resume` are the
     * ownership-GRANTING ops and skip this.
     */
    private requireOwned;
    private withMutableOwned;
    private findPendingClientRequest;
    private dropResolvedPermission;
    /**
     * Drop ONLY the calling connection's own pending permission entry for
     * `requestId`, never a sibling co-owner's. Under the consensus policy a vote
     * (or an unexpected vote error) from connection B must not delete connection
     * A's still-needed entry, which would stall the quorum. A connection that
     * never streamed the request holds no entry, so this is a no-op for it.
     */
    private dropOwnPendingPermission;
    /**
     * Handle one inbound POST message. Returns nothing — every reply is
     * delivered asynchronously on a long-lived SSE stream per the RFD
     * (`POST` itself answers `202`). `initialize` is handled by the caller
     * (it mints the connection) and never reaches here.
     */
    handle(conn: AcpConnection, msg: JsonRpcInbound, sessionHeader?: string, reqLoopback?: boolean): Promise<void>;
    private handleInRuntime;
    /**
     * Current epoch token of the session's event bus, or `undefined` when
     * the session is unknown (torn down between ownership check and header
     * write). The `/acp` GET route advertises it as `X-Qwen-Event-Epoch`
     * BEFORE `stream.open()` flushes headers (DAEMON-001).
     */
    getSessionEventEpoch(sessionId: string): string | undefined;
    /**
     * Bind a session-scoped SSE stream to the bridge's event stream,
     * translating each `BridgeEvent` into a JSON-RPC frame (design §4.2).
     */
    pumpSessionEvents(conn: AcpConnection, sessionId: string, signal: AbortSignal, lastEventId?: number, epoch?: string): Promise<void>;
    private translateEvent;
    /**
     * Resolve a client's JSON-RPC response to an agent→client request.
     * `fromLoopback` is the CURRENT request's loopback bit (the vote POST may
     * arrive from a different peer than `initialize`).
     */
    private resolveClientResponse;
    private handlePrompt;
    private replyConn;
    private replySession;
}
export type { JsonRpcRequest };
