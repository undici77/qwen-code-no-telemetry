import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
const ContextMenuShortcutContext = React.createContext(null);
function ContextMenu({ onOpenChange, ...props }) {
    return (_jsx(ContextMenuPrimitive.Root, { "data-slot": "context-menu", onOpenChange: onOpenChange, ...props }));
}
function ContextMenuTrigger({ ...props }) {
    return (_jsx(ContextMenuPrimitive.Trigger, { "data-slot": "context-menu-trigger", ...props }));
}
function ContextMenuGroup({ ...props }) {
    return (_jsx(ContextMenuPrimitive.Group, { "data-slot": "context-menu-group", ...props }));
}
function ContextMenuPortal({ ...props }) {
    return (_jsx(ContextMenuPrimitive.Portal, { "data-slot": "context-menu-portal", ...props }));
}
function ContextMenuSub({ ...props }) {
    return _jsx(ContextMenuPrimitive.Sub, { "data-slot": "context-menu-sub", ...props });
}
function ContextMenuRadioGroup({ ...props }) {
    return (_jsx(ContextMenuPrimitive.RadioGroup, { "data-slot": "context-menu-radio-group", ...props }));
}
function ContextMenuSubTrigger({ className, inset, children, ...props }) {
    return (_jsxs(ContextMenuPrimitive.SubTrigger, { "data-slot": "context-menu-sub-trigger", "data-inset": inset, className: cn("focus:bg-foreground/5 data-[state=open]:bg-foreground/5 [&>svg:not([class*='text-'])]:text-muted-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className), ...props, children: [children, _jsx(ChevronRightIcon, { className: "ml-auto" })] }));
}
function ContextMenuSubContent({ className, ...props }) {
    return (_jsx(ContextMenuPrimitive.SubContent, { "data-slot": "context-menu-sub-content", className: cn("popover-styled data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-dropdown min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden p-1", className), ...props }));
}
function ContextMenuContent({ className, onKeyDown, children, ...props }) {
    const shortcutRegistry = React.useRef(new Map());
    const contentRef = React.useRef(null);
    // Close the menu by pressing Escape programmatically
    const closeMenu = React.useCallback(() => {
        // Dispatch Escape key to close the menu
        contentRef.current?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }, []);
    const contextValue = React.useMemo(() => ({
        register: (key, handler) => {
            shortcutRegistry.current.set(key.toLowerCase(), handler);
        },
        unregister: (key) => {
            shortcutRegistry.current.delete(key.toLowerCase());
        },
        close: closeMenu,
    }), [closeMenu]);
    const handleKeyDown = React.useCallback((e) => {
        // Call original onKeyDown if provided
        onKeyDown?.(e);
        // Check if key matches a registered shortcut
        const handler = shortcutRegistry.current.get(e.key.toLowerCase());
        if (handler && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            handler();
        }
    }, [onKeyDown]);
    return (_jsx(ContextMenuPrimitive.Portal, { children: _jsx(ContextMenuPrimitive.Content, { ref: contentRef, "data-slot": "context-menu-content", onKeyDown: handleKeyDown, className: cn("popover-styled data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-dropdown max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto p-1", className), ...props, children: _jsx(ContextMenuShortcutContext.Provider, { value: contextValue, children: children }) }) }));
}
function ContextMenuItem({ className, inset, variant = "default", shortcut, children, onClick, ...props }) {
    const shortcutContext = React.useContext(ContextMenuShortcutContext);
    React.useEffect(() => {
        if (!shortcut || !shortcutContext || !onClick)
            return;
        // Register the shortcut with a handler that simulates a click and closes menu
        const handler = () => {
            onClick({});
            shortcutContext.close();
        };
        shortcutContext.register(shortcut, handler);
        return () => {
            shortcutContext.unregister(shortcut);
        };
    }, [shortcut, shortcutContext, onClick]);
    return (_jsxs(ContextMenuPrimitive.Item, { "data-slot": "context-menu-item", "data-inset": inset, "data-variant": variant, onClick: onClick, className: cn("focus:bg-foreground/5 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&>svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className), ...props, children: [children, shortcut && _jsx(ContextMenuShortcut, { children: shortcut })] }));
}
function ContextMenuCheckboxItem({ className, children, checked, ...props }) {
    return (_jsxs(ContextMenuPrimitive.CheckboxItem, { "data-slot": "context-menu-checkbox-item", className: cn("focus:bg-foreground/5 relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className), checked: checked, ...props, children: [_jsx("span", { className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center", children: _jsx(ContextMenuPrimitive.ItemIndicator, { children: _jsx(CheckIcon, { className: "size-4" }) }) }), children] }));
}
function ContextMenuRadioItem({ className, children, ...props }) {
    return (_jsxs(ContextMenuPrimitive.RadioItem, { "data-slot": "context-menu-radio-item", className: cn("focus:bg-foreground/5 relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className), ...props, children: [_jsx("span", { className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center", children: _jsx(ContextMenuPrimitive.ItemIndicator, { children: _jsx(CircleIcon, { className: "size-2 fill-current" }) }) }), children] }));
}
function ContextMenuLabel({ className, inset, ...props }) {
    return (_jsx(ContextMenuPrimitive.Label, { "data-slot": "context-menu-label", "data-inset": inset, className: cn("text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className), ...props }));
}
function ContextMenuSeparator({ className, ...props }) {
    return (_jsx(ContextMenuPrimitive.Separator, { "data-slot": "context-menu-separator", className: cn("bg-foreground/5 -mx-1 my-1 h-px", className), ...props }));
}
function ContextMenuShortcut({ className, ...props }) {
    return (_jsx("span", { "data-slot": "context-menu-shortcut", className: cn("ml-auto text-[10px] font-medium opacity-50 px-1.5 py-0.5 rounded border border-foreground/15", className), ...props }));
}
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup, };
//# sourceMappingURL=context-menu.js.map