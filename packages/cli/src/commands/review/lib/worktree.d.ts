/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { spawnSync } from 'node:child_process';
export type SweepResult = ReturnType<typeof spawnSync>;
/**
 * Free a disposable worktree's path: unregister it, then remove what is left.
 *
 * `git worktree remove --force` only clears a tree git still tracks. A directory
 * left at the path after metadata loss or a partial cleanup is reported "not a
 * working tree" and left in place — and a *non-empty* one then makes
 * `git worktree add` fail `already exists`, wedging every later run until
 * someone clears it by hand. So the unregister is followed by a plain remove of
 * whatever dir remains. `rmSync` unlinks a symlink rather than following it, so
 * a tampered leftover cannot redirect the delete outside `tree`.
 *
 * This is `releaseWorktree`'s two-step, and deliberately NOT a call to it:
 * `releaseWorktree` runs git from the process cwd, which need not be this
 * worktree's repo, and it discards the sweep's stderr — which is usually the
 * only thing that explains a subsequent `add` failure. Every caller here needs
 * `cwd` and that stderr.
 *
 * Best-effort by design: a clean path is the normal case, so the unregister does
 * not throw on a non-zero status. `rmSync` still can (`force` suppresses ENOENT
 * but not EPERM/EBUSY) — callers decide what that means.
 */
export declare function discardWorktree(cwd: string, tree: string): SweepResult;
/**
 * The reason a disposable worktree could not be created.
 *
 * The stale-sweep's stderr is folded in because it is usually the explanation:
 * when `add` fails on a leftover the sweep could not clear, the sweep is what
 * says why. Pure, and extracted for that reason — the branch it lives on fires
 * only when `git worktree add` fails, and there is no portable way to force that
 * in a real-git test (the one lever, making `.git/worktrees` unwritable, is
 * bypassed by root and behaves differently under CI's unprivileged user).
 */
export declare function worktreeCreateFailureDetail(label: string, err: unknown, sweepStderr: string): string;
