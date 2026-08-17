/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Read-only usage-dashboard surface behind the Web Shell Daemon Status
 * "统计 / Usage" tab. Serves the selected range's (`today`/`week`/`month`)
 * flattened token totals plus a trailing per-day heatmap, computed by core's
 * `buildUsageDashboard` from the local usage history (global `~/.qwen`,
 * cross-project). Uses `loadUsageHistoryWithLive`, which unions the durable
 * `usage_record.jsonl` (written only by the TUI `/clear` path) with a replay of
 * recent transcripts — so daemon / Web Shell sessions and any in-progress
 * session are counted here, unlike the TUI `/stats` view. The load is
 * read-only (never writes `~/.qwen`).
 *
 * Open GET (no `mutate` gate), consistent with `GET /daemon/status` and
 * `GET /scheduled-tasks`: it exposes only aggregate local usage counts.
 *
 * The heavy step — `loadUsageHistoryWithLive` can replay recent transcripts —
 * is cached once (range-independent), so toggling Today/7D/30D re-aggregates
 * cheaply from a single disk read instead of re-loading per range, and
 * concurrent requests coalesce onto the in-flight load.
 */
import type { Application } from 'express';
import { type UsageSummaryRecord } from '@qwen-code/qwen-code-core';
export interface RegisterUsageStatsRoutesDeps {
  /** Injectable for tests; defaults to core's disk-backed history loader. */
  loadHistory?: () => Promise<UsageSummaryRecord[]>;
  /** Coalescing/refresh window for the cached history. Defaults to 60s. */
  cacheTtlMs?: number;
}
export declare function registerUsageStatsRoutes(
  app: Application,
  deps?: RegisterUsageStatsRoutesDeps,
): void;
