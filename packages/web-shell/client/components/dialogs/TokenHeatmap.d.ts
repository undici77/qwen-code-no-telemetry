/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
interface HeatmapDay {
    tokens: number;
    /** cachedTokens / inputTokens for that day, 0..1. */
    cacheReadRate: number;
}
interface TokenHeatmapProps {
    /** Per-day cells keyed by local `YYYY-MM-DD`. */
    heatmap: Record<string, HeatmapDay>;
    /** Trailing days the daemon aggregated (drives the rendered window). */
    days: number;
}
export declare function TokenHeatmap({ heatmap, days }: TokenHeatmapProps): import("react/jsx-runtime").JSX.Element;
export {};
