/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type { SettingsMigration, MigrationResult } from './types.js';
export { MigrationScheduler } from './scheduler.js';
export { v1ToV2Migration, V1ToV2Migration } from './versions/v1-to-v2.js';
export { v2ToV3Migration, V2ToV3Migration } from './versions/v2-to-v3.js';
export { v3ToV4Migration, V3ToV4Migration } from './versions/v3-to-v4.js';
import type { MigrationResult } from './types.js';
/**
 * Ordered array of all settings migrations.
 * Use this with MigrationScheduler to run the full migration chain.
 *
 * @example
 * ```typescript
 * const scheduler = new MigrationScheduler(ALL_MIGRATIONS);
 * const result = scheduler.migrate(settings);
 * ```
 */
export declare const ALL_MIGRATIONS: readonly [import("./versions/v1-to-v2.js").V1ToV2Migration, import("./versions/v2-to-v3.js").V2ToV3Migration, import("./versions/v3-to-v4.js").V3ToV4Migration];
/**
 * Convenience function that runs all migrations on the given settings.
 * This is the primary entry point for settings migration.
 *
 * @param settings - The settings object to migrate
 * @param scope - The scope of settings being migrated
 * @returns MigrationResult containing the final settings, version, and execution log
 *
 * @example
 * ```typescript
 * const result = runMigrations(settings, 'User');
 * if (result.executedMigrations.length > 0) {
 *   console.log(`Migrated from version ${result.executedMigrations[0].fromVersion} to ${result.finalVersion}`);
 * }
 * ```
 */
export declare function runMigrations(settings: unknown, scope: string): MigrationResult;
/**
 * Checks if the given settings need migration.
 * Returns true only if at least one registered migration would be applied.
 *
 * This function checks:
 * 1. If $version field exists and is a number:
 *    - Returns false if $version >= SETTINGS_VERSION
 *    - Returns true only when $version < SETTINGS_VERSION AND at least one
 *      migration can execute for the current settings shape
 * 2. If $version field is missing or invalid:
 *    - Uses fallback logic by checking individual migrations
 *
 * Note:
 * - Legacy numeric versions that have no executable migrations are handled by
 *   the settings loader via version normalization (bump metadata to current).
 *
 * @param settings - The settings object to check
 * @returns true if migration is needed, false otherwise
 */
export declare function needsMigration(settings: unknown): boolean;
