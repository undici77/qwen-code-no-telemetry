/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
declare const MAX_MANAGED_AUTO_MEMORY_INDEX_LINES = 200;
export declare const MEMORY_FRONTMATTER_EXAMPLE: readonly string[];
export declare const TYPES_SECTION_INDIVIDUAL: readonly string[];
export declare const WHAT_NOT_TO_SAVE_SECTION: readonly string[];
export declare const MEMORY_DRIFT_CAVEAT = "- Memory records can become stale over time. Use memory as context for what was true at a given point in time. Before answering the user or building assumptions based solely on information in memory records, verify that the memory is still correct and up-to-date by reading the current state of the files or resources. If a recalled memory conflicts with current information, trust what you observe now \u2014 and update or remove the stale memory rather than acting on it.";
export declare const WHEN_TO_ACCESS_SECTION: readonly string[];
export declare const TRUSTING_RECALL_SECTION: readonly string[];
export declare function buildManagedAutoMemoryPrompt(memoryDir: string, indexContent?: string | null): string;
export declare function appendManagedAutoMemoryToUserMemory(userMemory: string, memoryDir: string, indexContent?: string | null): string;
export { MAX_MANAGED_AUTO_MEMORY_INDEX_LINES };
