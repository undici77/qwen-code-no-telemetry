/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { AutoMemoryType } from './types.js';
export interface AutoMemoryForgetMatch {
    topic: AutoMemoryType;
    summary: string;
    filePath: string;
}
export interface AutoMemoryForgetResult {
    query: string;
    removedEntries: AutoMemoryForgetMatch[];
    touchedTopics: AutoMemoryType[];
    systemMessage?: string;
}
export interface AutoMemoryForgetSelectionResult {
    matches: AutoMemoryForgetMatch[];
    strategy: 'none' | 'heuristic' | 'model';
    reasoning?: string;
}
export declare function selectManagedAutoMemoryForgetCandidates(projectRoot: string, query: string, options?: {
    config?: Config;
    limit?: number;
}): Promise<AutoMemoryForgetSelectionResult>;
export declare function forgetManagedAutoMemoryMatches(projectRoot: string, matches: AutoMemoryForgetMatch[], now?: Date): Promise<AutoMemoryForgetResult>;
export declare function forgetManagedAutoMemoryEntries(projectRoot: string, query: string, options?: {
    config?: Config;
}, now?: Date): Promise<AutoMemoryForgetResult>;
