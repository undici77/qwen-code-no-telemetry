/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Request, Response } from 'express';
import type {
  WorkspaceEntry,
  WorkspaceRegistry,
  WorkspaceRuntime,
} from './workspace-registry.js';
export interface WorkspaceRouteContext {
  readonly runtime: WorkspaceRuntime;
  readonly routePrefix: string;
}
export declare function resolveWorkspaceEntryFromParam(
  registry: WorkspaceRegistry,
  req: Request,
  res: Response,
  paramName?: string,
): WorkspaceEntry | null;
export declare function isPortableAbsolutePath(value: string): boolean;
export declare function resolveRegisteredWorkspaceRuntimeByPathSelector(
  registry: WorkspaceRegistry,
  selector: string,
): WorkspaceRuntime | undefined;
export declare function resolveManagedWorkspaceRuntimeByPathSelector(
  registry: WorkspaceRegistry,
  selector: string,
): WorkspaceRuntime | undefined;
export declare function resolveWorkspaceRuntimeFromParam(
  registry: WorkspaceRegistry,
  req: Request,
  res: Response,
  paramName?: string,
): WorkspaceRuntime | null;
export declare function sendWorkspaceRuntimeUnavailable(
  res: Response,
  entry?: Pick<WorkspaceEntry, 'workspaceCwd' | 'workspaceId'>,
): void;
export declare function isGenerationClosedError(error: unknown): boolean;
export declare function sendGenerationClosedError(
  res: Response,
  error: unknown,
): boolean;
export declare function resolveManagedWorkspaceRuntimeFromParam(
  registry: WorkspaceRegistry,
  req: Request,
  res: Response,
  paramName?: string,
): WorkspaceRuntime | null;
export declare function requireTrustedWorkspaceRuntime(
  runtime: WorkspaceRuntime,
  res: Response,
): boolean;
export declare function sendUntrustedWorkspaceResponse(
  res: Response,
  extra?: {
    sessionId?: string;
    workspaceCwd?: string;
    workspaceId?: string;
  },
): void;
export declare function getWorkspaceRouteContext(
  req: Request,
): WorkspaceRouteContext | undefined;
export declare function setWorkspaceRouteContext(
  req: Request,
  context: WorkspaceRouteContext,
): void;
export declare function sendWorkspaceMismatch(
  res: Response,
  registry: WorkspaceRegistry,
): void;
/**
 * Resolve an optional `?cwd=` query parameter to a path contained within the
 * workspace root. Returns the workspace root itself when the parameter is
 * absent, unresolvable, or escapes the workspace boundary.
 */
export declare function resolveContainedCwd(
  req: Request,
  workspaceCwd: string,
): string;
/**
 * Strict variant of {@link resolveContainedCwd} for mutation routes. Returns
 * `null` when a supplied `?cwd=` is invalid, inaccessible, or escapes the
 * workspace boundary, so the caller can reject the request instead of
 * silently operating on the workspace root.
 */
export declare function resolveContainedCwdOrFail(
  req: Request,
  workspaceCwd: string,
): string | null;
