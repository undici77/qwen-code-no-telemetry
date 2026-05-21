/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Hunk } from 'diff';
/** Re-export so consumers don't need to depend on `diff` directly. */
export type GitDiffHunk = Hunk;
export interface GitDiffStats {
    filesCount: number;
    linesAdded: number;
    linesRemoved: number;
}
export interface PerFileStats {
    added: number;
    removed: number;
    isBinary: boolean;
    isUntracked?: boolean;
    /** `true` when the file is removed in the worktree relative to HEAD.
     *  Mutually exclusive with `isUntracked`. Detected via
     *  `git diff HEAD --name-status -z` (status letter `D`); a row like
     *  `0\t10\tfoo.ts` from numstat alone is not enough to distinguish
     *  "deleted" from "heavy edit that drops 10 lines". */
    isDeleted?: boolean;
    /** Only meaningful for untracked files: `true` when the file exceeded the
     *  line-counting read cap and `added` is therefore a lower bound. */
    truncated?: boolean;
}
export interface GitDiffResult {
    stats: GitDiffStats;
    perFileStats: Map<string, PerFileStats>;
}
/** Maximum files retained in per-file results. Matches issue #2997 "50 files" cap. */
export declare const MAX_FILES = 50;
/** Per-file diff content cap. Matches issue #2997 "1MB" cap. */
export declare const MAX_DIFF_SIZE_BYTES = 1000000;
/** Per-file diff line cap (GitHub's auto-load threshold). */
export declare const MAX_LINES_PER_FILE = 400;
/** Skip per-file parsing when the diff touches more than this many files. */
export declare const MAX_FILES_FOR_DETAILS = 500;
/**
 * Fetch numstat-based git diff stats (files changed, lines added/removed) and
 * per-file summaries comparing the working tree to HEAD. Structured hunks are
 * available separately via `fetchGitDiffHunks`.
 *
 * Returns `null` when not inside a git repo, when git itself fails, or when
 * the working tree is in a transient state (merge, rebase, cherry-pick,
 * revert) — those states carry incoming changes that weren't intentionally
 * made by the user.
 */
export declare function fetchGitDiff(cwd: string): Promise<GitDiffResult | null>;
/**
 * Fetch structured hunks for the current working tree vs HEAD. Separate
 * from `fetchGitDiff` so callers that only need stats do not pay the full
 * diff cost.
 *
 * NOTE on memory: this reads the full `git diff HEAD` stdout via `execFile`
 * before applying parser caps (`MAX_FILES`, `MAX_DIFF_SIZE_BYTES`,
 * `MAX_LINES_PER_FILE`). For very large diffs we can buffer up to the
 * `runGit` `maxBuffer` (64 MB) before dropping content. Streaming the
 * parser would let us terminate `git` early at `MAX_FILES`; that's a
 * reasonable follow-up but out of scope for this utility's first cut.
 */
export declare function fetchGitDiffHunks(cwd: string): Promise<Map<string, Hunk[]>>;
/**
 * Parse `git diff --numstat -z` output.
 *
 * Wire format (stable per `git-diff(1)`):
 * - Non-rename:  `<added>\t<removed>\t<path>\0`
 * - Rename:      `<added>\t<removed>\t\0<oldpath>\0<newpath>\0`
 *
 * Using `-z` (vs the default newline-delimited form) keeps paths byte-accurate:
 * tabs, newlines, and non-ASCII characters all round-trip without git's
 * C-style quoting, so `perFileStats` keys match the real on-disk filenames.
 *
 * Binary files use `-` for both counts. Only the first `MAX_FILES` entries are
 * retained in `perFileStats`; totals account for every entry.
 */
export declare function parseGitNumstat(stdout: string): GitDiffResult;
/**
 * Parse unified diff output into per-file hunks.
 *
 * Limits applied:
 * - Stop once `MAX_FILES` files have been collected.
 * - Skip files whose raw diff exceeds `MAX_DIFF_SIZE_BYTES`.
 * - Truncate per-file content at `MAX_LINES_PER_FILE` lines.
 */
export declare function parseGitDiff(stdout: string): Map<string, Hunk[]>;
/**
 * Parse `git diff --shortstat` output, e.g.
 * ` 3 files changed, 42 insertions(+), 7 deletions(-)`.
 *
 * The regex is anchored (line start/end with the `m` flag) and uses single
 * literal spaces plus bounded `\d{1,10}` digit runs. This closes CodeQL alert
 * #137: the previous unanchored form with `\s+` and `\d+` in nested optional
 * groups could backtrack polynomially on crafted strings of `0`s.
 */
export declare function parseShortstat(stdout: string): GitDiffStats | null;
/**
 * Parse `git diff HEAD --name-status -z` output and return the paths whose
 * status is `D` (deleted in the worktree).
 *
 * Wire format with `-z`: `<status>\0<path>\0` per entry, except renames and
 * copies which span three tokens: `R<score>\0<oldpath>\0<newpath>\0` (and
 * `C<score>\0...`). We only care about deletions here, so renames/copies
 * are walked past — neither half of a rename pair is "deleted" in the
 * user-facing sense (the file still exists under the new name).
 */
export declare function parseDeletedFromNameStatus(stdout: string): Set<string>;
/**
 * Resolve the real git directory for a working tree, following `.git` file
 * indirection used by linked worktrees (`git worktree add`) and submodules.
 * Returns `null` when the location is not inside a git repo.
 */
export declare function resolveGitDir(cwd: string): Promise<string | null>;
