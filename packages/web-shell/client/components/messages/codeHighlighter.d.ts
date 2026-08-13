/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Highlighter } from 'shiki';
export declare const SHIKI_CACHE_MAX = 128;
/** Returns previously-highlighted HTML for this exact code/lang/theme, or null. */
export declare function getCachedHtml(code: string, lang: string, theme: string): string | null;
/** Returns the shared highlighter with `lang` loaded (lazily, cached). */
export declare function getCodeHighlighter(lang: string): Promise<Highlighter>;
export declare const MAX_HIGHLIGHT_TOTAL_CHARS = 100000;
export declare const MAX_HIGHLIGHT_LINE_CHARS = 20000;
export declare function isTooLargeToHighlight(code: string): boolean;
/**
 * Synchronously highlights code to HTML *iff* the highlighter and language are
 * already warm (e.g. right after a streaming block settles). Returns null
 * otherwise, so the caller can fall back to the async path (or plain text).
 *
 * The size policy (isTooLargeToHighlight) lives at the caller, which already
 * gates before reaching this function — so it is not re-checked here.
 */
export declare function highlightToHtmlSync(code: string, lang: string, theme: string, persist?: boolean): string | null;
/** Resets all module-level highlighter state (incl. the HTML cache). Tests only. */
export declare function __resetForTesting(): void;
