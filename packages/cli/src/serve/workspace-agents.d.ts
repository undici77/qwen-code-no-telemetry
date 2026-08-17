/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import {
  SubagentManager,
  type SubagentConfig,
} from '@qwen-code/qwen-code-core';
import {
  InvalidClientIdError,
  type AcpSessionBridge,
} from './acp-session-bridge.js';
import type { WorkspaceRegistry } from './workspace-registry.js';
import {
  type ServeWorkspaceAgentDetail,
  type ServeWorkspaceAgentSummary,
} from '@qwen-code/acp-bridge/status';
/**
 * Workspace subagent CRUD routes.
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
 * implements only `getSdkMode / getProjectRoot / getActiveExtensions /
 * isSafeMode / getAgentsSettings` — the methods the manager's CRUD paths
 * actually touch. A `Proxy` makes any future use of an unimplemented method
 * throw immediately so a silent dependency creep can't ship as a 500.
 */
export interface WorkspaceAgentsRouteDeps {
  bridge: AcpSessionBridge;
  boundWorkspace: string;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  parseClientId: (req: Request, res: Response) => string | undefined | null;
  safeBody: (req: Request) => Record<string, unknown>;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
export interface WorkspaceQualifiedAgentsRouteDeps {
  workspaceRegistry: WorkspaceRegistry;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  parseClientId: (req: Request, res: Response) => string | undefined | null;
  safeBody: (req: Request) => Record<string, unknown>;
}
export declare function mountWorkspaceAgentsRoutes(
  app: Application,
  deps: WorkspaceAgentsRouteDeps,
): void;
export declare function mountWorkspaceQualifiedAgentsRoutes(
  app: Application,
  deps: WorkspaceQualifiedAgentsRouteDeps,
): void;
export declare function toSummary(
  config: SubagentConfig,
): ServeWorkspaceAgentSummary;
export declare function toDetail(
  config: SubagentConfig,
): ServeWorkspaceAgentDetail;
/**
 * Build a CRUD-scoped `SubagentManager` for the daemon. The
 * underlying manager only touches five `Config` methods on its
 * read/write paths (`getSdkMode`, `getProjectRoot`,
 * `getActiveExtensions`, `isSafeMode`, `getAgentsSettings`); a `Proxy` makes
 * any future expansion of that surface throw immediately rather than silently
 * produce incorrect data. The CRUD catalog has no session settings context,
 * so built-in agents use their registry defaults here.
 */
export declare function createDaemonSubagentManager(
  boundWorkspace: string,
  safeMode?: boolean,
): SubagentManager;
export { InvalidClientIdError };
