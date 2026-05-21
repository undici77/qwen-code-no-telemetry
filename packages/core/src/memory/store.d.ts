/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AUTO_MEMORY_INDEX_FILENAME } from './paths.js';
import { type AutoMemoryExtractCursor, type AutoMemoryMetadata } from './types.js';
export declare function createDefaultAutoMemoryMetadata(now?: Date): AutoMemoryMetadata;
export declare function createDefaultAutoMemoryExtractCursor(now?: Date): AutoMemoryExtractCursor;
export declare function createDefaultAutoMemoryIndex(): string;
export declare function ensureAutoMemoryScaffold(projectRoot: string, now?: Date): Promise<void>;
export declare function readAutoMemoryIndex(projectRoot: string): Promise<string | null>;
export { AUTO_MEMORY_INDEX_FILENAME };
