import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { formatDuration } from '../utils/formatters.js';
import { calculateAverageLatency, calculateCacheHitRate, calculateErrorRate, } from '../utils/computeStats.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { flattenModelsBySource } from '../utils/modelsBySource.js';
import { t } from '../../i18n/index.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { calculateCost } from '../../utils/costCalculator.js';
const METRIC_COL_WIDTH = 28;
// 28 + 2*24 = 76, fitting the 76-column panel at 80-column terminal width
// when the session has a single (model, source) pair split into two columns.
// Sessions with three or more sources will exceed the panel — acceptable per
// the design doc, which accepts the crowded layout for many-subagent cases.
const MODEL_COL_WIDTH = 24;
// Keep this in sync with the surrounding Box borderStyle and paddingX:
// Ink's round border consumes 2 border columns plus 2 columns of horizontal
// padding on each side.
const PANEL_HORIZONTAL_CHROME_WIDTH = 6;
const StatRow = ({ title, values, modelColWidth, isSubtle = false, isSection = false, }) => (_jsxs(Box, { children: [_jsx(Box, { width: METRIC_COL_WIDTH, children: _jsx(Text, { bold: isSection, color: isSection ? theme.text.primary : theme.text.link, children: isSubtle ? `  ↳ ${title}` : title }) }), values.map((value, index) => (_jsx(Box, { width: modelColWidth, children: _jsx(Text, { color: theme.text.primary, children: value }) }, index)))] }));
export const ModelStatsDisplay = ({ width, }) => {
    const { stats } = useSessionStats();
    const { models } = stats.metrics;
    const entries = flattenModelsBySource(models);
    const settings = useSettings();
    const modelPricing = settings.merged.modelPricing;
    if (entries.length === 0) {
        return (_jsx(Box, { borderStyle: "round", borderColor: theme.border.default, paddingY: 1, paddingX: 2, width: width, children: _jsx(Text, { color: theme.text.primary, children: t('No API calls have been made in this session.') }) }));
    }
    const getModelValues = (getter) => entries.map(({ metrics }) => getter(metrics));
    const hasThoughts = entries.some(({ metrics }) => metrics.tokens.thoughts > 0);
    const hasCached = entries.some(({ metrics }) => metrics.tokens.cached > 0);
    const modelColWidth = entries.length === 1 && width
        ? Math.max(MODEL_COL_WIDTH, width - PANEL_HORIZONTAL_CHROME_WIDTH - METRIC_COL_WIDTH)
        : MODEL_COL_WIDTH;
    const getModelName = (key) => key.split('::')[0];
    const hasPricing = entries.some(({ key, metrics }) => calculateCost({
        inputTokens: metrics.tokens.prompt,
        outputTokens: metrics.tokens.candidates + metrics.tokens.thoughts,
        pricing: modelPricing?.[getModelName(key)],
    }) != null);
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, width: width, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Model Stats For Nerds') }), _jsx(Box, { height: 1 }), _jsxs(Box, { children: [_jsx(Box, { width: METRIC_COL_WIDTH, children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Metric') }) }), entries.map(({ key, label }) => (_jsx(Box, { width: modelColWidth, children: _jsx(Text, { bold: true, color: theme.text.primary, children: label }) }, key)))] }), _jsx(Box, { borderStyle: "single", borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: theme.border.default }), _jsx(StatRow, { title: t('API'), values: [], modelColWidth: modelColWidth, isSection: true }), _jsx(StatRow, { title: t('Requests'), values: getModelValues((m) => m.api.totalRequests.toLocaleString()), modelColWidth: modelColWidth }), _jsx(StatRow, { title: t('Errors'), values: getModelValues((m) => {
                    const errorRate = calculateErrorRate(m);
                    return (_jsxs(Text, { color: m.api.totalErrors > 0 ? theme.status.error : theme.text.primary, children: [m.api.totalErrors.toLocaleString(), " (", errorRate.toFixed(1), "%)"] }));
                }), modelColWidth: modelColWidth }), _jsx(StatRow, { title: t('Avg Latency'), values: getModelValues((m) => {
                    const avgLatency = calculateAverageLatency(m);
                    return formatDuration(avgLatency);
                }), modelColWidth: modelColWidth }), _jsx(Box, { height: 1 }), _jsx(StatRow, { title: t('Tokens'), values: [], modelColWidth: modelColWidth, isSection: true }), _jsx(StatRow, { title: t('Total'), values: getModelValues((m) => (_jsx(Text, { color: theme.status.warning, children: m.tokens.total.toLocaleString() }))), modelColWidth: modelColWidth }), _jsx(StatRow, { title: t('Prompt'), isSubtle: true, values: getModelValues((m) => m.tokens.prompt.toLocaleString()), modelColWidth: modelColWidth }), hasCached && (_jsx(StatRow, { title: t('Cached'), isSubtle: true, values: getModelValues((m) => {
                    const cacheHitRate = calculateCacheHitRate(m);
                    return (_jsxs(Text, { color: theme.status.success, children: [m.tokens.cached.toLocaleString(), " (", cacheHitRate.toFixed(1), "%)"] }));
                }), modelColWidth: modelColWidth })), hasThoughts && (_jsx(StatRow, { title: t('Thoughts'), isSubtle: true, values: getModelValues((m) => m.tokens.thoughts.toLocaleString()), modelColWidth: modelColWidth })), _jsx(StatRow, { title: t('Output'), isSubtle: true, values: getModelValues((m) => m.tokens.candidates.toLocaleString()), modelColWidth: modelColWidth }), hasPricing && (_jsxs(_Fragment, { children: [_jsx(Box, { height: 1 }), _jsx(StatRow, { title: t('Cost'), values: [], modelColWidth: modelColWidth, isSection: true }), _jsx(StatRow, { title: t('Estimated'), values: entries.map(({ key, metrics }) => {
                            const cost = calculateCost({
                                inputTokens: metrics.tokens.prompt,
                                outputTokens: metrics.tokens.candidates + metrics.tokens.thoughts,
                                pricing: modelPricing?.[getModelName(key)],
                            });
                            return cost != null ? `$${cost.toFixed(4)}` : 'N/A';
                        }), modelColWidth: modelColWidth })] }))] }));
};
//# sourceMappingURL=ModelStatsDisplay.js.map