import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { ICON } from '../constants.js';
import { fmtTokens, getSeriesColors } from './stats-helpers.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { computeSessionStats } from '../utils/computeStats.js';
import { formatDuration } from '../utils/formatters.js';
import { getStatusColor, TOOL_SUCCESS_RATE_HIGH, TOOL_SUCCESS_RATE_MEDIUM, USER_AGREEMENT_RATE_HIGH, USER_AGREEMENT_RATE_MEDIUM, } from '../utils/displayUtils.js';
import { t } from '../../i18n/index.js';
export const SessionTab = () => {
    const SERIES_COLORS = getSeriesColors();
    const { stats } = useSessionStats();
    const { metrics } = stats;
    const computed = computeSessionStats(metrics);
    const now = new Date();
    const wallDuration = stats.sessionStartTime
        ? now.getTime() - stats.sessionStartTime.getTime()
        : 0;
    let totalInput = 0;
    let totalOutput = 0;
    let totalCached = 0;
    for (const m of Object.values(metrics.models)) {
        totalInput += m.tokens.prompt;
        totalOutput += m.tokens.candidates;
        totalCached += m.tokens.cached;
    }
    const cacheRate = totalInput > 0 ? (totalCached / totalInput) * 100 : 0;
    const generation = metrics.generation;
    const lastGeneration = generation?.last;
    const lastTps = lastGeneration && lastGeneration.generationDurationMs > 0
        ? lastGeneration.outputTokens /
            (lastGeneration.generationDurationMs / 1000)
        : undefined;
    const averageTtft = generation && generation.timedRequests > 0
        ? generation.totalTtftMs / generation.timedRequests
        : undefined;
    const sessionTps = generation && generation.totalGenerationDurationMs > 0
        ? generation.totalThroughputOutputTokens /
            (generation.totalGenerationDurationMs / 1000)
        : undefined;
    const successColor = getStatusColor(computed.successRate, {
        green: TOOL_SUCCESS_RATE_HIGH,
        yellow: TOOL_SUCCESS_RATE_MEDIUM,
    });
    const agreementColor = getStatusColor(computed.agreementRate, {
        green: USER_AGREEMENT_RATE_HIGH,
        yellow: USER_AGREEMENT_RATE_MEDIUM,
    });
    const labelWidth = 28;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Session ID:') }) }), _jsx(Text, { color: theme.text.primary, children: stats.sessionId })] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Interaction Summary') }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Tool Calls:') }) }), _jsxs(Text, { color: theme.text.primary, children: [metrics.tools.totalCalls, " (", ' ', _jsxs(Text, { color: theme.status.success, children: ["\u2713 ", metrics.tools.totalSuccess] }), ' ', _jsxs(Text, { color: theme.status.error, children: ["\u2717 ", metrics.tools.totalFail] }), ' ', ")"] })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Success Rate:') }) }), _jsxs(Text, { color: successColor, children: [computed.successRate.toFixed(1), "%"] })] }), computed.totalDecisions > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('User Agreement:') }) }), _jsxs(Text, { color: agreementColor, children: [computed.agreementRate.toFixed(1), "%", ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", computed.totalDecisions, " ", t('reviewed'), ")"] })] })] })), (metrics.files.totalLinesAdded > 0 ||
                        metrics.files.totalLinesRemoved > 0) && (_jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Code Changes:') }) }), _jsxs(Text, { color: theme.status.success, children: ["+", metrics.files.totalLinesAdded] }), _jsx(Text, { color: theme.text.primary, children: " " }), _jsxs(Text, { color: theme.status.error, children: ["-", metrics.files.totalLinesRemoved] })] }))] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Performance') }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Wall Time:') }) }), _jsx(Text, { color: theme.text.primary, children: formatDuration(wallDuration) })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: t('Agent Active:') }) }), _jsx(Text, { color: theme.text.primary, children: formatDuration(computed.agentActiveTime) })] }), _jsxs(Box, { paddingLeft: 2, children: [_jsx(Box, { width: 26, children: _jsxs(Text, { color: theme.text.secondary, children: ["\u00BB ", t('API Time:')] }) }), _jsxs(Text, { color: theme.text.primary, children: [formatDuration(computed.totalApiTime), ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", computed.apiTimePercent.toFixed(1), "%)"] })] })] }), _jsxs(Box, { paddingLeft: 2, children: [_jsx(Box, { width: 26, children: _jsxs(Text, { color: theme.text.secondary, children: ["\u00BB ", t('Tool Time:')] }) }), _jsxs(Text, { color: theme.text.primary, children: [formatDuration(computed.totalToolTime), ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", computed.toolTimePercent.toFixed(1), "%)"] })] })] })] }), lastGeneration && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { bold: true, color: theme.text.primary, children: [t('Generation Metrics'), " (", t('Latest Request'), ")"] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Model'), ":"] }) }), _jsx(Text, { color: theme.text.primary, children: lastGeneration.model })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: "TTFT:" }) }), _jsx(Text, { color: theme.text.primary, children: formatDuration(lastGeneration.ttftMs) })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Generation Time'), ":"] }) }), _jsx(Text, { color: theme.text.primary, children: formatDuration(lastGeneration.generationDurationMs) })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Output Tokens'), ":"] }) }), _jsx(Text, { color: theme.text.primary, children: lastGeneration.outputTokens.toLocaleString() })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsx(Text, { color: theme.text.secondary, children: "TPS:" }) }), _jsx(Text, { color: theme.text.primary, children: lastTps === undefined ? '—' : `${lastTps.toFixed(1)} tok/s` })] }), _jsxs(Box, { paddingLeft: 2, children: [_jsx(Box, { width: 26, children: _jsxs(Text, { color: theme.text.secondary, children: ["\u00BB ", t('Requests'), ":"] }) }), _jsx(Text, { color: theme.text.primary, children: generation.timedRequests })] }), _jsxs(Box, { paddingLeft: 2, children: [_jsx(Box, { width: 26, children: _jsxs(Text, { color: theme.text.secondary, children: ["\u00BB ", t('Average TTFT'), ":"] }) }), _jsx(Text, { color: theme.text.primary, children: averageTtft === undefined ? '—' : formatDuration(averageTtft) })] }), _jsxs(Box, { paddingLeft: 2, children: [_jsx(Box, { width: 26, children: _jsxs(Text, { color: theme.text.secondary, children: ["\u00BB ", t('Session TPS'), ":"] }) }), _jsx(Text, { color: theme.text.primary, children: sessionTps === undefined
                                    ? '—'
                                    : `${sessionTps.toFixed(1)} tok/s` })] })] })), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Tokens') }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Input'), ":"] }) }), _jsx(Text, { color: theme.status.warning, children: totalInput.toLocaleString() })] }), _jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Output'), ":"] }) }), _jsx(Text, { color: theme.status.warning, children: totalOutput.toLocaleString() })] }), totalCached > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: labelWidth, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Cached'), ":"] }) }), _jsxs(Text, { color: theme.status.success, children: [totalCached.toLocaleString(), " (", cacheRate.toFixed(1), "%)"] })] }))] }), Object.keys(metrics.models).length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Models') }), Object.entries(metrics.models).map(([name, m], i) => (_jsxs(Box, { children: [_jsx(Text, { color: SERIES_COLORS[i % SERIES_COLORS.length], children: ICON.CIRCLE_FILLED + ' ' }), _jsxs(Text, { color: theme.text.primary, children: [name, " "] }), _jsxs(Text, { color: theme.text.secondary, children: [m.api.totalRequests, " ", t('reqs'), " \u00B7 ", t('in'), "=", fmtTokens(m.tokens.prompt), " \u00B7 ", t('out'), "=", fmtTokens(m.tokens.candidates)] })] }, name)))] }))] }));
};
//# sourceMappingURL=StatsSessionTab.js.map