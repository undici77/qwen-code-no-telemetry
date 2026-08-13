/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import type { PartListUnion } from '@google/genai';
import { ToolErrorType } from '../tools/tool-error.js';
import type { Config } from '../config/config.js';
import type { VisionBridgePdfContinuation } from '../services/visionBridge/vision-bridge-service.js';
import { type ReadTextRangeResult } from './read-text-range.js';
export declare const DEFAULT_ENCODING: BufferEncoding;
export type UnicodeEncoding = 'utf8' | 'utf16le' | 'utf16be' | 'utf32le' | 'utf32be';
export interface BOMInfo {
    encoding: UnicodeEncoding;
    bomLength: number;
}
/**
 * Detect a Unicode BOM (Byte Order Mark) if present.
 * Reads up to the first 4 bytes and returns encoding + BOM length, else null.
 */
export declare function detectBOM(buf: Buffer): BOMInfo | null;
/**
 * Check whether a buffer is valid UTF-8 by attempting a strict decode.
 * If any invalid byte sequence is encountered, TextDecoder with `fatal: true` throws.
 */
export declare function isValidUtf8(buffer: Buffer): boolean;
/**
 * Result of reading a file with encoding detection.
 */
export interface FileReadResult {
    /** Decoded text content of the file (BOM stripped if present). */
    content: string;
    /** Detected encoding name (e.g. 'utf-8', 'gb18030', 'utf-16le'). */
    encoding: string;
    /**
     * Whether the file had a Unicode BOM (UTF-8, UTF-16 LE/BE, or UTF-32 LE/BE).
     * When true, the same BOM should be re-written on save to preserve the file's
     * original byte-order mark.
     */
    bom: boolean;
}
export declare function decodeBufferWithEncodingInfoAsync(full: Buffer): Promise<FileReadResult>;
/**
 * Internal helper: decode a buffer given a BOMInfo.
 * Returns the decoded string for each supported BOM encoding.
 */
export declare function decodeBOMBuffer(buf: Buffer, bomInfo: BOMInfo): string;
/**
 * Map a BOMInfo encoding to a canonical encoding name string.
 */
export declare function bomEncodingToName(bomEncoding: UnicodeEncoding): string;
/**
 * Read a file as text, honoring BOM encodings (UTF‑8/16/32) and stripping the BOM.
 * For files without BOM, validates UTF-8 first. If invalid UTF-8, uses chardet
 * to detect encoding (e.g. GBK, Big5, Shift_JIS) and iconv-lite to decode.
 * Falls back to utf8 when detection fails.
 *
 * Returns both the decoded content and the detected encoding/BOM information
 * in a single I/O pass, avoiding redundant file reads.
 */
export declare function readFileWithEncodingInfo(filePath: string, signal?: AbortSignal): Promise<FileReadResult>;
/**
 * Read a file as text, honoring BOM encodings (UTF‑8/16/32) and stripping the BOM.
 * For files without BOM, validates UTF-8 first. If invalid UTF-8, uses chardet
 * to detect encoding (e.g. GBK, Big5, Shift_JIS) and iconv-lite to decode.
 * Falls back to utf8 when detection fails.
 */
export declare function readFileWithEncoding(filePath: string): Promise<string>;
export declare function countFileLines(filePath: string): Promise<number>;
export declare function readFileWithLineAndLimit(params: {
    path: string;
    limit: number;
    line?: number;
    maxOutputBytes?: number;
    signal?: AbortSignal;
    stats?: import('node:fs').Stats;
}): Promise<ReadTextRangeResult>;
/**
 * Detect the encoding of a file by reading a sample from its beginning.
 * Returns the encoding name (e.g. 'utf-8', 'gbk', 'shift_jis').
 * Uses BOM detection first, then UTF-8 validation, then chardet as fallback.
 *
 * Accepts an already-open handle so a caller that has pinned an inode can be
 * told the encoding of *that* inode rather than of whatever the path resolves
 * to now. A supplied handle is borrowed: reads go through explicit positions so
 * the caller's file position is untouched, and it is never closed here.
 */
export declare function detectFileEncoding(source: string | fs.promises.FileHandle): Promise<string>;
/**
 * Looks up the specific MIME type for a file path.
 * @param filePath Path to the file.
 * @returns The specific MIME type string (e.g., 'text/python', 'application/javascript') or undefined if not found or ambiguous.
 */
