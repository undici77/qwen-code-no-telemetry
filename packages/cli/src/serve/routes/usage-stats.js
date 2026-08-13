/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { buildUsageDashboard, loadUsageHistoryWithLive, } from '@qwen-code/qwen-code-core';
import { writeStderrLine } from '../../utils/stdioHelpers.js';
const DEFAULT_HEATMAP_DAYS = 183;
const MIN_HEATMAP_DAYS = 1;
const MAX_HEATMAP_DAYS = 366;
const DEFAULT_CACHE_TTL_MS = 60_000;
// The summary window the UI toggle exposes (Today / 7D / 30D). A subset of
// core's `TimeRange`; core maps week→7 days and month→30 days.
const USAGE_RANGES = ['today', 'week', 'month'];
/** Parse `?range=`; anything invalid falls back to `today` (matches core). */
function parseRange(raw) {
    return typeof raw === 'string' &&
        USAGE_RANGES.includes(raw)
        ? raw
        : 'today';
}
/** Parse + clamp `?heatmapDays=`; anything invalid falls back to the default. */
function parseHeatmapDays(raw) {
    if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
        return DEFAULT_HEATMAP_DAYS;
    }
    const value = Number.parseInt(raw, 10);
    return Math.min(MAX_HEATMAP_DAYS, Math.max(MIN_HEATMAP_DAYS, value));
}
export function registerUsageStatsRoutes(app, deps = {}) {
    const loadHistory = deps.loadHistory ?? (() => loadUsageHistoryWithLive());
    const ttlMs = deps.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    let cache = null;
    const getRecords = () => {
        const now = Date.now();
        const fresh = cache !== null &&
            (cache.settledAt === null || now - cache.settledAt < ttlMs);
        if (!fresh) {
            const entry = { promise: loadHistory(), settledAt: null };
            cache = entry;
            entry.promise.then(() => {
                if (cache === entry)
                    entry.settledAt = Date.now();
            }, () => {
                if (cache === entry)
                    cache = null;
            });
        }
        return cache.promise;
    };
    app.get('/usage/dashboard', async (req, res) => {
        const range = parseRange(req.query['range']);
        const heatmapDays = parseHeatmapDays(req.query['heatmapDays']);
        try {
            const records = await getRecords();
            const dashboard = buildUsageDashboard(records, { range, heatmapDays });
            res.status(200).json(dashboard);
        }
        catch (err) {
            writeStderrLine(`qwen serve: GET /usage/dashboard failed: ${err instanceof Error ? err.message : String(err)}`);
            res.status(500).json({
                error: 'Failed to load usage dashboard',
                code: 'usage_dashboard_failed',
            });
        }
    });
}
//# sourceMappingURL=usage-stats.js.map