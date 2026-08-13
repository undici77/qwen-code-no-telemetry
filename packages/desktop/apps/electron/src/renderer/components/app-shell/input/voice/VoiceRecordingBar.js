import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
function formatElapsed(ms) {
    const total = Math.floor(ms / 1000);
    const mm = Math.floor(total / 60);
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}
export function VoiceRecordingBar({ levels, elapsedMs, interimText, }) {
    return (_jsxs("div", { className: "relative flex-1 flex items-center gap-2 min-w-0 px-1", children: [interimText && (_jsx("span", { className: "absolute bottom-full left-1 mb-1 max-w-[70%] truncate rounded-md bg-popover px-2 py-1 text-xs text-muted-foreground shadow-md ring-1 ring-border", children: interimText })), _jsx("span", { className: "flex-1 border-t border-dotted border-foreground/30" }), _jsx("span", { className: "flex items-center gap-px h-4 shrink-0", "aria-hidden": "true", children: levels.map((lvl, i) => (_jsx("span", { className: "w-0.5 rounded-full bg-foreground/80", style: { height: `${2 + Math.round(lvl * 14)}px` } }, i))) }), _jsx("span", { className: "text-xs tabular-nums text-muted-foreground shrink-0", children: formatElapsed(elapsedMs) })] }));
}
//# sourceMappingURL=VoiceRecordingBar.js.map