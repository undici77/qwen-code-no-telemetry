/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonAuth(options?: DaemonResourceOptions): {
    status: import("@qwen-code/sdk").DaemonAuthStatusSnapshot | undefined;
    providers: import("@qwen-code/sdk/daemon").DaemonAuthProviderStatus[];
    pendingDeviceFlows: {
        deviceFlowId: string;
        providerId: import("@qwen-code/sdk").DaemonAuthProviderId;
        expiresAt: number;
    }[];
    startDeviceFlow: (providerId: import("@qwen-code/sdk").DaemonAuthProviderId) => Promise<import("@qwen-code/sdk").DaemonDeviceFlowStartResult>;
    getDeviceFlow: (deviceFlowId: string, opts?: {
        signal?: AbortSignal;
    }) => Promise<import("@qwen-code/sdk").DaemonDeviceFlowState>;
    cancelDeviceFlow: (deviceFlowId: string) => Promise<void>;
    reload: () => Promise<import("@qwen-code/sdk").DaemonAuthStatusSnapshot | undefined>;
    data: import("@qwen-code/sdk").DaemonAuthStatusSnapshot | undefined;
    loading: boolean;
    error: Error | undefined;
};
