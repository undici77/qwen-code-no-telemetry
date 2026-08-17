/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, Response } from 'express';
import type { DaemonWorkspaceService } from '../workspace-service/types.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
export interface WorkspacePermissionsRouteDeps {
  boundWorkspace: string;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
  mutate: (opts?: { strict?: boolean }) => import('express').RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  workspace: DaemonWorkspaceService;
  parseAndValidateClientId: (
    req: Request,
    res: Response,
  ) => string | undefined | null;
}
export declare function registerWorkspacePermissionsRoutes(
  app: Application,
  deps: WorkspacePermissionsRouteDeps,
): void;
export declare function registerWorkspaceQualifiedPermissionsRoutes(
  app: Application,
  deps: Pick<WorkspacePermissionsRouteDeps, 'mutate' | 'safeBody'> & {
    workspaceRegistry: WorkspaceRegistry;
  },
): void;
