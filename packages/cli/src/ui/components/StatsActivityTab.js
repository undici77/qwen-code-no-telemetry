import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { buildBrailleLineChart, MONTH_LABELS, } from '../utils/asciiCharts.js';
import { fmtTokens, fmtDurationShort, TableRow } from './stats-helpers.js';
import { HeatmapView } from './StatsHeatmapView.js';
import { t } from '../../i18n/index.js';
export const ActivityTab = ({ data, bodyWidth, chartMonthOffset, range }) => {
    const heatmapWeeks = Math.min(26, Math.max(8, Math.floor((bodyWidth - 4) / 2)));
    const col1Width = Math.floor(bodyWidth / 3);
    let totalTokens = 0;
    for (const m of Object.values(data.report.models)) {
        totalTokens += m.totalTokens;
    }
    const dailyTotals = new Map();
    for (const d of data.tokensPerDay) {
        dailyTotals.set(d.date, (dailyTotals.get(d.date) || 0) + d.tokens);
    }
    const allDates = [...dailyTotals.keys()].sort();
    const availableMonths = [...new Set(allDates.map((d) => d.slice(0, 7)))]
        .sort()
        .reverse();
    const clampedOffset = Math.min(chartMonthOffset, Math.max(0, availableMonths.length - 1));
    const chartMonth = range === 'all' && availableMonths.length > 0
        ? availableMonths[clampedOffset]
        : null;
    const chartMonthLabel = chartMonth
        ? `${MONTH_LABELS[Number(chartMonth.slice(5, 7)) - 1]} ${chartMonth.slice(0, 4)}`
        : null;
    const canGoLeft = clampedOffset < availableMonths.length - 1;
    const canGoRight = clampedOffset > 0;
    const filteredTokens = chartMonth
        ? data.tokensPerDay.filter((d) => d.date.startsWith(chartMonth))
        : data.tokensPerDay;
    const filteredDailyTotals = new Map();
    for (const d of filteredTokens) {
        filteredDailyTotals.set(d.date, (filteredDailyTotals.get(d.date) || 0) + d.tokens);
    }
    const lineData = [...filteredDailyTotals.entries()]
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
    const lineChart = buildBrailleLineChart(lineData, bodyWidth - 8, 8);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", marginBottom: 1, children: [_jsxs(Box, { width: col1Width, children: [_jsxs(Text, { color: theme.text.secondary, children: [t('Sessions'), " "] }), _jsx(Text, { bold: true, color: theme.text.primary, children: data.report.sessionCount }), data.delta?.sessions != null && (_jsxs(Text, { color: data.delta.sessions >= 0
                                    ? theme.status.success
                                    : theme.status.error, children: [' ', data.delta.sessions >= 0 ? '\u25B2' : '\u25BC', Math.abs(data.delta.sessions).toFixed(0), "%"] }))] }), _jsxs(Box, { width: col1Width, children: [_jsxs(Text, { color: theme.text.secondary, children: [t('Duration'), " "] }), _jsx(Text, { bold: true, color: theme.text.primary, children: fmtDurationShort(data.report.totalDurationMs) }), data.delta?.duration != null && (_jsxs(Text, { color: data.delta.duration >= 0
                                    ? theme.status.success
                                    : theme.status.error, children: [' ', data.delta.duration >= 0 ? '\u25B2' : '\u25BC', Math.abs(data.delta.duration).toFixed(0), "%"] }))] }), _jsxs(Box, { children: [_jsxs(Text, { color: theme.text.secondary, children: [t('Tokens'), " "] }), _jsx(Text, { bold: true, color: theme.status.warning, children: fmtTokens(totalTokens) }), data.delta?.tokens != null && (_jsxs(Text, { color: data.delta.tokens >= 0
                                    ? theme.status.success
                                    : theme.status.error, children: [' ', data.delta.tokens >= 0 ? '\u25B2' : '\u25BC', Math.abs(data.delta.tokens).toFixed(0), "%"] }))] })] }), _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { flexDirection: "column", flexGrow: 1, children: _jsx(HeatmapView, { data: data, weeks: heatmapWeeks, monthOffset: clampedOffset }) }), _jsxs(Box, { marginLeft: 2, flexDirection: "column", children: [_jsxs(Box, { children: [_jsxs(Text, { color: theme.text.secondary, children: [t('streak'), ": "] }), _jsxs(Text, { color: theme.status.success, bold: true, children: [data.currentStreak, t('d')] })] }), _jsxs(Box, { children: [_jsxs(Text, { color: theme.text.secondary, children: [t('best'), ": "] }), _jsxs(Text, { color: theme.status.warning, bold: true, children: [data.longestStreak, t('d')] })] })] })] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Token Trend') }), chartMonthLabel && (_jsxs(Text, { color: theme.text.accent, children: ['  ', canGoLeft ? '\u2190 ' : '  ', chartMonthLabel, canGoRight ? ' \u2192' : ''] }))] }), lineChart ? (_jsxs(Box, { flexDirection: "column", children: [lineChart.rows.map((row, ri) => (_jsxs(Box, { children: [_jsxs(Text, { color: theme.text.secondary, children: [lineChart.yLabels[ri]?.padStart(6) ?? '      ', '\u2502'] }), row.map((cell, ci) => (_jsx(Text, { color: cell.filled ? theme.text.accent : theme.text.secondary, children: cell.char }, ci)))] }, ri))), _jsx(Box, { children: _jsxs(Text, { color: theme.text.secondary, children: ['      \u2514', lineChart.xLabels] }) }), _jsx(Box, { marginTop: 0, children: _jsxs(Text, { color: theme.text.secondary, children: ['       ', "peak ", fmtTokens(lineChart.peak)] }) })] })) : (_jsxs(Text, { color: theme.text.secondary, children: ['  ', t('(no data)')] }))] }), data.report.projects.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Projects') }), _jsx(TableRow, { cells: [
                            {
                                text: '  ' + t('Project'),
                                width: 22,
                                color: theme.text.secondary,
                            },
                            { text: t('Sessions'), width: 10, color: theme.text.secondary },
                            { text: t('Tokens'), width: 10, color: theme.text.secondary },
                            { text: t('Duration'), width: 10, color: theme.text.secondary },
                        ] }), data.report.projects.slice(0, 5).map((proj) => {
                        const name = proj.path.split('/').pop() || proj.path;
                        const tokens = proj.totalTokens;
                        return (_jsx(TableRow, { cells: [
                                {
                                    text: '  ' + name.slice(0, 18),
                                    width: 22,
                                    color: theme.text.primary,
                                },
                                {
                                    text: String(proj.sessionCount),
                                    width: 10,
                                    color: theme.text.primary,
                                },
                                {
                                    text: fmtTokens(tokens),
                                    width: 10,
                                    color: theme.status.warning,
                                },
                                {
                                    text: fmtDurationShort(proj.totalDurationMs),
                                    width: 10,
                                    color: theme.text.secondary,
                                },
                            ] }, proj.path));
                    })] }))] }));
};
//# sourceMappingURL=StatsActivityTab.js.map