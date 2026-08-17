/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const NOT_CURRENTLY_GENERATING_CANCEL_MESSAGE: 'Not currently generating';
/**
 * ACP idle-cancel compatibility contract.
 *
 * The current CLI agent throws `NOT_CURRENTLY_GENERATING_CANCEL_MESSAGE`
 * when a client sends `cancel` while no prompt is active. Older ACP
 * surfaces may wrap that text in either `message` or `data.details`.
 * Treat harmless wording extensions such as
 * "Not currently generating (session idle)" as the same no-op cancel,
 * but keep this matcher narrow so unrelated cancel failures still
 * propagate to callers.
 */
export declare function isNotCurrentlyGeneratingCancelError(
  err: unknown,
): boolean;
export declare class SessionNotFoundError extends Error {
  readonly sessionId: string;
  readonly code: 'session_not_found' | 'session_closing';
  constructor(
    sessionId: string,
    extra?: string,
    code?: 'session_not_found' | 'session_closing',
  );
}
export declare class SessionArchivedError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string);
}
export declare class SessionNotArchivedError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string);
}
export declare class SessionConflictError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string);
}
export declare class SessionArchivingError extends Error {
  readonly sessionId: string;
  readonly lockKind: 'exclusive' | 'shared';
  constructor(sessionId: string, lockKind?: 'exclusive' | 'shared');
}
/**
 * Why a restore of this id is fenced.
 *
 * `restore_in_progress` is the ordinary case: a restore is running and the
 * caller can retry shortly. `awaiting_abandoned_cleanup` means the public
 * caller already received a timeout, but the non-cancellable ACP request (and
 * its cleanup) has not settled yet — retrying at the ordinary cadence just
 * re-hits the fence, so clients must back off much further.
 */
export type RestoreInProgressReason =
  | 'restore_in_progress'
  | 'awaiting_abandoned_cleanup';
/** Fallback retry hint, in seconds, for an ordinary in-flight restore. */
export declare const RESTORE_IN_PROGRESS_RETRY_AFTER_SECONDS = 5;
/**
 * A session-id registration operation. `requestedAction` is the caller's
 * operation; `activeAction` is the operation that already owns the id.
 * `spawn` means a fresh `POST /session` carrying a caller-supplied id.
 */
