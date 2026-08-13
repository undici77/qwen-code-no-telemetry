import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { formatDuration } from '../../utils/formatters.js';
import { getArenaStatusLabel } from '../../utils/displayUtils.js';
export const ArenaAgentCard = ({ agent, width, }) => {
    const { icon, text, color } = getArenaStatusLabel(agent.status);
    const duration = formatDuration(agent.durationMs);
    const tokens = agent.totalTokens.toLocaleString();
    const inTokens = agent.inputTokens.toLocaleString();
    const outTokens = agent.outputTokens.toLocaleString();
    return (_jsxs(Box, { flexDirection: "column", width: width, children: [_jsx(Box, { children: _jsxs(Text, { color: color, children: [icon, " ", agent.label, " \u00B7 ", text, " \u00B7 ", duration] }) }), _jsx(Box, { marginLeft: 2, children: _jsxs(Text, { color: theme.text.secondary, children: ["Tokens: ", tokens, " (in ", inTokens, ", out ", outTokens, ")"] }) }), _jsx(Box, { marginLeft: 2, children: _jsxs(Text, { color: theme.text.secondary, children: ["Tool Calls: ", agent.toolCalls, agent.failedToolCalls > 0 && (_jsxs(_Fragment, { children: [' ', "(", _jsxs(Text, { color: theme.status.success, children: ["\u2713 ", agent.successfulToolCalls] }), _jsx(Text, { color: theme.text.secondary, children: " " }), _jsxs(Text, { color: theme.status.error, children: ["\u2715 ", agent.failedToolCalls] }), ")"] }))] }) }), agent.error && (_jsx(Box, { marginLeft: 2, children: _jsx(Text, { color: theme.status.error, children: agent.error }) }))] }));
};
/**
 * Calculate diff stats from a unified diff string.
 * Returns the stats string and individual counts for colored rendering.
 */
