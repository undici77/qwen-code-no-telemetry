/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type GitDiffHunk, type GitDiffResult } from '@qwen-code/qwen-code-core';
export interface CurrentDiffData {
    /** `null` ⇒ not a git repo / HEAD missing / mid-rebase / etc. */
    result: GitDiffResult | null;
    hunks: Map<string, GitDiffHunk[]>;
    loading: boolean;
}
/**
 * Loads "working tree vs HEAD" stats and hunks **once at mount**. Mirrors
 * the data shape `fetchGitDiff` already returns so renderers can be
 * driven from a single contract — see `DiffDialog`.
 *
 * Snapshot semantics: the dialog's "Current" tab reflects the state at
 * the moment `/diff` was opened, not the live worktree. Re-fetching on
 * every render would flicker the UI as users navigate between sources;
 * users who want a fresh view can close and reopen `/diff`. The
 * `cwd`-only dependency reinforces this — typing in another shell pane
 * does not retrigger the fetch.
 *
 * Failures are swallowed and surfaced as the empty result (the dialog
 * displays an explanatory empty-state instead of crashing), matching
 * how non-interactive `/diff` already behaves. We log them at the debug
 * level so an operator can still trace permission flips, corrupt index
 * files, or other git failures.
 */
export declare function useDiffData(cwd: string | undefined): CurrentDiffData;
