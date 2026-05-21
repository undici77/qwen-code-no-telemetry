/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type BridgeEvent } from '../eventBus.js';
import type { FsErrorKind } from './errors.js';
import type { Intent, ResolvedPath } from './paths.js';
/**
 * Frame type for successful filesystem operations on the boundary.
 * Emitted from the orchestrator on the success path of `readText`,
 * `readBytes`, `list`, `glob`, `stat`, `writeText`, `edit`. PR 19/20
 * SSE consumers can fan it out to subscribed clients; PR 18 itself
 * has no consumer beyond unit tests, since no HTTP routes use the
 * boundary yet.
 */
export declare const FS_ACCESS_EVENT_TYPE: "fs.access";
/**
 * Frame type for boundary policy denials. Emitted whenever an
 * `FsError` propagates from the orchestrator. Always emitted, even
 * for transient ones that the route handler will surface to the
 * caller — the audit trail is the operator's tool, separate from
 * the client-visible response.
 */
export declare const FS_DENIED_EVENT_TYPE: "fs.denied";
/**
 * Request-scoped audit context. Bound to a `WorkspaceFileSystem`
 * instance by the factory's `forRequest(ctx)` call so individual
 * orchestrator methods don't need to thread these fields by hand.
 */
export interface AuditContext {
    /** Daemon-stamped client identity from PR 7 (#4231). */
    originatorClientId?: string;
    /** Optional ACP session id for cross-correlating audit + session events. */
    sessionId?: string;
    /** Route name like 'GET /file' — populated by PR 19/20 handlers. */
    route: string;
}
/**
 * Successful-access record. The hot path computes this lazily so a
 * disabled publisher (no subscribers, no flag) doesn't pay the
 * SHA-256 cost. Sized fields (`sizeBytes`) and outcome fields
 * (`truncated`) are present only when meaningful for the intent.
 *
 * The literal `kind` field discriminates this against
 * `FsDeniedAuditPayload` so SDK consumers can `switch` over a
 * `FsAccessAuditPayload | FsDeniedAuditPayload` union and have
 * the type narrow inside each branch — the `BridgeEvent.type`
 * envelope alone doesn't propagate type information into
 * `event.data: unknown`.
 */
export interface FsAccessAuditPayload {
    kind: typeof FS_ACCESS_EVENT_TYPE;
    intent: Intent;
    route: string;
    pathHash: string;
    /**
     * ACP session id from `AuditContext.sessionId`, when known.
     * Multi-session daemons need this to correlate audit events
     * back to the session that triggered them — `originatorClientId`
     * alone identifies the *client*, not the *session*. Always
     * present when the calling route is session-scoped (PR 19/20
     * routes that take `:sessionId`); absent on workspace-scoped
     * routes that have no session context.
     */
    sessionId?: string;
    /** Workspace-relative path; only populated when QWEN_AUDIT_RAW_PATHS=1. */
    relPath?: string;
    sizeBytes?: number;
    truncated?: boolean;
    matchedIgnore?: 'file' | 'directory';
    durationMs: number;
    /**
     * Literal glob pattern. Populated only for `intent === 'glob'`,
     * where `pathHash` would otherwise hash the bound workspace and
     * provide no per-call information. The pattern is recorded
     * verbatim (not hashed) because it does not carry path content
     * — the per-hit canonical paths are NOT logged here. Audit
     * consumers correlate the workspace via `pathHash` and the
     * specific call via `pattern`.
     */
    pattern?: string;
}
export interface FsDeniedAuditPayload {
    kind: typeof FS_DENIED_EVENT_TYPE;
    intent: Intent;
    route: string;
    pathHash: string;
    /** See `FsAccessAuditPayload.sessionId` — same semantics. */
    sessionId?: string;
    relPath?: string;
    errorKind: FsErrorKind;
    hint?: string;
    /**
     * Human-readable error message from the underlying `FsError`.
     * Audit consumers debugging a production incident need to see
     * the actual OS error (e.g. errno detail, byte counts) rather
     * than only `errorKind` + `hint`. Optional so privacy-sensitive
     * deployments can suppress it; populated by default by
     * `recordDenied` since the orchestrator already wraps every body
     * error into an `FsError` whose message we can quote.
     */
    message?: string;
    /** See `FsAccessAuditPayload.pattern` — same semantics. */
    pattern?: string;
}
/**
 * Boundary-side audit publisher. The orchestrator (commit 6) will
 * call `recordAccess` on success and `recordDenied` on `FsError`,
 * passing the resolved path so this module can normalize, hash,
 * and (optionally) attach the relative form.
 */
export interface AuditPublisher {
    recordAccess(ctx: AuditContext, record: Omit<FsAccessAuditPayload, 'kind' | 'pathHash' | 'relPath' | 'route'> & {
        absolute: ResolvedPath | string;
    }): void;
    recordDenied(ctx: AuditContext, record: Omit<FsDeniedAuditPayload, 'kind' | 'pathHash' | 'relPath' | 'route'> & {
        /** Raw user input; the canonical form may not exist on disk. */
        input: string;
    }): void;
}
export interface CreateAuditPublisherDeps {
    /** Bridge-bound publisher into `EventBus.publish`. */
    emit: (event: BridgeEvent) => void;
    /** Canonical workspace root, for relPath computation. */
    boundWorkspace: string;
    /** Optional override for tests / privacy modes. */
    includeRawPaths?: boolean;
}
/**
 * Build an `AuditPublisher` whose emit method publishes typed
 * `BridgeEvent`s onto the daemon's per-session NDJSON stream. The
 * publisher takes care of:
 *
 * - hashing the path (always)
 * - computing relative path (only when `includeRawPaths` is on)
 * - synthesizing the `BridgeEvent.type` discriminator
 * - forwarding `originatorClientId` so the SSE fan-out can suppress
 *   self-echoes
 *
 * Publishers are cheap to construct and intended to live on a
 * `WorkspaceFileSystemFactory` for the daemon's process lifetime.
 */
export declare function createAuditPublisher(deps: CreateAuditPublisherDeps): AuditPublisher;
