/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ModelMetrics, type ModelMetricsCore } from '@qwen-code/qwen-code-core';
/**
 * One entry in the flattened view of the `models` metric map. Each entry
 * corresponds to a single row (in `StatsDisplay`) or column (in
 * `ModelStatsDisplay`).
 */
export interface ModelSourceEntry {
    /**
     * Stable React key built from the raw model name + source. Guaranteed
     * unique across the returned array, even when two raw model names
     * normalize to the same display label (e.g. `foo` and `foo-001`).
     */
    key: string;
    /**
     * Display label. Either the bare (possibly normalized) model name for
     * the single-source collapse case, or `${modelName} (${source})` when
     * the model has any non-main source.
     */
    label: string;
    /** Backing metrics — either the model aggregate or one source bucket. */
    metrics: ModelMetricsCore;
}
/**
 * Flattens `SessionMetrics.models` into a list of `(label, metrics)` entries
 * suitable for rendering one per row/column.
 *
 * Rules (matching the design doc `3215-subagent-stats-attribution.md`):
 * - Collapse is decided **session-wide**: if NO model in the entire session
 *   has any non-main source, every row renders with the plain model name
 *   (existing UX preserved).
 * - If ANY model in the session has a non-main source, EVERY row across
 *   ALL models renders with a `${model} (${source})` label — including the
 *   `(main)` rows — so the user can directly compare attribution across the
 *   whole stats panel. This matches the issue mockup, which shows
 *   `qwen-max (main)` alongside `qwen-plus (researcher)`.
 * - Within the split case, sources under a given model are sorted with
 *   `MAIN_SOURCE` first (if present), then the rest alphabetically.
 * - Models with zero requests (aggregate) are omitted.
 * - If `bySource` is somehow empty (defensive — callers shouldn't hit this),
 *   fall back to the aggregate row with the plain model name.
 */
export declare function flattenModelsBySource(models: Record<string, ModelMetrics>): ModelSourceEntry[];
