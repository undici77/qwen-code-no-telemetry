/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Point } from './selection-state.js';
export interface ViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/**
 * Maps a 1-based terminal cell (col, row) to composited-frame grid coordinates.
 *
 * The frame from the renderer is the whole root frame; its rows are indexed
 * from the frame top. In the alternate screen the frame is top-anchored when it
 * fits and bottom-pinned when it overflows, so the terminal row maps to a frame
 * row via the frame anchor (`min(0, terminalHeight - frameHeight)`), which is
 * negative on overflow. This is the same correction `layoutRowForEvent` applies.
 */
export declare function terminalToGrid(
  col: number,
  row: number,
  terminalHeight: number,
  frameHeight: number,
): Point;
/** Whether a grid point falls inside the history viewport region. */
export declare function pointInViewport(
  point: Point,
  rect: ViewportRect,
): boolean;
/** Clamps a grid point to the viewport interior, for drag extension. */
export declare function clampToViewport(
  point: Point,
  rect: ViewportRect,
): Point;
