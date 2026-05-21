/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Options for writeWithBackup function.
 */
export interface WriteWithBackupOptions {
    /** Suffix for backup file (default: '.orig') */
    backupSuffix?: string;
    /** File encoding (default: 'utf-8') */
    encoding?: BufferEncoding;
}
/**
 * Safely writes content to a file with backup protection.
 *
 * This function ensures data safety by:
 * 1. Writing content to a temporary file first
 * 2. Backing up the existing target file (if any)
 * 3. Renaming the temporary file to the target path
 *
 * If any step fails, an error is thrown and no partial changes are left on disk.
 * The backup file (if created) can be used for manual recovery.
 *
 * Note: This is not 100% atomic but provides good protection. In the worst case,
 * a .orig backup file remains that can be manually restored.
 *
 * @param targetPath - The path to write to
 * @param content - The content to write
 * @param options - Optional configuration
 * @throws Error if any step of the write process fails
 *
 * @example
 * ```typescript
 * await writeWithBackup('/path/to/settings.json', JSON.stringify(settings, null, 2));
 * // If /path/to/settings.json existed, it's now backed up to /path/to/settings.json.orig
 * ```
 */
export declare function writeWithBackup(targetPath: string, content: string, options?: WriteWithBackupOptions): Promise<void>;
/**
 * Synchronous version of writeWithBackup.
 *
 * @param targetPath - The path to write to
 * @param content - The content to write
 * @param options - Optional configuration
 * @throws Error if any step of the write process fails
 */
export declare function writeWithBackupSync(targetPath: string, content: string, options?: WriteWithBackupOptions): void;
