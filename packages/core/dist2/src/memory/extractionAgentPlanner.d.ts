/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { AutoMemoryType } from './types.js';
export interface AutoMemoryExtractionExecutionResult {
    touchedTopics: AutoMemoryType[];
    systemMessage?: string;
}
export declare function runAutoMemoryExtractionByAgent(config: Config, projectRoot: string): Promise<AutoMemoryExtractionExecutionResult>;