export declare function getSpecificMimeType(filePath: string): string | undefined;
/**
 * Checks if a path is within a given root directory.
 * @param pathToCheck The absolute path to check.
 * @param rootDirectory The absolute root directory.
 * @returns True if the path is within the root directory, false otherwise.
 */
export declare function isWithinRoot(pathToCheck: string, rootDirectory: string): boolean;
/**
 * Heuristic: determine if a file is likely binary.
 * Now BOM-aware: if a Unicode BOM is detected, we treat it as text.
 * For non-BOM files, retain the existing null-byte and non-printable ratio checks.
 */
export declare function isBinaryFile(filePath: string): Promise<boolean>;
export type FileType = 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary' | 'svg' | 'notebook';
/**
 * Detects the type of file based on extension and content.
 * @param filePath Path to the file.
 * @returns Promise that resolves to a FileType string.
 */
export declare function detectFileType(filePath: string): Promise<FileType>;
export interface ProcessedFileReadResult {
    llmContent: PartListUnion;
    returnDisplay: string;
    error?: string;
    errorType?: ToolErrorType;
    originalLineCount?: number;
    originalLineCountExact?: boolean;
    isTruncated?: boolean;
    linesShown?: [number, number];
    /**
     * The Stats taken at the start of the read pipeline, before the
     * actual content read. Surfaced so the FileReadCache can record
     * a fingerprint that matches the bytes the model actually
     * received — a post-read re-stat would describe a possibly-
     * mutated file rather than the file the read returned.
     */
    stats?: import('node:fs').Stats;
    /**
     * Structured context for a PDF rendered specifically for a text-only
     * model's vision bridge. Callers must either replace the image parts with a
     * transcription or restore `fallback`; raw candidate images must never be
     * forwarded to the primary model.
     */
    pdfVisionBridgeCandidate?: PDFVisionBridgeCandidate;
    /** User-only disclosure attached after a prepared PDF candidate runs. */
    pdfVisionBridgeNotice?: string;
}
export interface PDFVisionBridgeFallback {
    llmContent: string;
    returnDisplay: string;
    error: string;
    errorType: ToolErrorType;
}
export interface PDFVisionBridgeCandidate {
    reason: 'text_extraction_failed' | 'single_page_text_overflow';
    displayName: string;
    renderedRange: {
        firstPage: number;
        lastPage: number;
    };
    continuation?: VisionBridgePdfContinuation;
    fallback: PDFVisionBridgeFallback;
}
/**
 * Whether a {@link ProcessedFileReadResult} may be cached for prior-read
 * enforcement: the payload must be plain text (not an image / PDF `Part`)
 * and carry a known line count. Shared by `read-file.ts` and
 * `readManyFiles.ts` so both read paths derive `cacheable` identically and
 * agree on what Edit / WriteFile may later mutate.
 */
export declare function isCacheableReadResult(result: ProcessedFileReadResult): boolean;
export interface ProcessSingleFileContentOptions {
    offset?: number;
    limit?: number;
    pages?: string;
    /**
     * When true, keep an image inline for a text-only model instead of replacing
     * it with an "unsupported" note. Vision Bridge callers set this only after
     * confirming that another model can interpret the image.
     */
    preserveUnsupportedImage?: boolean;
    /**
     * Prepare PDF page images for `read_file` to transcribe through the vision
     * bridge. Unlike `preserveUnsupportedImage`, this never changes how ordinary
     * image files are handled.
     */
    preparePdfForVisionBridge?: boolean;
    signal?: AbortSignal;
    /**
     * Large full-PDF text fallback returns a tool error by default. `@`-attached
     * PDFs use `reference` so the model gets guidance without a failed read.
     */
    largePdfBehavior?: 'error' | 'reference';
    displayPath?: string;
    textFileHandle?: FileHandle;
    textFileStats?: import('node:fs').Stats;
    textFileMaxScanBytes?: number;
}
/**
 * Reads and processes a single file, handling text, images, PDFs, and notebooks.
 * @param filePath Absolute path to the file.
 * @param config Config instance for truncation settings.
 * @param options Optional read behavior controls.
 * @returns ProcessedFileReadResult object.
 */
export declare function processSingleFileContent(filePath: string, config: Config, options?: ProcessSingleFileContentOptions): Promise<ProcessedFileReadResult>;
export declare function processSingleFileContent(filePath: string, config: Config, offset?: number, limit?: number, pages?: string): Promise<ProcessedFileReadResult>;
export declare function getRangeReadByteLimit(config: Config): number;
export declare function fileExists(filePath: string): Promise<boolean>;
