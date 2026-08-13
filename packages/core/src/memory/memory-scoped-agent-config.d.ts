/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
export interface MemoryScopedAgentConfigOptions {
    allowShell?: boolean;
    bypassBaseAskForScopedPaths?: boolean;
    includeUserMemory?: boolean;
    protectPinnedMemory?: boolean;
    restrictReadsToMemoryPaths?: boolean;
}
export declare function isAllowedMemoryPath(filePath: string | undefined, projectRoot: string, options?: Pick<MemoryScopedAgentConfigOptions, 'includeUserMemory'>): boolean;
export declare function createMemoryScopedAgentConfig(config: Config, projectRoot: string, options?: MemoryScopedAgentConfigOptions): Config;
