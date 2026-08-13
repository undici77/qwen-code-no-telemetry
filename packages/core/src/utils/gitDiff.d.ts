/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Hunk } from 'diff';
/** Re-export so consumers don't need to depend on `diff` directly. */
export type GitDiffHunk = Hunk;
/**
 * A single file's diff hunks plus whether the per-file caps
 * (`MAX_DIFF_SIZE_BYTES` / `MAX_LINES_PER_FILE`) actually cut content — so the
 * viewer can label the diff as incomplete instead of silently under-reporting.
 */
export interface GitDiffFileHunks {
    hunks: Hunk[];
    truncated: boolean;
}
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
    /** For a rename detected by `git diff --numstat -z`, the pre-rename path.
     *  The map key (and wire `path`) is the current post-rename path so the
     *  single-file endpoint can address it; this carries the old path for display. */
    oldPath?: string;
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
 * Fetch structured hunks for a single file (working tree vs HEAD). Cheaper than
 * `fetchGitDiffHunks`, which diffs the whole tree — this is for on-demand
 * rendering of one file in the diff viewer.
 *
 * `filePath` may be a repo-root-relative path or an absolute path inside the
 * repo (the daemon passes the workspace-sandboxed absolute path). Relative
 * inputs reject absolute prefixes, drive letters, and `..` traversal; absolute
 * inputs are rejected when they fall outside the git root. Both forms are
 * normalized to a git-root-relative path before any git call, so the path can
 * never escape the repository.
 *
 * Untracked files (which `git diff HEAD` omits) are synthesized as a single
 * all-added hunk by reading the file, so the viewer can show new files like any
 * other addition. `truncated` is set whenever the per-file caps cut content on
 * either path (parser cap for tracked diffs, byte/line caps for synthesized
 * untracked ones). Returns `null` for non-repos, transient states, paths
 * outside the repo, binary or unreadable untracked files, and tracked files
 * with no changes.
 */
export declare function fetchGitDiffHunksForFile(cwd: string, filePath: string, oldPath?: string): Promise<GitDiffFileHunks | null>;
export declare function parseGitNumstat(stdout: string): GitDiffResult;
/**
 * Parse unified diff output into per-file hunks.
 *
 * Limits applied:
 * - Stop once `MAX_FILES` files have been collected.
 * - Skip files whose raw diff exceeds `MAX_DIFF_SIZE_BYTES`.
 * - Truncate per-file content at `MAX_LINES_PER_FILE` lines; when
 *   `truncatedPaths` is provided, every file that actually lost lines to that
 *   cap is recorded there so callers can surface the truncation instead of
 *   presenting a silently incomplete diff.
 */
export declare function parseGitDiff(stdout: string, truncatedPaths?: Set<string>): Map<string, Hunk[]>;
/**
 * Decode a path field from a `diff --git` header — handles both unquoted
 * (`b/foo.txt`) and C-style quoted (`"b/tab\there.txt"`) forms.
 *
 * Git wraps a path in `"..."` and applies C-style escaping (`\t`, `\n`,
 * `\r`, `\"`, `\\`, plus octal `\NNN` for non-ASCII bytes) whenever the
 * raw path contains a character that breaks the simple space-delimited
 * format. `core.quotepath=false` disables ONLY the octal escaping for
 * non-ASCII bytes; control chars and quotes are still escaped, so we
 * must decode them ourselves to preserve the real on-disk filename.
 *
 * Octal escapes are decoded as raw byte values then UTF-8-decoded en
 * masse so multi-byte sequences like `\346\226\207` (文) round-trip
 * correctly even though we never set quotepath=true ourselves.
 */
export declare function unquoteCStylePath(s: string): string;
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
/** An in-progress git operation that the status indicator should surface. */
export type GitOperation = 'merge' | 'rebase' | 'cherry-pick' | 'revert' | 'bisect';
/**
 * Working-tree summary for the status line / Web Shell git chip: branch,
 * detached-HEAD flag, upstream ahead/behind, staged / unstaged / untracked /
 * conflicted file counts, stash count, and any in-progress operation. A single
 * `git status --porcelain=v1 --branch -z` call drives everything except stash
 * and the operation (read directly from the git dir to avoid extra
 * subprocesses).
 *
 * Unlike `fetchGitDiff`, this does NOT bail on a transient state — a
 * merge / rebase / cherry-pick / revert in progress is exactly what the
 * indicator should show (reported via `operation`). `git status` still
 * produces valid output during these states.
 *
 * Returns `null` only when not inside a git repo or when git itself fails.
 */
