/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { IncomingMessage } from 'node:http';
import type { Application } from 'express';
import { type WebSocket } from 'ws';
import type { HttpAcpBridge } from '@qwen-code/acp-bridge/bridgeTypes';
import type { DaemonWorkspaceService } from '../workspace-service/types.js';
import type { WorkspaceFileSystemFactory } from '../fs/index.js';
import type { DeviceFlowRegistry } from '../auth/device-flow.js';
import type { ParsedAllowOriginPatterns } from '../auth.js';
import { type LiveSessionIsolation } from './dispatch.js';
import { WorkspaceRememberTaskLane } from '../workspace-remember.js';
import type { WorkspaceRegistry, WorkspaceRuntime } from '../workspace-registry.js';
import { ConnectionRegistry, type AcpConnectionDiagnostic } from './connection-registry.js';
import type { RateLimitTier } from '../rate-limit.js';
import { SessionArchiveCoordinator } from '../server/session-archive.js';
import type { RequestedSessionIdAdmission } from '../session-id-admission.js';
import { type ClientMcpServerProvider } from './client-mcp-ws.js';
import type { CdpTunnelRegistry } from '../cdp-tunnel/cdp-tunnel-registry.js';
export declare const ACP_CONNECTION_HEADER = "acp-connection-id";
export declare const ACP_SESSION_HEADER = "acp-session-id";
/**
 * Browsers cannot set an `Authorization` header on a WebSocket, so the Web
 * Shell authenticates the `/voice/stream` (and `/acp`) upgrade by offering the
 * bearer token as a `Sec-WebSocket-Protocol` subprotocol of the form
 * `qwen-bearer.<base64url(token)>`. Kept in sync with the encoder in
 * `packages/web-shell/client/voice/useVoiceCapture.ts`.
 */
export declare const WS_BEARER_SUBPROTOCOL_PREFIX = "qwen-bearer.";
export interface MountAcpHttpOptions {
    boundWorkspace: string;
    /** Process-level fallback for embedded mounts and parent-process runtimes. */
    daemonEnv?: Readonly<NodeJS.ProcessEnv>;
    workspace: DaemonWorkspaceService;
    fsFactory?: WorkspaceFileSystemFactory;
    deviceFlowRegistry?: DeviceFlowRegistry;
    enabled?: boolean;
    path?: string;
    maxConnections?: number;
    /** Bearer token for WS auth (WS bypasses Express middleware). */
    token?: string;
    /**
     * Parsed `--allow-origin` allowlist. The WS CSRF check (CSWSH defence)
     * rejects non-loopback origins; origins in this allowlist are also accepted,
     * so a browser extension (`chrome-extension://<id>`) can open the reverse
     * tool channel. Mirrors the REST CORS allowlist (`allowOriginCors`).
     */
    allowedOrigins?: ParsedAllowOriginPatterns;
    /** Hostname the daemon is listening on; used by local MCP child processes. */
    hostname?: string;
    /** Effective direct session shell policy for ACP initialize/dispatch. */
    sessionShellCommandEnabled?: boolean;
    archiveCoordinator?: SessionArchiveCoordinator;
    /**
     * The daemon-wide session-id admission shared with every other transport.
     * Required: a mount-local fallback could not see draining generations, so
     * the host must inject the shared instance (as `createServeApp` does).
     */
    requestedSessionIdAdmission: RequestedSessionIdAdmission;
    /** Shared lane for sessionless workspace remember tasks. */
    workspaceRememberLane: WorkspaceRememberTaskLane;
    /** Rate limit checker for WS messages (WS bypasses Express middleware). */
    checkRate?: (key: string, tier: RateLimitTier) => boolean;
    /**
     * Opt-in: accept client-hosted MCP servers over the WS (issue #5626,
     * Phase 2 "reverse tool channel"). When true, inbound `mcp_register` /
     * `mcp_message` / `mcp_unregister` frames are handled per-connection. Off by
     * default — the public contract is still settling.
     */
    clientMcpOverWs?: boolean;
    /**
     * Injection point for the deep wiring into the agent's live MCP stack. When
     * supplied, an `mcp_register` frame registers a real SDK-type runtime MCP
     * server whose discovery + tool calls round-trip over the WS. When omitted,
     * `mcp_register` is rejected with a structured `not_wired` error (the WS
     * framing + correlation still work, but no agent-visible server is created).
     *
     * Single shared instance — used by the round-trip test, which injects one
     * provider for the whole server. Production wires the per-connection
     * {@link clientMcpProviderFactory} instead (so each WS connection gets its
     * own runtime-MCP originator id). When both are set the factory wins.
     */
    clientMcpProvider?: ClientMcpServerProvider;
    /**
     * Per-WS-connection provider factory (issue #5626, production wiring). Called
     * once per connection (lazily, on the first client-MCP frame) with the
     * connection's stable id, so runtime-MCP mutations the provider performs are
     * attributed to that connection. Takes precedence over
     * {@link clientMcpProvider}.
     */
    clientMcpProviderFactory?: (connectionId: string) => ClientMcpServerProvider;
    /**
     * Opt-in: tunnel raw CDP to a real browser tab over the reverse `/acp` WS
     * (Plan C, issue #5626). When true, a `/cdp` upgrade branch accepts a loopback
     * puppeteer client and inbound `cdp_*` frames are routed to the bound reverse
     * link. Off by default.
     */
    cdpTunnelOverWs?: boolean;
    /**
     * Process-scoped registry that pairs the extension `/acp` reverse connection
     * with the `/cdp` endpoint. Required when {@link cdpTunnelOverWs} is on;
     * ignored otherwise.
     */
    cdpTunnelRegistry?: CdpTunnelRegistry;
    /**
     * Phase 4 (issue #6378): the daemon's workspace registry. When present and it
     * has non-primary runtimes, `/workspaces/:workspace/acp` mounts a per-runtime
     * ACP dispatcher for each registered workspace. Legacy `/acp` stays bound to
     * the primary runtime.
     */
    workspaceRegistry?: WorkspaceRegistry;
    /** Live primary trust decision for legacy `/acp` operations. */
    isPrimaryWorkspaceTrusted?: () => boolean;
    /**
     * Additional non-ACP WebSocket routes (e.g. `/voice/stream`) that reuse this
     * upgrade listener's security checks. Matched paths skip the ACP init flow.
     */
    extraWsRoutes?: readonly ExtraWsRoute[];
    workspaceVoiceConnection?: (runtime: WorkspaceRuntime, ws: WebSocket, req: IncomingMessage) => void;
    liveSessionIsolation?: LiveSessionIsolation;
}
/**
 * A non-ACP WebSocket route that shares the daemon's single upgrade listener
 * (and therefore its loopback / host-allowlist / CSRF / bearer-token checks)
 * instead of attaching a second `'upgrade'` listener — the ACP listener
 * `socket.destroy()`s unknown paths, so a competing listener can't coexist.
 */
