import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { useWebShellPortalRoot } from '../../portalRoot';
function Popover({ ...props }) {
    return _jsx(PopoverPrimitive.Root, { "data-slot": "popover", ...props });
}
const PopoverTrigger = React.forwardRef(function PopoverTrigger(props, ref) {
    return (_jsx(PopoverPrimitive.Trigger, { ref: ref, "data-slot": "popover-trigger", ...props }));
});
const PopoverContent = React.forwardRef(function PopoverContent({ className, align = 'center', sideOffset = 4, ...props }, ref) {
    const portalRoot = useWebShellPortalRoot();
    return (_jsx(PopoverPrimitive.Portal, { container: portalRoot ?? undefined, children: _jsx(PopoverPrimitive.Content, { ref: ref, "data-slot": "popover-content", align: align, sideOffset: sideOffset, className: cn('z-[var(--web-shell-popover-z-index,1000)] flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95', className), ...props }) }));
});
const PopoverAnchor = React.forwardRef(function PopoverAnchor(props, ref) {
    return (_jsx(PopoverPrimitive.Anchor, { ref: ref, "data-slot": "popover-anchor", ...props }));
});
function PopoverHeader({ className, ...props }) {
    return (_jsx("div", { "data-slot": "popover-header", className: cn('flex flex-col gap-0.5 text-sm', className), ...props }));
}
function PopoverTitle({ className, ...props }) {
    return (_jsx("div", { "data-slot": "popover-title", className: cn('font-medium', className), ...props }));
}
function PopoverDescription({ className, ...props }) {
    return (_jsx("p", { "data-slot": "popover-description", className: cn('text-muted-foreground', className), ...props }));
}
export { Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, };
//# sourceMappingURL=popover.js.map