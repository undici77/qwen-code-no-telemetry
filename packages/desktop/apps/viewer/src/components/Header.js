import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Header - App header with branding and controls
 */
import { Sun, Moon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
/**
 * CraftAgentLogo - The Qwen Code "C" logo
 */
function CraftAgentLogo({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("g", { transform: "translate(3.4502, 3)", fill: "currentColor", children: _jsx("path", { d: "M3.17890888,3.6 L3.17890888,0 L16,0 L16,3.6 L3.17890888,3.6 Z M9.642,7.2 L9.64218223,10.8 L0,10.8 L0,3.6 L16,3.6 L16,7.2 L9.642,7.2 Z M3.17890888,18 L3.178,14.4 L0,14.4 L0,10.8 L16,10.8 L16,18 L3.17890888,18 Z", fillRule: "nonzero" }) }) }));
}
export function Header({ hasSession, sessionTitle, isDark, onToggleTheme, onClear }) {
    const { t } = useTranslation();
    return (_jsxs("header", { className: "shrink-0 grid grid-cols-[auto_1fr_auto] items-center px-4 py-3", children: [_jsx("a", { href: "https://agents.craft.do", className: "hover:opacity-80 transition-opacity", title: "Qwen Code", children: _jsx(CraftAgentLogo, { className: "w-6 h-6 text-[#9570BE]" }) }), _jsx("div", { className: "flex justify-center", children: sessionTitle && (_jsx("span", { className: "text-sm font-semibold text-foreground truncate max-w-md", children: sessionTitle })) }), _jsxs("div", { className: "flex items-center gap-2", children: [hasSession && (_jsx("button", { onClick: onClear, className: "p-1.5 rounded-md bg-background shadow-minimal text-foreground/40 hover:text-foreground/70 transition-colors", title: t('viewer.clearSession'), children: _jsx(X, { className: "w-4 h-4" }) })), _jsx("button", { onClick: onToggleTheme, className: "p-1.5 rounded-md bg-background shadow-minimal text-foreground/40 hover:text-foreground/70 transition-colors", title: isDark ? 'Switch to light mode' : 'Switch to dark mode', children: isDark ? _jsx(Sun, { className: "w-4 h-4" }) : _jsx(Moon, { className: "w-4 h-4" }) })] })] }));
}
//# sourceMappingURL=Header.js.map