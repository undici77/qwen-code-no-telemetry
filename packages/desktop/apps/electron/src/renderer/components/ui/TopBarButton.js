import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
/**
 * TopBarButton - Consistent button style for the app's top bar
 *
 * Fixed size 28x28px with centered content, rounded corners, and hover effects.
 * Used for: Craft logo, back/forward navigation, sidebar toggle, etc.
 */
export const TopBarButton = React.forwardRef(({ children, isActive, className, disabled, ...props }, ref) => {
    return (_jsx("button", { ref: ref, type: "button", disabled: disabled, className: cn("header-icon-btn h-7 w-7 flex items-center justify-center rounded-[6px] titlebar-no-drag", "hover:bg-foreground/5 focus:outline-none focus-visible:ring-0", "disabled:opacity-30 disabled:pointer-events-none", "transition-colors duration-100", isActive && "bg-foreground/5", className), ...props, children: children }));
});
TopBarButton.displayName = "TopBarButton";
//# sourceMappingURL=TopBarButton.js.map