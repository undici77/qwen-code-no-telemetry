/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonSettings(options?: DaemonResourceOptions): {
  status:
    | import('@qwen-code/sdk/daemon').DaemonWorkspaceSettingsStatus
    | undefined;
  settings: import('@qwen-code/sdk/daemon').DaemonSettingDescriptor[];
  setValue: (
    scope: 'workspace' | 'user',
    key: string,
    value: unknown,
    options?: {
      mcpServerMutation?: {
        operation: 'set' | 'remove';
        name: string;
      };
    },
  ) => Promise<import('@qwen-code/sdk/daemon').DaemonSettingUpdateResult>;
  reload: () => Promise<
    import('@qwen-code/sdk/daemon').DaemonWorkspaceSettingsStatus | undefined
  >;
  data:
    | import('@qwen-code/sdk/daemon').DaemonWorkspaceSettingsStatus
    | undefined;
  loading: boolean;
  error: Error | undefined;
};
