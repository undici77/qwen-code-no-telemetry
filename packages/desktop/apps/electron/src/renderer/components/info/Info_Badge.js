import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info_Badge
 *
 * Colored badge with optional icon for status indicators.
 * Features rounded-lg (8px) corners and tinted shadow based on color.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
const colorConfig = {
    success: {
        bg: 'bg-[oklch(from_var(--success)_l_c_h_/_0.08)]',
        text: 'text-[var(--success-text)]',
        shadow: 'shadow-tinted',
        shadowColor: 'var(--success-rgb)',
    },
    warning: {
        bg: 'bg-[oklch(from_var(--info)_l_c_h_/_0.08)]',
        text: 'text-[var(--info-text)]',
        shadow: 'shadow-tinted',
        shadowColor: 'var(--info-rgb)',
    },
    destructive: {
        bg: 'bg-[oklch(from_var(--destructive)_l_c_h_/_0.08)]',
        text: 'text-[var(--destructive-text)]',
        shadow: 'shadow-tinted',
        shadowColor: 'var(--destructive-rgb)',
    },
    default: {
        bg: 'bg-foreground/10',
        text: 'text-foreground/70',
        shadow: 'shadow-tinted',
        shadowColor: 'var(--foreground-rgb)',
    },
    muted: {
        bg: 'bg-background',
        text: 'text-foreground/70',
        shadow: 'shadow-minimal',
    },
};
export function Info_Badge({ color = 'default', icon, children, className, style, ...props }) {
    const config = colorConfig[color];
    return (_jsxs("span", { className: cn('inline-flex items-center gap-1.5 rounded-[5px] pl-2.5 pr-3 py-1 text-xs font-medium', config.bg, config.text, config.shadow, className), style: config.shadowColor
            ? { '--shadow-color': config.shadowColor, ...style }
            : style, ...props, children: [icon && _jsx("span", { className: "shrink-0", children: icon }), children] }));
}
//# sourceMappingURL=Info_Badge.js.map