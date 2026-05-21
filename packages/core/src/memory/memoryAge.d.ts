/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Days elapsed since mtime. Floor-rounded — 0 for today, 1 for
 * yesterday, 2+ for older. Negative inputs (future mtime, clock skew)
 * clamp to 0.
 */
export declare function memoryAgeDays(mtimeMs: number): number;
/**
 * Human-readable age string. Models are poor at date arithmetic —
 * a raw ISO timestamp doesn't trigger staleness reasoning the way
 * "47 days ago" does.
 */
export declare function memoryAge(mtimeMs: number): string;
/**
 * Plain-text staleness caveat for memories >1 day old. Returns ''
 * for fresh (today/yesterday) memories — warning there is noise.
 */
export declare function memoryFreshnessText(mtimeMs: number): string;
/**
 * Per-memory staleness note wrapped in <system-reminder> tags.
 * Returns '' for memories ≤ 1 day old.
 */
export declare function memoryFreshnessNote(mtimeMs: number): string;
