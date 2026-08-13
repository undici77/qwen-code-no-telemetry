import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
// Rotate message every few seconds while waiting
const ROTATE_INTERVAL_MS = 3000; // rotate every 3s per request
// Default witty loading phrases
const DEFAULT_LOADING_PHRASES = [
    'Processing...',
    'Working on it...',
    'Just a moment...',
    'Loading...',
    'Hold tight...',
    'Almost there...',
];
export const WaitingMessage = ({ loadingMessage }) => {
    // Build a phrase list that starts with the provided message (if any), then witty fallbacks
    const phrases = useMemo(() => {
        const set = new Set();
        const list = [];
        if (loadingMessage && loadingMessage.trim()) {
            list.push(loadingMessage);
            set.add(loadingMessage);
        }
        for (const p of DEFAULT_LOADING_PHRASES) {
            if (!set.has(p)) {
                list.push(p);
            }
        }
        return list;
    }, [loadingMessage]);
    const [index, setIndex] = useState(0);
    // Reset to the first phrase whenever the incoming message changes
    useEffect(() => {
        setIndex(0);
    }, [phrases]);
    // Periodically rotate to a different phrase
    useEffect(() => {
        if (phrases.length <= 1) {
            return;
        }
        const id = setInterval(() => {
            setIndex((prev) => {
                // pick a different random index to avoid immediate repeats
                let next = Math.floor(Math.random() * phrases.length);
                if (phrases.length > 1) {
                    let guard = 0;
                    while (next === prev && guard < 5) {
                        next = Math.floor(Math.random() * phrases.length);
                        guard++;
                    }
                }
                return next;
            });
        }, ROTATE_INTERVAL_MS);
        return () => clearInterval(id);
    }, [phrases]);
    return (_jsx("div", { className: "waiting-message-outer flex gap-0 items-start text-left py-2 flex-col opacity-85", children: _jsx("div", { className: "assistant-message-container assistant-message-loading waiting-message-inner w-full items-start pl-[30px] relative", children: _jsx("span", { className: "waiting-message-text opacity-70 italic loading-text-shimmer", children: phrases[index] }) }) }));
};
//# sourceMappingURL=WaitingMessage.js.map