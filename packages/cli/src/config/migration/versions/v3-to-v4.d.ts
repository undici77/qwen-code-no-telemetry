/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SettingsMigration } from '../types.js';
/**
 * V3 -> V4 migration (gitCoAuthor boolean → object expansion).
 *
 * Before V4, `general.gitCoAuthor` was a single boolean that governed both
 * commit message attribution and PR body attribution. V4 splits those into
 * two independent sub-toggles so users can disable one without losing the
 * other. This migration rewrites any stored boolean into `{ commit: v,
 * pr: v }` so the user's prior choice carries over to both new toggles and
 * the settings dialog reads the expected object shape.
 *
 * Compatibility strategy:
 * - Boolean values are expanded in place.
 * - Object values with `commit`/`pr` keys are left untouched (forward-
 *   compatible — a user who edited their settings.json by hand to the new
 *   shape is already on V4-equivalent data).
 * - Any other present value (string, number, array, null) is dropped with
 *   a warning so the caller sees an actionable message.
 */
export declare class V3ToV4Migration implements SettingsMigration {
    readonly fromVersion = 3;
    readonly toVersion = 4;
    shouldMigrate(settings: unknown): boolean;
    migrate(settings: unknown, scope: string): {
        settings: unknown;
        warnings: string[];
    };
}
export declare const v3ToV4Migration: V3ToV4Migration;
