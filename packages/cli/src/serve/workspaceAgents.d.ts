/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import { SubagentManager } from '@qwen-code/qwen-code-core';
import { InvalidClientIdError, type HttpAcpBridge } from './httpAcpBridge.js';
/**
 * Issue #4175 PR 16: workspace subagent CRUD routes.
 *
 * Wraps `SubagentManager` over five HTTP routes:
 *
 *   GET    /workspace/agents             — list project + user + builtin + extension
 *   POST   /workspace/agents             — create at project or user level (409 on collision)
 *   GET    /workspace/agents/:agentType  — full detail incl. systemPrompt
 *   POST   /workspace/agents/:agentType  — update existing (404 missing, 403 read-only)
 *   DELETE /workspace/agents/:agentType  — delete (idempotent for SDK callers)
 *
 * The daemon doesn't have a full `Config` instance, so we instantiate
 * `SubagentManager` against a CRUD-scoped `Config` stub that
 * implements only `getSdkMode / getProjectRoot / getActiveExtensions`
 * — the methods the manager's CRUD paths actually touch (verified
 * against `subagent-manager.ts:365,932,954,958`). A `Proxy` makes any
 * future use of an unimplemented method throw immediately so a
 * silent dependency creep can't ship as a 500.
 */
export interface WorkspaceAgentsRouteDeps {
    bridge: HttpAcpBridge;
    boundWorkspace: string;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    parseClientId: (req: Request, res: Response) => string | undefined | null;
    safeBody: (req: Request) => Record<string, unknown>;
}
export declare function mountWorkspaceAgentsRoutes(app: Application, deps: WorkspaceAgentsRouteDeps): void;
/**
 * Build a CRUD-scoped `SubagentManager` for the daemon. The
 * underlying manager only touches three `Config` methods on its
 * read/write paths (`getSdkMode`, `getProjectRoot`,
 * `getActiveExtensions`); a `Proxy` makes any future expansion of
 * that surface throw immediately rather than silently produce
 * incorrect data.
 */
export declare function createDaemonSubagentManager(boundWorkspace: string): SubagentManager;
export { InvalidClientIdError };
