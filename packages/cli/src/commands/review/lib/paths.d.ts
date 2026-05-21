/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const REVIEW_TMP_DIR: string;
export declare const REVIEWS_DIR: string;
export declare const REVIEW_CACHE_DIR: string;
/** Worktree path for a given PR review session. */
export declare function worktreePath(prNumber: string | number): string;
/** Local branch ref name for a fetched PR head. */
export declare function reviewBranch(prNumber: string | number): string;
/**
 * Per-target side-file path (review JSON, PR context, presubmit report).
 *
 * Files live under `.qwen/tmp/` rather than the OS temp dir so the path is
 * stable across platforms (macOS's `os.tmpdir()` returns `/var/folders/...`,
 * not `/tmp` — using the project-local dir avoids that mismatch entirely)
 * and so they're scoped to the project rather than the user's whole machine.
 */
export declare function tmpFile(target: string, suffix: string): string;
/** Filename prefix used by `tmpFile`; useful for cleanup globbing. */
export declare function tmpPrefix(target: string): string;
