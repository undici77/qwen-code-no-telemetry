/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Checks if a directory is within a git repository
 * @param directory The directory to check
 * @returns true if the directory is in a git repository, false otherwise
 */
export declare function isGitRepository(directory: string): boolean;
/**
 * Finds the root directory of a git repository
 * @param directory Starting directory to search from
 * @returns The git repository root path, or null if not in a git repository
 */
export declare function findGitRoot(directory: string): string | null;
/**
 * Gets the current git branch, if in a git repository.
 */
export declare const getGitBranch: (cwd: string) => string | undefined;
/**
 * Gets the git repository full name (owner/repo), if in a git repository.
 * Tries to get the name from the remote URL first, then falls back to the directory name.
 */
export declare const getGitRepoName: (cwd: string) => string | undefined;
/**
 * Gets the recent git status including the last 5 commits.
 * Mirrors claude-code's getGitStatus() in context.ts.
 *
 * Injected as context at conversation start so the main agent can reason about
 * version history (e.g. "regressed in 2.1" + "Recent commits: 2.1.8" triggers
 * Explore with git log). Critical for SWE-bench regression tasks.
 *
 * NOTE: Do NOT pass this to Explore/read-only subagents - they run their own
 * git log. The snapshot here is dead weight (and potentially stale) for them.
 */
export declare function getRecentGitStatus(cwd: string): string | null;
