import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { isSuccessStatus, } from '@qwen-code/qwen-code-core';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { MessageType } from '../../types.js';
import { formatDuration } from '../../utils/formatters.js';
import { getArenaStatusLabel } from '../../utils/displayUtils.js';
import { DescriptiveRadioButtonSelect } from '../shared/DescriptiveRadioButtonSelect.js';
export function ArenaSelectDialog({ manager, config, addItem, closeArenaDialog, }) {
    const pushMessage = useCallback((result) => {
        const item = {
            type: result.messageType === 'info' ? MessageType.INFO : MessageType.ERROR,
            text: result.content,
        };
        addItem(item, Date.now());
        try {
            const chatRecorder = config.getChatRecordingService();
            chatRecorder?.recordSlashCommand({
                phase: 'result',
                rawCommand: '/arena select',
                outputHistoryItems: [{ ...item }],
            });
        }
        catch {
            // Best-effort recording
        }
    }, [addItem, config]);
    const onSelect = useCallback(async (agentId) => {
        closeArenaDialog();
        const mgr = config.getArenaManager();
        if (!mgr) {
            pushMessage({
                messageType: 'error',
                content: 'No arena session found. Start one with /arena start.',
            });
            return;
        }
        const agent = mgr.getAgentState(agentId) ??
            mgr.getAgentStates().find((item) => item.agentId === agentId);
        const label = agent?.model.modelId || agentId;
        pushMessage({
            messageType: 'info',
            content: `Applying changes from ${label}…`,
        });
        const result = await mgr.applyAgentResult(agentId);
        if (!result.success) {
            pushMessage({
                messageType: 'error',
                content: `Failed to apply changes from ${label}: ${result.error}`,
            });
            return;
        }
        try {
            await config.cleanupArenaRuntime(true);
        }
        catch (err) {
            pushMessage({
                messageType: 'error',
                content: `Warning: failed to clean up arena resources: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
        pushMessage({
            messageType: 'info',
            content: `Applied changes from ${label} to workspace. Arena session complete.`,
        });
    }, [closeArenaDialog, config, pushMessage]);
    const onDiscard = useCallback(async () => {
        closeArenaDialog();
        const mgr = config.getArenaManager();
        if (!mgr) {
            pushMessage({
                messageType: 'error',
                content: 'No arena session found. Start one with /arena start.',
            });
            return;
        }
        try {
            pushMessage({
                messageType: 'info',
                content: 'Discarding Arena results and cleaning up…',
            });
            await config.cleanupArenaRuntime(true);
            pushMessage({
                messageType: 'info',
                content: 'Arena results discarded. All worktrees cleaned up.',
            });
        }
        catch (err) {
            pushMessage({
                messageType: 'error',
                content: `Failed to clean up arena worktrees: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
    }, [closeArenaDialog, config, pushMessage]);
    const result = manager.getResult();
    const agents = manager.getAgentStates();
    const firstSelectableAgentId = agents.find((agent) => isSuccessStatus(agent.status))?.agentId;
    const [selectedAgentId, setSelectedAgentId] = useState(firstSelectableAgentId);
    const [showPreview, setShowPreview] = useState(false);
    const [showDetailedDiff, setShowDetailedDiff] = useState(false);
    const selectedResult = result?.agents.find((agent) => agent.agentId === selectedAgentId);
    const items = useMemo(() => agents.map((agent) => {
        const label = agent.model.modelId;
        const statusInfo = getArenaStatusLabel(agent.status);
        const duration = formatDuration(agent.stats.durationMs);
        const tokens = agent.stats.outputTokens.toLocaleString();
        // Build diff summary from cached result if available
        let diffAdditions = 0;
        let diffDeletions = 0;
        let fileCount = 0;
        if (isSuccessStatus(agent.status) && result) {
            const agentResult = result.agents.find((a) => a.agentId === agent.agentId);
            if (agentResult?.diffSummary) {
                diffAdditions = agentResult.diffSummary.additions;
                diffDeletions = agentResult.diffSummary.deletions;
                fileCount = agentResult.diffSummary.files.length;
            }
            else if (agentResult?.diff) {
                const lines = agentResult.diff.split('\n');
                for (const line of lines) {
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                        diffAdditions++;
                    }
                    else if (line.startsWith('-') && !line.startsWith('---')) {
                        diffDeletions++;
                    }
                }
            }
            fileCount = agentResult?.modifiedFiles?.length ?? fileCount;
        }
        // Title: full model name (not truncated)
        const title = _jsx(Text, { children: label });
        // Description: status, time, tokens, changes (unified with Arena Complete columns)
        const description = (_jsxs(Text, { children: [_jsx(Text, { color: statusInfo.color, children: statusInfo.text }), _jsx(Text, { color: theme.text.secondary, children: " \u00B7 " }), _jsx(Text, { color: theme.text.secondary, children: duration }), _jsx(Text, { color: theme.text.secondary, children: " \u00B7 " }), _jsxs(Text, { color: theme.text.secondary, children: [tokens, " tokens"] }), fileCount > 0 && (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.text.secondary, children: " \u00B7 " }), _jsxs(Text, { color: theme.text.secondary, children: [fileCount, " files"] })] })), (diffAdditions > 0 || diffDeletions > 0) && (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.text.secondary, children: " \u00B7 " }), _jsxs(Text, { color: theme.status.success, children: ["+", diffAdditions] }), _jsx(Text, { color: theme.text.secondary, children: "/" }), _jsxs(Text, { color: theme.status.error, children: ["-", diffDeletions] }), _jsx(Text, { color: theme.text.secondary, children: " lines" })] }))] }));
        return {
            key: agent.agentId,
            value: agent.agentId,
            title,
            description,
            disabled: !isSuccessStatus(agent.status),
        };
    }), [agents, result]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            closeArenaDialog();
        }
        if (key.name === 'p' && !key.ctrl && !key.meta) {
            setShowPreview((current) => !current);
        }
        if (key.name === 'd' && !key.ctrl && !key.meta) {
            setShowDetailedDiff((current) => !current);
        }
        if (key.name === 'x' && !key.ctrl && !key.meta) {
            onDiscard();
        }
    }, { isActive: true });
    const task = result?.task || '';
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, color: theme.text.primary, children: "Arena Results" }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsxs(Text, { children: [_jsx(Text, { color: theme.text.secondary, children: "Task: " }), _jsx(Text, { color: theme.text.primary, children: `"${task.length > 60 ? task.slice(0, 59) + '…' : task}"` })] }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: "Select a winner to apply changes:" }) }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(DescriptiveRadioButtonSelect, { items: items, initialIndex: items.findIndex((item) => !item.disabled), onSelect: (agentId) => {
                        onSelect(agentId);
                    }, onHighlight: (agentId) => {
                        setSelectedAgentId(agentId);
                    }, isFocused: true, showNumbers: false }) }), showPreview && selectedResult && (_jsx(ArenaAgentPreview, { result: selectedResult })), showDetailedDiff && selectedResult && (_jsx(ArenaAgentDetailedDiff, { result: selectedResult })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: "p preview, d detailed diff, Enter select winner, x discard all, Esc cancel" }) })] }));
}
function ArenaAgentPreview({ result, }) {
    const fileSummary = result.diffSummary?.files ?? [];
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { bold: true, color: theme.text.primary, children: ["Quick Preview \u00B7 ", result.model.modelId] }), _jsxs(Box, { marginLeft: 2, children: [_jsx(Text, { color: theme.text.secondary, children: "Approach: " }), _jsx(Text, { color: theme.text.primary, children: result.approachSummary ?? 'No approach summary available.' })] }), _jsxs(Box, { marginLeft: 2, children: [_jsx(Text, { color: theme.text.secondary, children: "Major files: " }), _jsx(Text, { color: theme.text.primary, children: formatFileList(fileSummary.map((file) => file.path)) })] }), _jsxs(Box, { marginLeft: 2, children: [_jsx(Text, { color: theme.text.secondary, children: "Metrics: " }), _jsxs(Text, { color: theme.text.primary, children: [result.stats.outputTokens.toLocaleString(), " tokens \u00B7", ' ', formatDuration(result.stats.durationMs), " \u00B7 ", result.stats.toolCalls, ' ', "tools"] })] })] }));
}
function ArenaAgentDetailedDiff({ result, }) {
    const diffLines = getVisibleDiffLines(result.diff);
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { bold: true, color: theme.text.primary, children: ["Detailed Diff \u00B7 ", result.model.modelId] }), diffLines.length === 0 ? (_jsx(Box, { marginLeft: 2, children: _jsx(Text, { color: theme.text.secondary, children: "No diff available." }) })) : (_jsx(Box, { marginLeft: 2, flexDirection: "column", children: diffLines.map((line, index) => (_jsx(Text, { color: getDiffLineColor(line), children: line }, `${index}-${line}`))) }))] }));
}
function formatFileList(files) {
    if (files.length === 0) {
        return 'none';
    }
    const visible = files.slice(0, 6);
    const suffix = files.length > visible.length
        ? `, +${files.length - visible.length} more`
        : '';
    return `${visible.join(', ')}${suffix}`;
}
function getVisibleDiffLines(diff) {
    if (!diff) {
        return [];
    }
    const lines = diff.split('\n');
    const maxLines = 180;
    if (lines.length <= maxLines) {
        return lines;
    }
    return [
        ...lines.slice(0, maxLines),
        `... truncated ${lines.length - maxLines} diff lines`,
    ];
}
function getDiffLineColor(line) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
        return theme.status.success;
    }
    if (line.startsWith('-') && !line.startsWith('---')) {
        return theme.status.error;
    }
    if (line.startsWith('diff --git') ||
        line.startsWith('@@') ||
        line.startsWith('---') ||
        line.startsWith('+++')) {
        return theme.text.accent;
    }
    return theme.text.secondary;
}
//# sourceMappingURL=ArenaSelectDialog.js.map