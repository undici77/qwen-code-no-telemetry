import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { theme } from '../semantic-colors.js';
import { formatDuration } from '../utils/formatters.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { getStatusColor, TOOL_SUCCESS_RATE_HIGH, TOOL_SUCCESS_RATE_MEDIUM, USER_AGREEMENT_RATE_HIGH, USER_AGREEMENT_RATE_MEDIUM, } from '../utils/displayUtils.js';
import { getRenderableGradientColors } from '../utils/gradientUtils.js';
import { computeSessionStats } from '../utils/computeStats.js';
import { flattenModelsBySource } from '../utils/modelsBySource.js';
import { t } from '../../i18n/index.js';
const StatRow = ({ title, children }) => (_jsxs(Box, { children: [_jsx(Box, { width: 28, children: _jsx(Text, { color: theme.text.link, children: title }) }), _jsx(Box, { flexGrow: 1, children: children })] }));
const SubStatRow = ({ title, children }) => (_jsxs(Box, { paddingLeft: 2, children: [_jsx(Box, { width: 26, children: _jsxs(Text, { color: theme.text.secondary, children: ["\u00BB ", title] }) }), _jsx(Box, { flexGrow: 1, children: children })] }));
const Section = ({ title, children }) => (_jsxs(Box, { flexDirection: "column", width: "100%", marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: title }), children] }));
const ModelUsageTable = ({ models, totalCachedTokens, cacheEfficiency }) => {
    // 35 + 8 + 15 + 15 = 73, fitting within the 76-column panel allocated
    // when the terminal is at the default 80-column width. Subagent labels
    // longer than 35 characters will wrap — acceptable cosmetic trade-off
    // given the alternative is overflowing the panel border.
    const nameWidth = 35;
    const requestsWidth = 8;
    const inputTokensWidth = 15;
    const outputTokensWidth = 15;
    const entries = flattenModelsBySource(models);
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Box, { width: nameWidth, children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Model Usage') }) }), _jsx(Box, { width: requestsWidth, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Reqs') }) }), _jsx(Box, { width: inputTokensWidth, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Input Tokens') }) }), _jsx(Box, { width: outputTokensWidth, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Output Tokens') }) })] }), _jsx(Box, { borderStyle: "round", borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: theme.border.default, width: nameWidth + requestsWidth + inputTokensWidth + outputTokensWidth }), entries.map(({ key, label, metrics }) => (_jsxs(Box, { children: [_jsx(Box, { width: nameWidth, children: _jsx(Text, { color: theme.text.primary, children: label }) }), _jsx(Box, { width: requestsWidth, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: metrics.api.totalRequests }) }), _jsx(Box, { width: inputTokensWidth, justifyContent: "flex-end", children: _jsx(Text, { color: theme.status.warning, children: metrics.tokens.prompt.toLocaleString() }) }), _jsx(Box, { width: outputTokensWidth, justifyContent: "flex-end", children: _jsx(Text, { color: theme.status.warning, children: metrics.tokens.candidates.toLocaleString() }) })] }, key))), cacheEfficiency > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { color: theme.text.primary, children: [_jsx(Text, { color: theme.status.success, children: t('Savings Highlight:') }), ' ', totalCachedTokens.toLocaleString(), " (", cacheEfficiency.toFixed(1), "%)", ' ', t('of input tokens were served from the cache, reducing costs.')] }), _jsx(Box, { height: 1 }), _jsxs(Text, { color: theme.text.secondary, children: ["\u00BB ", t('Tip: For a full token breakdown, run `/stats model`.')] })] }))] }));
};
export const StatsDisplay = ({ duration, title, width, }) => {
    const { stats } = useSessionStats();
    const { metrics } = stats;
    const { models, tools, files } = metrics;
    const computed = computeSessionStats(metrics);
    const successThresholds = {
        green: TOOL_SUCCESS_RATE_HIGH,
        yellow: TOOL_SUCCESS_RATE_MEDIUM,
    };
    const agreementThresholds = {
        green: USER_AGREEMENT_RATE_HIGH,
        yellow: USER_AGREEMENT_RATE_MEDIUM,
    };
    const successColor = getStatusColor(computed.successRate, successThresholds);
    const agreementColor = getStatusColor(computed.agreementRate, agreementThresholds);
    const renderTitle = () => {
        if (title) {
            const gradientColors = getRenderableGradientColors(theme.ui.gradient);
            return gradientColors ? (_jsx(Gradient, { colors: gradientColors, children: _jsx(Text, { bold: true, color: theme.text.primary, children: title }) })) : (_jsx(Text, { bold: true, color: theme.text.accent, children: title }));
        }
        return (_jsx(Text, { bold: true, color: theme.text.accent, children: t('Session Stats') }));
    };
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, width: width, children: [renderTitle(), _jsx(Box, { height: 1 }), _jsxs(Section, { title: t('Interaction Summary'), children: [_jsx(StatRow, { title: t('Session ID:'), children: _jsx(Text, { color: theme.text.primary, children: stats.sessionId }) }), _jsx(StatRow, { title: t('Tool Calls:'), children: _jsxs(Text, { color: theme.text.primary, children: [tools.totalCalls, " (", ' ', _jsxs(Text, { color: theme.status.success, children: ["\u2713 ", tools.totalSuccess] }), ' ', _jsxs(Text, { color: theme.status.error, children: ["x ", tools.totalFail] }), " )"] }) }), _jsx(StatRow, { title: t('Success Rate:'), children: _jsxs(Text, { color: successColor, children: [computed.successRate.toFixed(1), "%"] }) }), computed.totalDecisions > 0 && (_jsx(StatRow, { title: t('User Agreement:'), children: _jsxs(Text, { color: agreementColor, children: [computed.agreementRate.toFixed(1), "%", ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", computed.totalDecisions, " ", t('reviewed'), ")"] })] }) })), files &&
                        (files.totalLinesAdded > 0 || files.totalLinesRemoved > 0) && (_jsx(StatRow, { title: t('Code Changes:'), children: _jsxs(Text, { color: theme.text.primary, children: [_jsxs(Text, { color: theme.status.success, children: ["+", files.totalLinesAdded] }), ' ', _jsxs(Text, { color: theme.status.error, children: ["-", files.totalLinesRemoved] })] }) }))] }), _jsxs(Section, { title: t('Performance'), children: [_jsx(StatRow, { title: t('Wall Time:'), children: _jsx(Text, { color: theme.text.primary, children: duration }) }), _jsx(StatRow, { title: t('Agent Active:'), children: _jsx(Text, { color: theme.text.primary, children: formatDuration(computed.agentActiveTime) }) }), _jsx(SubStatRow, { title: t('API Time:'), children: _jsxs(Text, { color: theme.text.primary, children: [formatDuration(computed.totalApiTime), ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", computed.apiTimePercent.toFixed(1), "%)"] })] }) }), _jsx(SubStatRow, { title: t('Tool Time:'), children: _jsxs(Text, { color: theme.text.primary, children: [formatDuration(computed.totalToolTime), ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", computed.toolTimePercent.toFixed(1), "%)"] })] }) })] }), Object.keys(models).length > 0 && (_jsx(ModelUsageTable, { models: models, totalCachedTokens: computed.totalCachedTokens, cacheEfficiency: computed.cacheEfficiency }))] }));
};
//# sourceMappingURL=StatsDisplay.js.map