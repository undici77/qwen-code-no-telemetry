import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EntityRow — Reusable visual skeleton for list items.
 *
 * Extracted from SessionItem/SourceItem/SkillItem which all share the same layout:
 * - Absolutely-positioned icon on the left
 * - Title + badge/subtitle row
 * - Optional trailing content (timestamp, count)
 * - Hover-visible MoreHorizontal dropdown + context menu
 * - Selection/multi-select styling
 * - Optional separator above
 * - Optional children below the button (e.g. expanded child list)
 * - Optional overlay (e.g. match count badge)
 *
 * Domain-specific logic (what icon, what badges, what menu items) is injected via slots.
 */
import * as React from 'react';
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, } from '@/components/ui/styled-dropdown';
import { ContextMenu, ContextMenuTrigger, StyledContextMenuContent, } from '@/components/ui/styled-context-menu';
import { DropdownMenuProvider, ContextMenuProvider, } from '@/components/ui/menu-context';
import { cn } from '@/lib/utils';
export function EntityRow({ icon, title, titleClassName, titleTrailing, titleSuffix, subtitle, badges, trailing, controls, children, overlay, isSelected = false, isInMultiSelect = false, onMouseDown, onClick, showSeparator = false, menuContent, contextMenuContent, hideMoreButton = false, buttonProps, dataAttributes, className, separatorClassName = 'pl-12 pr-4', }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // Resolve context menu content: use override if provided, else fall back to dropdown menu content
    const resolvedContextMenu = contextMenuContent ?? menuContent;
    // Build the inner content (shared between with-context-menu and without)
    const innerContent = (_jsxs("div", { className: "relative group select-none pl-2 mr-2", children: [(isSelected || isInMultiSelect) && (_jsx("div", { className: "absolute left-0 inset-y-0 w-[2px] bg-accent" })), _jsx("button", { ...buttonProps, className: cn('entity-row-btn flex w-full items-start gap-2 pl-2 py-3 text-left text-sm outline-none rounded-[8px]', 'transition-[background-color] duration-75', controls ? 'pr-24' : 'pr-4', isSelected || isInMultiSelect
                    ? 'bg-foreground/3'
                    : 'hover:bg-foreground/2', buttonProps?.className), onMouseDown: onMouseDown, onClick: !onMouseDown ? onClick : undefined, children: _jsxs("div", { className: "flex flex-col gap-1.5 min-w-0 flex-1", children: [titleTrailing ? (_jsxs("div", { className: "flex items-center gap-[10px] w-full min-w-0", children: [icon && (_jsx("div", { className: "shrink-0 flex items-center gap-[10px] [&>*]:w-3 [&>*]:h-3", children: icon })), _jsx("div", { className: cn('font-sans truncate min-w-0', titleClassName), children: title }), titleSuffix && (_jsx("div", { className: "shrink-0 flex items-center", children: titleSuffix })), _jsxs("div", { className: "shrink-0 ml-auto relative -mr-1", children: [_jsx("span", { className: cn(menuOpen || contextMenuOpen
                                                ? 'invisible'
                                                : 'group-hover:invisible'), children: titleTrailing }), menuContent && !hideMoreButton && (_jsx("div", { className: cn('absolute inset-0 flex items-center justify-end overflow-visible', menuOpen || contextMenuOpen
                                                ? 'opacity-100'
                                                : 'opacity-0 group-hover:opacity-100'), onMouseDown: (e) => e.stopPropagation(), children: _jsxs(DropdownMenu, { modal: true, open: menuOpen, onOpenChange: setMenuOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("div", { className: "p-1 rounded-[6px] hover:bg-foreground/10 data-[state=open]:bg-foreground/10 cursor-pointer", children: _jsx(MoreHorizontal, { className: "h-3.5 w-3.5 text-muted-foreground" }) }) }), _jsx(StyledDropdownMenuContent, { align: "end", children: _jsx(DropdownMenuProvider, { children: menuContent }) })] }) }))] })] })) : (_jsxs("div", { className: "flex items-center gap-[10px] w-full pr-6 min-w-0", children: [icon && (_jsx("div", { className: "shrink-0 flex items-center gap-[10px] [&>*]:w-3 [&>*]:h-3", children: icon })), _jsx("div", { className: cn('font-medium font-sans line-clamp-2 min-w-0 -mb-[2px]', titleClassName), children: title }), titleSuffix && (_jsx("div", { className: "shrink-0 self-center flex items-center", children: titleSuffix }))] })), subtitle && (_jsxs("div", { className: "flex items-start gap-[10px] w-full text-[12px] text-foreground/55 min-w-0 -mt-1", children: [icon && (_jsx("div", { className: "shrink-0 flex items-center gap-[10px] [&>*]:w-3 [&>*]:h-3 invisible", "aria-hidden": "true", children: icon })), _jsx("div", { className: "min-w-0 flex-1 line-clamp-2 leading-[1.35]", children: subtitle })] })), (badges || trailing) && (_jsxs("div", { className: "flex items-center gap-[10px] text-xs text-foreground/70 w-full -mb-[2px] min-w-0", children: [icon && (_jsx("div", { className: "shrink-0 flex items-center gap-[10px] [&>*]:w-3 [&>*]:h-3 invisible", "aria-hidden": "true", children: icon })), badges && (_jsx("div", { className: "flex-1 flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-hide", style: {
                                        maskImage: 'linear-gradient(to right, black calc(100% - 16px), transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 16px), transparent 100%)',
                                    }, children: badges })), trailing && (_jsx("div", { className: "shrink-0 flex items-center gap-1 ml-auto", children: trailing }))] }))] }) }), controls && (_jsx("div", { className: "absolute right-3 top-1/2 z-20 flex -translate-y-1/2 items-center gap-3", onMouseDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(), children: controls })), children, overlay, menuContent && !hideMoreButton && !titleTrailing && (_jsx("div", { className: cn('absolute right-2 top-2 transition-opacity z-10', menuOpen || contextMenuOpen
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'), onMouseDown: (e) => e.stopPropagation(), children: _jsx("div", { className: "flex items-center rounded-[8px] overflow-hidden border border-transparent hover:border-border/50", children: _jsxs(DropdownMenu, { modal: true, open: menuOpen, onOpenChange: setMenuOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("div", { className: "p-1.5 hover:bg-foreground/10 data-[state=open]:bg-foreground/10 cursor-pointer", children: _jsx(MoreHorizontal, { className: "h-4 w-4 text-muted-foreground" }) }) }), _jsx(StyledDropdownMenuContent, { align: "end", children: _jsx(DropdownMenuProvider, { children: menuContent }) })] }) }) }))] }));
    return (_jsxs("div", { className: className, "data-selected": isSelected || undefined, ...dataAttributes, children: [showSeparator && (_jsx("div", { className: separatorClassName, children: _jsx(Separator, {}) })), resolvedContextMenu ? (_jsxs(ContextMenu, { modal: true, onOpenChange: setContextMenuOpen, children: [_jsx(ContextMenuTrigger, { asChild: true, children: innerContent }), _jsx(StyledContextMenuContent, { children: _jsx(ContextMenuProvider, { children: resolvedContextMenu }) })] })) : (innerContent)] }));
}
//# sourceMappingURL=entity-row.js.map