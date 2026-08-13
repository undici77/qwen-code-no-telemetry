/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
export type ColumnAlign = 'left' | 'center' | 'right';
interface TableRendererProps {
    headers: string[];
    rows: string[][];
    contentWidth: number;
    /** Per-column alignment parsed from markdown separator line */
    aligns?: ColumnAlign[];
    enableInlineMath?: boolean;
    /**
     * True while THIS table is still streaming its rows (the frontier). The
     * horizontal-vs-vertical decision is then anchored to the first row so the
     * format cannot flip as later rows arrive; a completed table (false/undefined)
     * — committed, or a mid-content table already closed by following text —
     * measures every row for the most readable layout.
     */
    isStreaming?: boolean;
    /**
     * Maximum rendered text lines the table may occupy. When set (streaming
     * preview) and the fully rendered table exceeds it, output is clipped to
     * `maxHeight - 1` lines plus a cue. Backstop against a wrapped-cell table
     * overflowing the viewport and triggering the scroll-to-top lock.
     */
    maxHeight?: number;
}
/**
 * Custom table renderer for markdown tables.
 *
 * Builds the table as pure ANSI strings (like Claude Code does)
 * to prevent Ink from inserting mid-row line breaks.
 *
 * Improvements over original:
 * 1. ANSI-aware + CJK-aware column width calculation via stringWidth
 * 2. Cell content wraps (multi-line) instead of truncation
 * 3. Supports left/center/right alignment from markdown separator markers
 * 4. Vertical fallback format when rows would be too tall
 * 5. Safety check against terminal resize races
 */
export declare const TableRenderer: React.FC<TableRendererProps>;
export {};
