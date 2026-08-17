/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonSkills(options?: DaemonResourceOptions): {
  status: import('@qwen-code/sdk').DaemonWorkspaceSkillsStatus | undefined;
  skills: import('@qwen-code/sdk').DaemonWorkspaceSkillStatus[];
  setEnabled: (
    skillName: string,
    enabled: boolean,
  ) => Promise<import('@qwen-code/sdk').DaemonSkillToggleResult>;
  install: (
    request: import('@qwen-code/sdk').DaemonSkillInstallRequest,
  ) => Promise<import('@qwen-code/sdk').DaemonSkillMutationResult>;
  remove: (
    skillName: string,
    scope: import('@qwen-code/sdk').DaemonSkillScope,
  ) => Promise<import('@qwen-code/sdk').DaemonSkillMutationResult>;
  reload: () => Promise<
    import('@qwen-code/sdk').DaemonWorkspaceSkillsStatus | undefined
  >;
  data: import('@qwen-code/sdk').DaemonWorkspaceSkillsStatus | undefined;
  loading: boolean;
  error: Error | undefined;
};
