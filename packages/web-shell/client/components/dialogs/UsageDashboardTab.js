import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useUsageDashboard, } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { formatMegaTokens } from '../../utils/formatTokenCount';
import { TokenHeatmap } from './TokenHeatmap';
import { SvgLineChart } from './SvgLineChart';
import styles from './UsageDashboardTab.module.css';
// The heatmap window as one semantic constant: the sub-label uses the month
// count directly, and the day count (for the day-bucketed API) is derived from
// it, so the label and the requested window can never drift.
const HEATMAP_MONTHS = 12;
// 30.44 = average days per month, so 12 months ≈ 365 days.
const HEATMAP_DAYS = Math.round(HEATMAP_MONTHS * 30.44);
// The summary-period toggle (mockup: Today / 7D / 30D). `week`/`month` map to
// core's trailing 7/30-day windows.
const RANGES = ['today', 'week', 'month'];
const PERIOD_LABEL_KEY = {
    today: 'daemon.usage.today',
    week: 'daemon.usage.period7d',
    month: 'daemon.usage.period30d',
};
const HERO_LABEL_KEY = {
    today: 'daemon.usage.today',
    week: 'daemon.usage.rangeWeek',
    month: 'daemon.usage.rangeMonth',
};
// Short window word prefixed to the model/skill/chart section titles (mockup:
// "7 DAYS MODEL SHARE"). Uppercased by CSS.
const RANGE_WORD_KEY = {
    today: 'daemon.usage.rangeWordToday',
    week: 'daemon.usage.rangeWordWeek',
    month: 'daemon.usage.rangeWordMonth',
};
// Fixed categorical palette for the model rows (rank badge + bar + share%).
const RANK_COLORS = [
    '#3b82f6',
    '#14b8a6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#22c55e',
    '#06b6d4',
    '#ec4899',
];
function dayMs(dateKey) {
    return new Date(`${dateKey}T00:00:00`).getTime();
}
function shortDay(dateKey, locale) {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
    });
}
function shortDayMs(ms, locale) {
    return new Date(ms).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
    });
}
function Stat({ label, value }) {
    return (_jsxs("div", { className: styles.stat, children: [_jsx("div", { className: styles.statValue, children: value.toLocaleString() }), _jsx("div", { className: styles.statLabel, children: label })] }));
}
function Metric({ accent, value, label, hint, }) {
    return (_jsxs("div", { className: styles.metric, children: [_jsxs("div", { className: styles.metricHead, children: [_jsx("span", { className: `${styles.tick} ${styles[`tick_${accent}`]}` }), _jsx("span", { className: styles.metricLabel, children: label })] }), _jsx("div", { className: styles.metricValue, children: value }), _jsx("div", { className: styles.metricHint, children: hint })] }));
}
function ModelRow({ rank, model, color, }) {
    const { t } = useI18n();
    const sharePct = Math.max(0, Math.min(100, model.share * 100));
    const cachePct = Math.max(0, Math.min(100, model.cacheReadRate * 100));
    return (_jsxs("div", { className: styles.modelRow, children: [_jsxs("div", { className: styles.modelHead, children: [_jsx("span", { className: styles.modelRank, style: { color }, children: String(rank).padStart(2, '0') }), _jsxs("div", { className: styles.modelMeta, children: [_jsx("div", { className: styles.modelName, children: model.model }), _jsx("div", { className: styles.modelSub, children: t('daemon.usage.modelMeta', {
                                    tokens: formatMegaTokens(model.totalTokens),
                                    cache: Math.round(cachePct),
                                }) })] }), _jsxs("span", { className: styles.modelShare, style: { color }, children: [Math.round(sharePct), "%"] })] }), _jsx("div", { className: styles.modelTrack, children: _jsx("div", { className: styles.modelFill, style: { width: `${sharePct}%`, background: color }, children: _jsx("div", { className: styles.modelFillCache, style: { width: `${cachePct}%` } }) }) })] }));
}
function MiniBars({ points, format, locale, }) {
    const max = Math.max(1, ...points.map((p) => p.value));
    return (_jsxs("div", { className: styles.bars, children: [_jsx("div", { className: styles.barsBody, children: points.map((p, i) => (_jsx("div", { className: styles.barCol, title: `${shortDay(p.label, locale)} · ${format(p.value)}`, children: _jsx("div", { className: styles.bar, style: { height: `${(p.value / max) * 100}%` } }) }, `${p.label}-${i}`))) }), points.length > 1 && (_jsxs("div", { className: styles.barsCaption, children: [_jsx("span", { children: shortDay(points[0].label, locale) }), _jsx("span", { children: shortDay(points[points.length - 1].label, locale) })] }))] }));
}
/**
 * Daemon Status "统计 / Usage" tab: a Today/7D/30D period toggle over the
 * selected range's totals + breakdown, a ~12-month token heatmap, and — below
 * it — per-model token share, skill-call counts, and daily token/session
 * charts for the range. Mounts only when the tab is active, so the aggregate
 * loads on demand; the daemon caches it per range.
 */
