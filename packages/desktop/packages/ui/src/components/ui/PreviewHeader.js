import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PreviewHeader - Unified header component for preview windows and overlays
 *
 * Works in two contexts:
 * - Electron windows: Traffic lights on left (handled by OS), badges centered
 * - Viewer overlays: Badges centered, close button on right
 *
 * Use `onClose` prop to show the close button on the right.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
/**
 * Badge variants using semantic colors
 */
export const PREVIEW_BADGE_VARIANTS = {
    edit: 'text-foreground/70',
    write: 'text-foreground/70',
    read: 'text-foreground/70',
    bash: 'text-foreground/70',
    grep: 'text-foreground/70',
    glob: 'text-foreground/70',
    blue: 'text-foreground/70',
    amber: 'text-foreground/70',
    orange: 'text-foreground/70',
    green: 'text-foreground/70',
    purple: 'text-foreground/70',
    gray: 'text-foreground/70',
    default: 'text-foreground/70',
};
/**
 * PreviewHeaderBadge - Badge component for preview headers
 *
 * Style specs:
 * - Height: 26px
 * - Padding: 10px horizontal
 * - Border radius: 6px
 * - Font: Sans-serif, 13px, medium weight
 * - Truncation: CSS truncate, shrink, stay 1 line
 * - Clickable: underline on hover, pointer cursor
 */
export function PreviewHeaderBadge({ icon: Icon, label, variant = 'default', onClick, title, className, shrinkable = false, }) {
    const variantClasses = PREVIEW_BADGE_VARIANTS[variant];
    const baseClasses = cn('flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] font-sans text-[13px] font-medium bg-background shadow-minimal', variantClasses, className);
    if (onClick) {
        return (_jsxs("button", { onClick: onClick, className: cn(baseClasses, 'min-w-0 cursor-pointer group'), title: title || label, children: [Icon && _jsx(Icon, { className: "w-3.5 h-3.5 shrink-0" }), _jsx("span", { className: "truncate group-hover:underline", children: label })] }));
    }
    return (_jsxs("div", { className: cn(baseClasses, shrinkable ? 'min-w-0' : 'shrink-0'), title: title || label, children: [Icon && _jsx(Icon, { className: "w-3.5 h-3.5 shrink-0" }), _jsx("span", { className: "truncate", children: label })] }));
}
/**
 * PreviewHeader - Header/toolbar for preview windows and overlays
 *
 * Layout:
 * - Left: 70px spacer (for macOS traffic lights in Electron)
 * - Center: Badges row
 * - Right: Close button (if onClose provided) or 70px spacer
 */
export function PreviewHeader({ children, onClose, rightActions, height = 50, className, style, }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: cn('shrink-0 flex items-center justify-between px-3', className), style: { height, ...style }, children: [_jsx("div", { className: "flex-1 min-w-[70px]" }), _jsx("div", { className: "flex items-center gap-2 min-w-0", style: { WebkitAppRegion: 'no-drag' }, children: children }), _jsxs("div", { className: "flex-1 min-w-[70px] flex items-center gap-2 justify-end", style: { WebkitAppRegion: 'no-drag' }, children: [rightActions, onClose && (_jsx("button", { onClick: onClose, className: cn('p-1.5 rounded-[6px] bg-background shadow-minimal cursor-pointer', 'opacity-70 hover:opacity-100 transition-opacity', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'), title: t('common.closeEsc'), children: _jsx(X, { className: "w-4 h-4" }) }))] })] }));
}
//# sourceMappingURL=PreviewHeader.js.map