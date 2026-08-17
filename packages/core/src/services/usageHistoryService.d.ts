/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionMetrics } from '../telemetry/uiTelemetry.js';
export interface UsageSummaryRecord {
  version: 1;
  sessionId: string;
  timestamp: number;
  startTime: number;
  project: string;
  durationMs: number;
  totalLatencyMs?: number;
  models: Record<
    string,
    {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      thoughtsTokens: number;
      totalTokens: number;
      totalLatencyMs?: number;
    }
  >;
  tools: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    byName: Record<
      string,
      {
        count: number;
        success: number;
        fail: number;
        totalDurationMs?: number;
      }
    >;
  };
  files: {
    linesAdded: number;
    linesRemoved: number;
  };
  /** Optional — older records (written before skills were tracked) omit it. */
  skills?: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    byName: Record<
      string,
      {
        count: number;
        success: number;
        fail: number;
      }
    >;
  };
}
export type TimeRange = 'today' | 'week' | 'month' | 'all';
export interface AggregatedReport {
  timeRange: TimeRange;
  periodStart: Date;
  periodEnd: Date;
  sessionCount: number;
  totalDurationMs: number;
  totalLatencyMs: number;
  totalRequests: number;
  models: Record<
    string,
    {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      thoughtsTokens: number;
      totalTokens: number;
      totalLatencyMs: number;
    }
  >;
  tools: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    topTools: Array<{
      name: string;
      count: number;
      success: number;
      fail: number;
      totalDurationMs: number;
    }>;
  };
  files: {
    linesAdded: number;
    linesRemoved: number;
  };
  skills: {
    totalCalls: number;
    topSkills: Array<{
      name: string;
      count: number;
      success: number;
      fail: number;
    }>;
  };
  projects: Array<{
    path: string;
    sessionCount: number;
    totalDurationMs: number;
    totalTokens: number;
  }>;
}
export declare function persistSessionUsage(params: {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  project: string;
  metrics: SessionMetrics;
}): void;
export declare function metricsToUsageRecord(
  sessionId: string,
  project: string,
  startTime: number,
  endTime: number,
  metrics: SessionMetrics,
): UsageSummaryRecord;
/**
 * Salvages a session's usage summary into `usage_record.jsonl` right before
 * its transcript is deleted (#7384): the usage-history rebuild reads
 * transcripts, so deleting a session that was never `/clear`ed or cleanly
 * exited previously erased its usage from the records forever.
 *
 * Never throws — deletion must proceed even when salvage fails — and skips
 * the write when the persisted history already carries a record for the
 * session (a `/clear` or exit already wrote the authoritative summary;
 * duplicating it would re-open #4994). Returns true when a record was
 * written.
 */
export declare function persistUsageBeforeTranscriptDeletion(
  transcriptPath: string,
): Promise<boolean>;
export declare function loadUsageHistory(
  skipSessionInRebuild?: string,
  options?: {
    persistRebuild?: boolean;
  },
): Promise<UsageSummaryRecord[]>;
/**
 * Load the durable usage history **and** merge in sessions that were never
 * written to `usage_record.jsonl` — notably daemon / Web Shell sessions (only
 * the TUI `/clear` path persists usage) and any still-in-progress session.
 *
 * Unlike {@link loadUsageHistory}, which returns the persisted file verbatim
 * whenever it is non-empty (and so silently omits everything not yet
 * persisted), this replays recent transcripts for sessions the persisted file
 * does not already cover and unions the two. Persisted records win on any
 * sessionId conflict — they are the authoritative final snapshot. This is what
 * the daemon usage-dashboard reads so its totals reflect live Web Shell
 * activity. Read-only: never writes `usage_record.jsonl`.
 *
 * The transcript scan is bounded to a trailing window (mtime-based) so an
 * established history does not pay a full cross-project replay on every load.
 */
export declare function loadUsageHistoryWithLive(options?: {
  /**
   * Only replay transcripts touched at/after this epoch-ms. Defaults to a
   * {@link LIVE_REBUILD_WINDOW_DAYS}-day trailing window (covers the dashboard's
   * summary + daily charts; see the constant for the heatmap trade-off).
   */
  sinceMs?: number;
}): Promise<UsageSummaryRecord[]>;
export declare function getTimeRangeBounds(range: TimeRange): {
  start: Date;
  end: Date;
};
export declare function aggregateUsage(
  records: UsageSummaryRecord[],
  range: TimeRange,
): AggregatedReport;
