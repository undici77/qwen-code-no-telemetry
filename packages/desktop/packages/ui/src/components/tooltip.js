import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../lib/utils";
function TooltipProvider({ delayDuration = 300, ...props }) {
    return (_jsx(TooltipPrimitive.Provider, { delayDuration: delayDuration, disableHoverableContent: true, ...props }));
}
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
function TooltipContent({ className, sideOffset = 4, ...props }) {
    return (_jsx(TooltipPrimitive.Portal, { children: _jsx(TooltipPrimitive.Content, { "data-slot": "tooltip-content", sideOffset: sideOffset, className: cn("z-tooltip overflow-hidden rounded-[8px] px-2.5 py-1.5 text-xs", "dark bg-background/80 backdrop-blur-xl backdrop-saturate-150 border border-border/50 text-foreground shadow-modal-small", "animate-in fade-in-0 duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-75", className), ...props }) }));
}
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
//# sourceMappingURL=tooltip.js.map