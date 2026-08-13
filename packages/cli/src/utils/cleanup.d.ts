/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function registerCleanup(fn: (() => void) | (() => Promise<void>)): () => void;
export interface RunExitCleanupOptions {
    /** TEST ONLY — override per-cleanup-function timeout (default 2s). */
    _testPerFnTimeoutMs?: number;
    /** TEST ONLY — override overall wall-clock timeout (default 5s). */
    _testOverallTimeoutMs?: number;
}
export declare function runExitCleanup(options?: RunExitCleanupOptions): Promise<void>;
/**
 * Test-only: clear the registered cleanup functions array. Module-private
 * state otherwise leaks across vitest cases — the previous test isolation
 * via `global['cleanupFunctions']` was a no-op (the array isn't on global)
 * and only happened to work because `runExitCleanup` itself clears at the
 * end. Naming follows the `_reset*ForTest` convention from
 * d6485964c (paths, jsonl-utils, ripGrep).
 */
export declare function _resetCleanupFunctionsForTest(): void;
export declare function cleanupCheckpoints(): Promise<void>;
