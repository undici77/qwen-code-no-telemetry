/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SettingsMigration, MigrationResult } from './types.js';
/**
 * Formats a SettingScope enum value to a human-readable string.
 * - Converts to lowercase
 * - Special case: 'SystemDefaults' -> 'system default'
 */
export declare function formatScope(scope: string): string;
/**
 * Chain scheduler for settings migrations.
 *
 * The MigrationScheduler orchestrates multiple migrations in sequence,
 * delegating version detection to each individual migration via `shouldMigrate`.
 * It has no centralized version logic - migrations self-determine applicability.
 *
 * Key characteristics:
 * - Linear chain execution: migrations are applied in registration order
 * - Idempotent: already-migrated versions return false from shouldMigrate
 * - Adjacent versions only: each migration handles N → N+1
 * - Pure functions: migrations don't modify input objects
 */
export declare class MigrationScheduler {
    private readonly migrations;
    private readonly scope;
    /**
     * Creates a new MigrationScheduler with the given migrations.
     *
     * @param migrations - Array of migrations in execution order (typically ascending version)
     * @param scope - The scope of settings being migrated
     */
    constructor(migrations: SettingsMigration[], scope: string);
    /**
     * Executes the migration chain on the given settings.
     *
     * Iterates through all registered migrations in order. For each migration:
     * 1. Calls `shouldMigrate` with the current settings
     * 2. If true, calls `migrate` to transform the settings
     * 3. Records the execution
     *
     * The scheduler itself has no version awareness - all version detection
     * is delegated to the individual migrations.
     *
     * @param settings - The settings object to migrate
     * @returns MigrationResult containing the final settings, version, and execution log
     */
    migrate(settings: unknown): MigrationResult;
}
