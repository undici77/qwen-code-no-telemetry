/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SettingsMigration } from '../types.js';
/**
 * V2 -> V3 migration (boolean polarity normalization stage).
 *
 * Migration contract:
 * - Input: V2 settings object (`$version: 2`).
 * - Output: `$version: 3` with deprecated disable* fields removed and
 *   valid values migrated to enable* equivalents.
 *
 * Compatibility strategy:
 * - Accept boolean values and coercible strings "true"/"false".
 * - Remove invalid deprecated values (rather than preserving them).
 * - Emit warnings for each removed invalid deprecated key.
 * - Always bump version to 3 so future loads are idempotent and skip repeated checks.
 */
export declare class V2ToV3Migration implements SettingsMigration {
    readonly fromVersion = 2;
    readonly toVersion = 3;
    /**
     * Migration trigger rule.
     *
     * Execute only when `$version === 2`.
     * This includes V2 files with no migratable disable* booleans so that version
     * metadata still advances to 3.
     */
    shouldMigrate(settings: unknown): boolean;
    /**
     * Applies V2 -> V3 transformation with deterministic deprecated-key cleanup.
     *
     * Detailed strategy:
     * 1) Clone input.
     * 2) Process consolidated paths first:
     *    - Inspect each source path.
     *    - Normalize each present value (boolean / coercible string / invalid).
     *    - Always delete present deprecated source key.
     *    - Valid normalized values contribute to aggregate.
     *    - Invalid values emit warnings.
     *    - Emit consolidated target when at least one valid source was consumed.
     * 3) Process remaining one-to-one mappings:
     *    - For each unmapped source, normalize value.
     *    - If valid -> delete old key and write inverted target.
     *    - If invalid -> delete old key and emit warning.
     * 4) Set `$version = 3`.
     *
     * Guarantees:
     * - Input object is not mutated.
     * - Valid migration and invalid cleanup are deterministic.
     * - Deprecated disable* keys are not retained after migration.
     */
    migrate(settings: unknown, scope: string): {
        settings: unknown;
        warnings: string[];
    };
}
/** Singleton instance of V2→V3 migration */
export declare const v2ToV3Migration: V2ToV3Migration;
