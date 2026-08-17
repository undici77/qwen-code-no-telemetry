/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/** Inline review comment, as listed by `GET /pulls/{n}/comments`. */
export interface RawStatusComment {
  id: number;
  user?: {
    login: string;
  } | null;
  body?: string;
  path?: string;
  /** Line in the PR's LATEST diff; null when GitHub cannot map the comment
   * to it (the anchor is outdated). File-level comments are always null. */
  line?: number | null;
  original_line?: number | null;
  /** SHA GitHub currently anchors the comment to. */
  commit_id?: string;
  /** SHA the comment was filed against. */
  original_commit_id?: string;
  in_reply_to_id?: number | null;
  created_at?: string;
  /** 'line' for ordinary comments, 'file' for file-level ones. */
  subject_type?: string;
}
/**
 * Answers "did `path` change between `sinceSha` and the worktree HEAD, and
 * which commits touched it?" — injected so the classification core stays
 * pure. `'unknown'` when the question cannot be answered (no worktree, the
 * comment's commit absent from the object store, path outside the repo).
 *
 * Force-push caveat: the worktree shares the main clone's object database,
 * so a force-pushed-away commit is often still PRESENT — the range then
 * spans the whole re-pushed branch rather than the intended window. That
 * errs fail-safe (it can over-report `changed: true`, never hide a change),
 * so it is accepted rather than special-cased.
 */
export type CodeChangeProbe = (
  path: string,
  sinceSha: string | undefined,
) => {
  changed: boolean | 'unknown';
  touchedBy: string[];
  touchedByTotal: number;
};
export interface ThreadStatus {
  rootId: number;
  path: string;
  author: string;
  createdAt: string;
  /** The root body asserts a blocking defect (same semantic test pr-context
   * uses to build its "Blockers to re-check" section). */
  isBlocker: boolean;
  anchor: {
    /** Current-diff line at the LIVE head; null = not mappable. */
    line: number | null;
    originalLine: number | null;
    /** line === null on a line-scoped comment: the anchor no longer maps to
     * the latest diff. File-level comments are never outdated. */
    outdated: boolean;
    isFileLevel: boolean;
    /** SHA the comment was filed against (falls back to the current anchor
     * SHA when the API omits original_commit_id). */
    commitId: string;
  };
  code: {
    /** Did the anchored file change between the comment's commit and the
     * WORKTREE head (the code this review is ruling on)? */
    changedSinceComment: boolean | 'unknown';
    /** Short SHAs of commits in that range touching the file, newest first,
     * capped — the candidate "fixed by" commits for the re-check. */
    touchedBy: string[];
    /** Real count before the cap — when it exceeds `touchedBy.length`, the
     * list was cut and a fix commit may be among the ones not shown. */
    touchedByTotal: number;
    /** True when the worktree HEAD no longer matches the live PR head: the
     * code facts above describe a superseded checkout. Denormalized onto
     * every thread so a `jq` filter over `threads[]` cannot skip the
     * top-level drift flag by construction. */
    staleWorktree: boolean;
  };
  replies: Array<{
    id: number;
    author: string;
    createdAt: string;
  }>;
  /** The PR author replied somewhere in this thread — the strongest cheap
   * signal that the concern has been seen (NOT that it is fixed). */
  authorReplied: boolean;
  participants: string[];
}
/**
 * Pure classification core: group the flat comment list into threads and
 * compute each thread's status. Replies whose root was deleted (the id no
 * longer appears in the list) are dropped, matching pr-context's rendering
 * of the same data.
 */
export declare function buildThreadStatuses(
  comments: RawStatusComment[],
  prAuthor: string,
  probe: CodeChangeProbe,
): ThreadStatus[];
export interface ThreadSummary {
  threads: number;
  outdated: number;
  blockers: number;
  changedSinceComment: number;
  changeUnknown: number;
  withReplies: number;
  authorReplied: number;
}
export declare function summarizeThreads(
  threads: ThreadStatus[],
): ThreadSummary;
/**
 * Git-backed probe. Every call is scoped to `worktree` with `git -C`, NOT to
 * the process CWD: the command runs from the trusted main checkout (so its
 * `--out` cannot be redirected through a symlink an untrusted PR planted in
 * its own tree), while the code facts must come from the PR's checked-out
 * worktree. Memoized per (path, sinceSha): several threads routinely anchor
 * to the same file at the same commit.
 */
export declare function makeGitProbe(worktree: string): CodeChangeProbe;
export declare const commentStatusCommand: CommandModule;
