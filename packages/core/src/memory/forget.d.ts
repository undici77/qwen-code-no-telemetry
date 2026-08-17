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
  entryIndex?: number;
}
export interface AutoMemoryForgetResult {
  query: string;
  removedEntries: AutoMemoryForgetMatch[];
  touchedTopics: AutoMemoryType[];
  touchedScopes: AutoMemoryStorageScope[];
  systemMessage?: string;
}
export interface AutoMemoryForgetSelectionResult {
  matches: AutoMemoryForgetMatch[];
  strategy: 'none' | 'heuristic' | 'model';
  reasoning?: string;
}
export type AutoMemoryStorageScope = 'user' | 'project';
export declare function selectManagedAutoMemoryForgetCandidates(
  projectRoot: string,
  query: string,
  options?: {
    config?: Config;
    limit?: number;
    abortSignal?: AbortSignal;
  },
): Promise<AutoMemoryForgetSelectionResult>;
export declare function forgetManagedAutoMemoryMatches(
  projectRoot: string,
  matches: AutoMemoryForgetMatch[],
  now?: Date,
  options?: {
    abortSignal?: AbortSignal;
  },
): Promise<AutoMemoryForgetResult>;
export declare function forgetManagedAutoMemoryEntries(
  projectRoot: string,
  query: string,
  options?: {
    config?: Config;
    abortSignal?: AbortSignal;
  },
  now?: Date,
): Promise<AutoMemoryForgetResult>;
