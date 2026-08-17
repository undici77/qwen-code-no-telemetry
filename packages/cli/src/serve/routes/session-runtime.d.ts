/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Response } from 'express';
import type { DaemonLogger } from '../daemon-logger.js';
import type {
  WorkspaceRegistry,
  WorkspaceRuntime,
} from '../workspace-registry.js';
export declare function requirePrimarySessionRuntime(
  workspaceRegistry: WorkspaceRegistry,
  res: Response,
): WorkspaceRuntime | undefined;
export declare function requireSessionRuntime(opts: {
  sessionId: string;
  route: string;
  res: Response;
  workspaceRegistry: WorkspaceRegistry;
  daemonLog?: DaemonLogger;
  details?: Record<string, unknown>;
}): WorkspaceRuntime | undefined;
