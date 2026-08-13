/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonChannelStartupRequest, DaemonChannelUpsertRequest, DaemonRevisionRequest } from '@qwen-code/sdk/daemon';
import type { DaemonChannelsResource, DaemonResourceOptions } from '../types.js';
interface WorkspaceChannelsResource extends DaemonChannelsResource {
    workspaceCwd: string;
}
export declare function useDaemonChannels(options?: DaemonResourceOptions): {
    data: {
        catalog: import("@qwen-code/sdk/daemon").DaemonChannelTypeCatalog;
        snapshot: import("@qwen-code/sdk/daemon").DaemonChannelsSnapshot;
    } | undefined;
    loading: boolean;
    error: Error | undefined;
    reload: () => Promise<WorkspaceChannelsResource | undefined>;
    catalog: import("@qwen-code/sdk/daemon").DaemonChannelTypeCatalog;
    snapshot: import("@qwen-code/sdk/daemon").DaemonChannelsSnapshot | undefined;
    channels: Record<string, import("@qwen-code/sdk/daemon").DaemonChannelInstanceSnapshot>;
    createOrUpdate: (name: string, request: DaemonChannelUpsertRequest) => Promise<import("@qwen-code/sdk/daemon").DaemonChannelMutationResult>;
    remove: (name: string, request: DaemonRevisionRequest) => Promise<import("@qwen-code/sdk/daemon").DaemonChannelMutationResult>;
    setStartup: (name: string, request: DaemonChannelStartupRequest) => Promise<import("@qwen-code/sdk/daemon").DaemonChannelMutationResult>;
    start: (name: string) => Promise<import("@qwen-code/sdk/daemon").DaemonChannelMutationResult>;
    stop: (name: string) => Promise<import("@qwen-code/sdk/daemon").DaemonChannelMutationResult>;
    restart: (name: string) => Promise<import("@qwen-code/sdk/daemon").DaemonChannelMutationResult>;
    pairing: import("../types.js").DaemonChannelPairingActions;
};
export {};
