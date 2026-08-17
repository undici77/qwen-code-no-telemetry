/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type TimeRange,
  type UsageSummaryRecord,
} from './usageHistoryService.js';
/**
 * Flattened totals for the selected range, powering the usage-dashboard hero +
 * breakdown tiles. All token counts are summed across every model in the range.
 */
export interface UsageDashboardTotals {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  thoughtsTokens: number;
  requests: number;
  sessions: number;
  toolCalls: number;
  linesAdded: number;
  linesRemoved: number;
  /** cachedTokens / inputTokens as a 0..1 fraction (0 when there is no input). */
  cacheReadRate: number;
}
/** One model's share of the range's token spend, for the model-share list. */
export interface UsageModelShare {
  model: string;
  totalTokens: number;
  /** cachedTokens / inputTokens, 0..1. */
  cacheReadRate: number;
  /** totalTokens / range total, 0..1. */
  share: number;
}
/** One skill's invocation count over the range, for the skill-calls table. */
export interface UsageSkillCall {
  name: string;
  count: number;
}
/** One day's totals for the range's daily token/session charts. */
export interface UsageDailyPoint {
  date: string;
  tokens: number;
  sessions: number;
}
/** One heatmap cell: total tokens (drives intensity) + that day's cache rate. */
export interface UsageHeatmapDay {
  tokens: number;
  /** cachedTokens / inputTokens for that day, 0..1. */
  cacheReadRate: number;
}
export interface UsageDashboard {
  generatedAt: string;
  /** The range these totals cover; the heatmap below is always ~6 months. */
  range: TimeRange;
  summary: UsageDashboardTotals;
  /** Per-model token share for the range, sorted by tokens desc. */
  models: UsageModelShare[];
  /** Skill invocations for the range, sorted by count desc. */
  skills: UsageSkillCall[];
  /** Per-day tokens + sessions across the range window (continuous axis). */
  daily: UsageDailyPoint[];
  /** Per-day cells keyed by local `YYYY-MM-DD`, trailing `heatmapDays`. */
  heatmap: Record<string, UsageHeatmapDay>;
  heatmapDays: number;
}
export interface LoadUsageDashboardOptions {
  /** Aggregation window for the summary totals. Defaults to `today`. */
  range?: TimeRange;
  /** Trailing days covered by the heatmap. Defaults to ~6 months. */
  heatmapDays?: number;
}
/**
 * Build the dashboard from already-loaded usage records (pure — no I/O). Split
 * out from {@link loadUsageDashboard} so a caller can load the history once and
 * cheaply re-aggregate across ranges (the Today/7D/30D toggle) rather than
 * re-reading the whole history per range.
 */
export declare function buildUsageDashboard(
  records: UsageSummaryRecord[],
  options?: LoadUsageDashboardOptions,
): UsageDashboard;
/**
 * Read-only snapshot of local token usage for the daemon usage-dashboard API.
 * Loads the global cross-project history (`~/.qwen`) via
 * {@link loadUsageHistoryWithLive} — the persisted `usage_record.jsonl` unioned
 * with a replay of recent transcripts — so the totals include daemon / Web Shell
 * and in-progress sessions that the persisted file never captures. The load can
 * be I/O heavy on large histories, so callers should cache (the daemon route
 * caches the loaded records and re-runs {@link buildUsageDashboard} per range).
 */
export declare function loadUsageDashboard(
  options?: LoadUsageDashboardOptions,
): Promise<UsageDashboard>;
