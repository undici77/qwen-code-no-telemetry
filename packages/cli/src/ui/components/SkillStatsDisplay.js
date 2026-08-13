import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { t } from '../../i18n/index.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { theme } from '../semantic-colors.js';
import { getStatusColor, TOOL_SUCCESS_RATE_HIGH, TOOL_SUCCESS_RATE_MEDIUM, } from '../utils/displayUtils.js';
const SKILL_NAME_COL_WIDTH = 30;
const CALLS_COL_WIDTH = 8;
const SUCCESS_COL_WIDTH = 8;
const FAIL_COL_WIDTH = 8;
const SUCCESS_RATE_COL_WIDTH = 15;
const StatRow = ({ name, stats }) => {
    const successRate = stats.count > 0 ? (stats.success / stats.count) * 100 : 0;
    const successColor = getStatusColor(successRate, {
        green: TOOL_SUCCESS_RATE_HIGH,
        yellow: TOOL_SUCCESS_RATE_MEDIUM,
    });
    return (_jsxs(Box, { children: [_jsx(Box, { width: SKILL_NAME_COL_WIDTH, children: _jsx(Text, { color: theme.text.link, children: name }) }), _jsx(Box, { width: CALLS_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.primary, children: stats.count }) }), _jsx(Box, { width: SUCCESS_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: theme.status.success, children: stats.success }) }), _jsx(Box, { width: FAIL_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { color: stats.fail > 0 ? theme.status.error : theme.text.primary, children: stats.fail }) }), _jsx(Box, { width: SUCCESS_RATE_COL_WIDTH, justifyContent: "flex-end", children: _jsxs(Text, { color: successColor, children: [successRate.toFixed(1), "%"] }) })] }));
};
export const SkillStatsDisplay = ({ width, }) => {
    const { stats } = useSessionStats();
    const skills = stats.metrics.skills ?? {
        totalCalls: 0,
        totalSuccess: 0,
        totalFail: 0,
        byName: {},
    };
    const activeSkills = Object.entries(skills.byName)
        .filter(([, metrics]) => metrics.count > 0)
        .sort(([leftName, left], [rightName, right]) => {
        const countDelta = right.count - left.count;
        return countDelta !== 0 ? countDelta : leftName.localeCompare(rightName);
    });
    if (activeSkills.length === 0) {
        return (_jsx(Box, { borderStyle: "round", borderColor: theme.border.default, paddingY: 1, paddingX: 2, width: width, children: _jsx(Text, { color: theme.text.primary, children: t('No skill calls have been made in this session.') }) }));
    }
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, width: width, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Skill Stats For Nerds') }), _jsx(Box, { height: 1 }), _jsxs(Box, { children: [_jsx(Box, { width: SKILL_NAME_COL_WIDTH, children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Skill Name') }) }), _jsx(Box, { width: CALLS_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Calls') }) }), _jsx(Box, { width: SUCCESS_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('OK') }) }), _jsx(Box, { width: FAIL_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Fail') }) }), _jsx(Box, { width: SUCCESS_RATE_COL_WIDTH, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Success Rate') }) })] }), _jsx(Box, { borderStyle: "single", borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: theme.border.default, width: "100%" }), activeSkills.map(([name, skillStats]) => (_jsx(StatRow, { name: name, stats: skillStats }, name)))] }));
};
//# sourceMappingURL=SkillStatsDisplay.js.map