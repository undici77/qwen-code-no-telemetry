/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type ScannedAutoMemoryDocument } from './scan.js';
export declare function selectRelevantAutoMemoryDocuments(query: string, docs: ScannedAutoMemoryDocument[], limit?: number): ScannedAutoMemoryDocument[];
export declare function buildRelevantAutoMemoryPrompt(docs: ScannedAutoMemoryDocument[]): string;
export interface ResolveRelevantAutoMemoryPromptOptions {
    config?: Config;
    excludedFilePaths?: Iterable<string>;
    limit?: number;
    recentTools?: readonly string[];
    /** When provided and aborted, suppresses logMemoryRecall telemetry for discarded results. */
    abortSignal?: AbortSignal;
}
export interface RelevantAutoMemoryPromptResult {
    prompt: string;
    selectedDocs: ScannedAutoMemoryDocument[];
    strategy: 'none' | 'heuristic' | 'model';
}
export declare function resolveRelevantAutoMemoryPromptForQuery(projectRoot: string, query: string, options?: ResolveRelevantAutoMemoryPromptOptions): Promise<RelevantAutoMemoryPromptResult>;
export declare function buildRelevantAutoMemoryPromptForQuery(projectRoot: string, query: string, options?: ResolveRelevantAutoMemoryPromptOptions): Promise<string>;
