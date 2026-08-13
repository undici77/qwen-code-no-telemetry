import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';
export const TAB_DEFS = [
    { tab: 'session', label: () => t('Session') },
    { tab: 'activity', label: () => t('Activity') },
    { tab: 'efficiency', label: () => t('Efficiency') },
];
export const RANGE_CYCLE = ['all', 'month', 'week', 'today'];
export function getHeatmapColors() {
    return {
        0: '#161b22',
        1: '#0e4429',
        2: '#006d32',
        3: '#26a641',
        4: '#39d353',
    };
}
export function getSeriesColors() {
    return [
        theme.text.link,
        theme.status.error,
        theme.text.accent,
        theme.status.success,
        theme.status.warning,
        theme.text.code,
    ];
}
export function getRangeLabel(range) {
    const labels = {
        today: t('Today'),
        all: t('All time'),
        week: t('Last 7 days'),
        month: t('Last 30 days'),
    };
    return labels[range] ?? range;
}
export function fmtTokens(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}k`;
    return `${n}`;
}
export function fmtDurationShort(ms) {
    const totalMinutes = Math.floor(ms / 60_000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const d = t('d');
    const h = t('h');
    const m = t('m');
    if (days > 0)
        return `${days}${d} ${hours}${h} ${minutes}${m}`;
    if (hours > 0)
        return `${hours}${h} ${minutes}${m}`;
    return `${minutes}${m}`;
}
export function fmtSuccessBar(rate) {
    const filled = Math.max(0, Math.min(10, Math.round(rate / 10)));
    return '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
}
export function getSuccessColor(rate) {
    if (rate >= 95)
        return theme.status.success;
    if (rate >= 80)
        return theme.status.warning;
    return theme.status.error;
}
export function getCacheColor(rate) {
    if (rate >= 85)
        return theme.status.success;
    if (rate >= 70)
        return theme.status.warning;
    return theme.status.error;
}
export const TableRow = ({ cells }) => (_jsx(Box, { children: cells.map((cell, i) => (_jsx(Box, { width: cell.width, children: _jsx(Text, { color: cell.color, bold: cell.bold, children: cell.text }) }, i))) }));
//# sourceMappingURL=stats-helpers.js.map