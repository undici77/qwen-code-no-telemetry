import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { keyMatchers, Command } from '../keyMatchers.js';
import { truncateText } from '../utils/sessionPickerUtils.js';
import { isRealUserTurn } from '../utils/historyMapping.js';
import { t } from '../../i18n/index.js';
const MAX_VISIBLE_ITEMS = 7;
function getUserTurns(history) {
    return history.filter(isRealUserTurn);
}
function TurnItemView({ item, isSelected, isFirst, isLast, showScrollUp, showScrollDown, maxPromptWidth, turnNumber, }) {
    const showUpIndicator = isFirst && showScrollUp;
    const showDownIndicator = isLast && showScrollDown;
    const prefix = isSelected
        ? '› '
        : showUpIndicator
            ? '↑ '
            : showDownIndicator
                ? '↓ '
                : '  ';
    const promptText = item.text || '(empty prompt)';
    const truncatedPrompt = truncateText(promptText, maxPromptWidth);
    return (_jsx(Box, { flexDirection: "column", marginBottom: isLast ? 0 : 1, children: _jsxs(Box, { children: [_jsx(Text, { color: isSelected
                        ? theme.text.accent
                        : showUpIndicator || showDownIndicator
                            ? theme.text.secondary
                            : undefined, bold: isSelected, children: prefix }), _jsx(Text, { color: theme.text.secondary, children: `#${turnNumber} ` }), _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, bold: isSelected, children: truncatedPrompt })] }) }));
}
function getRestoreOptions(diffStats) {
    const hasChanges = !!diffStats && diffStats.filesChanged.length > 0;
    const options = [];
    if (hasChanges) {
        const fileCount = diffStats.filesChanged.length;
        const detail = t(fileCount === 1
            ? '(+{{insertions}} -{{deletions}} in {{count}} file)'
            : '(+{{insertions}} -{{deletions}} in {{count}} files)', {
            insertions: String(diffStats.insertions),
            deletions: String(diffStats.deletions),
            count: String(fileCount),
        });
        options.push({
            key: 'both',
            label: t('Restore code and conversation'),
            detail,
        });
    }
    options.push({
        key: 'conversation',
        label: t('Restore conversation only'),
    });
    if (hasChanges) {
        options.push({
            key: 'code',
            label: t('Restore code only'),
        });
    }
    options.push({
        key: 'cancel',
        label: t('Never mind'),
    });
    return options;
}
/**
 * Multi-phase rewind selector:
 * 1. Pick list — choose which user turn to rewind to
 * 2. Restore options — choose what to restore (when file checkpointing enabled)
 * 3. Confirm — Y/N confirm (when file checkpointing disabled, legacy fallback)
 */
