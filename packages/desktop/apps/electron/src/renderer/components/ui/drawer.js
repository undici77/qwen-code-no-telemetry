import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
function Drawer({ ...props }) {
    return _jsx(DrawerPrimitive.Root, { "data-slot": "drawer", ...props });
}
function DrawerTrigger({ ...props }) {
    return _jsx(DrawerPrimitive.Trigger, { "data-slot": "drawer-trigger", ...props });
}
function DrawerPortal({ ...props }) {
    return _jsx(DrawerPrimitive.Portal, { "data-slot": "drawer-portal", ...props });
}
function DrawerClose({ ...props }) {
    return _jsx(DrawerPrimitive.Close, { "data-slot": "drawer-close", ...props });
}
function DrawerOverlay({ className, ...props }) {
    return (_jsx(DrawerPrimitive.Overlay, { "data-slot": "drawer-overlay", className: cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-modal bg-black/50", className), ...props }));
}
function DrawerContent({ className, children, overlay, ...props }) {
    return (_jsxs(DrawerPortal, { "data-slot": "drawer-portal", children: [overlay !== undefined ? overlay : _jsx(DrawerOverlay, {}), _jsxs(DrawerPrimitive.Content, { "data-slot": "drawer-content", className: cn("group/drawer-content bg-background fixed z-modal flex h-auto flex-col", "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b", "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t", "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm", "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm", className), ...props, children: [_jsx("div", { className: "bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" }), children] })] }));
}
function DrawerHeader({ className, ...props }) {
    return (_jsx("div", { "data-slot": "drawer-header", className: cn("flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left", className), ...props }));
}
function DrawerFooter({ className, ...props }) {
    return (_jsx("div", { "data-slot": "drawer-footer", className: cn("mt-auto flex flex-col gap-2 p-4", className), ...props }));
}
function DrawerTitle({ className, ...props }) {
    return (_jsx(DrawerPrimitive.Title, { "data-slot": "drawer-title", className: cn("text-foreground font-semibold", className), ...props }));
}
function DrawerDescription({ className, ...props }) {
    return (_jsx(DrawerPrimitive.Description, { "data-slot": "drawer-description", className: cn("text-muted-foreground text-sm", className), ...props }));
}
export { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, };
//# sourceMappingURL=drawer.js.map