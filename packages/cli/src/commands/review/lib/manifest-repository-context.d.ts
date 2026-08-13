/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { RepositoryContextProvider } from './repository-context.js';
/**
 * Visited-entry ceiling for one `relatedPaths` expansion, counted across all
 * scan roots. Dependency and build-output trees (SKIPPED_DIRECTORIES) are
 * never descended into, so only source-bearing entries count. Calibrated on
 * this repository: the whole `packages/` tree of an installed checkout stays
 * under it, so a honestly scoped manifest never fails a review, while a
 * pathological scan still ends. Exceeded, the provider throws (fail closed),
 * like every other manifest error.
 */
export declare const MAX_GLOB_CANDIDATES = 16384;
/**
 * Matching-work ceiling for one stage. The visited-entry cap bounds a
 * COUNT; the per-candidate matching work is a separate dimension — one
 * memoised `**` match is quadratic in segment LENGTH, and in an untrusted
 * repository an attacker controls both lengths within their schema maxima
 * (255-byte filenames, 512-character patterns), so billing segment COUNTS
 * never trips for a schema-legal stall shape. Every attempted pattern match
 * therefore charges `pattern.length × path.length` against this budget, in
 * the rule filter as well as the expansion, so a matching burst fails
 * closed instead of stalling the step. Calibrated so the documented
 * legitimate scan — every entry of an installed-checkout `packages/` tree
 * against a handful of realistic globs — stays far below it, while a
 * schema-max adversarial evaluation exhausts it within the first few dozen
 * candidates.
 */
export declare const MAX_MATCH_WORK: number;
export declare const manifestRepositoryContextProvider: RepositoryContextProvider;
