import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SessionStatusMenu } from "@/components/ui/session-status-menu";
import { getStateIcon, getStateIconStyle } from "@/config/session-status-config";
import { useSessionListContext } from "@/context/SessionListContext";
import { getSessionStatus } from "@/utils/session";
export function SessionStatusIcon({ item }) {
    const ctx = useSessionListContext();
    const [open, setOpen] = useState(false);
    const status = getSessionStatus(item);
    const handleSelect = (state) => {
        setOpen(false);
        ctx.onSessionStatusChange(item.id, state);
    };
    return (_jsxs(Popover, { modal: true, open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", className: cn("!h-5 !w-5 flex items-center justify-center rounded-full transition-colors cursor-pointer", "hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", "[&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full [&>span]:text-base"), style: getStateIconStyle(status, ctx.sessionStatuses), "aria-haspopup": "menu", "aria-expanded": open, "aria-label": "Change todo state", onContextMenu: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }, children: getStateIcon(status, ctx.sessionStatuses) }) }), _jsx(PopoverContent, { className: "w-auto p-0 border-0 shadow-none bg-transparent", align: "start", side: "bottom", sideOffset: 4, onContextMenu: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, children: _jsx(SessionStatusMenu, { activeState: status, onSelect: handleSelect, states: ctx.sessionStatuses, isArchived: item.isArchived, onArchive: ctx.onArchive ? () => { setOpen(false); ctx.onArchive(item.id); } : undefined, onUnarchive: ctx.onUnarchive ? () => { setOpen(false); ctx.onUnarchive(item.id); } : undefined }) })] }));
}
//# sourceMappingURL=SessionStatusIcon.js.map