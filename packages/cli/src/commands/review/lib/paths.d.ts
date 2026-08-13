/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const REVIEW_TMP_DIR: string;
export declare const REVIEWS_DIR: string;
export declare const REVIEW_CACHE_DIR: string;
/**
 * Filename prefix for review-worktree lease files under `REVIEW_TMP_DIR`.
 * Lives here, not in `review-worktree-lease.ts`, because the review
 * workflow's cleanup sweep deletes leases by glob — the sweep pattern and
 * the lease writer must share one definition (the cleanup spec pins both).
 */
export declare const LEASE_PREFIX = "qwen-review-lease-";
/**
 * Where the skill tees `qwen review parse-args`'s verdict (SKILL Step 0). A fixed,
 * conventional name so a capture command can read back the effort the parser
 * already resolved without the orchestrator threading the `--effort` value through
 * by hand — see `resolveEffort`.
 */
export declare const PARSE_ARGS_REPORT: string;
/** Worktree path for a given PR review session. */
export declare function worktreePath(prNumber: string | number): string;
/**
 * The disposable worktree the test-efficacy probe runs in — a sibling of the
 * shared review worktree, discarded wholesale when the probe finishes (#6832).
 *
 * The one exception to this file's "paths are relative to the project root"
 * rule: this returns an ABSOLUTE path. The probe drives `git worktree add`/
 * `remove` with the shared worktree as cwd, so a relative path would resolve
 * against that worktree, not the repo root, and land the probe tree nested
 * inside the tree it is meant to sit beside. Both call sites — the probe and
 * `cleanup.ts`'s stale-tree sweep — go through here so the `-probe` suffix and
 * this normalisation stay in one place; renaming the suffix in one file used to
 * silently stop the other from sweeping.
 */
export declare function probeWorktreePath(worktree: string): string;
/**
 * The merge-base tree an A/B probe compares against — a second sibling of the
 * review worktree, holding the code as it stood *before* the PR.
 *
 * Absolute for the same reason as `probeWorktreePath`: `git worktree add` runs
 * with the review worktree as cwd, so a relative path would land the base tree
 * nested inside the tree it is meant to sit beside. Kept here beside its sibling
 * so `base-tree` and `cleanup.ts`'s sweep cannot drift apart on the suffix —
 * the failure mode that made the probe tree's helper shared in the first place.
 */
export declare function baseWorktreePath(worktree: string): string;
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
