/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { AcpSessionBridge } from './acp-session-bridge.js';
interface WorkspaceGenerationRouteDeps {
  bridge: AcpSessionBridge;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  parseClientId: (req: Request, res: Response) => string | undefined | null;
  safeBody: (req: Request) => Record<string, unknown>;
}
export declare function mountWorkspaceGenerationRoutes(
  app: Application,
  deps: WorkspaceGenerationRouteDeps,
): void;
export {};
