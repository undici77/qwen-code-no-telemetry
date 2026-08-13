/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fsSync from 'node:fs';
import * as fs from 'node:fs/promises';
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
    /**
     * Ignore the existing target's permission bits and apply `mode`
     * regardless. Use for secrets that must heal historically over-permissive
     * files (e.g. a credential file accidentally restored from backup at
     * 0o644 must be forced back to 0o600). No effect when `mode` is unset.
     * Default: false.
     */
    forceMode?: boolean;
    /**
     * Do NOT follow symlinks at `filePath` — write to / replace the link
     * itself rather than its target. Pre-`atomicWriteFile` migration code
     * used `fs.rename(tmp, filePath)`, which atomically *replaces* a
     * symlink with the new regular file. The default behavior resolves
     * the chain and writes through, which is a security regression for
     * credential files on shared hosts (a pre-placed symlink could
     * redirect tokens to an attacker-controlled path). Credential write
     * sites pass `noFollow: true` to match the old replace-the-symlink
     * semantics. Default: false (follow symlinks). See PR #4333 review.
     */
    noFollow?: boolean;
    /** Reject the write immediately before its irreversible commit step. */
    assertCanCommit?: () => void;
}
/**
 * Rename a file with retry on EPERM/EACCES (common on Windows under
 * concurrent access). Uses exponential backoff.
 *
 * @param _renameImpl Internal test seam — defaults to `fs.rename`. Tests
 *   inject a mock to exercise retry, give-up, and non-retryable paths
 *   that vitest cannot otherwise spy on (ESM exports of `node:fs` are
 *   non-configurable).
 */
export declare function renameWithRetry(src: string, dest: string, retries: number, delayMs: number, _renameImpl?: (s: string, d: string) => Promise<void>): Promise<void>;
/**
 * Atomically write content to a file (write-to-temp + rename).
 *
 * Falls back to in-place write when the existing file's uid differs
 * from the process's euid — POSIX rename would reset ownership.
 * Also falls back on EXDEV (cross-device). Both fallbacks lose crash
 * atomicity but preserve the existing inode's uid.
 *
 * The parent directory of `filePath` must already exist.
 */
export declare function atomicWriteFile(filePath: string, data: string | Buffer, options?: AtomicWriteFileOptions, 
/**
 * Internal test seam — defaults to real `fs.rename` / `fs.writeFile` /
 * `fs.open`. Tests inject overrides to exercise EXDEV fallback and
 * rename-retry paths that vitest cannot spy on (ESM exports of `node:fs`
 * are non-configurable). The `open` seam additionally lets tests assert
 * the O_EXCL no-clobber create flag on the noFollow EXDEV path.
 * Production callers never pass this.
 */
_testFs?: {
    rename?: (s: string, d: string) => Promise<void>;
    writeFile?: typeof fs.writeFile;
    open?: typeof fs.open;
    chmod?: typeof fs.chmod;
    fchmod?: (fh: fs.FileHandle, mode: number) => Promise<void>;
    unlink?: typeof fs.unlink;
}): Promise<void>;
/** Atomically write a JSON value to a file. Delegates to {@link atomicWriteFile}. */
export declare function atomicWriteJSON(filePath: string, data: unknown, options?: AtomicWriteFileOptions): Promise<void>;
/**
 * Sync mirror of {@link renameWithRetry}. Retries on EPERM/EACCES with
 * exponential backoff (common on Windows under concurrent AV scans).
 *
 * @param _renameImpl Internal test seam — see {@link renameWithRetry}.
 */
export declare function renameWithRetrySync(src: string, dest: string, retries: number, delayMs: number, _renameImpl?: (s: string, d: string) => void): void;
/**
 * Synchronous variant of {@link atomicWriteFile}. Same semantics: symlink
 * resolution, permission preservation (or `forceMode` override), fsync via
 * `flush: true`, EPERM/EACCES rename retry, EXDEV fallback to direct write.
 *
 * Use for code paths that cannot await (e.g. settings persistence on
 * `process.exit`). Prefer the async variant when possible.
 */
export declare function atomicWriteFileSync(filePath: string, data: string | Buffer, options?: AtomicWriteFileOptions, 
/** Internal test seam — see {@link atomicWriteFile}. */
_testFs?: {
    rename?: (s: string, d: string) => void;
    writeFile?: typeof fsSync.writeFileSync;
    open?: typeof fsSync.openSync;
    chmod?: typeof fsSync.chmodSync;
    fchmod?: (fd: number, mode: number) => void;
    unlink?: typeof fsSync.unlinkSync;
}): void;
