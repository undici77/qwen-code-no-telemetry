/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, RequestHandler } from 'express';
import type { SendBridgeError } from '../server/error-response.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
export declare function registerWorkspaceGitBranchRoutes(
  app: Application,
  deps: {
    boundWorkspace: string;
    sendBridgeError: SendBridgeError;
    isWorkspaceTrusted?: () => boolean;
    captureGenerationAssertion?: () => (() => void) | undefined;
    mutate: (opts?: { strict?: boolean }) => RequestHandler;
  },
): void;
export declare function registerWorkspaceQualifiedGitBranchRoutes(
  app: Application,
  deps: {
    workspaceRegistry: WorkspaceRegistry;
    sendBridgeError: SendBridgeError;
    mutate: (opts?: { strict?: boolean }) => RequestHandler;
  },
): void;
