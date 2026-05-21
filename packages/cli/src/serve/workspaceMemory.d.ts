/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { HttpAcpBridge } from './httpAcpBridge.js';
/**
 * Issue #4175 PR 16: workspace memory CRUD routes.
 *
 * `GET /workspace/memory` returns the daemon's snapshot of explicit
 * `QWEN.md` / `AGENTS.md` files reachable from the bound workspace
 * plus the user's `~/.qwen/` global. Read-only; returns
 * `initialized: false` and an empty `files` list when no files exist
 * (no synthetic 500s, mirroring PR 12's read-only routes).
 *
 * `POST /workspace/memory` accepts `{ scope, content, mode }` and
 * forwards to `writeWorkspaceContextFile`. Strict mutation gate; on
 * success, fans out a `memory_changed` event onto every active
 * session's bus so adapters can refresh cached snapshots.
 *
 * Both routes are filesystem-only — neither spawns the ACP child.
 *
 * **Absolute filePath disclosure note**: success / 413 / GET-list
 * responses include absolute on-disk paths (`/work/<x>/QWEN.md`,
 * `/Users/<x>/.qwen/QWEN.md`). This is by design for a daemon
 * contract: clients pre-flight `caps.workspaceCwd` to learn the
 * bound workspace root and can compute relative paths if they
 * prefer; the global scope (`~/.qwen/QWEN.md`) is NOT under the
 * workspace root, so rewriting to a workspace-relative form would
 * lose information. The bearer-token gate + the daemon's loopback-
 * default binding already restrict who can see these paths. If a
 * future deployment shape needs path redaction (e.g. multi-tenant
 * over a shared host), it should land as a `--redact-paths`
 * deployment toggle rather than a per-route default flip — tracked
 * with PR 24's `--redact-errors` policy work, not in PR 16.
 */
export interface WorkspaceMemoryRouteDeps {
    bridge: HttpAcpBridge;
    boundWorkspace: string;
    /**
     * `mutate({ strict: true })`-style middleware factory from PR 15.
     * Passed in so `server.ts` stays the single composition root for
     * the mutation-gate decisions.
     */
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    /**
     * Pre-validated client id parser. Returns `undefined` for absent
     * headers, the parsed id for valid ones, and `null` after sending
     * its own 400 response (so the route handler must short-circuit).
     * Re-uses `parseClientIdHeader` from `server.ts`.
     */
    parseClientId: (req: Request, res: Response) => string | undefined | null;
    /** `safeBody` from `server.ts` — strips prototype-pollution keys. */
    safeBody: (req: Request) => Record<string, unknown>;
}
/** Mount the two memory routes on the supplied Express app. */
export declare function mountWorkspaceMemoryRoutes(app: Application, deps: WorkspaceMemoryRouteDeps): void;