export function UsageDashboardTab() {
    const { t, language } = useI18n();
    const [range, setRange] = useState('today');
    const { dashboard, loading, error, reload } = useUsageDashboard({
        range,
        heatmapDays: HEATMAP_DAYS,
        autoLoad: true,
    });
    const periodToggle = (_jsx("div", { className: styles.segmented, role: "group", "aria-label": t('daemon.usage.rangeGroup'), children: RANGES.map((r) => (_jsx("button", { type: "button", className: `${styles.segment} ${r === range ? styles.segmentActive : ''}`, "aria-pressed": r === range, onClick: () => setRange(r), children: t(PERIOD_LABEL_KEY[r]) }, r))) }));
    if (!dashboard) {
        return (_jsxs("div", { className: styles.usage, children: [_jsx("div", { className: styles.toolbar, children: periodToggle }), loading ? (_jsx("div", { className: styles.state, children: t('daemon.usage.loading') })) : error ? (_jsxs("div", { className: styles.state, children: [t('daemon.usage.failed'), ": ", error.message] })) : (_jsx("div", { className: styles.state, children: t('daemon.usage.empty') }))] }));
    }
    const { summary, models, skills, daily, heatmap, heatmapDays } = dashboard;
    const changes = summary.linesAdded + summary.linesRemoved;
    const hasHeatmap = summary.totalTokens > 0 || Object.keys(heatmap).length > 0;
    const rangeWord = t(RANGE_WORD_KEY[dashboard.range]);
    return (_jsxs("div", { className: styles.usage, "aria-busy": loading, children: [_jsx("div", { className: styles.toolbar, children: periodToggle }), _jsxs("header", { className: styles.hero, children: [_jsxs("div", { className: styles.heroMain, children: [_jsx("div", { className: styles.heroLabel, children: t(HERO_LABEL_KEY[dashboard.range]) }), _jsx("div", { className: styles.heroNumber, children: formatMegaTokens(summary.totalTokens) }), _jsx("div", { className: styles.heroSub, children: t('daemon.usage.tokensConsumed') })] }), _jsx("button", { type: "button", className: styles.refresh, onClick: () => void reload(), disabled: loading, children: t('daemon.refresh') })] }), _jsxs("div", { className: styles.stats, children: [_jsx(Stat, { label: t('daemon.usage.sessions'), value: summary.sessions }), _jsx(Stat, { label: t('daemon.usage.requests'), value: summary.requests }), _jsx(Stat, { label: t('daemon.usage.tools'), value: summary.toolCalls }), _jsx(Stat, { label: t('daemon.usage.changes'), value: changes })] }), _jsxs("section", { className: styles.section, children: [_jsx("h4", { className: styles.sectionTitle, children: t('daemon.usage.breakdownTitle') }), _jsxs("div", { className: styles.breakdown, children: [_jsx(Metric, { accent: "input", value: formatMegaTokens(summary.inputTokens), label: t('daemon.usage.inputTokens'), hint: t('daemon.usage.inputHint') }), _jsx(Metric, { accent: "output", value: formatMegaTokens(summary.outputTokens + summary.thoughtsTokens), label: t('daemon.usage.outputTokens'), hint: t('daemon.usage.outputHint') }), _jsx(Metric, { accent: "cache", value: `${Math.round(summary.cacheReadRate * 100)}%`, label: t('daemon.usage.cacheRead'), hint: t('daemon.usage.cacheHint') })] })] }), _jsxs("section", { className: styles.section, children: [_jsx("h4", { className: styles.sectionTitle, children: t('daemon.usage.heatmapTitle') }), _jsx("div", { className: styles.sectionSub, children: t('daemon.usage.heatmapSub', { months: HEATMAP_MONTHS }) }), hasHeatmap ? (_jsx(TokenHeatmap, { heatmap: heatmap, days: heatmapDays })) : (_jsx("div", { className: styles.state, children: t('daemon.usage.empty') }))] }), models.length > 0 && (_jsxs("section", { className: styles.section, children: [_jsxs("h4", { className: styles.sectionTitle, children: [rangeWord, " ", t('daemon.usage.modelShareTitle')] }), _jsx("div", { className: styles.sectionSub, children: t('daemon.usage.modelShareSub') }), _jsx("div", { className: styles.modelList, children: models.map((m, i) => (_jsx(ModelRow, { rank: i + 1, model: m, color: RANK_COLORS[i % RANK_COLORS.length] }, m.model))) })] })), skills.length > 0 && (_jsxs("section", { className: styles.section, children: [_jsxs("h4", { className: styles.sectionTitle, children: [rangeWord, " ", t('daemon.usage.skillTitle')] }), _jsx("div", { className: styles.sectionSub, children: t('daemon.usage.skillSub') }), _jsxs("table", { className: styles.skillTable, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('daemon.usage.skillName') }), _jsx("th", { className: styles.right, children: t('daemon.usage.skillCount') })] }) }), _jsx("tbody", { children: skills.map((s) => (_jsxs("tr", { children: [_jsx("td", { children: s.name }), _jsx("td", { className: styles.right, children: s.count.toLocaleString() })] }, s.name))) })] })] })), daily.length > 1 && (_jsxs("section", { className: styles.section, children: [_jsxs("h4", { className: styles.sectionTitle, children: [rangeWord, " ", t('daemon.usage.dailyTokensTitle')] }), _jsx("div", { className: styles.sectionSub, children: t('daemon.usage.dailyTokensSub') }), _jsx(SvgLineChart, { series: [
                            {
                                label: t('daemon.usage.tokensConsumed'),
                                values: daily.map((d) => d.tokens),
                                color: 'var(--agent-blue-400)',
                            },
                        ], timestamps: daily.map((d) => dayMs(d.date)), format: formatMegaTokens, formatTime: (ms) => shortDayMs(ms, language), ariaLabel: t('daemon.usage.dailyTokensTitle'), peakLabel: t('daemon.charts.peak') })] })), daily.length > 1 && (_jsxs("section", { className: styles.section, children: [_jsxs("h4", { className: styles.sectionTitle, children: [rangeWord, " ", t('daemon.usage.dailySessionsTitle')] }), _jsx("div", { className: styles.sectionSub, children: t('daemon.usage.dailySessionsSub') }), _jsx(MiniBars, { points: daily.map((d) => ({ label: d.date, value: d.sessions })), format: (n) => n.toLocaleString(), locale: language })] }))] }));
}
//# sourceMappingURL=UsageDashboardTab.js.map