/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonMemory(options?: DaemonResourceOptions): {
    status: import("@qwen-code/sdk/daemon").DaemonWorkspaceMemoryStatus | undefined;
    files: import("@qwen-code/sdk/daemon").DaemonWorkspaceMemoryFile[];
    readFile: (filePath: string) => Promise<import("@qwen-code/sdk").DaemonWorkspaceFile>;
    writeMemory: (req: import("@qwen-code/sdk/daemon").DaemonWriteMemoryRequest) => Promise<import("@qwen-code/sdk/daemon").DaemonWriteMemoryResult>;
    reload: () => Promise<import("@qwen-code/sdk/daemon").DaemonWorkspaceMemoryStatus | undefined>;
    data: import("@qwen-code/sdk/daemon").DaemonWorkspaceMemoryStatus | undefined;
    loading: boolean;
    error: Error | undefined;
};
