import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useSessionPicker } from '../hooks/useSessionPicker.js';
import { formatRelativeTime } from '../utils/formatters.js';
import { formatMessageCount, truncateText, } from '../utils/sessionPickerUtils.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { t } from '../../i18n/index.js';
import { SessionPreview } from './SessionPreview.js';
const PREFIX_CHARS = {
    selected: '› ',
    scrollUp: '↑ ',
    scrollDown: '↓ ',
    normal: '  ',
};
function SessionListItemView({ session, isSelected, isFirst, isLast, showScrollUp, showScrollDown, maxPromptWidth, prefixChars = PREFIX_CHARS, boldSelectedPrefix = true, isChecked, isDisabled = false, disabledHint, }) {
    const timeAgo = formatRelativeTime(session.mtime);
    // `messageCount` is now optional on `SessionListItem` because counting
    // requires a full readline pass over the JSONL — far too expensive to do
    // in the listing path. The row simply omits the "N messages" segment
    // when the count isn't available; preview-style consumers that care can
    // call `SessionService.countSessionMessages(sessionId)` lazily.
    const messageText = typeof session.messageCount === 'number'
        ? formatMessageCount(session.messageCount)
        : undefined;
    const showUpIndicator = isFirst && showScrollUp;
    const showDownIndicator = isLast && showScrollDown;
    const prefix = isSelected
        ? prefixChars.selected
        : showUpIndicator
            ? prefixChars.scrollUp
            : showDownIndicator
                ? prefixChars.scrollDown
                : prefixChars.normal;
    const promptText = session.customTitle || session.prompt || '(empty prompt)';
    // Reserve space for the checkbox when multi-select is active so the
    // prompt column doesn't shift between modes.
    const checkboxWidth = isChecked === undefined ? 0 : 4; // "[x] "
    const truncatedPrompt = truncateText(promptText, Math.max(1, maxPromptWidth - checkboxWidth));
    // Dim auto-generated titles so users can distinguish a model guess from
    // a title they chose themselves with `/rename`. Selected row keeps the
    // accent color — legibility of the focused row wins over source hinting.
    const isAutoTitle = session.titleSource === 'auto' && Boolean(session.customTitle);
    return (_jsxs(Box, { flexDirection: "column", marginBottom: isLast ? 0 : 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: isSelected
                            ? theme.text.accent
                            : showUpIndicator || showDownIndicator
                                ? theme.text.secondary
                                : undefined, bold: isSelected && boldSelectedPrefix, children: prefix }), isChecked !== undefined && (_jsx(Text, { color: isDisabled
                            ? theme.text.secondary
                            : isChecked
                                ? theme.text.accent
                                : isSelected
                                    ? theme.text.accent
                                    : theme.text.secondary, bold: isChecked, children: isChecked ? '[x] ' : '[ ] ' })), _jsx(Text, { color: isDisabled
                            ? theme.text.secondary
                            : isSelected
                                ? theme.text.accent
                                : isAutoTitle
                                    ? theme.text.secondary
                                    : theme.text.primary, bold: isSelected && !isDisabled, children: truncatedPrompt })] }), _jsx(Box, { paddingLeft: 2, children: _jsxs(Text, { color: theme.text.secondary, children: [timeAgo, messageText !== undefined && ` · ${messageText}`, session.gitBranch && ` · ${session.gitBranch}`, isDisabled && disabledHint ? ` · ${disabledHint}` : ''] }) })] }));
}
export function SessionPicker(props) {
    const { sessionService, onSelect, onCancel, currentBranch, title, centerSelection = true, initialSessions, enablePreview = false, enableMultiSelect = false, onConfirmMulti, disabledIds, } = props;
    const { columns: width, rows: height } = useTerminalSize();
    // Calculate box width (marginX={2})
    const boxWidth = width - 4;
    // Calculate visible items.
    // Reserved space: header (1), search row (1), footer (1), separators (2),
    // borders (2). The search row is rendered as a thin "Press / to search"
    // hint in list mode and a live query in search mode — same height in
    // both, so the visible-item count doesn't shift between modes.
    const reservedLines = 7;
    // Each item takes 2 lines (prompt + metadata) + 1 line margin between items
    const itemHeight = 3;
    const maxVisibleItems = Math.max(1, Math.floor((height - reservedLines) / itemHeight));
    const picker = useSessionPicker({
        sessionService,
        currentBranch,
        onSelect,
        onCancel,
        maxVisibleItems,
        centerSelection,
        initialSessions,
        isActive: true,
        enablePreview,
        enableMultiSelect,
        onConfirmMulti,
        disabledIds,
    });
    if (enablePreview &&
        picker.viewMode === 'preview' &&
        picker.previewSessionId &&
        sessionService) {
        const previewed = picker.filteredSessions.find((s) => s.sessionId === picker.previewSessionId);
        return (_jsx(SessionPreview, { sessionService: sessionService, sessionId: picker.previewSessionId, sessionTitle: previewed?.customTitle ?? previewed?.prompt ?? undefined, messageCount: previewed?.messageCount, mtime: previewed?.mtime, gitBranch: previewed?.gitBranch, onExit: picker.exitPreview, onResume: onSelect }));
    }
    return (_jsx(Box, { flexDirection: "column", width: boxWidth, height: height - 1, overflow: "hidden", children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, width: boxWidth, height: height - 1, overflow: "hidden", children: [_jsxs(Box, { paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: title ?? t('Resume Session') }), picker.filterByBranch && currentBranch && (_jsxs(Text, { color: theme.text.secondary, children: [' ', t('(branch: {{branch}})', { branch: currentBranch })] })), picker.searchQuery !== '' && (_jsxs(Text, { color: theme.text.secondary, children: [' ', t('({{count}} matches)', {
                                    count: String(picker.filteredSessions.length),
                                })] }))] }), _jsx(Box, { paddingX: 1, children: picker.isSearchActive ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.text.secondary, children: t('Search: ') }), _jsxs(Text, { color: theme.text.primary, children: [picker.searchQuery, _jsx(Text, { color: theme.text.secondary, children: "\u258C" })] })] })) : picker.searchQuery !== '' ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.text.secondary, children: t('Filter: ') }), _jsx(Text, { color: theme.text.primary, children: picker.searchQuery })] })) : (_jsx(Text, { color: theme.text.secondary, children: t('Press / to search') })) }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, paddingX: 1, overflow: "hidden", children: !sessionService || picker.isLoading ? (_jsx(Box, { paddingY: 1, justifyContent: "center", children: _jsx(Text, { color: theme.text.secondary, children: t('Loading sessions...') }) })) : picker.filteredSessions.length === 0 ? (_jsx(Box, { paddingY: 1, justifyContent: "center", children: _jsx(Text, { color: theme.text.secondary, children: picker.searchQuery !== ''
                                ? t('No sessions match "{{query}}"', {
                                    query: picker.searchQuery,
                                })
                                : picker.filterByBranch
                                    ? t('No sessions found for branch "{{branch}}"', {
                                        branch: currentBranch ?? '',
                                    })
                                    : t('No sessions found') }) })) : (picker.visibleSessions.map((session, visibleIndex) => {
                        const actualIndex = picker.scrollOffset + visibleIndex;
                        const isDisabled = picker.disabledIdSet.has(session.sessionId);
                        return (_jsx(SessionListItemView, { session: session, isSelected: !picker.isSearchActive &&
                                actualIndex === picker.selectedIndex, isFirst: visibleIndex === 0, isLast: visibleIndex === picker.visibleSessions.length - 1, showScrollUp: picker.showScrollUp, showScrollDown: picker.showScrollDown, maxPromptWidth: boxWidth - 6, prefixChars: PREFIX_CHARS, boldSelectedPrefix: false, isChecked: enableMultiSelect
                                ? picker.checkedIds.has(session.sessionId)
                                : undefined, isDisabled: enableMultiSelect && isDisabled, disabledHint: enableMultiSelect && isDisabled
                                ? t('current — cannot delete')
                                : undefined }, session.sessionId));
                    })) }), _jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(boxWidth - 2) }) }), _jsx(Box, { paddingX: 1, children: _jsx(Box, { flexDirection: "row", children: picker.isSearchActive ? (_jsx(Text, { color: theme.text.secondary, children: t('Type to search · Enter to commit · Esc to clear') })) : (_jsxs(_Fragment, { children: [currentBranch && (_jsxs(Text, { color: theme.text.secondary, children: [_jsx(Text, { bold: picker.filterByBranch, color: picker.filterByBranch ? theme.text.accent : undefined, children: "Ctrl+B" }), t(' to toggle branch · ')] })), enablePreview && (_jsx(Text, { color: theme.text.secondary, children: t('Space to preview · ') })), enableMultiSelect &&
                                    (() => {
                                        // Count every checked id that's also committable
                                        // (not disabled) — regardless of whether the current
                                        // filter happens to hide it. This is the exact set
                                        // Enter will commit, so the footer can't drift from
                                        // it (no more "0 selected" while the user has 3
                                        // checks hidden by a search).
                                        let committableCheckedCount = 0;
                                        for (const id of picker.checkedIds) {
                                            if (!picker.disabledIdSet.has(id)) {
                                                committableCheckedCount++;
                                            }
                                        }
                                        return (_jsx(Text, { color: theme.text.secondary, children: committableCheckedCount > 0
                                                ? t('Space to toggle · {{count}} selected · ', {
                                                    count: String(committableCheckedCount),
                                                })
                                                : t('Space to select multiple · ') }));
                                    })(), _jsx(Text, { color: theme.text.secondary, children: t('↑↓ to navigate · Type to search · Esc to cancel') })] })) }) })] }) }));
}
//# sourceMappingURL=SessionPicker.js.map