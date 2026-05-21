/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Structural mapping table for V1 -> V2.
 *
 * Used by:
 * - v1->v2 migration execution
 * - warnings for residual legacy keys in latest-version settings files
 */
export declare const V1_TO_V2_MIGRATION_MAP: Record<string, string>;
/**
 * Top-level keys that are V2/V3 containers.
 * If one of these keys already has object value, treat it as latest-format data.
 */
export declare const V2_CONTAINER_KEYS: Set<string>;
/**
 * Legacy disable* keys that remain in disable* form for V2.
 */
export declare const V1_TO_V2_PRESERVE_DISABLE_MAP: Record<string, string>;
export declare const CONSOLIDATED_DISABLE_KEYS: Set<string>;
/**
 * Keys that indicate V1-like top-level structure when holding primitive values.
 */
export declare const V1_INDICATOR_KEYS: string[];
