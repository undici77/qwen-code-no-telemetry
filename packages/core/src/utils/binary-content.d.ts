/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * True when a content type carries bytes that cannot be meaningfully decoded
 * as UTF-8 text. Unknown application/* types default to TEXT: structured
 * text formats (yaml, ndjson, toml, sql, ...) are routinely served under
 * application/, and mislabeled binaries are still caught by magic-byte
 * sniffing downstream.
 */
export declare function isBinaryContentType(contentType: string): boolean;
export declare function extensionForMimeType(mimeType: string | undefined): string;
export interface SniffedFileKind {
    /** Effective file extension (no dot). */
    extension: string;
    /** Effective mime type for display; falls back to the served Content-Type. */
    mimeType: string;
    /** True when magic bytes identified an unambiguous binary format. */
    magicMatched: boolean;
    /**
     * How the extension was determined: 'magic' bytes, a recognized 'name'
     * (Content-Disposition or URL filename), the Content-Type 'mime' map, or
     * the 'fallback' default. Callers deciding binary-vs-text on a headerless
     * response need this — a *recognized* .bin filename is binary, while the
     * fallback 'bin' just means "unknown".
     */
    extensionSource: 'magic' | 'name' | 'mime' | 'fallback';
}
/**
 * Determine the real file kind of fetched bytes. Servers frequently deliver
 * PDFs and Office files as application/octet-stream, so Content-Type alone
 * would persist them as .bin and strand every downstream consumer. Priority:
 * magic bytes → Content-Disposition filename → URL path extension →
 * Content-Type → bin.
 */
export declare function sniffFileKind(bytes: Buffer, contentType: string, contentDisposition: string, url: string): SniffedFileKind;
/**
 * Cheap "is this actually text?" heuristic for mislabeled bodies: NUL bytes
 * (present in virtually every real binary format, and in UTF-16) or invalid
 * UTF-8 in the leading window mean binary. A small replacement-char
 * allowance covers a multi-byte sequence cut at the window edge.
 */
export declare function looksLikeText(bytes: Buffer): boolean;
export type PersistBinaryResult = {
    filepath: string;
    size: number;
    ext: string;
} | {
    error: string;
};
/**
 * Write raw fetched bytes to `dir` with the given extension so the file can
 * be consumed by native tools afterwards (read_file for PDFs/images, shell
 * tools for archives). Callers derive `ext` via sniffFileKind.
 */
export declare function persistBinaryContent(bytes: Buffer, ext: string, dir: string, persistId: string): Promise<PersistBinaryResult>;
export declare function formatByteSize(sizeInBytes: number): string;
