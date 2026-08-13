/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Stats } from 'node:fs';
import { AUTO_MEMORY_INDEX_FILENAME } from './paths.js';
import { type AutoMemoryExtractCursor, type AutoMemoryMetadata } from './types.js';
export declare function createDefaultAutoMemoryMetadata(now?: Date): AutoMemoryMetadata;
export declare function createDefaultAutoMemoryExtractCursor(now?: Date): AutoMemoryExtractCursor;
export declare function createDefaultAutoMemoryIndex(): string;
export interface AutoMemoryIndexRead {
    content: string;
    stats: Stats;
}
export declare function ensureAutoMemoryScaffold(projectRoot: string, now?: Date): Promise<void>;
export declare function readAutoMemoryIndex(projectRoot: string): Promise<string | null>;
export declare function readAutoMemoryIndexWithStats(projectRoot: string): Promise<AutoMemoryIndexRead | null>;
/**
 * Ensure the user-level (cross-project) auto-memory dir + empty index exist.
 * Unlike the per-project scaffold, this does NOT seed meta.json or
 * extract-cursor.json — user memory has no per-project state to track.
 */
export declare function ensureUserAutoMemoryScaffold(): Promise<void>;
export declare function readUserAutoMemoryIndex(): Promise<string | null>;
export declare function readUserAutoMemoryIndexWithStats(): Promise<AutoMemoryIndexRead | null>;
export { AUTO_MEMORY_INDEX_FILENAME };
