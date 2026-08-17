/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Shared rendered-height accounting for bounding the live (pending) markdown
 * frame during streaming. A single source line does NOT map to a single
 * terminal row: a wide/CJK line wraps, and a markdown table renders ~2 rows per
 * data row (TableRenderer draws a separator between every data row) plus
 * borders and vertical margin. Both the incremental scrollback commit
 * (useGeminiStream) and the render-side safety-net slice (MarkdownDisplay) use
 * this module so they agree on how tall the pending content will render — a
 * divergent estimate would let the safety net engage out of step with the
 * commit and flicker.
 */
/** The fixed chrome a horizontal table adds around its rows: the top,
 *  header-separator and bottom borders (3) plus a `marginY` of 1 (2 rows) = 5.
 *  fitPendingSlice adds this to the summed wrapped row heights (`contentRows`)
 *  and the N-1 inter-row separators — it is no longer a flat `2 * dataRows + 5`. */
export declare const TABLE_CHROME_ROWS = 5;
/** The wrap-height threshold: when any cell wraps past this many lines,
 *  TableRenderer falls back to the (much taller) vertical layout. This is the
 *  single source of truth — TableRenderer imports it as MAX_ROW_LINES — so the
 *  renderer and this estimator can never disagree on the format decision. */
export declare const TABLE_MAX_ROW_LINES = 4;
/** A markdown table row: `| ... |`. Group 1 captures the inner cells. */
export declare const TABLE_ROW_RE: RegExp;
/** A markdown table separator: `| --- | :--: |` etc. */
export declare const TABLE_SEPARATOR_RE: RegExp;
/** A fenced code block delimiter. Group 1 is the fence (``` or ~~~ run). */
export declare const CODE_FENCE_RE: RegExp;
/**
 * Splits one markdown table row into its cells, honouring escaped pipes
 * (`\|`), inline code spans and inline math spans. Shared so table detection
 * and the renderer agree on column counts.
 */
export declare function splitMarkdownTableRow(row: string): string[];
/** Estimated terminal rows a non-table line occupies once wrapped to `width`. */
export declare function estimateWrappedRows(
  line: string,
  width: number,
): number;
/**
 * True when `lines[i]` starts a markdown table: a `| ... |` row immediately
 * followed by a separator row whose column count matches the header's. The
 * column-count check mirrors the renderer's own table detection so this and
 * MarkdownDisplay agree on what counts as a table.
 */
export declare function isTableStart(lines: string[], i: number): boolean;
export interface PendingSliceResult {
  /**
   * Number of leading source lines whose combined RENDERED height fits within
   * `budget`. May be 0 when even the first line/table alone overflows (the
   * caller then renders nothing rather than an oversized row).
   */
  keptLines: number;
  /** True when some trailing source lines were dropped to fit the budget. */
  clipped: boolean;
}
/**
 * How many leading source lines of `allLines` fit within `budget` RENDERED
 * terminal rows. Block-aware:
 *  - a non-table line costs {@link estimateWrappedRows};
 *  - a *completed* table costs the height of whichever layout TableRenderer will
 *    pick — horizontal (wrapped rows + chrome) or, when the terminal is too
 *    narrow OR a cell wraps past {@link TABLE_MAX_ROW_LINES}, the taller vertical
 *    `label: value` layout — capped at `tableClampRows` (TableRenderer clamps a
 *    streaming table's height to that);
 *  - a table that would overflow the remaining budget is cut *before* (kept for
 *    a later chunk / commit) unless it is the first block, in which case it is
 *    kept and the clamp bounds it, then the walk stops;
 *  - lines inside a fenced code block are charged individually (never treated as
 *    a table) so the estimate matches the renderer, which renders them as code.
 *
 * The result is an upper bound on the true rendered height of the kept prefix,
 * so callers that slice to `keptLines` can never overflow the viewport.
 */
export declare function fitPendingSlice(
  allLines: string[],
  contentWidth: number,
  budget: number,
  tableClampRows: number,
): PendingSliceResult;
