/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shim for ink PR #968 (vadimdemedes/ink#968): extends measureElement()
 * to return {x, y, width, height}. Once the upstream PR is merged and
 * ink is upgraded, replace usages with `measureElement` from 'ink'
 * and delete this file.
 */
import { type DOMElement } from 'ink';
export interface ElementMetrics {
    /** Horizontal position (0-based column) within the live layout region. */
    x: number;
    /** Vertical position (0-based row) within the live layout region. */
    y: number;
    /** Element width in columns. */
    width: number;
    /** Element height in rows. */
    height: number;
}
/**
 * Measure the layout metrics of a `<Box>` element, including its position
 * within the live layout region.
 *
 * Coordinates are computed by walking up the yoga parent chain and
 * accumulating each ancestor's offset. In alternate-screen mode these
 * equal viewport coordinates directly; in inline mode callers must
 * subtract the live region's viewport anchor from mouse event rows.
 *
 * Must be called from post-render code (useEffect, useLayoutEffect,
 * input handlers, timer callbacks) — returns zeroes during render.
 */
export declare function measureElementPosition(node: DOMElement): ElementMetrics;
/**
 * Height (in rows) of the Ink live frame — the computed height of the root of
 * the yoga tree that `node` belongs to.
 *
 * In alternate-screen mode the frame is bottom-anchored to the terminal, so the
 * frame top sits at `terminalHeight - frameHeight` (see utils/list-mouse.ts
 * `frameAnchor`). When the frame is TALLER than the terminal that value is
 * negative — the top rows are scrolled off the top edge — which is exactly the
 * correction needed to map mouse rows back onto layout rows.
 *
 * Like {@link measureElementPosition}, must be called from post-render code and
 * returns 0 during render.
 */
export declare function measureFrameHeight(node: DOMElement): number;
/**
 * Map a 1-based terminal mouse row onto the 0-based layout row of `node`'s
 * frame — i.e. a row directly comparable to a measured element's `y`. Combines
 * the frame-anchor correction ({@link frameAnchor} over {@link measureFrameHeight})
 * with {@link terminalRowToLayoutRow}.
 *
 * Single-sources the anchor→layout-row mapping shared by RowMouseController and
 * TextInputMouseController, so the (previously off-by-one) correction can't
 * drift between the two. Must be called from post-render code.
 */
export declare function layoutRowForEvent(node: DOMElement, terminalRow1Based: number, terminalHeight: number): number;