export interface GitWorkingTreeStatus {
    /** Branch name, or `null` when detached / unborn / unreadable. */
    branch: string | null;
    /** `true` for a detached HEAD (branch holds no name). */
    detached: boolean;
    /** `true` when the branch tracks an upstream. */
    hasUpstream: boolean;
    /** Commits ahead of upstream (0 without an upstream). */
    ahead: number;
    /** Commits behind upstream (0 without an upstream). */
    behind: number;
    /** Files with a staged change (porcelain X column). */
    staged: number;
    /** Files with an unstaged change (porcelain Y column). */
    unstaged: number;
    /** Untracked files (`??`). */
    untracked: number;
    /** Unmerged (conflicted) entries. */
    conflicted: number;
    /** Stash entries (lines in `logs/refs/stash`). */
    stashCount: number;
    /** In-progress operation, if any. */
    operation?: GitOperation;
}
export declare function getGitWorkingTreeStatus(cwd: string): Promise<GitWorkingTreeStatus | null>;
interface StatusBranchLine {
    branch: string | null;
    detached: boolean;
    hasUpstream: boolean;
    ahead: number;
    behind: number;
}
/**
 * Parse the `## ...` header from `git status --branch`. Forms handled:
 * `## branch...upstream [ahead N, behind M]`, `## branch`, `## HEAD (no
 * branch)` (detached), and `## No commits yet on branch` / `## Initial commit
 * on branch` (unborn).
 */
export declare function parseStatusBranchLine(line: string): StatusBranchLine;
interface StatusCounts {
    staged: number;
    unstaged: number;
    untracked: number;
    conflicted: number;
}
/**
 * Count staged / unstaged / untracked / conflicted entries from `git status
 * --porcelain=v1 -z` tokens (the branch header is already removed). Each entry
 * is `XY <path>`; a rename/copy carries a second NUL-separated path that is
 * skipped.
 */
export declare function parseStatusEntries(tokens: string[]): StatusCounts;
/** Maximum entries per `fetchGitLog` page. */
export declare const MAX_LOG_LIMIT = 200;
/** Default page size for `fetchGitLog`. */
export declare const DEFAULT_LOG_LIMIT = 50;
export interface GitLogEntry {
    sha: string;
    shortSha: string;
    authorName: string;
    authorEmail: string;
    /** Unix timestamp in seconds. */
    authorDate: number;
    subject: string;
    /** `%D` output, e.g. `"HEAD -> main, origin/main, v1.2.0"`. */
    refs: string;
    /** Parent SHAs (length > 1 ⇒ merge commit). */
    parents: string[];
}
export interface GitLogResult {
    entries: GitLogEntry[];
    hasMore: boolean;
}
export interface GitCommitFileStat {
    path: string;
    added: number;
    removed: number;
    isBinary: boolean;
}
export interface GitCommitDetail {
    sha: string;
    shortSha: string;
    authorName: string;
    authorEmail: string;
    authorDate: number;
    subject: string;
    body: string;
    refs: string;
    parents: string[];
    files: GitCommitFileStat[];
    filesCount: number;
    linesAdded: number;
    linesRemoved: number;
    hiddenCount: number;
}
/**
 * Fetch a page of commit log entries (newest first).
 *
 * Returns `null` when not inside a git repo or when git fails. An empty
 * repo (no commits) returns `{ entries: [], hasMore: false }`.
 */
export declare function fetchGitLog(cwd: string, options?: {
    limit?: number;
    skip?: number;
    range?: string;
}): Promise<GitLogResult | null>;
/**
 * Fetch full detail for a single commit: metadata (including body) plus
 * per-file numstat.
 *
 * Returns `null` when not inside a git repo, the sha is invalid / not found,
 * or git fails.
 */
export declare function fetchGitCommitDetail(cwd: string, sha: string): Promise<GitCommitDetail | null>;
export {};
