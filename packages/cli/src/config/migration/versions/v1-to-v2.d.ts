/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SettingsMigration } from '../types.js';
/**
 * Heuristic indicators for deciding whether an object is "V1-like".
 *
 * Detection strategy:
 * - A file is considered migratable as V1 when:
 *   1) It is not explicitly versioned as V2+ (`$version` is missing or invalid), and
 *   2) At least one indicator key appears in a legacy-compatible top-level shape.
 * - Indicator list intentionally excludes keys that are valid top-level entries in
 *   both old and new structures to reduce false positives.
 *
 * Shape rule:
 * - Object values for indicator keys are treated as already-nested V2-like content
 *   and do not alone trigger migration.
 * - Primitive/array/null values on indicator keys are treated as legacy V1 signals.
 */
/**
 * V1 -> V2 migration (structural normalization stage).
 *
 * Migration contract:
 * - Input: settings in legacy V1-like shape (mostly flat, may contain mixed partial V2).
 * - Output: V2-compatible nested structure with `$version: 2`.
 * - No semantic inversion of disable* naming in this stage.
 *
 * Data-preservation strategy:
 * - Prefer transforming known keys into canonical V2 locations.
 * - Preserve unrecognized keys verbatim.
 * - Preserve parent-path scalar values when nested writes would collide with them.
 * - Preserve/merge existing partial V2 objects where safe.
 *
 * This class intentionally optimizes for backward compatibility and non-destructive
 * behavior over aggressive normalization.
 */
export declare class V1ToV2Migration implements SettingsMigration {
    readonly fromVersion = 1;
    readonly toVersion = 2;
    /**
     * Determines whether this migration should execute.
     *
     * Decision strategy:
     * - Hard-stop when `$version` is a number >= 2 (already V2+).
     * - Otherwise, scan indicator keys and trigger only when at least one indicator is
     *   still in legacy top-level shape (primitive/array/null).
     *
     * Mixed-shape tolerance:
     * - Files that are partially migrated are supported; V2-like object-valued indicators
     *   are ignored while legacy-shaped indicators can still trigger migration.
     */
    shouldMigrate(settings: unknown): boolean;
    /**
     * Performs non-destructive V1 -> V2 transformation.
     *
     * Detailed strategy:
     * 1) Relocate known V1 keys using `V1_TO_V2_MIGRATION_MAP`.
     *    - If a source value is already an object and maps to a child path of itself
     *      (partial V2 shape), merge child properties into target path.
     * 2) Relocate disable* keys into V2 disable* locations.
     *    - Consolidated keys (`disableAutoUpdate`, `disableUpdateNag`): normalize to
     *      boolean with stable-compatible presence semantics (`value === true`).
     *    - Other disable* keys: migrate only boolean values.
     * 3) Preserve `mcpServers` top-level placement.
     * 4) Carry over remaining keys:
     *    - If a key is parent of migrated nested paths, merge unprocessed object children.
     *    - If parent value is non-object, preserve that scalar/array/null as-is.
     *    - Otherwise copy untouched key/value.
     * 5) Stamp `$version = 2`.
     *
     * The method is pure with respect to input mutation.
     */
    migrate(settings: unknown, _scope: string): {
        settings: unknown;
        warnings: string[];
    };
}
/** Singleton instance of V1→V2 migration */
export declare const v1ToV2Migration: V1ToV2Migration;
