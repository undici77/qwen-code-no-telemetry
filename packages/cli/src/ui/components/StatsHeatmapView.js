import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { buildHeatmapData, MONTH_LABELS } from '../utils/asciiCharts.js';
import { getHeatmapColors } from './stats-helpers.js';
import { t } from '../../i18n/index.js';
export const HeatmapView = ({ data, weeks, monthOffset }) => {
    const HEATMAP_COLORS = getHeatmapColors();
    const heatmap = buildHeatmapData(data.heatmap, weeks, monthOffset);
    const fmtDate = (d) => {
        const dt = new Date(d + 'T00:00:00');
        return `${MONTH_LABELS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Activity Heatmap') }), _jsxs(Text, { color: theme.text.accent, children: ['  ', fmtDate(heatmap.startDate), " - ", fmtDate(heatmap.endDate)] })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.text.secondary, children: '    ' }), (() => {
                        const labelAt = new Map();
                        for (const cl of heatmap.colLabels)
                            labelAt.set(cl.col, cl.text);
                        const out = [];
                        let skipCols = 0;
                        for (let c = 0; c < heatmap.totalCols; c++) {
                            if (skipCols > 0) {
                                skipCols--;
                                continue;
                            }
                            const label = labelAt.get(c);
                            if (label && label.length > 2) {
                                out.push(_jsx(Text, { color: theme.text.secondary, children: label.padEnd(4) }, c));
                                skipCols = 1;
                            }
                            else if (label) {
                                out.push(_jsx(Text, { color: theme.text.secondary, children: label.padEnd(2) }, c));
                            }
                            else {
                                out.push(_jsx(Text, { children: '  ' }, c));
                            }
                        }
                        return out;
                    })()] }), heatmap.rows.map((row, ri) => (_jsxs(Box, { children: [_jsx(Text, { color: theme.text.secondary, children: row.label }), row.cells.map((cell, ci) => (_jsx(Text, { backgroundColor: cell.intensity > 0 ? HEATMAP_COLORS[cell.intensity] : undefined, underline: cell.isToday, children: cell.char }, ci)))] }, ri))), _jsx(Text, { children: " " }), _jsxs(Box, { children: [_jsxs(Text, { color: theme.text.secondary, children: ['    ', t('Less'), ' '] }), [0, 1, 2, 3, 4].map((level) => (_jsx(Text, { backgroundColor: level > 0 ? HEATMAP_COLORS[level] : undefined, children: level === 0 ? '\u00B7\u00B7' : '  ' }, level))), _jsxs(Text, { color: theme.text.secondary, children: [" ", t('More')] })] })] }));
};
//# sourceMappingURL=StatsHeatmapView.js.map