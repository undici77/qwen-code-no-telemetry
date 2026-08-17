/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ServeWorkspaceSkillsStatus } from '@qwen-code/acp-bridge/status';
export interface WorkspaceSkillsStatusProvider {
  (workspaceCwd: string): Promise<ServeWorkspaceSkillsStatus>;
  invalidate?(workspaceCwd: string): void;
}
export interface WorkspaceSkillsStatusProviderOptions {
  workspaceTrusted?: boolean;
}
export declare function createWorkspaceSkillsStatusProvider(
  options?: WorkspaceSkillsStatusProviderOptions,
): WorkspaceSkillsStatusProvider;
