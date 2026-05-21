/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface MigrationResult {
    success: boolean;
    convertedFiles: string[];
    failedFiles: Array<{
        file: string;
        error: string;
    }>;
}
export interface MigrationOptions {
    /** Directory containing command files */
    commandDir: string;
    /** Whether to create backups (default: true) */
    createBackup?: boolean;
    /** Whether to delete original TOML files after migration (default: false) */
    deleteOriginal?: boolean;
}
/**
 * Scans a directory for TOML command files.
 * @param commandDir Directory to scan
 * @returns Array of TOML file paths (relative to commandDir)
 */
export declare function detectTomlCommands(commandDir: string): Promise<string[]>;
/**
 * Migrates TOML command files to Markdown format.
 * @param options Migration options
 * @returns Migration result with details
 */
export declare function migrateTomlCommands(options: MigrationOptions): Promise<MigrationResult>;
/**
 * Generates a migration report message.
 * @param tomlFiles List of TOML files found
 * @returns Human-readable migration prompt message
 */
export declare function generateMigrationPrompt(tomlFiles: string[]): string;
