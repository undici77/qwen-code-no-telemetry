/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DaemonClient } from '@qwen-code/sdk/daemon';
import type { DaemonWorkspaceActions } from './types.js';
export interface CreateDaemonWorkspaceActionsArgs {
  getClient: () => DaemonClient | undefined;
  getWorkspaceCwd: () => string | undefined;
  baseUrl: string;
  token?: string;
}
export declare function createDaemonWorkspaceActions({
  getClient,
  getWorkspaceCwd,
  baseUrl,
  token,
}: CreateDaemonWorkspaceActionsArgs): DaemonWorkspaceActions;