export interface ExtraWsRoute {
    path: string;
    onConnection: (ws: WebSocket, req: IncomingMessage) => void;
}
/** Per-mount ACP connection counts (primary + each trusted secondary). */
export interface AcpHttpMountSnapshot {
    /** Workspace id, or `null` for the primary/legacy `/acp` mount. */
    workspaceId: string | null;
    primary: boolean;
    connectionCount: number;
    wsStreams: number;
}
export interface AcpHttpConnectionDiagnostic extends AcpConnectionDiagnostic {
    workspaceId: string | null;
    workspaceCwd: string;
    primary: boolean;
}
/** Aggregate ACP HTTP observability across every mounted runtime. */
export interface AcpHttpSnapshot {
    connectionCount: number;
    connectionStreams: number;
    sessionStreams: number;
    sseStreams: number;
    wsStreams: number;
    pendingClientRequests: number;
    mounts: AcpHttpMountSnapshot[];
    connections: AcpHttpConnectionDiagnostic[];
}
export interface AcpHttpHandle {
    dispose(): void;
    registry: ConnectionRegistry;
    /**
     * Aggregate connection snapshot across the primary mount and every trusted
     * secondary runtime — so daemon metrics report all workspaces' ACP
     * connections, not just the primary's.
     */
    getSnapshot(): AcpHttpSnapshot;
    beginWorkspaceDrain(workspaceId: string): void;
    cancelWorkspaceDrain(workspaceId: string): void;
    getWorkspaceActivity(workspaceId: string): {
        acpConnections: number;
        memoryTasks: number;
    };
    /**
     * Return the remember lane for a workspace, creating a secondary mount on
     * demand for trusted non-primary runtimes. Returns undefined once the handle
     * is disposed (callers answer 503) or for an unknown/untrusted runtime.
     */
    ensureWorkspaceRememberLane(workspaceId: string): WorkspaceRememberTaskLane | undefined;
    /** Non-creating lane lookup for read routes; undefined when no mount exists. */
    getWorkspaceRememberLane(workspaceId: string): WorkspaceRememberTaskLane | undefined;
    /** Commit memory teardown while sockets remain open for terminal events. */
    commitWorkspaceRemoval(workspaceId: string): void;
    disposeWorkspace(workspaceId: string): void;
    /** Attach HTTP server post-listen to enable WebSocket upgrade. */
    attachServer(server: import('node:http').Server): void;
}
/**
 * Mount the official ACP Streamable HTTP transport (RFD #721) on an
 * existing Express app, backed by the shared `HttpAcpBridge`. Additive:
 * the REST surface (`/session/*`) is untouched (design doc §6).
 *
 * Wire shape (single `/acp` endpoint):
 *   - POST   {initialize}  → 200 + capabilities JSON + `Acp-Connection-Id`
 *   - POST   {other}       → 202; reply delivered on a long-lived SSE stream
 *   - GET    (conn header) → connection-scoped SSE stream
 *   - GET    (conn+session)→ session-scoped SSE stream
 *   - DELETE               → 202; tears the connection down
 */
export declare function mountAcpHttp(app: Application, bridge: HttpAcpBridge, opts: MountAcpHttpOptions): AcpHttpHandle | undefined;
