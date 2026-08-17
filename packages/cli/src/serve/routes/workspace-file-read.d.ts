/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, Response } from 'express';
import type { WorkspaceRegistry } from '../workspace-registry.js';
/**
 * Hard cap on entries returned from `GET /list`. The boundary probes
 * with `MAX_LIST_ENTRIES + 1` and stops collecting once it knows the
 * response is truncated, avoiding full materialization of very large
 * directories. 2000 is generous for legitimate listings while staying
 * well under the 10MB request limit when each entry serializes to ~80
 * bytes.
 *
 * Ties into the response's `truncated: true` flag so SDK consumers
 * can ask the daemon to paginate (PR 19 emits the flag; pagination
 * itself is a future PR — this PR's job is to advertise the
 * truncation so the SDK doesn't quietly assume the full set).
 */
export declare const MAX_LIST_ENTRIES = 2000;
/**
 * Hard cap for `GET /file?limit=` line-window reads. Kept separate
 * from `MAX_LIST_ENTRIES` so directory listing pagination changes do
 * not accidentally alter file line slicing semantics.
 */
export declare const MAX_FILE_LINE_LIMIT = 2000;
/** Default byte window for `GET /file/bytes` when `maxBytes` is omitted. */
export declare const DEFAULT_FILE_BYTES_MAX_BYTES: number;
/**
 * Default cap when the caller omits `?maxResults` on `GET /glob`.
 * Mirrors the orchestrator's default behavior (no cap) clipped to a
 * concrete number so route consumers see consistent ceilings without
 * needing to know the orchestrator's defaults.
 */
export declare const DEFAULT_GLOB_MAX_RESULTS = 5000;
/**
 * Hard upper bound for caller-supplied `?maxResults` on `GET /glob`.
 * Anything above this rejects with `parse_error` rather than
 * silently capping; a caller asking for 1M results almost
 * certainly meant to stream.
 */
export declare const MAX_GLOB_MAX_RESULTS = 50000;
/**
 * Privacy + correctness headers shared by every read route. The
 * `no-store` directive blocks intermediaries (browser caches,
 * forwarding proxies in development) from snapshotting workspace
 * file contents — even on a localhost daemon, a misconfigured CDN
 * or a developer browser extension that mirrors XHR responses to
 * disk would otherwise persist source contents past the request
 * lifetime. `nosniff` blocks MIME-sniffing fallbacks that would let
 * a UTF-8 source file render as HTML in a browser that loaded it
 * directly. Both are harmless on the SDK / curl path and
 * mandatory for any browser-adjacent client.
 */
export declare function applyReadHeaders(res: Response): void;
/**
 * Common error envelope. Mirrors `sendBridgeError` in
 * `serve/server.ts` so SDK consumers see one shape across daemon
 * routes. `FsError` carries its own `status` from
 * `DEFAULT_STATUS_BY_KIND` (`fs/errors.ts`), so the route doesn't
 * re-derive it — that keeps the kind→status mapping authoritative
 * in a single place. Non-`FsError` paths log to stderr and 500;
 * the route's own try-catch should already have wrapped expected
 * boundary errors via `wrapAsFsError`.
 */
export declare function sendFsError(
  res: Response,
  err: unknown,
  route: string,
): void;
interface RegisterDeps {
  /**
   * Pulls the daemon-stamped client identity off the request. Re-used
   * from `serve/server.ts` so the X-Qwen-Client-Id validation lives
   * in one place; PR 19 routes thread the trusted id into the audit
   * context. Returning `null` means the helper already sent a 400
   * — the route must short-circuit.
   */
  parseClientId: (req: Request, res: Response) => string | undefined | null;
}
/**
 * Compute the workspace-relative form of a `ResolvedPath` for the
 * response payload. Missing `boundWorkspace` means the app was
 * misconfigured; never fall back to returning absolute filesystem
 * paths to clients.
 *
 * Always emits POSIX-style separators so SDK consumers see the same
 * shape regardless of the daemon's platform — `path.relative` on
 * Windows yields backslashes, which would otherwise leak into
 * `/file`, `/stat`, `/list`, and `/glob` response paths.
 */
export declare function workspaceRelative(
  req: Request,
  resolved: string,
): string;
export declare function registerWorkspaceFileReadRoutes(
  app: Application,
  deps: RegisterDeps,
): void;
export declare function registerWorkspaceQualifiedFileReadRoutes(
  app: Application,
  deps: RegisterDeps & {
    workspaceRegistry: WorkspaceRegistry;
  },
): void;
export {};
