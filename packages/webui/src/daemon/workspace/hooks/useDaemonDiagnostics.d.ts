/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonDiagnostics(options?: DaemonResourceOptions): {
    env: import("../types.js").ResourceResult<import("@qwen-code/sdk").DaemonWorkspaceEnvStatus>;
    preflight: import("../types.js").ResourceResult<import("@qwen-code/sdk").DaemonWorkspacePreflightStatus>;
};
