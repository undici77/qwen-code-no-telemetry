/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import { type WorkspaceFileSystemFactory } from '../fs/index.js';
import {
  type SetupGithubFileOps,
  type SetupGithubResult,
} from '../../services/setup-github.js';
interface RegisterDeps {
  boundWorkspace: string;
  bridge: AcpSessionBridge;
  env: Readonly<NodeJS.ProcessEnv>;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  parseClientId: (req: Request, res: Response) => string | undefined | null;
  safeBody: (req: Request) => Record<string, unknown>;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
export declare function registerWorkspaceSetupGithubRoutes(
  app: Application,
  deps: RegisterDeps,
): void;
export declare function createSetupGithubFileOps(
  factory: WorkspaceFileSystemFactory,
  route: string,
  originatorClientId: string | undefined,
  assertGenerationOpen?: () => void,
): SetupGithubFileOps & {
  assertCanWrite(): void;
};
export declare function sanitizeSetupGithubMessage(
  message: string,
  boundWorkspace: string,
): string;
export declare function sanitizeSetupGithubResult(
  result: SetupGithubResult,
  boundWorkspace: string,
): SetupGithubResult;
export declare function setupGithubEventData(
  result: SetupGithubResult,
): Record<string, unknown>;
export declare function resolveSetupGithubProxy(
  boundWorkspace: string,
  env: Readonly<NodeJS.ProcessEnv>,
  workspaceTrusted?: boolean,
): string | undefined;
export {};
