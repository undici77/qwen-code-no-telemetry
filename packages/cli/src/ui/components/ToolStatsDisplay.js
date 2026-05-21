import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { formatDuration } from '../utils/formatters.js';
import { getStatusColor, TOOL_SUCCESS_RATE_HIGH, TOOL_SUCCESS_RATE_MEDIUM, USER_AGREEMENT_RATE_HIGH, USER_AGREEMENT_RATE_MEDIUM, } from '../utils/displayUtils.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { t } from '../../i18n/index.js';
const TOOL_NAME_COL_WIDTH = 25;
const CALLS_COL_WIDTH = 8;
const SUCCESS_RATE_COL_WIDTH = 15;
const AVG_DURATION_COL_WIDTH = 15;
const StatRow = ({ name, stats }) => {
    const successRate = stats.count > 0 ? (stats.success / stats.count) * 100 : 0;
    const avgDuration = stats.count > 0 ? stats.durationMs / stats.count : 0;
    const successColor = getStatusColor(successRate, {
        green: TOOL_SUCCESS_RATE_HIGH,
        yellow: TOOL_SUCCESS_RATE_MEDIUM,
    });
    return (_jsxs(Box, { children: [_jsx(Box, { width: TOOL_NAME_COL_WIDTH, children: _jsx(Text, { color: theme.text.link, children: name }) }), _jsx(Box, { width: CALLS_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: stats.count }) }), _jsx(Box, { width: SUCCESS_RATE_COL_WIDTH, justifyContent: "flex-end", children: _jsxs(Text, { color: successColor, children: [successRate.toFixed(1), "%"] }) }), _jsx(Box, { width: AVG_DURATION_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: formatDuration(avgDuration) }) })] }));
};
export const ToolStatsDisplay = ({ width, }) => {
    const { stats } = useSessionStats();
    const { tools } = stats.metrics;
    const activeTools = Object.entries(tools.byName).filter(([, metrics]) => metrics.count > 0);
    if (activeTools.length === 0) {
        return (_jsx(Box, { borderStyle: "round", borderColor: theme.border.default, paddingY: 1, paddingX: 2, width: width, children: _jsx(Text, { color: theme.text.primary, children: t('No tool calls have been made in this session.') }) }));
    }
    const totalDecisions = Object.values(tools.byName).reduce((acc, tool) => {
        acc.accept += tool.decisions.accept;
        acc.reject += tool.decisions.reject;
        acc.modify += tool.decisions.modify;
        return acc;
    }, { accept: 0, reject: 0, modify: 0 });
    const totalReviewed = totalDecisions.accept + totalDecisions.reject + totalDecisions.modify;
    const agreementRate = totalReviewed > 0 ? (totalDecisions.accept / totalReviewed) * 100 : 0;
    const agreementColor = getStatusColor(agreementRate, {
        green: USER_AGREEMENT_RATE_HIGH,
        yellow: USER_AGREEMENT_RATE_MEDIUM,
    });
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, width: width, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Tool Stats For Nerds') }), _jsx(Box, { height: 1 }), _jsxs(Box, { children: [_jsx(Box, { width: TOOL_NAME_COL_WIDTH, children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Tool Name') }) }), _jsx(Box, { width: CALLS_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Calls') }) }), _jsx(Box, { width: SUCCESS_RATE_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Success Rate') }) }), _jsx(Box, { width: AVG_DURATION_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Avg Duration') }) })] }), _jsx(Box, { borderStyle: "single", borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: theme.border.default, width: "100%" }), activeTools.map(([name, stats]) => (_jsx(StatRow, { name: name, stats: stats }, name))), _jsx(Box, { height: 1 }), _jsx(Text, { bold: true, color: theme.text.primary, children: t('User Decision Summary') }), _jsxs(Box, { children: [_jsx(Box, { width: TOOL_NAME_COL_WIDTH + CALLS_COL_WIDTH + SUCCESS_RATE_COL_WIDTH, children: _jsx(Text, { color: theme.text.link, children: t('Total Reviewed Suggestions:') }) }), _jsx(Box, { width: AVG_DURATION_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: totalReviewed }) })] }), _jsxs(Box, { children: [_jsx(Box, { width: TOOL_NAME_COL_WIDTH + CALLS_COL_WIDTH + SUCCESS_RATE_COL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t(' » Accepted:') }) }), _jsx(Box, { width: AVG_DURATION_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.status.success, children: totalDecisions.accept }) })] }), _jsxs(Box, { children: [_jsx(Box, { width: TOOL_NAME_COL_WIDTH + CALLS_COL_WIDTH + SUCCESS_RATE_COL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t(' » Rejected:') }) }), _jsx(Box, { width: AVG_DURATION_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.status.error, children: totalDecisions.reject }) })] }), _jsxs(Box, { children: [_jsx(Box, { width: TOOL_NAME_COL_WIDTH + CALLS_COL_WIDTH + SUCCESS_RATE_COL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t(' » Modified:') }) }), _jsx(Box, { width: AVG_DURATION_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.status.warning, children: totalDecisions.modify }) })] }), _jsx(Box, { borderStyle: "single", borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: theme.border.default, width: "100%" }), _jsxs(Box, { children: [_jsx(Box, { width: TOOL_NAME_COL_WIDTH + CALLS_COL_WIDTH + SUCCESS_RATE_COL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t(' Overall Agreement Rate:') }) }), _jsx(Box, { width: AVG_DURATION_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: totalReviewed > 0 ? agreementColor : undefined, children: totalReviewed > 0 ? `${agreementRate.toFixed(1)}%` : '--' }) })] })] }));
};
//# sourceMappingURL=ToolStatsDisplay.js.map