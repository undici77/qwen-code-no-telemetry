/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** A single `@@` hunk. All line numbers are 1-based and inclusive. */
export interface DiffHunk {
  /** Range within the diff FILE (what `read_file` offset/limit addresses). */
  diffStart: number;
  diffEnd: number;
  /** Range within the post-change ("+") side of the source file. */
  newStart: number;
  newEnd: number;
  /**
   * How many lines the hunk occupies on the new side. Zero for a pure deletion
   * (`@@ -3,4 +2,0 @@`): the range is then empty and no RIGHT-side inline
   * comment can be anchored inside it. GitHub answers such an anchor with a 422
   * that sinks the entire review.
   */
  newCount: number;
}
/**
 * What kind of code a path holds.
 *
 * The distinction drives how much reviewer attention the file is worth. Across
 * the last 40 merged PRs in this repo the median diff is 41% test code and a
 * third of PRs are more than half tests, so a topology chosen from raw diff
 * size spends most of its reviewers on the least risky lines.
 */
export type PathKind = 'source' | 'test' | 'generated' | 'docs';
/**
 * Classify a repo-relative path. Order matters: a generated snapshot under a
 * `__snapshots__/` directory is generated, not a test worth reading.
 */
export declare function classifyPath(path: string): PathKind;
/** One file's section of the diff, from `diff --git` to the next one. */
export interface DiffFile {
  /** New-side path, or the old path for a deletion. */
  path: string;
  kind: PathKind;
  /** Range within the diff FILE, covering header + all hunks. */
  diffStart: number;
  diffEnd: number;
  hunks: DiffHunk[];
  /**
   * New-side line ranges the PR actually **wrote** — the `+` lines, coalesced.
   *
   * Distinct from `hunks`, which also span the three context lines git prints
   * around every change. Telling a whole-file agent that a hunk's whole range
   * is "changed" would have it treat six untouched lines as new and report
   * defects that predate the PR. Anchor validation wants `hunks`; deciding
   * what is new wants this.
   */
  addedRanges: Array<{
    start: number;
    end: number;
  }>;
  addedLines: number;
  removedLines: number;
  /** True for `Binary files ... differ` sections (no hunks to review). */
  binary: boolean;
}
/** A contiguous slice of the diff file assigned to exactly one agent. */
export interface DiffChunk {
  /** 1-based, stable across a run. Used as the agent's coverage receipt id. */
  id: number;
  /** Range within the diff FILE, 1-based inclusive. */
  startLine: number;
  endLine: number;
  lines: number;
  /** Characters in the range. Above `READ_FILE_CHAR_CAP` one read truncates. */
  chars: number;
  /**
   * Longest single line in the range.
   *
   * Paging recovers a chunk that is merely long, because `read_file` takes a
   * line `offset`. It cannot recover a single *line* longer than the read cap:
   * every page starts at a line boundary, so the tail of that line is
   * unreachable. Such a chunk cannot honestly be receipted as fully reviewed.
   */
  maxLineChars: number;
  /**
   * True when this chunk is a single hunk that exceeds `maxChunkLines` or
   * `MAX_CHUNK_CHARS` and offered no safe interior boundary to split on. Such
   * a chunk stands alone: cutting it anywhere else would slice a function in
   * half, which is the failure mode chunking exists to prevent. An oversized
   * chunk may exceed one read's worth of characters, so its agent must page.
   */
  oversized: boolean;
  /** Which source files (and which of their lines) this chunk covers. */
  files: Array<{
    path: string;
    newStart: number;
    newEnd: number;
  }>;
}
/**
 * Why these chunk ids cannot key a review — or null when they can.
 *
 * One definition for everything keyed by `chunk-<id>`: coverage refuses a plan
 * whose ids it could never match (`readPlan`), and the prompt builder's batch
 * mode must refuse the SAME plan before writing a brief, record or block —
 * filtering there instead shrank the round, so `[13, "x", 15]` printed a
 * complete-looking two-auditor round with one territory silently gone.
 */
export declare function chunkIdsProblem(ids: readonly unknown[]): string | null;
export interface DiffPlan {
  diffLines: number;
  diffChars: number;
  /**
   * Diff lines belonging to `source` files. This — not `diffLines` — is what
   * the review topology is chosen from: a change of 150 production lines that
   * ships 800 lines of new tests carries the review risk of a small change,
   * and deserves the many-lenses treatment rather than being carved into
   * territories where most territories are test code.
   */
  srcDiffLines: number;
  testDiffLines: number;
  generatedDiffLines: number;
  docsDiffLines: number;
  files: DiffFile[];
  chunks: DiffChunk[];
}
/** Default target size of a chunk, in diff lines. */
export declare const DEFAULT_MAX_CHUNK_LINES = 400;
/**
 * Hard ceiling on a chunk's size in characters.
 *
 * `read_file` truncates a single read at `truncateToolOutputThreshold`
 * (default 25 000 chars) and reports `isTruncated`. A chunk agent is told to
 * read its range in one call, so a chunk above that ceiling would come back
 * silently short — reintroducing, per-chunk, exactly the blind spot the plan
 * exists to remove. 400 lines of ordinary source stays near 16 000 chars, but
 * one minified or long-line file would blow past 25 000, so bound both.
 */
export declare const MAX_CHUNK_CHARS = 20000;
/**
 * What one `read_file` call returns before it truncates and sets `isTruncated`
 * (`Config.getTruncateToolOutputThreshold()`, default 25 000).
 */
export declare const READ_FILE_CHAR_CAP = 25000;
/**
 * Parse a unified diff into per-file sections and hunks.
 *
 * The returned sections tile `[1, diffLines]` exactly — every line of the
 * diff belongs to exactly one file section. That invariant is what lets
 * `planChunks` guarantee full coverage.
 */
export declare function parseDiff(diffText: string): {
  files: DiffFile[];
  diffLines: number;
};
/**
 * Partition the diff into contiguous chunks of at most `maxChunkLines` diff
 * lines and `MAX_CHUNK_CHARS` characters, splitting on hunk boundaries and —
 * for hunks larger than either budget — on safe top-level boundaries inside
 * them.
 *
 * Both budgets bind. Lines govern how much a single agent can attend to;
 * characters govern what `read_file` will hand back in one call. A chunk over
 * the char budget comes back silently short, which is the failure this whole
 * module exists to remove.
 *
 * A file's header lines (`diff --git`, `index`, `---`, `+++`) are attached to
 * its first hunk so a chunk never begins with an orphaned header. Chunks may
 * span several small files.
 */
export declare function planChunks(
  files: DiffFile[],
  lines: string[],
  maxChunkLines?: number,
): DiffChunk[];
/** Parse + partition in one call. */
export declare function buildDiffPlan(
  diffText: string,
  maxChunkLines?: number,
): DiffPlan;
/**
 * True iff the chunks tile `[1, diffLines]` with no gap and no overlap.
 *
 * The orchestrator's coverage assertion depends on this; a regression here
 * would silently reintroduce the blind spot the whole design removes.
 */
export declare function chunksCoverDiff(
  chunks: DiffChunk[],
  diffLines: number,
): boolean;
