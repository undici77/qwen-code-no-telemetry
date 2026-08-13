/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Polling interval (ms) for the branch-name fallback. `fs.watch` on the
 * reflog is unreliable on NFS / FUSE / Docker overlay and some Linux
 * filesystems — events can be silently dropped with no recovery path.
 * A lightweight poll every 5 s ensures the footer branch name self-heals
 * within one interval even when the watcher misses a branch switch.
 */
export declare const BRANCH_POLL_INTERVAL_MS = 5000;
/**
 * Tracks the current git branch (or a short commit hash when detached) for
 * `cwd`, read directly from `.git` via core's gitDirect helpers — no `git`
 * subprocess. Re-reads automatically when the repository's reflog moves
 * (branch switch, commit, reset), with a polling fallback for filesystems
 * where `fs.watch` is unreliable (#7828).
 */
export declare function useGitBranchName(cwd: string): string | undefined;
