/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AutoMemoryType } from './types.js';
export declare const AUTO_MEMORY_DIRNAME = "memory";
export declare const AUTO_MEMORY_INDEX_FILENAME = "MEMORY.md";
export declare const AUTO_MEMORY_METADATA_FILENAME = "meta.json";
export declare const AUTO_MEMORY_EXTRACT_CURSOR_FILENAME = "extract-cursor.json";
export declare const AUTO_MEMORY_CONSOLIDATION_LOCK_FILENAME = "consolidation.lock";
/**
 * Returns the base directory for all auto-memory storage.
 * Defaults to the global qwen dir (`~/.qwen` or `$QWEN_HOME`);
 * overridable via QWEN_CODE_MEMORY_BASE_DIR for tests.
 */
export declare function getMemoryBaseDir(): string;
export declare function getAutoMemoryRoot(projectRoot: string): string;
/** Clear the memoization cache (for tests that change environment or git layout). */
export declare function clearAutoMemoryRootCache(): void;
/**
 * Returns the project-level state directory that holds auxiliary files
 * (meta.json, extract-cursor.json, consolidation.lock) for the given project.
 * This is the parent of getAutoMemoryRoot(), so memory/ stays clean:
 * only MEMORY.md and topic files live inside it.
 */
export declare function getAutoMemoryProjectStateDir(projectRoot: string): string;
/**
 * Returns true if the given absolute path is inside the auto-memory root for
 * the given project.
 *
 * Uses path.relative() instead of startsWith() to correctly handle
 * platform path-separator differences (e.g. Windows backslash vs forward
 * slash) and to be resilient against path-traversal edge cases.
 */
export declare function isAutoMemPath(absolutePath: string, projectRoot: string): boolean;
export declare function getAutoMemoryIndexPath(projectRoot: string): string;
export declare function getAutoMemoryMetadataPath(projectRoot: string): string;
export declare function getAutoMemoryExtractCursorPath(projectRoot: string): string;
export declare function getAutoMemoryConsolidationLockPath(projectRoot: string): string;
export declare function getAutoMemoryTopicFilename(type: AutoMemoryType): string;
export declare function getAutoMemoryTopicPath(projectRoot: string, type: AutoMemoryType): string;
export declare function getAutoMemoryFilePath(projectRoot: string, relativePath: string): string;
