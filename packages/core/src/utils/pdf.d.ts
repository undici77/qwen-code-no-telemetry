/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const PDF_MAX_PAGES_PER_READ = 20;
export declare const PDF_TEXT_RESULT_MAX_TOKENS = 12000;
export declare const PDF_TEXT_EXTRACTION_UNAVAILABLE_MESSAGE = "pdftotext is not installed. Install poppler-utils to enable PDF text extraction (e.g. `apt-get install poppler-utils` or `brew install poppler`).";
export declare const PDF_RENDER_UNAVAILABLE_MESSAGE = "pdftoppm is not installed. Install poppler-utils to enable PDF page rendering (e.g. `apt-get install poppler-utils` or `brew install poppler`).";
/**
 * Longest-edge pixel cap passed to `pdftoppm -scale-to`. Bounds each rendered
 * page's JPEG size — and thus its base64 payload and vision-token cost —
 * independently of the PDF's physical page dimensions. Mirrors claude-code's
 * page-as-image rendering. NOTE: `-scale-to` overrides `-r`, so the two must
 * never be combined.
 */
export declare const PDF_RENDER_SCALE_TO_PX = 1600;
export interface PDFPageRangeRequirement {
    required: boolean;
    effectivePageCount: number;
    hadPdfInfo: boolean;
}
export declare function shouldRequirePDFPageRange(pageCount: number | null, sizeBytes: number): PDFPageRangeRequirement;
export declare function estimatePDFTextOutputTokens(text: string): number;
export declare function buildLargePDFGuidance(displayName: string, requirement: PDFPageRangeRequirement): string;
export declare function buildPDFTextTooLargeGuidance(displayName: string, estimatedTokens: number, pagesUsed?: string): string;
/**
 * Parse a page range string into firstPage/lastPage numbers.
 * Supported formats:
 * - "5" → { firstPage: 5, lastPage: 5 }
 * - "1-10" → { firstPage: 1, lastPage: 10 }
 * - "3-" → { firstPage: 3, lastPage: Infinity }
 *
 * Returns null on invalid input (non-numeric, zero, inverted range).
 * Pages are 1-indexed.
 */
export declare function parsePDFPageRange(pages: string): {
    firstPage: number;
    lastPage: number;
} | null;
/**
 * Check whether `pdftotext` (from poppler-utils) is available.
 * The result is cached for the lifetime of the process. The in-flight
 * promise is also cached so N concurrent callers (e.g. @-reading a
 * directory of PDFs) don't each spawn their own probe subprocess.
 */
export declare function isPdftotextAvailable(): Promise<boolean>;
/**
 * Reset the pdftotext availability cache. Used by tests only.
 */
export declare function resetPdftotextCache(): void;
/**
 * Get the number of pages in a PDF using `pdfinfo` (from poppler-utils).
 * Returns null if pdfinfo is not available or page count cannot be determined.
 */
export declare function getPDFPageCount(filePath: string): Promise<number | null>;
export type PDFTextResult = {
    success: true;
    text: string;
} | {
    success: false;
    error: string;
};
/**
 * Extract text from a PDF file using `pdftotext`.
 * Outputs to stdout (`-` argument).
 *
 * @param filePath Path to the PDF file
 * @param options Optional page range (1-indexed, inclusive)
 */
export declare function extractPDFText(filePath: string, options?: {
    firstPage?: number;
    lastPage?: number;
    signal?: AbortSignal;
}): Promise<PDFTextResult>;
/**
 * Check whether `pdftoppm` (from poppler-utils) is available. Mirrors
 * {@link isPdftotextAvailable}: the result and the in-flight probe promise are
 * cached for the process lifetime so concurrent render callers share one probe.
 */
export declare function isPdftoppmAvailable(): Promise<boolean>;
/**
 * Reset the pdftoppm availability cache. Used by tests only.
 */
export declare function resetPdftoppmCache(): void;
export interface PDFRenderedImage {
    /** base64-encoded JPEG data (no `data:` URI prefix). */
    data: string;
    mimeType: string;
}
export type PDFRenderResult = {
    success: true;
    images: PDFRenderedImage[];
    bytesTruncated: boolean;
} | {
    success: false;
    error: string;
};
/**
 * Render PDF pages to JPEG images using `pdftoppm` (from poppler-utils). Each
 * page becomes one base64 JPEG whose longest edge is capped at
 * {@link PDF_RENDER_SCALE_TO_PX}, giving a bounded token cost per page
 * regardless of text density — the fallback path when text extraction
 * overflows or fails on a vision-capable model.
 *
 * @param filePath Path to the PDF file.
 * @param options Optional 1-indexed inclusive page range. Omit `firstPage` to
 *   render from the start; an `Infinity` `lastPage` renders through the end.
 */
export declare function renderPDFPagesToImages(filePath: string, options?: {
    firstPage?: number;
    lastPage?: number;
}): Promise<PDFRenderResult>;
