import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
const STATUS_ICONS = {
    pass: '\u2713', // checkmark
    warn: '\u26A0', // warning triangle
    fail: '\u2717', // X mark
};
function getStatusColor(status) {
    switch (status) {
        case 'pass':
            return theme.status.success;
        case 'warn':
            return theme.status.warning;
        case 'fail':
            return theme.status.error;
        default:
            return theme.text.primary;
    }
}
/**
 * Group checks by category, preserving insertion order.
 */
function groupByCategory(checks) {
    const groups = new Map();
    for (const check of checks) {
        const group = groups.get(check.category);
        if (group) {
            group.push(check);
        }
        else {
            groups.set(check.category, [check]);
        }
    }
    return groups;
}
export const DoctorReport = ({ checks, summary, width, }) => {
    const groups = groupByCategory(checks);
    const categoryEntries = Array.from(groups.entries());
    // Compute the widest check name so the message column aligns consistently.
    const nameColWidth = Math.max(20, ...checks.map((c) => c.name.length + 2));
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, width: width, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Doctor Report') }), _jsx(Box, { height: 1 }), categoryEntries.map(([category, items], groupIdx) => (_jsxs(Box, { flexDirection: "column", marginTop: groupIdx > 0 ? 1 : 0, children: [_jsx(Text, { bold: true, color: theme.text.link, children: category }), items.map((check) => (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: getStatusColor(check.status), children: ['  ', STATUS_ICONS[check.status], ' '] }), _jsx(Box, { width: nameColWidth, children: _jsx(Text, { color: theme.text.primary, children: check.name }) }), _jsx(Text, { dimColor: true, children: check.message })] }), check.detail && (_jsx(Box, { marginLeft: 6, children: _jsxs(Text, { dimColor: true, children: ['-> ', check.detail] }) }))] }, `${category}-${check.name}`)))] }, category))), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { dimColor: true, children: '-- ' }), _jsxs(Text, { color: theme.status.success, children: [summary.pass, " ", t('passed')] }), _jsx(Text, { dimColor: true, children: ', ' }), _jsxs(Text, { color: theme.status.warning, children: [summary.warn, " ", t('warnings')] }), _jsx(Text, { dimColor: true, children: ', ' }), _jsxs(Text, { color: theme.status.error, children: [summary.fail, " ", t('failures')] })] })] }));
};
//# sourceMappingURL=DoctorReport.js.map