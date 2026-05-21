/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionMetrics, ComputedSessionStats, ModelMetricsCore } from '../contexts/SessionContext.js';
export declare function calculateErrorRate(metrics: ModelMetricsCore): number;
export declare function calculateAverageLatency(metrics: ModelMetricsCore): number;
export declare function calculateCacheHitRate(metrics: ModelMetricsCore): number;
export declare const computeSessionStats: (metrics: SessionMetrics) => ComputedSessionStats;
