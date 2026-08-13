/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
/**
 * Loads the configured model providers (`GET /workspace/providers`) and reloads
 * whenever a settings change is broadcast — installing or deleting a model both
 * bump the settings version, so the model list stays in sync.
 */
export declare function useDaemonProviders(options?: DaemonResourceOptions): {
    status: import("@qwen-code/sdk").DaemonWorkspaceProvidersStatus | undefined;
    providers: import("@qwen-code/sdk").DaemonWorkspaceProviderStatus[];
    current: import("@qwen-code/sdk").DaemonWorkspaceProviderCurrent | undefined;
    reload: () => Promise<import("@qwen-code/sdk").DaemonWorkspaceProvidersStatus | undefined>;
    data: import("@qwen-code/sdk").DaemonWorkspaceProvidersStatus | undefined;
    loading: boolean;
    error: Error | undefined;
};