function getDiffStats(diff, diffSummary) {
    if (diffSummary) {
        return {
            text: `+${diffSummary.additions}/-${diffSummary.deletions}`,
            additions: diffSummary.additions,
            deletions: diffSummary.deletions,
        };
    }
    if (!diff)
        return { text: '', additions: 0, deletions: 0 };
    const lines = diff.split('\n');
    let additions = 0;
    let deletions = 0;
    for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
            additions++;
        }
        else if (line.startsWith('-') && !line.startsWith('---')) {
            deletions++;
        }
    }
    return { text: `+${additions}/-${deletions}`, additions, deletions };
}
const MAX_FILE_LIST_ITEMS = 4;
function formatFileList(files) {
    if (!files || files.length === 0) {
        return 'none';
    }
    const visible = files.slice(0, MAX_FILE_LIST_ITEMS);
    const suffix = files.length > MAX_FILE_LIST_ITEMS
        ? `, +${files.length - MAX_FILE_LIST_ITEMS} more`
        : '';
    return `${visible.join(', ')}${suffix}`;
}
function getAgentFiles(agent) {
    return (agent.modifiedFiles ??
        agent.diffSummary?.files.map((file) => file.path) ??
        []);
}
function getComparisonFileGroups(agents) {
    const counts = new Map();
    for (const agent of agents) {
        for (const file of new Set(getAgentFiles(agent))) {
            counts.set(file, (counts.get(file) ?? 0) + 1);
        }
    }
    const common = [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([file]) => file)
        .sort();
    const groups = [{ label: 'common', files: common }];
    for (const agent of agents) {
        const unique = getAgentFiles(agent)
            .filter((file) => counts.get(file) === 1)
            .sort();
        if (unique.length > 0) {
            groups.push({ label: `${agent.label}-only`, files: unique });
        }
    }
    return groups;
}
function getTreeBranch(index, total) {
    return index === total - 1 ? '└─' : '├─';
}
export const ArenaSessionCard = ({ sessionStatus, agents, width, }) => {
    const titleLabel = sessionStatus === 'idle' || sessionStatus === 'completed'
        ? 'Arena Comparison Summary'
        : sessionStatus === 'cancelled'
            ? 'Arena Cancelled'
            : 'Arena Failed';
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingX: 2, paddingY: 1, width: width, children: [_jsx(Box, { children: _jsx(Text, { bold: true, color: theme.text.primary, children: titleLabel }) }), _jsx(Box, { height: 1 }), (sessionStatus === 'idle' || sessionStatus === 'completed') && (_jsxs(_Fragment, { children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.text.primary, children: "Status Summary:" }), agents.map((agent, index) => {
                                const { text: statusText, color } = getArenaStatusLabel(agent.status);
                                return (_jsxs(Box, { marginLeft: 2, children: [_jsxs(Text, { color: theme.text.secondary, children: [index === agents.length - 1 ? '└─' : '├─', " ", agent.label, ":", ' '] }), _jsx(Text, { color: color, children: statusText })] }, agent.label));
                            })] }), _jsx(Box, { height: 1 }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.text.primary, children: "Files Modified:" }), getComparisonFileGroups(agents).map((group, index, groups) => (_jsxs(Box, { marginLeft: 2, children: [_jsxs(Text, { color: theme.text.secondary, children: [getTreeBranch(index, groups.length), " ", group.label, ":", ' '] }), _jsx(Text, { color: theme.text.primary, children: formatFileList(group.files) })] }, group.label)))] }), _jsx(Box, { height: 1 }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.text.primary, children: "Approach Summary:" }), agents.map((agent, index) => {
                                const diffStats = getDiffStats(agent.diff, agent.diffSummary);
                                const files = getAgentFiles(agent).length;
                                const branch = index === agents.length - 1 ? '└─' : '├─';
                                const summary = agent.approachSummary ?? 'No approach summary available.';
                                return (_jsx(Box, { marginLeft: 2, children: _jsxs(Text, { children: [_jsxs(Text, { color: theme.text.secondary, children: [branch, " ", agent.label, ":", ' '] }), _jsxs(Text, { color: theme.text.primary, children: [summary, " "] }), _jsx(Text, { color: theme.text.secondary, children: "(" }), _jsx(Text, { color: theme.text.accent, children: files }), _jsx(Text, { color: theme.text.secondary, children: files === 1 ? ' file, ' : ' files, ' }), _jsxs(Text, { color: theme.status.success, children: ["+", diffStats.additions] }), _jsx(Text, { color: theme.text.secondary, children: " " }), _jsxs(Text, { color: theme.status.error, children: ["-", diffStats.deletions] }), _jsx(Text, { color: theme.text.secondary, children: " lines, " }), _jsx(Text, { color: theme.text.accent, children: agent.toolCalls }), _jsx(Text, { color: theme.text.secondary, children: agent.toolCalls === 1 ? ' tool call)' : ' tool calls)' })] }) }, agent.label));
                            })] }), _jsx(Box, { height: 1 }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.text.primary, children: "Token Efficiency:" }), agents.map((agent, index) => (_jsxs(Box, { marginLeft: 2, children: [_jsxs(Text, { color: theme.text.secondary, children: [index === agents.length - 1 ? '└─' : '├─', " ", agent.label, ":", ' '] }), _jsxs(Text, { color: theme.text.primary, children: [agent.outputTokens.toLocaleString(), " tokens \u00B7 runtime", ' ', formatDuration(agent.durationMs)] })] }, agent.label)))] })] })), _jsx(Box, { height: 1 }), sessionStatus === 'idle' && (_jsx(Box, { flexDirection: "column", children: _jsxs(Text, { color: theme.text.secondary, children: ["Run ", _jsx(Text, { color: theme.text.accent, children: "/arena select" }), " to view detailed diff or pick a winner."] }) })), sessionStatus === 'completed' && (_jsx(Box, { children: _jsxs(Text, { color: theme.text.secondary, children: ["Run ", _jsx(Text, { color: theme.text.accent, children: "/arena select" }), " to pick a winner."] }) }))] }));
};
//# sourceMappingURL=ArenaCards.js.map