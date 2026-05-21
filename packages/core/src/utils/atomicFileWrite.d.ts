/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface AtomicWriteOptions {
    /** Number of rename retries on EPERM/EACCES (default: 3). */
    retries?: number;
    /** Base delay in ms for exponential backoff (default: 50). */
    delayMs?: number;
}
export interface AtomicWriteFileOptions extends AtomicWriteOptions {
    /** File permission mode (e.g. 0o600). Preserves original if target exists. */
    mode?: number;
    /** Whether to fsync the temp file before rename. Default: true. */
    flush?: boolean;
    /** Encoding for string content. Default: 'utf-8'. */
    encoding?: BufferEncoding;
}
/**
 * Rename a file with retry on EPERM/EACCES (common on Windows under
 * concurrent access). Uses exponential backoff.
 */
export declare function renameWithRetry(src: string, dest: string, retries: number, delayMs: number): Promise<void>;
/**
 * Atomically write arbitrary content (string or Buffer) to a file.
 *
 * 1. Resolve symlinks (including broken ones) so the temp file lives
 *    next to the real target.
 * 2. Write to a temporary file with fsync (`flush: true` by default).
 * 3. Preserve the original file's permissions (or apply `options.mode`).
 * 4. Atomic rename (POSIX) with retry (Windows).
 * 5. On EXDEV (cross-device rename), fall back to direct write.
 *    **Note:** the EXDEV fallback is non-atomic — a crash mid-write
 *    can leave a partially-written file. EXDEV only occurs when the
 *    resolved target path is on a different filesystem than its parent
 *    directory, which is rare in practice.
 * 6. Always clean up the temp file on failure.
 *
 * The parent directory of `filePath` must already exist.
 */
export declare function atomicWriteFile(filePath: string, data: string | Buffer, options?: AtomicWriteFileOptions): Promise<void>;
/**
 * Atomically write a JSON value to a file.
 *
 * Delegates to {@link atomicWriteFile} for the actual atomic
 * write-to-temp + rename flow.
 *
 * Note: if `filePath` is a symlink, the write resolves the chain
 * and updates the real target file — the symlink itself is preserved.
 *
 * The parent directory of `filePath` must already exist.
 */
export declare function atomicWriteJSON(filePath: string, data: unknown, options?: AtomicWriteOptions): Promise<void>;
