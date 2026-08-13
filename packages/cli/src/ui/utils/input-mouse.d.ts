/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure helper for mapping a click inside the prompt input — a visual line
 * (absolute index into the buffer's visual lines) and a visual column (terminal
 * cells from the start of the text) — onto a logical cursor offset in the text
 * buffer. The DOM measurement that produces the visual row/col lives in the
 * component that owns the input box.
 */
/** The slice of TextBuffer state this helper reads. */
export interface ClickableBufferState {
    /** All visual (wrapped) lines for the current text + width. */
    allVisualLines: string[];
    /**
     * For each visual line, `[logicalLineIndex, startColInLogicalLine]` in code
     * points — where that visual line begins within its logical line.
     */
    visualToLogicalMap: Array<[number, number]>;
    /** Logical lines (newline-split). */
    lines: string[];
}
/**
 * Convert a click at `absoluteVisualRow` (index into allVisualLines) and
 * `clickVisualCol` (terminal cells from the start of the text, with the prefix
 * already excluded) into a logical cursor offset, or null if the row maps to no
 * line.
 *
 * Walks code points accumulating display width so wide characters (CJK, emoji)
 * map correctly, landing the cursor on the character boundary the click falls
 * within. The resulting column is clamped to the logical line length.
 */
export declare function visualClickToOffset(buffer: ClickableBufferState, absoluteVisualRow: number, clickVisualCol: number): number | null;
