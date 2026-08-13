/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
export type ExtensionRuntimeRefreshConfig = Pick<Config, 'getSettingsMcpServers' | 'reinitializeMcpServers' | 'getSkillManager' | 'getSubagentManager' | 'getHookSystem' | 'refreshHierarchicalMemory'> & {
    reinitializeLsp?: Config['reinitializeLsp'];
};
export declare function refreshExtensionRuntime(config: ExtensionRuntimeRefreshConfig | undefined): Promise<void>;
