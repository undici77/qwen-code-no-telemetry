/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare class SessionNotFoundError extends Error {
    readonly sessionId: string;
    constructor(sessionId: string, extra?: string);
}
export declare class RestoreInProgressError extends Error {
    readonly sessionId: string;
    readonly activeAction: 'load' | 'resume';
    readonly requestedAction: 'load' | 'resume';
    constructor(sessionId: string, activeAction: 'load' | 'resume', requestedAction: 'load' | 'resume');
}
/**
 * Thrown by `spawnOrAttach` when `req.sessionScope` is set to a value
 * outside the `'single' | 'thread'` enum. The HTTP route validates the
 * body field at the boundary first (so HTTP callers get a typed
 * `400 invalid_session_scope` before ever reaching the bridge); this
 * class exists for direct callers — tests, embeds, future entry points
 * — and so the route's catch-block can translate it back to the same
 * 400 shape rather than the generic 500 every other thrown `Error`
 * collapses to. Distinct type so routes can branch without
 * text-matching the message.
 */
export declare class InvalidSessionScopeError extends Error {
    readonly sessionScope: unknown;
    constructor(sessionScope: unknown);
}
/**
 * Thrown by `spawnOrAttach` when a fresh-spawn would push `sessionCount`
 * past `BridgeOptions.maxSessions`. The HTTP route maps this to 503
 * with a `Retry-After` hint. Attaches (same workspace under `single`
 * scope) never trip this — only NEW children. Distinct error type so
 * routes can branch without text-matching.
 */
export declare class SessionLimitExceededError extends Error {
    readonly limit: number;
    constructor(limit: number);
}
/**
 * Thrown by `spawnOrAttach` when the requested `workspaceCwd` doesn't
 * canonicalize to the daemon's bound workspace. Per #3803 §02 every
 * bridge instance is bound to exactly one workspace; cross-workspace
 * requests are rejected at the daemon boundary. The server route
 * translates this to a 400 response with `code: 'workspace_mismatch'`
 * and both paths in the body so clients can fall through to spawning
 * their own daemon / routing to a different one via an orchestrator.
 */
export declare class WorkspaceMismatchError extends Error {
    readonly bound: string;
    readonly requested: string;
    constructor(bound: string, requested: string);
}
/**
 * Thrown when an HTTP caller echoes a client id that this daemon did not
 * issue for the addressed live session. Create/attach calls may receive a
 * fresh id instead; state-changing session routes reject unknown ids so
 * originator metadata stays daemon-stamped rather than caller-asserted.
 */
export declare class InvalidClientIdError extends Error {
    readonly sessionId: string;
    readonly clientId: string;
    constructor(sessionId: string, clientId: string);
}
/**
 * Thrown by `bridge.respondToPermission` when the voter's
 * `optionId` isn't in the set of options the agent originally
 * offered. Server route catches this and returns 400 (distinct from
 * 404 unknown-requestId).
 */
export declare class InvalidPermissionOptionError extends Error {
    readonly requestId: string;
    readonly optionId: string;
    constructor(requestId: string, optionId: string);
}
export declare class InvalidSessionMetadataError extends Error {
    readonly field: string;
    constructor(field: string, reason: string);
}
/**
 * #4175 Wave 4 PR 17. Thrown by `initWorkspace` when the target file
 * already exists with non-whitespace content and the caller did not
 * pass `force: true`. Translated to HTTP 409 by the route. The
 * `path` and `existingSize` fields let SDK clients render a clear
 * "file already exists; pass `force: true` to overwrite" prompt
 * without re-stat'ing the workspace.
 */
export declare class WorkspaceInitConflictError extends Error {
    readonly path: string;
    readonly existingSize: number;
    constructor(path: string, existingSize: number);
}
/**
 * #4282 fold-in 1 (gpt-5.5 C5). Thrown by `restartMcpServer` when the
 * caller asks for a server name that isn't in the daemon's
 * `McpServers` config. Translated to HTTP 404 + structured body by
 * the route — distinguishable from a generic 500 so a bad server
 * name doesn't look like an internal daemon failure.
 */
export declare class McpServerNotFoundError extends Error {
    readonly serverName: string;
    constructor(serverName: string);
}
/**
 * #4282 fold-in 1 (gpt-5.5 C4). Thrown by `restartMcpServer` when
 * `discoverMcpToolsForServer` resolves but the MCP client fails to
 * end up `CONNECTED` post-discover. The manager catches reconnect
 * errors and returns void, so without an explicit post-check the
 * route would report `restarted: true` while the server stays
 * disconnected. Translated to HTTP 502 + `errorKind:
 * 'protocol_error'` by the route.
 */
export declare class McpServerRestartFailedError extends Error {
    readonly serverName: string;
    readonly mcpStatus: string;
    constructor(serverName: string, mcpStatus: string);
}
