/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const MAX_CACHE_ENTRIES = 256;
export declare const MAX_TOTAL_PATHS = 50000;
/**
 * Generates a unique cache key based on the project directory and the content
 * of ignore files. This ensures that the cache is invalidated if the project
 * or ignore rules change.
 */
export declare const getCacheKey: (directory: string, ignoreContent: string, maxDepth?: number, maxFiles?: number, useGitignore?: boolean) => string;
/**
 * Reads cached data from the in-memory cache.
 * Bumps the entry to the end of the FIFO queue on hit so that
 * frequently-read crawl results survive eviction by auxiliary crawls.
 * Returns undefined if the key is not found.
 */
export declare const read: (key: string) => string[] | undefined;
/**
 * Writes data to the in-memory cache and sets a timer to evict it after the TTL.
 * Enforces MAX_CACHE_ENTRIES (LRU by insertion order) and MAX_TOTAL_PATHS to
 * prevent heap exhaustion when many large projects are crawled.
 */
export declare const write: (key: string, results: string[], ttlMs: number) => void;
/**
 * Clears the entire cache and all active timers.
 * Primarily used for testing.
 */
export declare const clear: () => void;