export type RestoreBlockedAction = 'load' | 'resume' | 'spawn';
export declare class RestoreInProgressError extends Error {
  readonly sessionId: string;
  readonly activeAction: RestoreBlockedAction;
  readonly requestedAction: RestoreBlockedAction;
  readonly reason: RestoreInProgressReason;
  readonly retryAfterSeconds: number;
  constructor(
    sessionId: string,
    activeAction: RestoreBlockedAction,
    requestedAction: RestoreBlockedAction,
    opts?: {
      reason?: RestoreInProgressReason;
      retryAfterSeconds?: number;
    },
  );
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
export declare class TotalSessionLimitExceededError extends Error {
  readonly limit: number;
  readonly scope: 'total';
  constructor(limit: number);
}
/**
 * Thrown by `sendPrompt` when a session already has too many accepted
 * prompts waiting or running. The REST route maps this to 503 with
 * `Retry-After`; SDK clients can retry after observing a turn completion.
 * The TypeScript SDK maps the same `prompt_queue_full` wire condition to
 * `DaemonPendingPromptLimitError`.
 */
export declare class PromptQueueFullError extends Error {
  readonly limit: number;
  readonly pendingCount: number;
  readonly sessionId: string;
  constructor(limit: number, pendingCount: number, sessionId: string);
}
/**
 * Rejected by `sendPrompt` when an accepted prompt exceeds its wallclock
 * deadline (`BridgeClientRequestContext.deadlineMs`). The bridge publishes a
 * `turn_error{code:'prompt_deadline_exceeded'}` terminal, releases the FIFO,
 * and best-effort cancels the agent — the agent may still be executing.
 * Exported so tests and routes can match on the class identity.
 */
export declare class PromptDeadlineExceededError extends Error {
  readonly deadlineMs: number;
  constructor(deadlineMs: number);
}
/**
 * Thrown by `spawnOrAttach` when the requested `workspaceCwd` doesn't
 * canonicalize to the bridge's bound workspace. Every bridge instance is bound
 * to exactly one runtime; a multi-workspace daemon selects a bridge before
 * dispatch. Cross-workspace requests that reach this boundary are rejected.
 * The server route translates this to a 400 response with
 * `code: 'workspace_mismatch'`
 * and both paths in the body so clients can refresh the workspace catalog,
 * register the requested workspace, or route to the correct runtime.
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
 * Thrown when a direct daemon shell command is attempted without the operator
 * explicitly enabling the high-risk session shell surface.
 */
export declare class SessionShellDisabledError extends Error {
  constructor();
}
/**
 * Thrown when a direct daemon shell command has no client id bound to the
 * addressed session. The bearer token authenticates the caller to the daemon;
 * this error means the caller has not proven ownership of the session.
 */
export declare class SessionShellClientRequiredError extends Error {
  constructor();
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
 * Typed error for unimplemented permission policies. Thrown by `MultiClientPermissionMediator.vote` when the
 * active policy is wired into the schema/registry but the mediator
 * implementation has not been built yet.
 *
 * **Currently unreachable in production** — the current code implements
 * all 4 policies in the frozen `PermissionPolicy` union. The class +
 * route-level 501 mapping in `server.ts:sendPermissionVoteError` are
 * RETAINED as forward-compat infrastructure: when a future PR adds a
 * 5th policy literal to `PermissionPolicy` and lands its mediator
 * implementation across multiple commits, the intermediate-build
 * stub can throw this typed error and the operator gets a clean 501
 * instead of a generic 500.
 *
 * Routes map this to HTTP 501 with a structured body so SDK clients
 * can render "your daemon is older than your settings expect;
 * upgrade".
 */
export declare class PermissionPolicyNotImplementedError extends Error {
  readonly policy: string;
  constructor(policy: string);
}
/**
 * Collision defense. Thrown by `MultiClientPermissionMediator.request`
 * when an agent-declared `allowedOptionIds` set contains the
 * cancel-vote sentinel string. The bridge maps voter cancel intent
 * to that exact `optionId`; if the agent legitimately uses it as
 * an option label, the mediator can no longer disambiguate. We
 * fail loudly at request issue time so the operator sees a clear
 * misconfiguration rather than the silent "voter approval was
 * treated as cancel" semantic flip.
 *
 * Routes map this to HTTP 500 — it represents a contract violation
 * between agent and daemon, not a client mistake.
 */
export declare class CancelSentinelCollisionError extends Error {
  readonly requestId: string;
  readonly sentinel: string;
  constructor(requestId: string, sentinel: string);
}
/**
 * Permission forbidden error. Thrown by `bridge.respondToSessionPermission` /
 * `bridge.respondToPermission` when the active permission policy
 * rejects the vote (designated voter mismatch, or remote vote under
 * `local-only`). The bridge converts the mediator's
 * `PermissionVoteOutcome { kind: 'forbidden', reason: ... }` into
 * this typed error so the route layer can map to HTTP 403 without
 * pattern-matching on the error message.
 *
 * `reason` is forwarded verbatim from the mediator's outcome so SDK
 * clients can render a precise UI ("you weren't designated to
 * approve" vs "this daemon only accepts loopback approvals").
 */
export declare class PermissionForbiddenError extends Error {
  readonly requestId: string;
  readonly sessionId: string;
  readonly reason: 'designated_mismatch' | 'remote_not_allowed';
  constructor(
    requestId: string,
    sessionId: string,
    reason: 'designated_mismatch' | 'remote_not_allowed',
  );
}
/**
 * Workspace init conflict. Thrown by `initWorkspace` when the target file
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
 * Path escape guard. Thrown by `initWorkspace` when
 * the configured `context.fileName` resolves outside the bound
 * workspace via path arithmetic (e.g. `../outside.md`). Translated
 * to HTTP 400 by the route — distinguishable from a generic 500 so
 * an operator sees "your workspace config is wrong" rather than
 * "the daemon is broken." The `filename` and `boundWorkspace`
 * fields let clients display a precise diagnostic.
 */
export declare class WorkspaceInitPathEscapeError extends Error {
  readonly filename: string;
  readonly boundWorkspace: string;
  constructor(filename: string, boundWorkspace: string);
}
/**
 * Path escape guard. Thrown by `initWorkspace` when
 * the target file is itself a symlink, OR when the parent path
 * canonicalizes (via `realpath`) outside the bound workspace.
 * Translated to HTTP 400 by the route — same operator-clarity
 * rationale as `WorkspaceInitPathEscapeError`. `target` is the
 * resolved path the bridge attempted, `kind` distinguishes the two
 * symlink scenarios for diagnostics.
 */
export declare class WorkspaceInitSymlinkError extends Error {
  readonly target: string;
  readonly kind: 'target' | 'parent';
  constructor(target: string, kind: 'target' | 'parent', detail: string);
}
/**
 * Race condition guard. Thrown by
 * `initWorkspace` when the target file's inode misbehaved at write
 * time IN A NON-SYMLINK WAY — typically a TOCTOU race against a
 * concurrent writer:
 *   - `'eexist'`: a regular file (or symlink) appeared at the target
 *     path between the absence check and our atomic `'wx'` create.
 *   - `'enoent'`: the target was deleted between the content check
 *     and the `O_NOFOLLOW` overwrite (concurrent git checkout, editor
 *     save, etc.).
 *
 * Split out from `WorkspaceInitSymlinkError` so the HTTP error code
 * isn't misleading: an operator chasing a `workspace_init_race`
 * code knows it's a benign concurrent-modification window, not a
 * symlink attack vector. Same 400 mapping as the sibling class —
 * the route layer still recognizes both.
 */
export declare class WorkspaceInitRaceError extends Error {
  readonly target: string;
  readonly kind: 'eexist' | 'enoent';
  constructor(target: string, kind: 'eexist' | 'enoent', detail: string);
}
/**
 * MCP server not found. Thrown by `restartMcpServer` when the
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
 * MCP restart failure. Thrown by `restartMcpServer` when
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
export declare class SessionBusyError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string, message?: string);
}
export declare class WorkspaceDrainingError extends Error {
  readonly code = 'workspace_draining';
  readonly workspaceCwd: string;
  constructor(workspaceCwd: string);
}
/**
 * Why a channel is closed to new session work. `restore_cleanup_failed`: the
 * cleanup of a timed-out restore failed, so the child's state is unknown.
 * `restore_settlement_overdue`: an abandoned restore blew past its settlement
 * grace period, so the child still holds work the bridge can neither cancel
 * nor account for. Both keep existing sessions usable and clear once the
 * channel drains and is recycled.
 */
export type BridgeChannelUnavailableReason =
  | 'restore_cleanup_failed'
  | 'restore_settlement_overdue';
export declare class BridgeChannelQuarantinedError extends Error {
  readonly reason: BridgeChannelUnavailableReason;
  /**
   * How long the caller should wait before retrying fresh session work. This
   * state persists until the workspace channel drains, which is at least a
   * restore budget away — the ordinary 5-second cadence would poll identical
   * 503s, and a fresh id never reaches the 409 that carries the real hint.
   */
  readonly retryAfterSeconds: number;
  constructor(
    reason?: BridgeChannelUnavailableReason,
    retryAfterSeconds?: number,
  );
}
export declare class InvalidRewindTargetError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string, message?: string);
}
export declare class BranchWhilePromptActiveError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string);
}
export declare class CdWhilePromptActiveError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string);
}
