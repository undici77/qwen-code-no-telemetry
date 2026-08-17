/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import type { SendBridgeError } from '../server/error-response.js';
import type { DaemonWorkspaceService } from '../workspace-service/index.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface RegisterWorkspaceMcpControlRoutesDeps {
  boundWorkspace: string;
  bridge: AcpSessionBridge;
  workspace: DaemonWorkspaceService;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  sendBridgeError: SendBridgeError;
  parseAndValidateClientId: (
    req: Request,
    res: Response,
  ) => string | undefined | null;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
export declare function registerWorkspaceMcpControlRoutes(
  app: Application,
  deps: RegisterWorkspaceMcpControlRoutesDeps,
): void;
export declare function registerWorkspaceQualifiedMcpControlRoutes(
  app: Application,
  deps: Pick<
    RegisterWorkspaceMcpControlRoutesDeps,
    'mutate' | 'safeBody' | 'sendBridgeError'
  > & {
    workspaceRegistry: WorkspaceRegistry;
  },
): void;
export {};
