import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useRef } from 'react';
import { Box, Text } from 'ink';
import { t } from '../../i18n/index.js';
const MAX_DISPLAYED_QUEUED_MESSAGES = 3;
const NUM_TIMES_QUEUE_HINT_SHOWN = 3;
export const QueuedMessageDisplay = ({ messageQueue, }) => {
    // Track how many times the edit hint has been shown (per session).
    // Once the user has seen it enough times, hide it.
    const hintSeenCountRef = useRef(0);
    const wasEmptyRef = useRef(true);
    if (messageQueue.length === 0) {
        wasEmptyRef.current = true;
        return null;
    }
    // Increment counter only on queue transition from empty → non-empty
    // (not on every re-render while queue stays non-empty).
    if (wasEmptyRef.current) {
        hintSeenCountRef.current++;
        wasEmptyRef.current = false;
    }
    const showHint = hintSeenCountRef.current <= NUM_TIMES_QUEUE_HINT_SHOWN;
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [messageQueue
                .slice(0, MAX_DISPLAYED_QUEUED_MESSAGES)
                .map((message, index) => {
                const preview = message.replace(/\s+/g, ' ');
                return (_jsx(Box, { paddingLeft: 2, width: "100%", children: _jsx(Text, { dimColor: true, wrap: "truncate", children: preview }) }, index));
            }), messageQueue.length > MAX_DISPLAYED_QUEUED_MESSAGES && (_jsx(Box, { paddingLeft: 2, children: _jsxs(Text, { dimColor: true, children: ["... (+", messageQueue.length - MAX_DISPLAYED_QUEUED_MESSAGES, " more)"] }) })), showHint && (_jsx(Box, { paddingLeft: 2, children: _jsx(Text, { dimColor: true, italic: true, children: t('Ctrl+Q to queue · ↑ to edit queued messages') }) }))] }));
};
//# sourceMappingURL=QueuedMessageDisplay.js.map