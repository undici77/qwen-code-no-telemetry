import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Static, Text } from 'ink';
import { useEffect, useMemo, useState } from 'react';
import { theme } from '../semantic-colors.js';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { buildResumedHistoryItems } from '../utils/resumeHistoryUtils.js';
import { formatRelativeTime } from '../utils/formatters.js';
import { formatMessageCount } from '../utils/sessionPickerUtils.js';
import { t } from '../../i18n/index.js';
export function SessionPreview(props) {
    const { sessionService, sessionId, sessionTitle, messageCount, mtime, gitBranch, onExit, onResume, } = props;
    const { columns } = useTerminalSize();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        setData(null);
        setError(null);
        sessionService
            .loadSession(sessionId)
            .then((d) => {
            if (cancelled)
                return;
            if (!d) {
                setError('Session not found');
                return;
            }
            setData(d);
        })
            .catch((e) => {
            if (cancelled)
                return;
            setError(e instanceof Error ? e.message : String(e));
        });
        return () => {
            cancelled = true;
        };
    }, [sessionService, sessionId]);
    // Preview passes `null` config: tool_group entries degrade to name-only
    // (no description). Users can press Enter to resume for full fidelity.
    const items = useMemo(() => {
        if (!data)
            return [];
        return buildResumedHistoryItems(data, null);
    }, [data]);
    // `listSessions` omits `messageCount` for perf, so the prop is usually
    // undefined in practice. Compute the count from the loaded conversation
    // using the same unique-user/assistant-uuid semantics as
    // `SessionService.countSessionMessages` — the data is already in memory,
    // so this is free and avoids an extra disk read.
    const computedMessageCount = useMemo(() => {
        if (!data)
            return undefined;
        const seen = new Set();
        for (const msg of data.conversation.messages) {
            if (msg.type === 'user' || msg.type === 'assistant') {
                seen.add(msg.uuid);
            }
        }
        return seen.size;
    }, [data]);
    const displayMessageCount = messageCount ?? computedMessageCount;
    useKeypress((key) => {
        const { name, ctrl } = key;
        if (name === 'escape' || (ctrl && name === 'c')) {
            onExit();
            return;
        }
        if (name === 'return') {
            onResume(sessionId);
        }
    }, { isActive: true });
    // Clamp to a safe minimum: `'─'.repeat(boxWidth - 2)` would throw RangeError
    // in very narrow terminals (tmux splits, small panes) if boxWidth < 2.
    const boxWidth = Math.max(10, columns - 4);
    const separatorWidth = Math.max(0, boxWidth - 2);
    const metaParts = [];
    if (typeof displayMessageCount === 'number') {
        metaParts.push(formatMessageCount(displayMessageCount));
    }
    if (typeof mtime === 'number') {
        metaParts.push(formatRelativeTime(mtime));
    }
    if (gitBranch) {
        metaParts.push(gitBranch);
    }
    const metaLine = metaParts.join(' · ');
    const header = (_jsx(Box, { paddingX: 1, children: _jsx(Text, { bold: true, color: theme.text.primary, children: sessionTitle ?? t('Session Preview') }) }, "header"));
    const topSeparator = (_jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(separatorWidth) }) }, "top-separator"));
    const footerSeparator = (_jsx(Box, { children: _jsx(Text, { color: theme.border.default, children: '─'.repeat(separatorWidth) }) }, "footer-separator"));
    const meta = metaLine ? (_jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: metaLine }) }, "meta")) : null;
    const footer = (_jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to resume · Esc to back') }) }, "footer"));
    if (data && !error) {
        return (_jsx(Box, { flexDirection: "column", width: boxWidth, children: _jsx(Static, { items: [
                    header,
                    topSeparator,
                    ...items.map((item) => (_jsx(HistoryItemDisplay, { item: item, terminalWidth: boxWidth, isPending: false, thoughtExpanded: true }, item.id))),
                    footerSeparator,
                    ...(meta ? [meta] : []),
                    footer,
                ], children: (item) => item }, sessionId) }));
    }
    return (_jsxs(Box, { flexDirection: "column", width: boxWidth, children: [header, topSeparator, error ? (_jsx(Box, { paddingY: 1, justifyContent: "center", children: _jsx(Text, { color: theme.status.error, children: error }) })) : (_jsx(Box, { paddingY: 1, justifyContent: "center", children: _jsx(Text, { color: theme.text.secondary, children: t('Loading session preview...') }) })), footerSeparator, meta, footer] }));
}
//# sourceMappingURL=SessionPreview.js.map