/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Attribution Trailer Utility
 *
 * Generates git notes commands for storing per-file AI attribution metadata
 * on commits. This keeps the commit message clean (only Co-Authored-By trailer)
 * while storing detailed contribution data in git notes.
 */
import type { CommitAttributionNote } from './commitAttribution.js';
/**
 * argv-form git notes invocation, designed for `child_process.execFile`.
 *
 * We return argv rather than a shell-quoted command string because the JSON
 * note travels as a separate argv entry — no shell quoting is needed and no
 * shell metacharacters can be re-evaluated. This matters most on Windows
 * where bash-style single-quote escaping (`'\''`) is invalid and would
 * corrupt the note (or, worse, allow interpolation under PowerShell/cmd).
 */
export interface GitNotesCommand {
    command: string;
    args: string[];
}
/**
 * Build the git notes add invocation to attach attribution metadata to a
 * specific commit. `targetCommit` MUST be the SHA the caller captured
 * after detecting the commit's HEAD movement — passing the symbolic
 * `'HEAD'` opens a TOCTOU window where a post-commit hook, a chained
 * `git commit && git tag -m ...`, or a parallel process can advance
 * HEAD between capture and exec, and `-f` would silently overwrite the
 * note on the wrong commit.
 *
 * Caller should pass the result to a process-spawning API
 * (`child_process.execFile`) along with a `cwd` option.
 *
 * Returns null if the serialized note exceeds MAX_NOTE_BYTES.
 */
export declare function buildGitNotesCommand(note: CommitAttributionNote, targetCommit: string): GitNotesCommand | null;
