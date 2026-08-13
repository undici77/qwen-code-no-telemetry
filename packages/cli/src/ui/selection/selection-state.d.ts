/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ScreenSelection } from 'ink';
/** A point in composited-frame coordinates: column `x`, grid row `y`. */
export interface Point {
    x: number;
    y: number;
}
/**
 * Selection granularity. `char` follows the pointer; `word` and `line` snap the
 * range to word/line boundaries (double/triple click, added in M4).
 */
export type SelectionMode = 'char' | 'word' | 'line';
/** Reading-order selection range, inclusive on both ends. */
export type NormalizedSelection = ScreenSelection;
/**
 * The anchor/focus selection model in visible-frame coordinates. The state is
 * pure: coordinate mapping (terminal → frame) and clearing on scroll live in the
 * hook that drives it. In VP mode (B1) the selection is visible-region only and
 * is cleared on scroll, so frame coordinates are sufficient.
 */
export declare class SelectionState {
    anchor: Point | null;
    focus: Point | null;
    dragging: boolean;
    mode: SelectionMode;
    start(point: Point, mode?: SelectionMode): void;
    extend(point: Point): void;
    finish(): void;
    clear(): void;
    get isEmpty(): boolean;
    /** True when the selection is a single point (a click with no drag). */
    get isCollapsed(): boolean;
    /**
     * A collapsed range is a real single-cell span in word/line mode, but only a
     * bare click in char mode.
     */
    get isBareClick(): boolean;
    /** Anchor/focus ordered into reading order, or null when empty. */
    normalized(): NormalizedSelection | null;
}
