import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
// Progress bar characters
const FILLED = '\u2588'; // █ - filled block
const BUFFER = '\u2592'; // ▒ - medium shade (autocompact buffer)
const EMPTY = '\u2591'; // ░ - light shade (free space)
const CONTENT_WIDTH = 56;
/**
 * Truncate a string to maxLen, appending '…' if truncated.
 */
function truncateName(name, maxLen) {
    if (name.length <= maxLen)
        return name;
    return name.slice(0, maxLen - 1) + '\u2026';
}
/**
 * Format token count for display (e.g. 1234 -> "1.2k", 123456 -> "123.5k")
 */
function formatTokens(tokens) {
    if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(1)}k`;
    }
    return `${tokens}`;
}
/**
 * Render a three-segment progress bar: used | autocompact buffer | free space.
 */
const ProgressBar = ({ usedPercentage, bufferPercentage, width }) => {
    const usedCount = Math.round((Math.min(usedPercentage, 100) / 100) * width);
    const bufferCount = Math.round((Math.min(bufferPercentage, 100 - usedPercentage) / 100) * width);
    const freeCount = Math.max(0, width - usedCount - bufferCount);
    const usedStr = FILLED.repeat(Math.max(0, usedCount));
    const freeStr = EMPTY.repeat(Math.max(0, freeCount));
    const bufferStr = BUFFER.repeat(Math.max(0, bufferCount));
    // Used color: accent by default, warning/error at high usage.
    let usedColor = theme.text.accent;
    if (usedPercentage > 80) {
        usedColor = theme.status.error;
    }
    else if (usedPercentage > 60) {
        usedColor = theme.status.warning;
    }
    return (_jsxs(Text, { children: [_jsx(Text, { color: usedColor, children: usedStr }), _jsx(Text, { color: theme.text.secondary, children: freeStr }), _jsx(Text, { color: theme.status.warning, children: bufferStr })] }));
};
/**
 * Format percentage for display, showing ">100%" when exceeding limit.
 */
function formatPercentage(tokens, contextWindowSize) {
    if (contextWindowSize <= 0)
        return '0.0';
    const percentage = (tokens / contextWindowSize) * 100;
    if (percentage > 100) {
        return '>100';
    }
    return percentage.toFixed(1);
}
/**
 * A row showing a category with its token count and percentage.
 */
const CategoryRow = ({ symbol, label, tokens, contextWindowSize, symbolColor, isOverLimit, }) => {
    const percentageStr = formatPercentage(tokens, contextWindowSize);
    const tokenStr = `${formatTokens(tokens)} ${t('tokens')} (${percentageStr}%)`;
    return (_jsxs(Box, { width: CONTENT_WIDTH, children: [_jsx(Box, { width: 2, children: _jsx(Text, { color: symbolColor || theme.text.secondary, children: symbol }) }), _jsx(Box, { width: 24, children: _jsx(Text, { color: theme.text.primary, children: label }) }), _jsx(Box, { flexGrow: 1, justifyContent: "flex-end", children: _jsx(Text, { color: isOverLimit ? theme.status.error : theme.text.secondary, children: tokenStr }) })] }));
};
/**
 * A row inside the "Compaction thresholds" section: label + token count, with
 * a left-edge marker when the current usage has crossed this tier.
 */
const ThresholdRow = ({ label, tokens, isCurrent, hint }) => {
    const tokenStr = `${formatTokens(tokens)} ${t('tokens')}`;
    return (_jsxs(Box, { width: CONTENT_WIDTH, children: [_jsx(Box, { width: 2, children: _jsx(Text, { color: isCurrent ? theme.status.warning : theme.text.secondary, children: isCurrent ? '▶' : ' ' }) }), _jsx(Box, { width: 22, children: _jsx(Text, { color: theme.text.primary, children: label }) }), _jsx(Box, { flexGrow: 1, justifyContent: "flex-end", children: _jsxs(Text, { color: theme.text.secondary, children: [tokenStr, hint ? `  ${hint}` : ''] }) })] }));
};
/**
 * Color associated with each compaction tier — green for safe, escalating to
 * red for hard. Keep these aligned with how `theme.status.*` is used elsewhere
 * so the tier badge feels native to the existing design.
 */
function tierColor(tier) {
    switch (tier) {
        case 'safe':
            return theme.status.success;
        case 'warn':
            return theme.status.warning;
        case 'auto':
            return theme.status.warning;
        case 'hard':
            return theme.status.error;
        default:
            return theme.text.secondary;
    }
}
/**
 * Renders the three-tier compaction threshold ladder (warn / auto / hard) with
 * the effective window and a current-tier marker. Source of the data is
 * `breakdown.thresholds` + `breakdown.currentTier`, which the context command
 * derives from `computeThresholds()` in core.
 */
const CompactionThresholds = ({ thresholds, currentTier }) => (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Compaction thresholds') }), _jsx(ThresholdRow, { label: t('Effective window'), tokens: thresholds.effectiveWindow }), _jsx(ThresholdRow, { label: t('Warn threshold'), tokens: thresholds.warn, isCurrent: currentTier === 'warn' }), _jsx(ThresholdRow, { label: t('Auto threshold'), tokens: thresholds.auto, isCurrent: currentTier === 'auto' }), _jsx(ThresholdRow, { label: t('Hard threshold'), tokens: thresholds.hard, isCurrent: currentTier === 'hard' }), _jsxs(Box, { width: CONTENT_WIDTH, children: [_jsx(Box, { width: 2, children: _jsx(Text, { children: " " }) }), _jsx(Box, { width: 22, children: _jsx(Text, { color: theme.text.primary, children: t('Current tier') }) }), _jsx(Box, { flexGrow: 1, justifyContent: "flex-end", children: _jsx(Text, { bold: true, color: tierColor(currentTier), children: currentTier }) })] })] }));
/**
 * A detail row for individual items (MCP tools, memory files, skills).
 */
const DETAIL_NAME_MAX_LEN = 30;
const DetailRow = ({ name, tokens }) => {
    const tokenStr = tokens > 0 ? `${formatTokens(tokens)} ${t('tokens')}` : `0 ${t('tokens')}`;
    return (_jsxs(Box, { width: CONTENT_WIDTH, paddingLeft: 2, children: [_jsxs(Text, { color: theme.text.secondary, children: ['\u2514', " "] }), _jsx(Box, { width: 32, children: _jsx(Text, { color: theme.text.link, children: truncateName(name, DETAIL_NAME_MAX_LEN) }) }), _jsx(Box, { flexGrow: 1, justifyContent: "flex-end", children: _jsx(Text, { color: theme.text.secondary, children: tokenStr }) })] }));
};
export const ContextUsage = ({ modelName, totalTokens, contextWindowSize, breakdown, builtinTools, mcpTools, memoryFiles, skills, isEstimated, showDetails = false, }) => {
    const hasTokenCount = totalTokens > 0;
    const percentage = contextWindowSize > 0 ? (totalTokens / contextWindowSize) * 100 : 0;
    const isOverLimit = percentage > 100;
    // Sort detail items by token count (descending) for better readability
    const sortedBuiltinTools = [...builtinTools].sort((a, b) => b.tokens - a.tokens);
    const sortedMcpTools = [...mcpTools].sort((a, b) => b.tokens - a.tokens);
    const sortedMemoryFiles = [...memoryFiles].sort((a, b) => b.tokens - a.tokens);
    // Sort skills: loaded first, then by total token cost descending
    const sortedSkills = [...skills].sort((a, b) => {
        if (a.loaded !== b.loaded)
            return a.loaded ? -1 : 1;
        const aTotal = a.tokens + (a.bodyTokens ?? 0);
        const bTotal = b.tokens + (b.bodyTokens ?? 0);
        return bTotal - aTotal;
    });
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingY: 1, paddingX: 2, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Context Usage') }), _jsx(Box, { height: 1 }), !hasTokenCount ? (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.status.warning, italic: true, children: t('No API response yet. Send a message to see actual usage.') }) }), _jsx(Text, { bold: true, color: theme.text.primary, children: t('Estimated pre-conversation overhead') }), _jsxs(Text, { color: theme.text.secondary, children: [t('Model'), ": ", modelName, '  ', t('Context window'), ": ", formatTokens(contextWindowSize), ' ', t('tokens')] }), _jsx(Box, { height: 1 })] })) : (_jsxs(_Fragment, { children: [_jsxs(Box, { width: CONTENT_WIDTH, marginBottom: 1, children: [_jsxs(Text, { color: theme.text.secondary, children: [t('Model'), ": ", modelName] }), _jsx(Box, { flexGrow: 1, justifyContent: "flex-end", children: _jsxs(Text, { color: theme.text.secondary, children: [t('Context window'), ": ", formatTokens(contextWindowSize), ' ', t('tokens')] }) })] }), isEstimated && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.status.warning, italic: true, children: t('Token usage is estimated until provider usage is received.') }) })), _jsx(Box, { width: CONTENT_WIDTH, children: _jsx(ProgressBar, { usedPercentage: Math.min(percentage, 100), bufferPercentage: contextWindowSize > 0
                                ? (breakdown.autocompactBuffer / contextWindowSize) * 100
                                : 0, width: CONTENT_WIDTH }) }), isOverLimit && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.status.error, children: t('Context exceeds limit! Use /compress or /clear to reduce.') }) })), _jsx(Box, { height: 1 }), _jsx(CategoryRow, { symbol: FILLED, label: t('Used'), tokens: totalTokens, contextWindowSize: contextWindowSize, symbolColor: isOverLimit ? theme.status.error : theme.text.accent, isOverLimit: isOverLimit }), _jsx(CategoryRow, { symbol: EMPTY, label: t('Free'), tokens: breakdown.freeSpace, contextWindowSize: contextWindowSize, symbolColor: theme.text.secondary }), _jsx(CategoryRow, { symbol: BUFFER, label: t('Autocompact buffer'), tokens: breakdown.autocompactBuffer, contextWindowSize: contextWindowSize, symbolColor: theme.status.warning }), _jsx(Box, { height: 1 }), _jsx(Text, { bold: true, color: theme.text.primary, children: t('Usage by category') })] })), _jsx(CategoryRow, { symbol: FILLED, label: t('System prompt'), tokens: breakdown.systemPrompt, contextWindowSize: contextWindowSize, symbolColor: theme.text.accent }), _jsx(CategoryRow, { symbol: FILLED, label: t('Built-in tools'), tokens: breakdown.builtinTools, contextWindowSize: contextWindowSize, symbolColor: theme.text.accent }), breakdown.mcpTools > 0 && (_jsx(CategoryRow, { symbol: FILLED, label: t('MCP tools'), tokens: breakdown.mcpTools, contextWindowSize: contextWindowSize, symbolColor: theme.text.accent })), _jsx(CategoryRow, { symbol: FILLED, label: t('Memory files'), tokens: breakdown.memoryFiles, contextWindowSize: contextWindowSize, symbolColor: theme.text.accent }), _jsx(CategoryRow, { symbol: FILLED, label: t('Skills'), tokens: breakdown.skills, contextWindowSize: contextWindowSize, symbolColor: theme.text.accent }), hasTokenCount && (_jsx(CategoryRow, { symbol: FILLED, label: t('Messages'), tokens: breakdown.messages, contextWindowSize: contextWindowSize, symbolColor: theme.text.accent })), breakdown.thresholds && breakdown.currentTier && (_jsx(CompactionThresholds, { thresholds: breakdown.thresholds, currentTier: breakdown.currentTier })), showDetails ? (_jsxs(_Fragment, { children: [sortedBuiltinTools.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Built-in tools') }), sortedBuiltinTools.map((tool) => (_jsx(DetailRow, { name: tool.name, tokens: tool.tokens }, tool.name)))] })), sortedMcpTools.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('MCP tools') }), sortedMcpTools.map((tool) => (_jsx(DetailRow, { name: tool.name, tokens: tool.tokens }, tool.name)))] })), sortedMemoryFiles.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Memory files') }), sortedMemoryFiles.map((file) => (_jsx(DetailRow, { name: file.path, tokens: file.tokens }, file.path)))] })), sortedSkills.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Skills') }), sortedSkills.map((skill) => (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { width: CONTENT_WIDTH, paddingLeft: 2, children: [_jsxs(Text, { color: theme.text.secondary, children: ['\u2514', " "] }), _jsxs(Box, { width: 32, children: [_jsx(Text, { color: theme.text.link, children: truncateName(skill.name, DETAIL_NAME_MAX_LEN) }), skill.loaded && (_jsxs(Text, { color: theme.status.success, children: [" ", t('active')] }))] }), _jsx(Box, { flexGrow: 1, justifyContent: "flex-end", children: _jsxs(Text, { color: theme.text.secondary, children: [formatTokens(skill.tokens), " ", t('tokens')] }) })] }), skill.loaded &&
                                        skill.bodyTokens != null &&
                                        skill.bodyTokens > 0 && (_jsxs(Box, { width: CONTENT_WIDTH, paddingLeft: 4, children: [_jsxs(Text, { color: theme.text.secondary, children: ['  \u2514', " "] }), _jsx(Box, { width: 30, children: _jsx(Text, { color: theme.text.secondary, italic: true, children: t('body loaded') }) }), _jsx(Box, { flexGrow: 1, justifyContent: "flex-end", children: _jsxs(Text, { color: theme.status.success, children: ["+", formatTokens(skill.bodyTokens), " ", t('tokens')] }) })] }))] }, skill.name)))] }))] })) : (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, italic: true, children: t('Run /context detail for per-item breakdown.') }) }))] }));
};
//# sourceMappingURL=ContextUsage.js.map