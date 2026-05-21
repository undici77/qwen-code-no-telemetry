/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
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
}): Promise<PDFTextResult>;
