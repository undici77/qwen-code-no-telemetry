/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonTools(options?: DaemonResourceOptions): {
  status:
    | import('@qwen-code/sdk/daemon').DaemonWorkspaceToolsStatus
    | undefined;
  tools: import('@qwen-code/sdk/daemon').DaemonWorkspaceToolStatus[];
  preheat: (
    timeoutMs?: number,
  ) => Promise<import('@qwen-code/sdk').DaemonWorkspaceAcpPreheatResult>;
  setEnabled: (toolName: string, enabled: boolean) => Promise<unknown>;
  reload: () => Promise<
    import('@qwen-code/sdk/daemon').DaemonWorkspaceToolsStatus | undefined
  >;
  data: import('@qwen-code/sdk/daemon').DaemonWorkspaceToolsStatus | undefined;
  loading: boolean;
  error: Error | undefined;
};
