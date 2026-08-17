/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { SendBridgeError } from '../server/error-response.js';
import type { DaemonWorkspaceService } from '../workspace-service/index.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface RegisterWorkspaceLifecycleRoutesDeps {
  boundWorkspace: string;
  workspace: DaemonWorkspaceService;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  sendBridgeError: SendBridgeError;
  invalidateServeFeaturesCache: () => void;
  parseAndValidateClientId: (
    req: Request,
    res: Response,
  ) => string | undefined | null;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
export declare function registerWorkspaceLifecycleRoutes(
  app: Application,
  deps: RegisterWorkspaceLifecycleRoutesDeps,
): void;
export declare function registerWorkspaceQualifiedLifecycleRoutes(
  app: Application,
  deps: Pick<
    RegisterWorkspaceLifecycleRoutesDeps,
    'mutate' | 'safeBody' | 'sendBridgeError' | 'invalidateServeFeaturesCache'
  > & {
    workspaceRegistry: WorkspaceRegistry;
  },
): void;
export {};
