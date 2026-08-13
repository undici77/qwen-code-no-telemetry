import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function OverlayErrorBanner({ label, message }) {
    return (_jsx("div", { className: "w-full max-w-[850px] mx-auto", children: _jsxs("div", { className: "px-4 py-3 rounded-[8px] bg-[color-mix(in_oklab,var(--destructive)_5%,var(--background))] shadow-tinted", style: { '--shadow-color': 'var(--destructive-rgb)' }, children: [_jsx("div", { className: "text-xs font-semibold text-destructive/70 mb-0.5", children: label }), _jsx("p", { className: "text-sm text-destructive whitespace-pre-wrap break-words font-mono", children: message })] }) }));
}
//# sourceMappingURL=OverlayErrorBanner.js.map