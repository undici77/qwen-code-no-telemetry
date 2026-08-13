import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
function SelectTrigger({ className, children, ...props }) {
    return (_jsxs(SelectPrimitive.Trigger, { "data-slot": "select-trigger", className: cn("flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 select-none data-[state=open]:ring-1 data-[state=open]:ring-foreground/30", className), ...props, children: [children, _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(ChevronDown, { className: "size-4 opacity-50" }) })] }));
}
function SelectScrollUpButton({ className, ...props }) {
    return (_jsx(SelectPrimitive.ScrollUpButton, { "data-slot": "select-scroll-up-button", className: cn("flex cursor-default items-center justify-center py-1", className), ...props, children: _jsx(ChevronUp, { className: "size-4" }) }));
}
function SelectScrollDownButton({ className, ...props }) {
    return (_jsx(SelectPrimitive.ScrollDownButton, { "data-slot": "select-scroll-down-button", className: cn("flex cursor-default items-center justify-center py-1", className), ...props, children: _jsx(ChevronDown, { className: "size-4" }) }));
}
function SelectContent({ className, children, position = "popper", container, ...props }) {
    return (_jsx(SelectPrimitive.Portal, { container: container, children: _jsxs(SelectPrimitive.Content, { "data-slot": "select-content", className: cn("popover-styled relative z-dropdown max-h-96 min-w-[8rem] overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" &&
                "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className), position: position, ...props, children: [_jsx(SelectScrollUpButton, {}), _jsx(SelectPrimitive.Viewport, { className: cn("p-1", position === "popper" &&
                        "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"), children: children }), _jsx(SelectScrollDownButton, {})] }) }));
}
function SelectLabel({ className, ...props }) {
    return (_jsx(SelectPrimitive.Label, { "data-slot": "select-label", className: cn("px-2 py-1.5 text-sm font-semibold", className), ...props }));
}
function SelectItem({ className, children, ...props }) {
    return (_jsxs(SelectPrimitive.Item, { "data-slot": "select-item", className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-foreground/5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className), ...props, children: [_jsx("span", { className: "absolute right-2 flex size-3.5 items-center justify-center", children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(Check, { className: "size-4" }) }) }), _jsx(SelectPrimitive.ItemText, { children: children })] }));
}
function SelectSeparator({ className, ...props }) {
    return (_jsx(SelectPrimitive.Separator, { "data-slot": "select-separator", className: cn("-mx-1 my-1 h-px bg-muted", className), ...props }));
}
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton, };
//# sourceMappingURL=select.js.map