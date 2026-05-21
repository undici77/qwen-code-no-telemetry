import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const SunIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 2v2" }), _jsx("path", { d: "M12 20v2" }), _jsx("path", { d: "m4.93 4.93 1.41 1.41" }), _jsx("path", { d: "m17.66 17.66 1.41 1.41" }), _jsx("path", { d: "M2 12h2" }), _jsx("path", { d: "M20 12h2" }), _jsx("path", { d: "m6.34 17.66-1.41 1.41" }), _jsx("path", { d: "m19.07 4.93-1.41 1.41" })] }));
const MoonIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }) }));
export const ThemeToggle = ({ theme, onToggle }) => {
    const isLight = theme === 'light';
    const nextThemeLabel = isLight
        ? 'Switch to dark theme'
        : 'Switch to light theme';
    return (_jsx("button", { type: "button", className: "theme-toggle", "aria-label": nextThemeLabel, "aria-pressed": isLight, title: nextThemeLabel, onClick: onToggle, children: isLight ? _jsx(MoonIcon, {}) : _jsx(SunIcon, {}) }));
};
//# sourceMappingURL=ThemeToggle.js.map