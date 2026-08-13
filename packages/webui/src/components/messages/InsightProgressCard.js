import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
export const InsightProgressCard = ({ stage, progress, detail, }) => {
    const percent = clamp(progress);
    return (_jsx("div", { className: "w-full px-[30px] py-2", children: _jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1", children: [_jsx("div", { className: "min-w-0 truncate text-sm leading-6 text-[var(--vscode-foreground)]", children: stage }), _jsxs("div", { className: "row-span-2 shrink-0 self-center text-xs leading-none tabular-nums text-[var(--vscode-descriptionForeground)]", children: [percent, "%"] }), detail ? (_jsx("div", { className: "min-w-0 truncate text-xs leading-5 text-[var(--vscode-descriptionForeground)]", children: detail })) : (_jsx("div", { className: "text-xs leading-5 text-[var(--vscode-descriptionForeground)]", children: "Processing your chat history\u2026" }))] }) }));
};
//# sourceMappingURL=InsightProgressCard.js.map