/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReadonlyFrame } from 'ink';
import type {
  NormalizedSelection,
  Point,
  SelectionMode,
} from './selection-state.js';
/**
 * Word span (maximal run of non-whitespace cells) around a click, or null when
 * the click is on whitespace. Wide-character spacer cells (empty value) are
 * treated as part of the preceding glyph's run.
 */
export declare function wordSpanAt(
  frame: ReadonlyFrame | null,
  x: number,
  y: number,
): NormalizedSelection | null;
/** Nearest contiguous selectable line span around a click, or null if blank. */
export declare function lineSpanAt(
  frame: ReadonlyFrame | null,
  x: number,
  y: number,
): NormalizedSelection | null;
/** Resolve the span at a point for a word/line selection mode. */
export declare function spanAtForMode(
  frame: ReadonlyFrame | null,
  mode: Exclude<SelectionMode, 'char'>,
  point: Point,
): NormalizedSelection | null;
