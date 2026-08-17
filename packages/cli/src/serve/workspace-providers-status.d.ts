/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ServeWorkspaceProvidersStatus } from '@qwen-code/acp-bridge/status';
import type { CliGenerationConfigInputs } from '../utils/modelConfigUtils.js';
export type WorkspaceProvidersStatusProvider = (
  workspaceCwd: string,
  acpChannelLive: boolean,
) => Promise<ServeWorkspaceProvidersStatus>;
export interface WorkspaceProvidersStatusProviderOptions {
  argv?: Partial<CliGenerationConfigInputs['argv']>;
  env?: Record<string, string | undefined>;
  workspaceTrusted?: boolean;
}
export declare function createWorkspaceProvidersStatusProvider(
  options?: WorkspaceProvidersStatusProviderOptions,
): WorkspaceProvidersStatusProvider;
