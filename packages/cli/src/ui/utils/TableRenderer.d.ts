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