export function RewindSelector({ history, onRewind, onCancel, fileCheckpointingEnabled, fileHistoryService, }) {
    const { columns: width, rows: height } = useTerminalSize();
    const userTurns = useMemo(() => getUserTurns(history), [history]);
    const [selectedIndex, setSelectedIndex] = useState(userTurns.length - 1);
    // Legacy confirm (when file checkpointing is off)
    const [confirmItem, setConfirmItem] = useState(null);
    // Restore option phase (when file checkpointing is on)
    const [restoreItem, setRestoreItem] = useState(null);
    const [restoreOptionIndex, setRestoreOptionIndex] = useState(0);
    const [diffStats, setDiffStats] = useState(undefined);
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const boxWidth = width - 4;
    const maxVisibleItems = Math.min(MAX_VISIBLE_ITEMS, userTurns.length);
    const scrollOffset = useMemo(() => {
        if (userTurns.length <= maxVisibleItems)
            return 0;
        const halfVisible = Math.floor(maxVisibleItems / 2);
        let offset = selectedIndex - halfVisible;
        offset = Math.max(0, offset);
        offset = Math.min(userTurns.length - maxVisibleItems, offset);
        return offset;
    }, [userTurns.length, maxVisibleItems, selectedIndex]);
    const visibleTurns = useMemo(() => userTurns.slice(scrollOffset, scrollOffset + maxVisibleItems), [userTurns, scrollOffset, maxVisibleItems]);
    const showScrollUp = scrollOffset > 0;
    const showScrollDown = scrollOffset + maxVisibleItems < userTurns.length;
    const restoreOptions = useMemo(() => getRestoreOptions(diffStats), [diffStats]);
    // Load diff stats when entering restore option phase
    useEffect(() => {
        if (!restoreItem || !fileCheckpointingEnabled)
            return;
        const promptId = restoreItem.promptId;
        if (!promptId) {
            setDiffStats(undefined);
            setLoadingDiff(false);
            return;
        }
        let cancelled = false;
        setLoadingDiff(true);
        fileHistoryService
            .getDiffStats(promptId)
            .then((stats) => {
            if (!cancelled) {
                setDiffStats(stats);
                setRestoreOptionIndex(0);
                setLoadingDiff(false);
            }
        })
            .catch(() => {
            if (!cancelled) {
                setDiffStats(undefined);
                setRestoreOptionIndex(0);
                setLoadingDiff(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [restoreItem, fileCheckpointingEnabled, fileHistoryService]);
    // Legacy confirm handler
    const handleConfirmSelect = useCallback((confirmed) => {
        if (confirmed && confirmItem) {
            setIsRestoring(true);
            Promise.resolve(onRewind(confirmItem, 'conversation'))
                .catch(() => { })
                .finally(() => setIsRestoring(false));
        }
        else {
            setConfirmItem(null);
        }
    }, [confirmItem, onRewind]);
    // Pick-list key handler
    useKeypress((key) => {
        const { name, ctrl } = key;
        if (name === 'escape' || (ctrl && name === 'c')) {
            onCancel();
            return;
        }
        if (name === 'return') {
            const selected = userTurns[selectedIndex];
            if (selected) {
                if (fileCheckpointingEnabled) {
                    setRestoreItem(selected);
                    setRestoreOptionIndex(0);
                }
                else {
                    setConfirmItem(selected);
                }
            }
            return;
        }
        if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
            return;
        }
        if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex((prev) => Math.min(userTurns.length - 1, prev + 1));
            return;
        }
    }, { isActive: confirmItem === null && restoreItem === null });
    // Restore option key handler
    useKeypress((key) => {
        if (isRestoring)
            return;
        const { name, ctrl } = key;
        if (name === 'escape' || (ctrl && name === 'c')) {
            setRestoreItem(null);
            setDiffStats(undefined);
            return;
        }
        if (loadingDiff)
            return;
        if (name === 'return') {
            const option = restoreOptions[restoreOptionIndex];
            if (option) {
                if (option.key === 'cancel') {
                    setRestoreItem(null);
                    setDiffStats(undefined);
                }
                else {
                    setIsRestoring(true);
                    Promise.resolve(onRewind(restoreItem, option.key))
                        .catch(() => { })
                        .finally(() => setIsRestoring(false));
                }
            }
            return;
        }
        if (name === 'up' || name === 'k') {
            setRestoreOptionIndex((prev) => Math.max(0, prev - 1));
            return;
        }
        if (name === 'down' || name === 'j') {
            setRestoreOptionIndex((prev) => Math.min(restoreOptions.length - 1, prev + 1));
            return;
        }
    }, { isActive: restoreItem !== null });
    // Legacy confirm key handler
    useKeypress((key) => {
        if (isRestoring)
            return;
        const { name, ctrl, sequence } = key;
        if (name === 'escape' || (ctrl && name === 'c')) {
            setConfirmItem(null);
            return;
        }
        if (name === 'return' || sequence === 'y' || sequence === 'Y') {
            handleConfirmSelect(true);
            return;
        }
        if (sequence === 'n' || sequence === 'N') {
            handleConfirmSelect(false);
            return;
        }
    }, { isActive: confirmItem !== null });
    if (userTurns.length === 0) {
        return (_jsx(Box, { flexDirection: "column", width: boxWidth, children: _jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, width: boxWidth, children: _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('No user turns to rewind to.') }) }) }) }));
    }
    // Restore option phase
    if (restoreItem) {
        const promptPreview = truncateText(restoreItem.text || '(empty)', boxWidth - 10);
        return (_jsx(Box, { flexDirection: "column", width: boxWidth, children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, width: boxWidth, children: [_jsx(Box, { paddingX: 1, children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Rewind Conversation') }) }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsxs(Box, { paddingX: 1, flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: theme.text.primary, children: t('Rewind to: ') }), _jsx(Text, { color: theme.text.accent, bold: true, children: promptPreview })] }), loadingDiff ? (_jsx(Text, { color: theme.text.secondary, children: t('Computing file changes...') })) : isRestoring ? (_jsx(Text, { color: theme.text.secondary, children: t('Restoring...') })) : (_jsxs(Box, { flexDirection: "column", children: [restoreOptions.map((option, idx) => {
                                        const isSelected = idx === restoreOptionIndex;
                                        const prefix = isSelected ? '› ' : '  ';
                                        return (_jsxs(Box, { children: [_jsxs(Text, { color: isSelected ? theme.text.accent : theme.text.primary, bold: isSelected, children: [prefix, option.label] }), option.detail && (_jsxs(Text, { color: theme.text.secondary, children: [' ', option.detail] }))] }, option.key));
                                    }), restoreOptions.some((o) => o.key === 'code' || o.key === 'both') ? (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, dimColor: true, children: t('Rewinding does not affect files edited manually or via shell commands.') }) })) : (
                                    // No file-restore options were offered. Most likely either
                                    // (a) the chosen turn has no captured edits, or (b) the
                                    // turn predates this process / came from a resumed session
                                    // whose snapshots were not rehydrated. Either way the
                                    // "Restore code" path is not actionable for this turn —
                                    // surface that explicitly so the user is not left
                                    // wondering why the option is missing.
                                    _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, dimColor: true, children: t('File restore is unavailable for this turn (no captured file changes, or this turn predates the current session).') }) }))] }))] }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('↑↓ to navigate · Enter to select · Esc to go back') }) })] }) }));
    }
    // Legacy confirm phase (when file checkpointing is off)
    if (confirmItem) {
        const promptPreview = truncateText(confirmItem.text || '(empty)', boxWidth - 10);
        return (_jsx(Box, { flexDirection: "column", width: boxWidth, children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, width: boxWidth, children: [_jsx(Box, { paddingX: 1, children: _jsx(Text, { bold: true, color: theme.text.primary, children: t('Rewind Conversation') }) }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsxs(Box, { paddingX: 1, flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: theme.text.primary, children: t('Rewind to: ') }), _jsx(Text, { color: theme.text.accent, bold: true, children: promptPreview })] }), _jsx(Text, { color: theme.status.warning, children: t('This will remove all conversation after this turn. The prompt will be pre-populated in the input for editing.') })] }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter/Y to confirm · Esc/N to go back') }) })] }) }));
    }
    // Pick-list phase
    return (_jsx(Box, { flexDirection: "column", width: boxWidth, height: height - 1, overflow: "hidden", children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, width: boxWidth, height: height - 1, overflow: "hidden", children: [_jsxs(Box, { paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Rewind Conversation') }), _jsxs(Text, { color: theme.text.secondary, children: [' ', t('({{count}} turns)', { count: String(userTurns.length) })] })] }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, paddingX: 1, overflow: "hidden", children: visibleTurns.map((item, visibleIndex) => {
                        const actualIndex = scrollOffset + visibleIndex;
                        return (_jsx(TurnItemView, { item: item, isSelected: actualIndex === selectedIndex, isFirst: visibleIndex === 0, isLast: visibleIndex === visibleTurns.length - 1, showScrollUp: showScrollUp, showScrollDown: showScrollDown, maxPromptWidth: boxWidth - 10, turnNumber: actualIndex + 1 }, item.id));
                    }) }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('↑↓ to navigate · Enter to select · Esc to cancel') }) })] }) }));
}
//# sourceMappingURL=RewindSelector.js.map