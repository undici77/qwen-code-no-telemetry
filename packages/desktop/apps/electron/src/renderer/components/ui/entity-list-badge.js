import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EntityListBadge — Generic configurable pill badge for use inside EntityRow badge rows.
 *
 * Two variants:
 * - "text" (default): Fixed-height text pill (h-[18px]) with padding.
 * - "icon": 18×18 centered icon box (no text padding).
 *
 * Color is caller-controlled via `colorClass` or inline `style`.
 */
import * as React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
export function EntityListBadge({ children, variant = 'text', colorClass, style, tooltip, className }) {
    const badge = (_jsx("span", { className: cn("shrink-0 rounded", variant === 'icon'
            ? "h-[18px] w-[18px] flex items-center justify-center"
            : "h-[18px] px-1.5 text-[10px] font-medium flex items-center whitespace-nowrap", colorClass, className), style: style, children: children }));
    if (tooltip) {
        return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: badge }), _jsx(TooltipContent, { side: "top", className: "max-w-xs", children: _jsx("span", { className: "text-xs", children: tooltip }) })] }));
    }
    return badge;
}
//# sourceMappingURL=entity-list-badge.js.map