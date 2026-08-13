import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ContentFrame({ title, maxWidth = 850, minWidth, fitContent, leftSidebar, rightSidebar, children, }) {
    // fitContent mode: card uses CSS max-content width to grow to its content (e.g., wide diffs).
    // Capped at 100% of the outer container so it never exceeds the viewport.
    // Fallback mode: card fills available width up to maxWidth (fixed/numeric).
    const wrapperStyle = fitContent
        ? { width: 'max-content', maxWidth: '100%', minWidth }
        : { maxWidth };
    return (_jsx("div", { className: "flex px-6", children: _jsxs("div", { className: `relative mx-auto ${fitContent ? '' : 'w-full'}`, style: wrapperStyle, children: [leftSidebar && (_jsx("div", { className: "absolute right-full top-0 h-full mr-4 overflow-y-auto", children: leftSidebar })), _jsxs("div", { className: "flex flex-col rounded-2xl overflow-hidden backdrop-blur-sm shadow-strong bg-background min-h-[320px]", children: [_jsx("div", { className: "flex justify-center items-center px-4 py-3 border-b border-foreground/7 select-none shrink-0", children: _jsx("div", { className: "text-xs font-semibold tracking-wider text-foreground/30", children: title }) }), _jsx("div", { children: children })] }), rightSidebar && (_jsx("div", { className: "absolute left-full top-0 h-full ml-4 overflow-y-auto", children: rightSidebar }))] }) }));
}
//# sourceMappingURL=ContentFrame.js.map