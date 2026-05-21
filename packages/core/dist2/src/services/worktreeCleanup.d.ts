/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Default age threshold for stale ephemeral worktree cleanup (30 days).
 * Matches claude-code's threshold so the on-disk hygiene story is the same.
 */
export declare const STALE_WORKTREE_CUTOFF_MS: number;
declare function isEphemeralSlug(slug: string): boolean;
/**
 * Removes stale ephemeral worktrees under `<projectRoot>/.qwen/worktrees/`.
 *
 * Safety guarantees (fail-closed):
 * - Only touches slugs matching {@link EPHEMERAL_WORKTREE_PATTERNS}.
 * - Skips entries newer than {@link STALE_WORKTREE_CUTOFF_MS} (default 30 days).
 * - Skips entries with any uncommitted tracked changes.
 * - Skips entries with commits not reachable from the upstream remote.
 * - Any error reading git status / log → skip the entry (don't delete).
 *
 * Returns the number of worktrees actually removed.
 */
export declare function cleanupStaleAgentWorktrees(projectRoot: string, options?: {
    cutoffMs?: number;
}): Promise<number>;
export declare const __test__: {
    isEphemeralSlug: typeof isEphemeralSlug;
};
export {};
