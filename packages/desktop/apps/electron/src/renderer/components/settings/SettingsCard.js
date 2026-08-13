import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsCard
 *
 * Container card with muted background for grouping related settings.
 * Children are separated by internal dividers.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
/**
 * SettingsCard - Container for grouping related settings
 *
 * @example
 * <SettingsCard>
 *   <SettingsToggle label="Option 1" ... />
 *   <SettingsToggle label="Option 2" ... />
 * </SettingsCard>
 */
export function SettingsCard({ children, className, divided = true }) {
    const childArray = React.Children.toArray(children).filter(Boolean);
    return (_jsx("div", { className: cn('rounded-xl bg-background shadow-minimal overflow-hidden', className), children: divided && childArray.length > 1
            ? childArray.map((child, index) => (_jsxs(React.Fragment, { children: [index > 0 && _jsx("div", { className: "h-px bg-border/50 mx-4" }), child] }, index)))
            : children }));
}
/**
 * SettingsCardContent - Inner padding wrapper for card content
 *
 * Use when you need custom content inside a SettingsCard
 */
export function SettingsCardContent({ children, className, }) {
    return _jsx("div", { className: cn('px-4 py-3.5', className), children: children });
}
/**
 * SettingsCardFooter - Footer section with actions
 */
export function SettingsCardFooter({ children, className, }) {
    return (_jsx("div", { className: cn('px-4 py-3 border-t border-border/50 bg-muted/30 flex items-center justify-end gap-2', className), children: children }));
}
//# sourceMappingURL=SettingsCard.js.map