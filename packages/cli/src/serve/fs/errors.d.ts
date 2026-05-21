/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Discriminator for filesystem-boundary errors raised by the
 * `WorkspaceFileSystem` layer (#4175 PR 18).
 *
 * The values are also serialized verbatim onto the wire by PR 19/20
 * route handlers as the `errorKind` field of the planned PR 13
 * envelope `{ kind, status, error, errorKind, hint }`. Keeping the
 * union closed and stable lets SDK consumers exhaustively switch
 * over the kinds without falling through to a generic 5xx path.
 */
export type FsErrorKind = 'path_outside_workspace' | 'symlink_escape' | 'path_not_found' | 'binary_file' | 'file_too_large' | 'hash_mismatch' | 'file_already_exists' | 'text_not_found' | 'ambiguous_text_match' | 'untrusted_workspace' | 'permission_denied'
/**
 * Environmental I/O failure that is *not* a permission decision —
 * disk full (`ENOSPC`), generic I/O error (`EIO`), filesystem busy
 * (`EBUSY`/`ETXTBSY`), path-too-long (`ENAMETOOLONG`), or
 * file-descriptor exhaustion (`EMFILE`/`ENFILE`).
 *
 * Separated from `permission_denied` because monitoring pipelines
 * key on `errorKind` for alerting — conflating "ACL denied" with
 * "disk full" pages the security oncall when the real action is
 * `df -h`. The 503 status communicates "service-level transient
 * failure" to PR 19/20 route handlers and SDK consumers.
 */
 | 'io_error'
/**
 * Catch-all for non-errno errors that reach the boundary
 * (`TypeError`, programmer-error throws, native module
 * exceptions, etc.). Distinguished from `permission_denied`
 * because monitoring pipelines key on `errorKind` for
 * security alerting — conflating "code bug" with "ACL
 * denied" pages security oncall for what should be a
 * developer ticket. The 500 status communicates "daemon
 * internal fault" to PR 19/20 route handlers.
 */
 | 'internal_error' | 'parse_error';
/**
 * HTTP status codes the boundary maps onto. The status lives on the
 * error itself rather than being derived by the route handler so the
 * serialization is "one helper line" — see PR 19/20 plans. The set is
 * intentionally narrow: anything outside this map indicates the
 * boundary is being asked to model a transport-level concern that
 * doesn't belong here (5xx, 401/403 from auth, etc.).
 */
export type FsErrorStatus = 400 | 403 | 404 | 409 | 413 | 422 | 500 | 503;
/**
 * Typed boundary error. PR 18 ships the class only — no route
 * serializes it yet. PR 19/20 add a `sendFsError(res, err)` helper
 * that maps `kind`/`status`/`hint` onto the envelope.
 *
 * Why a class rather than a plain object: `instanceof FsError`
 * gives the orchestrator a single catch-clause to convert thrown
 * boundary errors into `fs.denied` audit events without also
 * eating unrelated runtime errors (`TypeError`, `ENOENT` from a
 * lower-level `fs.promises` call that escaped categorization, etc.).
 */
export declare class FsError extends Error {
    readonly kind: FsErrorKind;
    readonly status: FsErrorStatus;
    readonly hint?: string;
    constructor(kind: FsErrorKind, message: string, options?: {
        hint?: string;
        status?: FsErrorStatus;
        cause?: unknown;
    });
}
/**
 * Type guard for catch sites that need to distinguish boundary
 * errors from generic `Error` instances.
 */
export declare function isFsError(err: unknown): err is FsError;
/**
 * Coerce an arbitrary thrown value into an `FsError`. Used by the
 * orchestrator's catch blocks so every body-level failure surfaces
 * as a typed error AND emits an `fs.denied` audit event — without
 * this, raw `fs.promises` errnos (`EACCES`, `ENOENT`, `ELOOP`, …)
 * propagate uncategorized, the audit log loses denial visibility,
 * and PR 19/20 routes degrade to opaque 5xx responses.
 *
 * Already-typed `FsError`s pass through unchanged so callers can
 * safely chain this on every catch.
 */
export declare function wrapAsFsError(err: unknown, fallbackKind?: FsErrorKind): FsError;
