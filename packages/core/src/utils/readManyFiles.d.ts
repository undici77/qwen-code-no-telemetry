/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PartListUnion } from '@google/genai';
import type { Config } from '../config/config.js';
/**
 * Options for reading multiple files.
 */
export interface ReadManyFilesOptions {
    /**
     * An array of file or directory paths to read.
     * Paths are relative to the project root.
     */
    paths: string[];
    /**
     * Optional AbortSignal for cancellation support.
     */
    signal?: AbortSignal;
    /**
     * When true and the vision bridge is enabled, keep images inline for a
     * text-only model (instead of an "unsupported" note) so the bridge can
     * transcribe them. Set only by the interactive `@`-resolution path, not by
     * the agent `read_many_files` tool.
     */
    preserveUnsupportedImageForBridge?: boolean;
    /**
     * File identities captured after caller-side workspace/ignore validation.
     * Matching paths are rechecked immediately before and after reading so a
     * replaced symlink or file is dropped instead of entering model context.
     */
    validatedPathIdentities?: ReadonlyMap<string, ReadManyFilesPathIdentity>;
    /**
     * User-facing labels for canonical paths. Callers that validate a realpath'd
     * target can keep the original @ reference in content delimiters.
     */
    displayPaths?: ReadonlyMap<string, string>;
}
export interface ReadManyFilesPathIdentity {
    dev: number;
    ino: number;
}
/**
 * Information about a single file that was read.
 */
export interface FileReadInfo {
    /** Absolute path to the file */
    filePath: string;
    /** Content of the file (string for text, Part for images/PDFs) */
    content: PartListUnion;
    /** Whether this is a directory listing rather than file content */
    isDirectory: boolean;
    /**
     * Error message when the read failed (e.g. missing pdftotext,
     * password-protected PDF, file too large). When present, `content`
     * holds the user-facing guidance string that was surfaced to the LLM,
     * and callers should render this entry as a failed read rather than a
     * successful one.
     */
    error?: string;
}
/**
 * Result from reading multiple files.
 */
export interface ReadManyFilesResult {
    /**
     * Content parts ready for LLM consumption.
     * For text files, content is concatenated with separators.
     * For images/PDFs, includes inline data parts.
     */
    contentParts: PartListUnion;
    /**
     * Individual file results with paths and content.
     * Used for recording each file read as a separate tool result.
     */
    files: FileReadInfo[];
    /**
     * Error message if an error occurred during file search.
     */
    error?: string;
}
/**
 * Reads content from multiple files and directories specified by paths.
 *
 * For directories, returns the folder structure.
 * For text files, concatenates their content into a single string with separators.
 * For image and PDF files, returns base64-encoded data.
 *
 * @param config - The runtime configuration
 * @param options - Options for file reading (paths, filters, signal)
 * @returns Result containing content parts and processed files
 *
 * NOTE: This utility is invoked only by explicit user-triggered file reads.
 * Do not apply workspace filters or path restrictions here.
 */
export declare function readManyFiles(config: Config, options: ReadManyFilesOptions): Promise<ReadManyFilesResult>;
