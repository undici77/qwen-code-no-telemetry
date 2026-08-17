/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Stats } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import { type ReadTextCursorWindowResult } from '../utils/read-text-range.js';
import { type IconvLite } from '../utils/load-iconv-lite.js';
import type {
  ReadTextFileRequest,
  WriteTextFileRequest,
  WriteTextFileResponse,
} from '@agentclientprotocol/sdk';
import type { ToolWriteOrigin } from './tool-write-origin.js';
export type LineEnding = 'crlf' | 'lf';
export type ReadTextFileResponse = {
  content: string;
  _meta?: {
    bom?: boolean;
    encoding?: string;
    originalLineCount?: number;
    originalLineCountExact?: boolean;
    lineEnding?: LineEnding;
    truncatedByBytes?: boolean;
    /** Byte offset to resume from; absent once the read reached EOF. */
    nextByteOffset?: number;
  };
};
export type CoreReadTextFileRequest = Omit<
  ReadTextFileRequest,
  'sessionId' | 'line'
> & {
  /**
   * Core-local callers use 0-based line offsets. ACP protocol boundaries remain
   * 1-based and convert explicitly before remote calls.
   */
  line?: number | null;
  maxOutputBytes?: number;
  signal?: AbortSignal;
  stats?: Stats;
};
export type CoreWriteTextFileRequest = Omit<
  WriteTextFileRequest,
  'sessionId'
> & {
  /**
   * Internal core provenance for a final built-in tool write. This is not part
   * of any tool schema and is serialized only at the ACP boundary.
   */
  toolWriteOrigin?: ToolWriteOrigin;
};
/**
 * Handle-bound range read used by filesystem security boundaries. The caller
 * opens the descriptor, keeps it open for the duration, and closes it; this
 * request never transfers ownership.
 *
 * Declared standalone rather than derived from {@link CoreReadTextFileRequest}:
 * a handle-bound read shares only `line` and `signal` with a path-bound one, so
 * an `Omit` chain would strip more than it kept and would keep re-admitting
 * fields that this path has no use for. `fileSize` is the one value retained
 * from the descriptor's opening stat because it bounds reads against appends.
 *
 * Both byte bounds are required rather than optional: what makes a large-file
 * read safe at a boundary is that the *returned* bytes and the *scanned* bytes
 * are each capped. A finite `limit` is not one of those bounds — `limit: 20` at
 * `line: 900_000_000` still walks the whole file — so it stays optional and
 * `maxScanBytes` is what actually keeps the read affordable.
 */
export interface CoreReadTextFileHandleRequest {
  fileHandle: FileHandle;
  /** File size captured from the opened descriptor before reading. */
  fileSize: number;
  /** 0-based start line, matching {@link CoreReadTextFileRequest}. */
  line?: number | null;
  limit?: number;
  maxOutputBytes: number;
  maxScanBytes: number;
  signal?: AbortSignal;
}
/**
 * Byte-cursor read used by filesystem security boundaries to page text without
 * re-scanning from byte 0. Same borrowed-descriptor contract as
 * {@link CoreReadTextFileHandleRequest}.
 */
export interface CoreReadTextCursorRequest {
  fileHandle: FileHandle;
  startOffset: number;
  fileSize: number;
  limit?: number;
  maxOutputBytes: number;
  maxSnapBytes: number;
  signal?: AbortSignal;
}
/**
 * Supported file encodings for new files.
 */
export declare const FileEncoding: {
  readonly UTF8: 'utf-8';
  readonly UTF8_BOM: 'utf-8-bom';
};
/**
 * Type for file encoding values.
 */
export type FileEncodingType = (typeof FileEncoding)[keyof typeof FileEncoding];
/**
 * Interface for file system operations that may be delegated to different implementations
 */
export interface FileSystemService {
  readTextFile(params: CoreReadTextFileRequest): Promise<ReadTextFileResponse>;
  readTextFileFromHandle?(
    params: CoreReadTextFileHandleRequest,
  ): Promise<ReadTextFileResponse>;
  writeTextFile(
    params: CoreWriteTextFileRequest,
  ): Promise<WriteTextFileResponse>;
  /**
   * Finds files with a given name within specified search paths.
   *
   * @param fileName - The name of the file to find.
   * @param searchPaths - An array of directory paths to search within.
   * @returns An array of absolute paths to the found files.
   */
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
/**
 * Options for writing text files
 */
export interface WriteTextFileOptions {
  /**
   * Whether to write the file with UTF-8 BOM.
   * If true, EF BB BF will be prepended to the content.
   * @default false
   */
  bom?: boolean;
  /**
   * The encoding to use when writing the file.
   * If specified and not UTF-8 compatible, iconv-lite will be used to encode.
   * This is used to preserve the original encoding of non-UTF-8 files (e.g. GBK, Big5).
   * @default undefined (writes as UTF-8)
   */
  encoding?: string;
}
/**
 * Returns true if a newly created file at the given path should be written
 * with a UTF-8 BOM. Conditions (all must be true):
 * 1. Running on Windows
 * 2. System code page is not UTF-8
 * 3. File extension is in UTF8_BOM_EXTENSIONS (e.g. .ps1)
 */
export declare function needsUtf8Bom(filePath: string): boolean;
/**
 * Reset the UTF-8 BOM cache — useful for testing.
 */
export declare function resetUtf8BomCache(): void;
/**
 * Ensures content uses CRLF line endings. First normalizes any existing
 * CRLF to LF to avoid double-conversion, then converts all LF to CRLF.
 */
export declare function ensureCrlfLineEndings(content: string): string;
/**
 * Detects whether the content uses CRLF or LF line endings.
 * Returns 'crlf' if the content contains at least one CRLF sequence,
 * 'lf' otherwise (including for content with no line endings).
 */
export declare function detectLineEnding(content: string): LineEnding;
export interface PreparedTextFileContent {
  data: string | Buffer;
  encoding?: BufferEncoding;
}
export declare function prepareTextFileContent(
  filePath: string,
  content: string,
  meta?: ReadTextFileResponse['_meta'] | null,
  iconvLite?: IconvLite,
): PreparedTextFileContent | undefined;
export declare function prepareTextFileContentAsync(
  filePath: string,
  content: string,
  meta?: ReadTextFileResponse['_meta'] | null,
): Promise<PreparedTextFileContent>;
export declare function encodeTextFileContentAsync(
  filePath: string,
  content: string,
  meta?: ReadTextFileResponse['_meta'] | null,
): Promise<Buffer>;
/**
 * Standard file system implementation
 */
export declare class StandardFileSystemService implements FileSystemService {
  readTextFile(params: CoreReadTextFileRequest): Promise<ReadTextFileResponse>;
  readTextFileFromHandle(
    params: CoreReadTextFileHandleRequest,
  ): Promise<ReadTextFileResponse>;
  readTextCursorFromHandle(
    params: CoreReadTextCursorRequest,
  ): Promise<ReadTextCursorWindowResult>;
  writeTextFile(
    params: CoreWriteTextFileRequest,
  ): Promise<WriteTextFileResponse>;
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
