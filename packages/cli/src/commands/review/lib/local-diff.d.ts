/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Untracked files above this size are named but not diffed.
 *
 * An untracked file is whatever the user happened to leave in the tree, and
 * `--exclude-standard` only filters what `.gitignore` covers. A 200 MB core
 * dump, a captured pcap, a vendored tarball that nobody ignored: inlining one
 * into the review diff buys nothing and pushes every real hunk past the chunk
 * planner's budget. They are reported to the caller instead of dropped in
 * silence — a review that quietly skipped a file is the bug this module exists
 * to fix, and re-introducing it one size class up would be a poor trade.
 */
export declare const MAX_UNTRACKED_BYTES = 1000000;
/**
 * Ceilings on the untracked pass as a whole.
 *
 * `MAX_UNTRACKED_BYTES` bounds any one file; nothing bounded the *set*, and each
 * untracked file costs one synchronous `git` spawn. A working tree whose
 * `.gitignore` does not yet cover `node_modules` — `git init` followed by
 * `npm install`, which is a normal Tuesday — offers tens of thousands of
 * untracked files, and the capture would sit there spawning `git` once per file
 * for minutes before the review began. The old bug made `/review` show nothing;
 * an unbounded fix would make it hang, which is not obviously an improvement.
 *
 * A count this far above any real change (500 new files in one review is already
 * extraordinary; `node_modules` is a hundred times that) means the tree's ignore
 * rules are broken, not that the user wrote a lot of code. So the pass is
 * abandoned wholesale rather than reviewing an arbitrary alphabetical prefix of
 * a build directory — and, being checked before the loop, it costs zero spawns.
 * The user is told, loudly, in the one place that can act on it.
 */
export declare const MAX_UNTRACKED_FILES = 500;
export declare const MAX_UNTRACKED_TOTAL_BYTES = 10000000;
/** An untracked file the capture did not review, and why. Never dropped mutely. */
export interface SkippedFile {
    path: string;
    /** Size in bytes, or null when the file could not be stat-ed at all. */
    bytes: number | null;
    reason: string;
}
export interface LocalDiffCapture {
    /** The captured diff: tracked sections first, then untracked ones. */
    diff: Buffer;
    /** Untracked files whose full contents were added to the diff. */
    untracked: string[];
    /** Untracked files that were NOT reviewed. Report every one of them. */
    skipped: SkippedFile[];
    /** True when HEAD does not exist yet (a repo with no commits). */
    unbornHead: boolean;
}
/**
 * True when git rendered this file as a binary blob rather than as text.
 *
 * `Binary files /dev/null and b/logo.png differ` — that is the entire body. The
 * section parses, and it contains nothing to review.
 */
export declare function isBinarySection(section: Buffer): boolean;
/**
 * Capture staged + unstaged + untracked changes as one unified diff.
 *
 * `file` scopes the capture to a single path (a `/review <file-path>` target).
 * Nothing here writes to the index, the worktree, or any ref.
 */
export declare function captureLocalDiff(opts: {
    file?: string;
    includeUntracked?: boolean;
}): LocalDiffCapture;
