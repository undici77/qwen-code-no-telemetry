/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonMcp(options?: DaemonResourceOptions): {
    status: import("@qwen-code/sdk").DaemonWorkspaceMcpStatus | undefined;
    initialize: () => Promise<import("@qwen-code/sdk").DaemonWorkspaceMcpInitializeResult>;
    reloadConfig: () => Promise<import("@qwen-code/sdk").DaemonWorkspaceMcpInitializeResult>;
    loadTools: (serverName: string) => Promise<import("@qwen-code/sdk/daemon").DaemonWorkspaceMcpToolsStatus>;
    loadResources: (serverName: string) => Promise<import("@qwen-code/sdk/daemon").DaemonWorkspaceMcpResourcesStatus>;
    restartServer: (serverName: string) => Promise<import("@qwen-code/sdk").DaemonMcpRestartResult>;
    manageServer: (serverName: string, action: import("@qwen-code/sdk/daemon").DaemonMcpManageAction) => Promise<import("@qwen-code/sdk/daemon").DaemonMcpManageResult>;
    addServer: (request: import("@qwen-code/sdk").DaemonRuntimeMcpAddRequest) => Promise<import("@qwen-code/sdk").DaemonRuntimeMcpAddResult>;
    removeServer: (name: string) => Promise<import("@qwen-code/sdk").DaemonRuntimeMcpRemoveResult>;
    reload: () => Promise<import("@qwen-code/sdk").DaemonWorkspaceMcpStatus | undefined>;
    data: import("@qwen-code/sdk").DaemonWorkspaceMcpStatus | undefined;
    loading: boolean;
    error: Error | undefined;
};
