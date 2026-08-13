/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { AutoMemoryType } from './types.js';
export interface AutoMemoryExtractionExecutionResult {
    touchedTopics: AutoMemoryType[];
    /** True when at least one file inside the project-level memory root was written/edited. */
    touchedProjectScope: boolean;
    /** True when at least one file inside the user-level memory root was written/edited. */
    touchedUserScope: boolean;
    systemMessage?: string;
    hasToolActivity: boolean;
}
export declare function runAutoMemoryExtractionByAgent(config: Config, projectRoot: string): Promise<AutoMemoryExtractionExecutionResult>;
