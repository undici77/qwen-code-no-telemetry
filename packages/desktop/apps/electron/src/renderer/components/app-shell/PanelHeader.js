import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
// eslint-disable-next-line import/no-internal-modules
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompensateForStoplight } from '@/context/StoplightContext';
import { DropdownMenu, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { StyledDropdownMenuContent } from '@/components/ui/styled-dropdown';
// Spring transition for smooth animations (matches sidebar)
const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
};
// Padding to compensate for macOS traffic lights (stoplight buttons)
// Traffic lights positioned at x:18, ~52px wide = 70px + 14px gap
const STOPLIGHT_PADDING = 84;
const TOP_BAR_CONTROL_NO_DRAG_WIDTH = 320;
/**
 * Standardized panel header with title and actions
 */
export function PanelHeader({ title, badge, titleMenu, leadingAction, centerButton, actions, rightSidebarButton, compensateForStoplight, paddingLeft, className, isRegeneratingTitle, }) {
    // Use context as fallback when prop is not explicitly set.
    // Skip stoplight compensation when leadingAction is present — the back button
    // occupies the space where traffic lights would be.
    const contextCompensate = useCompensateForStoplight();
    const shouldCompensate = leadingAction
        ? false
        : (compensateForStoplight ?? contextCompensate);
    // Controlled dropdown state for anchoring to chevron while keeping full title clickable
    const [dropdownOpen, setDropdownOpen] = useState(false);
    // Title content - either static or interactive with dropdown
    // Shimmer effect shows during title regeneration
    const titleContent = (_jsxs(motion.div, { initial: false, animate: { opacity: title ? 1 : 0 }, transition: { duration: 0.15 }, className: "flex min-w-0 max-w-full items-center gap-1", children: [_jsx("h1", { className: cn('min-w-0 max-w-full text-sm font-semibold truncate font-sans leading-tight', isRegeneratingTitle && 'animate-shimmer-text'), title: title, children: title }), badge] }));
    const content = (_jsxs(_Fragment, { children: [leadingAction && (_jsx("div", { className: "titlebar-no-drag shrink-0", children: leadingAction })), _jsx("div", { className: "flex-1 min-w-0 flex items-center select-none", children: _jsx("div", { className: cn('max-w-full overflow-hidden', !leadingAction && 'mx-auto'), children: titleMenu ? (_jsxs(DropdownMenu, { open: dropdownOpen, onOpenChange: setDropdownOpen, children: [_jsxs("button", { onClick: () => setDropdownOpen(true), className: cn('flex max-w-full items-center gap-1 px-2 py-1 rounded-md titlebar-no-drag min-w-0', 'hover:bg-foreground/[0.03] transition-colors', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring', dropdownOpen && 'bg-foreground/[0.03]'), children: [titleContent, _jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("span", { className: "shrink-0 flex items-center justify-center", children: _jsx(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground translate-y-[1px]" }) }) })] }), _jsx(StyledDropdownMenuContent, { align: "center", sideOffset: 8, children: titleMenu })] })) : (titleContent) }) }), centerButton && (_jsx("div", { className: "titlebar-no-drag shrink-0", children: centerButton })), actions && _jsx("div", { className: "titlebar-no-drag shrink-0", children: actions }), rightSidebarButton && (_jsx("div", { className: "titlebar-no-drag shrink-0", children: rightSidebarButton }))] }));
    // Base padding (16px = pl-4, matches pr-2 when leading action present for symmetry)
    const basePadding = leadingAction ? 8 : 16;
    const baseClassName = cn('titlebar-drag-region flex shrink-0 items-center pr-2 min-w-0 gap-1.5 relative z-panel h-[42px]', 
    // Only use static paddingLeft class when not animating
    !shouldCompensate && (paddingLeft || (leadingAction ? 'pl-2' : 'pl-4')), className);
    // Use motion.div with animated paddingLeft to shift content while keeping background full-width
    return (_jsxs(motion.div, { initial: false, animate: {
            paddingLeft: shouldCompensate ? STOPLIGHT_PADDING : basePadding,
        }, transition: springTransition, className: baseClassName, children: [shouldCompensate && (_jsx("div", { className: "titlebar-no-drag absolute left-0 top-0 h-full", style: { width: TOP_BAR_CONTROL_NO_DRAG_WIDTH }, "aria-hidden": "true" })), content] }));
}
//# sourceMappingURL=PanelHeader.js.map