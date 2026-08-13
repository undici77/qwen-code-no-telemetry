/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonUsageRange } from '@qwen-code/sdk/daemon';
import type { DaemonResourceOptions } from '../types.js';
export interface DaemonUsageDashboardOptions extends DaemonResourceOptions {
    /** Summary window: `today` (default) / `week` (7D) / `month` (30D). */
    range?: DaemonUsageRange;
    /** Trailing days for the heatmap; the server default (~6 months) is used
     * when omitted. Clamped server-side to 1..366. */
    heatmapDays?: number;
}
/**
 * Loads the aggregate token-usage dashboard (`GET /usage/dashboard`) behind the
 * Daemon Status "统计 / Usage" tab. Like {@link useDaemonStatusReport}, this is a
 * read-only resource; callers typically fetch on open + manual refresh rather
 * than polling, since the underlying aggregation can be I/O heavy.
 */
export declare function useDaemonUsageDashboard(options?: DaemonUsageDashboardOptions): {
    dashboard: import("@qwen-code/sdk/daemon").DaemonUsageDashboard | undefined;
    reload: () => Promise<import("@qwen-code/sdk/daemon").DaemonUsageDashboard | undefined>;
    data: import("@qwen-code/sdk/daemon").DaemonUsageDashboard | undefined;
    loading: boolean;
    error: Error | undefined;
};
