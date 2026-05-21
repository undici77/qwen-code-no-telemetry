/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Calculates the maximum *visual* width (terminal cells) of a multi-line
 * ASCII art string. Uses `string-width` semantics via `getCachedStringWidth`
 * so CJK fullwidth characters count as 2 cells and emoji are sized
 * correctly — `.length` would undercount these and let oversized art slip
 * past the width budget that `pickAsciiArtTier` applies.
 * @param asciiArt The ASCII art string.
 * @returns The widest line's terminal-cell width.
 */
export declare const getAsciiArtWidth: (asciiArt: string) => number;
export declare function toCodePoints(str: string): string[];
export declare function cpLen(str: string): number;
export declare function cpSlice(str: string, start: number, end?: number): string;
/**
 * Strip characters that can break terminal rendering.
 *
 * Uses Node.js built-in stripVTControlCharacters to handle VT sequences,
 * then filters remaining control characters that can disrupt display.
 *
 * Characters stripped:
 * - ANSI escape sequences (via strip-ansi)
 * - VT control sequences (via Node.js util.stripVTControlCharacters)
 * - C0 control chars (0x00-0x1F) except TAB/CR/LF which are handled elsewhere
 * - C1 control chars (0x80-0x9F) that can cause display issues
 *
 * Characters preserved:
 * - All printable Unicode including emojis
 * - DEL (0x7F) - handled functionally by applyOperations, not a display issue
 * - TAB (0x09) - needed for pasted tab-separated data (e.g. from spreadsheets)
 * - CR/LF (0x0D/0x0A) - needed for line breaks
 */
export declare function stripUnsafeCharacters(str: string): string;
/**
 * Cached version of stringWidth function for better performance
 * Follows Ink's approach with unlimited cache (no eviction)
 */
export declare const getCachedStringWidth: (str: string) => number;
export interface VisualHeightSlice {
    text: string;
    hiddenLinesCount: number;
}
interface SliceTextByVisualHeightOptions {
    minHeight?: number;
    reservedRows?: number;
    overflowDirection?: 'top' | 'bottom';
}
/**
 * Bounds text by terminal visual rows before it reaches Ink/Yoga layout.
 *
 * Explicit newlines and soft wraps caused by narrow terminals both count as
 * visual rows. `overflowDirection: "top"` keeps the newest tail, which is
 * useful for streaming logs; `"bottom"` keeps the beginning, which is useful
 * for task prompts.
 */
export declare function sliceTextByVisualHeight(text: string, maxHeight: number | undefined, maxWidth: number, options?: SliceTextByVisualHeightOptions): VisualHeightSlice;
/**
 * Clear the string width cache
 */
export declare const clearStringWidthCache: () => void;
export declare function escapeAnsiCtrlCodes<T>(obj: T): T;
/**
 * Sanitizes text by redacting potentially sensitive information like API keys,
 * tokens, and passwords. Also truncates long text to a maximum length.
 *
 * @param text The text to sanitize
 * @param maxLength Maximum length of the output text (default: 200)
 * @returns Sanitized and truncated text
 */
export declare function sanitizeSensitiveText(text: string, maxLength?: number): string;
/**
 * Make a git-supplied filename safe to drop into a TUI text node or a
 * stdout / log line. Strips both multi-byte ANSI sequences (via
 * `escapeAnsiCtrlCodes`) and bare control bytes that git happily round-trips
 * through `-z` paths but which would otherwise inject color resets, cursor
 * moves, BEL, or layout-breaking newlines into the rendered output.
 *
 * Use this anywhere a path from `fetchGitDiff`, `fetchGitDiffHunks`, or a
 * file-history backup is rendered to the user.
 */
export declare function sanitizeFilenameForDisplay(name: string): string;
export {};
