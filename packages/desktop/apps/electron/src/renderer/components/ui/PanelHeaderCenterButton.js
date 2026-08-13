import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { forwardRef } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
export const PanelHeaderCenterButton = forwardRef(({ icon, tooltip, className, ...props }, ref) => {
    const button = (_jsx("button", { ref: ref, type: "button", "aria-label": props['aria-label'] ?? tooltip, className: cn("panel-header-btn inline-flex items-center justify-center", "p-1.5 shrink-0 rounded-[6px] titlebar-no-drag", "bg-background shadow-minimal", "opacity-70 hover:opacity-100", "transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", "disabled:pointer-events-none disabled:opacity-50", className), ...props, children: icon }));
    if (tooltip) {
        return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: button }), _jsx(TooltipContent, { children: tooltip })] }));
    }
    return button;
});
PanelHeaderCenterButton.displayName = 'PanelHeaderCenterButton';
//# sourceMappingURL=PanelHeaderCenterButton.js.map