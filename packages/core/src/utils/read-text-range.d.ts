/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Stats } from 'node:fs';
import { type FileHandle } from 'node:fs/promises';
export interface ReadTextRangeRequest {
  path: string;
  offset?: number;
  limit?: number;
  maxOutputBytes: number;
  signal?: AbortSignal;
  stats?: Stats;
  /**
   * Upper bound on bytes read off disk while locating the requested window.
   * Line offsets address a byte stream, so a deep `offset` costs a scan from
   * byte 0 — this is what keeps that scan from being unbounded. Defaults to
   * `Infinity` so non-boundary callers (the `read_file` tool) are unchanged;
   * security boundaries must pass a finite value.
   */
  maxScanBytes?: number;
}
/**
 * Request shape for {@link readTextRangeFromHandle}.
 *
 * No `path`: the read is bound to the descriptor, so there is nothing for a
 * path to disambiguate. Both byte bounds are required rather than optional —
 * a handle-bound read exists because some caller pinned an inode at a security
 * boundary, and what makes such a read safe is that the bytes it *returns* and
 * the bytes it *scans* are each capped.
 */
export interface ReadTextRangeFromHandleRequest {
  offset?: number;
  limit?: number;
  /** Upper bound captured from the opened descriptor before reading. */
  fileSize: number;
  maxOutputBytes: number;
  maxScanBytes: number;
  signal?: AbortSignal;
}
export interface ReadTextRangeResult {
  content: string;
  originalLineCount: number;
  /**
   * Byte offset just past the last line the scanner passed, or `undefined` if
   * the stream reached EOF. Lets a line-addressed read hand back a byte cursor
   * so the *next* page costs O(1) instead of another scan from byte 0.
   */
  nextByteOffset?: number;
  encoding?: string;
  bom?: boolean;
  lineEnding?: 'crlf' | 'lf';
  originalLineCountExact: boolean;
  truncatedByBytes: boolean;
}
/**
 * Request for {@link readTextCursorWindowFromHandle}.
 *
 * `startOffset` is a byte offset, which is the whole point: a line offset has
 * to be resolved by scanning from byte 0, so paging by line is O(n²) across
 * pages. A byte offset is O(1), and `maxScanBytes` therefore does not apply.
 */
export interface ReadTextCursorWindowRequest {
  /** Byte offset to resume from. Expected to be the start of a line. */
  startOffset: number;
  /** File size as of the caller's `fstat`; bounds and EOF are relative to it. */
  fileSize: number;
  /** Maximum whole lines to return. */
  limit?: number;
  maxOutputBytes: number;
  /**
   * Bound on the forward scan used to reach a line boundary when
   * `startOffset` lands mid-line. A cursor this reader minted always points at
   * a line start, so the snap is a single byte comparison; the bound only
   * exists to stop a hand-written offset into a file with one enormous line
   * from scanning without limit.
   */
  maxSnapBytes: number;
  signal?: AbortSignal;
}
export interface ReadTextCursorWindowResult {
  content: string;
  /** Where reading actually began — differs from the request only after a snap. */
  startOffset: number;
  /** Byte offset of the next unreturned line. Absent once the file is exhausted. */
  nextOffset?: number;
  encoding: string;
  bom: boolean;
  lineEnding: 'crlf' | 'lf';
  truncatedByBytes: boolean;
}
/**
 * Raised when `startOffset` is not a line boundary and one cannot be reached
 * within `maxSnapBytes`. A malformed request, not an oversized file — the
 * caller supplied an offset this reader never would have.
 */
export declare class CursorNotAtLineBoundaryError extends Error {
  readonly startOffset: number;
  readonly maxSnapBytes: number;
  constructor(startOffset: number, maxSnapBytes: number);
}
export declare class LargeNonUtf8TextError extends Error {
  readonly encoding: string;
  readonly reason?: 'invalid-utf8' | undefined;
  constructor(encoding: string, reason?: 'invalid-utf8' | undefined);
}
/**
 * Raised when locating the requested line window would require reading more
 * than `maxScanBytes`. Distinct from `LargeNonUtf8TextError`: the file is
 * readable, the *offset* is what cannot be reached affordably.
 */
export declare class TextScanBudgetExceededError extends Error {
  readonly scannedBytes: number;
  readonly maxScanBytes: number;
  constructor(scannedBytes: number, maxScanBytes: number);
}
export declare function readTextRange(
  request: ReadTextRangeRequest,
): Promise<ReadTextRangeResult>;
/**
 * Range read bound to a caller-owned descriptor.
 *
 * Always streams: the buffering fast path would read the whole file, and a
 * caller reaches for a handle precisely when it needs the read bounded. The
 * handle is borrowed — every read uses an explicit position, and this function
 * never closes it.
 */
export declare function readTextRangeFromHandle(
  fileHandle: FileHandle,
  request: ReadTextRangeFromHandleRequest,
): Promise<ReadTextRangeResult>;
/**
 * Read whole lines starting at a byte offset, and report where the next line
 * begins.
 *
 * This is the O(1)-per-page counterpart to the line-addressed readers: it seeks
 * rather than counting newlines from byte 0, so paging a large log costs
 * O(file) in total instead of O(file²).
 */
export declare function readTextCursorWindowFromHandle(
  fileHandle: FileHandle,
  request: ReadTextCursorWindowRequest,
): Promise<ReadTextCursorWindowResult>;
export declare function detectLineEndingFromContent(
  content: string,
): 'crlf' | 'lf';
