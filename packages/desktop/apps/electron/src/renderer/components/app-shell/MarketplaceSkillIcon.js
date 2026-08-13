import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
const THEMES = {
    'bailian-cli': {
        bgA: '#111827',
        bgB: '#050816',
        glowA: '#38bdf8',
        glowB: '#818cf8',
        markA: '#67e8f9',
        markB: '#3b82f6',
        markC: '#4f46e5',
    },
    'bailian-docs': {
        bgA: '#0f1f1a',
        bgB: '#03100c',
        glowA: '#34d399',
        glowB: '#2dd4bf',
        markA: '#bbf7d0',
        markB: '#34d399',
        markC: '#0f766e',
    },
    'spark-video': {
        bgA: '#1d1230',
        bgB: '#090512',
        glowA: '#f97316',
        glowB: '#d946ef',
        markA: '#f0abfc',
        markB: '#fb7185',
        markC: '#f97316',
    },
};
const FALLBACK_THEME = THEMES['bailian-cli'];
function cleanSvgId(id) {
    return id.replace(/[^a-zA-Z0-9_-]/g, '');
}
function LogoDefs({ id, theme }) {
    return (_jsxs("defs", { children: [_jsxs("linearGradient", { id: `${id}-bg`, x1: "18", x2: "82", y1: "12", y2: "88", children: [_jsx("stop", { stopColor: theme.bgA }), _jsx("stop", { offset: "1", stopColor: theme.bgB })] }), _jsxs("radialGradient", { id: `${id}-glow-a`, cx: "34%", cy: "24%", r: "58%", children: [_jsx("stop", { stopColor: theme.glowA, stopOpacity: "0.7" }), _jsx("stop", { offset: "0.58", stopColor: theme.glowA, stopOpacity: "0.12" }), _jsx("stop", { offset: "1", stopColor: theme.glowA, stopOpacity: "0" })] }), _jsxs("radialGradient", { id: `${id}-glow-b`, cx: "78%", cy: "82%", r: "58%", children: [_jsx("stop", { stopColor: theme.glowB, stopOpacity: "0.46" }), _jsx("stop", { offset: "0.62", stopColor: theme.glowB, stopOpacity: "0.1" }), _jsx("stop", { offset: "1", stopColor: theme.glowB, stopOpacity: "0" })] }), _jsxs("linearGradient", { id: `${id}-mark`, x1: "26", x2: "76", y1: "22", y2: "80", children: [_jsx("stop", { stopColor: theme.markA }), _jsx("stop", { offset: "0.52", stopColor: theme.markB }), _jsx("stop", { offset: "1", stopColor: theme.markC })] }), _jsx("filter", { id: `${id}-soft-shadow`, x: "-20%", y: "-20%", width: "140%", height: "140%", children: _jsx("feDropShadow", { dx: "0", dy: "8", stdDeviation: "7", floodColor: "#000000", floodOpacity: "0.28" }) })] }));
}
function AppIconBackground({ id }) {
    return (_jsxs(_Fragment, { children: [_jsx("rect", { width: "100", height: "100", rx: "24", fill: `url(#${id}-bg)` }), _jsx("rect", { width: "100", height: "100", rx: "24", fill: `url(#${id}-glow-a)` }), _jsx("rect", { width: "100", height: "100", rx: "24", fill: `url(#${id}-glow-b)` })] }));
}
function CliLogo({ id }) {
    return (_jsxs("g", { filter: `url(#${id}-soft-shadow)`, children: [_jsx("path", { d: "M24 35 40 50 24 65", fill: "none", stroke: "white", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "9" }), _jsx("rect", { x: "48", y: "62", width: "29", height: "9", rx: "4.5", fill: "white" }), _jsx("path", { d: "M55 29c9-8 22-4 25 7 2 8-3 16-11 18", fill: "none", stroke: `url(#${id}-mark)`, strokeLinecap: "round", strokeWidth: "7" }), _jsx("circle", { cx: "72", cy: "38", r: "5.5", fill: `url(#${id}-mark)` })] }));
}
function DocsLogo({ id }) {
    return (_jsxs("g", { filter: `url(#${id}-soft-shadow)`, children: [_jsx("path", { d: "M26 25h31a8 8 0 0 1 8 8v47H34a10 10 0 0 1-10-10V28a3 3 0 0 1 3-3Z", fill: "rgba(255,255,255,0.94)" }), _jsx("path", { d: "M35 39h21M35 49h18M35 59h21", stroke: "#0f766e", strokeLinecap: "round", strokeWidth: "4" }), _jsx("path", { d: "M65 36 78 44 78 60 65 68 52 60 52 44Z", fill: `url(#${id}-mark)` }), _jsx("path", { d: "M65 36v32M52 44l26 16M78 44 52 60", stroke: "rgba(255,255,255,0.82)", strokeLinecap: "round", strokeWidth: "3.4" })] }));
}
function SparkVideoLogo({ id }) {
    return (_jsxs("g", { filter: `url(#${id}-soft-shadow)`, children: [_jsx("path", { d: "M50 17 59 40 83 50 59 60 50 83 41 60 17 50 41 40Z", fill: `url(#${id}-mark)` }), _jsx("path", { d: "m45 38 22 12-22 12Z", fill: "white" }), _jsx("circle", { cx: "76", cy: "25", r: "5", fill: "rgba(255,255,255,0.82)" }), _jsx("circle", { cx: "26", cy: "74", r: "3.5", fill: "rgba(255,255,255,0.58)" })] }));
}
function LogoMark({ iconKey, id }) {
    switch (iconKey) {
        case 'bailian-cli':
            return _jsx(CliLogo, { id: id });
        case 'bailian-docs':
            return _jsx(DocsLogo, { id: id });
        case 'spark-video':
            return _jsx(SparkVideoLogo, { id: id });
        default:
            return _jsx(CliLogo, { id: id });
    }
}
export function MarketplaceSkillIcon({ iconKey, className, }) {
    const id = cleanSvgId(React.useId());
    const theme = THEMES[iconKey ?? ''] ?? FALLBACK_THEME;
    return (_jsx("div", { className: cn('flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px]', 'bg-neutral-950 shadow-tinted', className), children: _jsxs("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", className: "h-full w-full", children: [_jsx(LogoDefs, { id: id, theme: theme }), _jsx(AppIconBackground, { id: id }), _jsx(LogoMark, { iconKey: iconKey, id: id })] }) }));
}
//# sourceMappingURL=MarketplaceSkillIcon.js.map