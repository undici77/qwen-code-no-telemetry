/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { SendBridgeError } from '../server/error-response.js';
import type { DaemonWorkspaceService } from '../workspace-service/index.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface RegisterWorkspaceToolsRoutesDeps {
  boundWorkspace: string;
  workspace: DaemonWorkspaceService;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  sendBridgeError: SendBridgeError;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
  parseAndValidateClientId: (
    req: Request,
    res: Response,
  ) => string | undefined | null;
}
export declare function registerWorkspaceToolsRoutes(
  app: Application,
  deps: RegisterWorkspaceToolsRoutesDeps,
): void;
export declare function registerWorkspaceQualifiedToolsRoutes(
  app: Application,
  deps: Pick<
    RegisterWorkspaceToolsRoutesDeps,
    'mutate' | 'safeBody' | 'sendBridgeError'
  > & {
    workspaceRegistry: WorkspaceRegistry;
  },
): void;
export {};
