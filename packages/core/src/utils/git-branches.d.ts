/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface GitBranchInfo {
  name: string;
  isHead: boolean;
  upstream?: string;
  ahead: number;
  behind: number;
  /** Unix epoch seconds of the branch tip commit. */
  commitDate: number;
  commitSubject: string;
}
export interface GitTagInfo {
  name: string;
  /** Unix epoch seconds of the tag (annotated) or tagged commit (lightweight). */
  date: number;
  subject: string;
}
export interface GitBranchesResult {
  local: GitBranchInfo[];
  remote: GitBranchInfo[];
  tags: GitTagInfo[];
  recent: string[];
  head: string;
  detached: boolean;
}
export declare function gitEnv(
  base?: Readonly<Record<string, string | undefined>>,
): Record<string, string | undefined>;
/**
 * List all local branches, remote branches, tags, and recent branches for
 * the repository at `cwd`. Uses `git for-each-ref` for structured output and
 * `git reflog` for recency.
 */
export declare function fetchGitBranches(
  cwd: string,
  env?: Readonly<Record<string, string | undefined>>,
): Promise<GitBranchesResult>;
/**
 * Whether `value` is safe to pass to git as a checkout target or branch start
 * point: a plausible ref name (branch, tag, or short/full SHA) that cannot be
 * mistaken for a git option (`-f`, `--patch`, `--output=…`) or a pathspec (`.`)
 * that `git checkout` would act on destructively.
 */
export declare function isValidCheckoutRef(value: string): boolean;
export interface GitCheckoutResult {
  branch: string;
  detached: boolean;
}
/**
 * Checkout a branch, tag, or revision. Returns the resulting HEAD state.
 * Throws on dirty tree or invalid ref.
 */
export declare function gitCheckout(
  cwd: string,
  ref: string,
  env?: Readonly<Record<string, string | undefined>>,
): Promise<GitCheckoutResult>;
/**
 * Create a new branch and check it out. Throws if the branch already exists
 * or the working tree is dirty.
 */
export declare function gitCreateBranch(
  cwd: string,
  name: string,
  startPoint?: string,
  env?: Readonly<Record<string, string | undefined>>,
): Promise<GitCheckoutResult>;
export interface GitPushResult {
  success: boolean;
  output: string;
}
/**
 * Push the current branch. When `setUpstream` is requested and the branch
 * already has an upstream, a plain `git push` is used so the configured
 * remote is preserved. Only when no upstream exists does it fall back to
 * `--set-upstream <remote> <branch>`, resolving the push remote with Git's
 * precedence (branch.<name>.pushRemote, remote.pushDefault,
 * branch.<name>.remote, sole remote, then origin).
 */
export declare function gitPush(
  cwd: string,
  opts?: {
    setUpstream?: boolean;
    force?: boolean;
  },
  env?: Readonly<Record<string, string | undefined>>,
): Promise<GitPushResult>;
export interface GitPullResult {
  success: boolean;
  output: string;
}
/**
 * Pull (fetch + merge) or fetch-only from the remote.
 */
export declare function gitPull(
  cwd: string,
  opts?: {
    rebase?: boolean;
    fetchOnly?: boolean;
  },
  env?: Readonly<Record<string, string | undefined>>,
): Promise<GitPullResult>;
export interface GitCommitResult {
  sha: string;
  subject: string;
}
/**
 * Commit changes. With `all: true`, stages every change in the working tree
 * (including untracked files) via `git add -A` before committing, so the
 * commit matches what the UI displays.
 */
export declare function gitCommit(
  cwd: string,
  message: string,
  opts?: {
    all?: boolean;
  },
  env?: Readonly<Record<string, string | undefined>>,
): Promise<GitCommitResult>;
