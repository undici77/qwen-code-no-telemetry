import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuTrigger, StyledContextMenuContent, } from '@/components/ui/styled-context-menu';
import { ContextMenuProvider } from '@/components/ui/menu-context';
import { SidebarMenu } from './SidebarMenu';
import { SortableList } from '@/components/ui/sortable-list';
export const isSeparatorItem = (item) => 'type' in item && item.type === 'separator';
// Stagger animation for child items
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.025,
            delayChildren: 0.01,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.015,
            staggerDirection: -1,
        },
    },
};
const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.15, ease: 'easeOut' },
    },
    exit: {
        opacity: 0,
        x: -8,
        transition: { duration: 0.1, ease: 'easeIn' },
    },
};
/**
 * LeftSidebar - Vertical list of navigation buttons with icons
 *
 * Navigation is managed by the parent component (Chat.tsx) for unified
 * sidebar keyboard navigation. This component just renders the items.
 *
 * Styling matches agent items in the sidebar for consistency:
 * - py-[7px] px-2 text-[13px] rounded-md
 * - Icon: h-3.5 w-3.5
 *
 * Link variants:
 * - "default": Highlighted style (used for active/selected items)
 * - "ghost": Subtle style (used for inactive items)
 *
 * Expandable items:
 * - Show a chevron toggle on hover (replaces icon position)
 * - Children are rendered with animated expand/collapse
 * - Nested items have left indentation with vertical line
 *
 * Drag-and-drop:
 * - Expandable items can opt-in to sortable (flat) or sortableTree (hierarchical) DnD
 * - Uses @dnd-kit with DragOverlay portaled to document.body (no clipping)
 * - Two-phase drop animation: overlay fades out, ghost fades in
 */
export function LeftSidebar({ links, isCollapsed, className, getItemProps, focusedItemId, isNested }) {
    // For nested sidebars, wrap in motion container for stagger effect
    const NavWrapper = isNested ? motion.nav : 'nav';
    const navProps = isNested ? {
        variants: containerVariants,
        initial: 'hidden',
        animate: 'visible',
        exit: 'exit',
    } : {};
    return (_jsx("div", { className: cn("flex flex-col select-none", !isNested && "py-1", className), children: _jsxs(NavWrapper, { className: cn("grid gap-0.5", isNested ? "pl-5 pr-0 relative" : "px-2"), role: "navigation", "aria-label": isNested ? "Sub navigation" : "Main navigation", ...navProps, children: [isNested && (_jsx("div", { className: "absolute left-[13px] top-1 bottom-1 w-px bg-foreground/10", "aria-hidden": "true" })), links.map((item) => {
                    // Handle separator items
                    if (isSeparatorItem(item)) {
                        return (_jsx("div", { className: "py-1 px-2", "aria-hidden": "true", children: _jsx("div", { className: "h-px bg-foreground/5" }) }, item.id));
                    }
                    const link = item;
                    const itemProps = getItemProps?.(link.id);
                    const isFocused = focusedItemId === link.id;
                    // Button element shared by both expandable and non-expandable items
                    const buttonElement = (_jsx(SidebarButton, { link: link, itemProps: itemProps }));
                    // Determine which expanded content to render (sortable vs regular)
                    const expandedContent = link.expandable && link.items && link.expanded
                        ? renderExpandedContent(link, getItemProps, focusedItemId, isNested)
                        : null;
                    // Wrap with context menu if configured, scoped to button only.
                    // ContextMenuTrigger with asChild sets data-state="open" on the button
                    // so only the clicked item highlights, not the entire section.
                    const content = (_jsxs("div", { className: "group/section", children: [link.contextMenu ? (_jsxs(ContextMenu, { modal: true, children: [_jsx(ContextMenuTrigger, { asChild: true, children: buttonElement }), _jsx(StyledContextMenuContent, { children: _jsx(ContextMenuProvider, { children: _jsx(SidebarMenu, { type: link.contextMenu.type, statusId: link.contextMenu.statusId, labelId: link.contextMenu.labelId, onConfigureStatuses: link.contextMenu.onConfigureStatuses, onMarkAllRead: link.contextMenu.onMarkAllRead, onConfigureLabels: link.contextMenu.onConfigureLabels, onAddLabel: link.contextMenu.onAddLabel, onDeleteLabel: link.contextMenu.onDeleteLabel, onAddSource: link.contextMenu.onAddSource, onAddSkill: link.contextMenu.onAddSkill, onAddAutomation: link.contextMenu.onAddAutomation, sourceType: link.contextMenu.sourceType, onConfigureViews: link.contextMenu.onConfigureViews, viewId: link.contextMenu.viewId, onDeleteView: link.contextMenu.onDeleteView }) }) })] })) : (buttonElement), link.expandable && link.items && (_jsx(AnimatePresence, { initial: false, children: link.expanded && (_jsx(motion.div, { initial: { height: 0, opacity: 0, marginTop: 0, marginBottom: 0 }, animate: { height: 'auto', opacity: 1, marginTop: 2, marginBottom: isNested ? 4 : 8 }, exit: { height: 0, opacity: 0, marginTop: 0, marginBottom: 0 }, transition: { duration: 0.2, ease: 'easeInOut' }, className: "overflow-hidden", children: expandedContent })) }))] }));
                    // For nested items, wrap in motion.div for stagger animation
                    return isNested ? (_jsx(motion.div, { variants: itemVariants, children: content }, link.id)) : (_jsx(React.Fragment, { children: content }, link.id));
                })] }) }));
}
// ============================================================
// Expanded Content Renderer
// Chooses between sortable, sortableTree, or regular nested sidebar
// ============================================================
function renderExpandedContent(link, getItemProps, focusedItemId, isNested) {
    // Flat sortable (e.g., statuses): wrap items in SortableList
    if (link.sortable && link.items) {
        // Split at first separator: items before are sortable, items after are trailing (non-sortable)
        const separatorIndex = link.items.findIndex(isSeparatorItem);
        const sortableItems = separatorIndex >= 0 ? link.items.slice(0, separatorIndex) : link.items;
        const trailingItems = separatorIndex >= 0
            ? link.items.slice(separatorIndex + 1).filter((item) => !isSeparatorItem(item))
            : [];
        return (_jsx(SortableStatusList, { items: sortableItems, onReorder: link.sortable.onReorder, getItemProps: getItemProps, focusedItemId: focusedItemId, trailingItems: trailingItems.length > 0 ? trailingItems : undefined }));
    }
    // Default: regular nested sidebar (no DnD)
    return (_jsx(LeftSidebar, { isCollapsed: false, isNested: true, getItemProps: getItemProps, focusedItemId: focusedItemId, links: link.items }));
}
function SortableStatusList({ items, onReorder, getItemProps, focusedItemId, trailingItems }) {
    // Filter to LinkItems only (separators don't participate in DnD)
    const linkItems = items.filter((item) => !isSeparatorItem(item));
    // Map to SortableItemData format (needs `id` field)
    const sortableItems = linkItems.map(item => ({
        ...item,
        id: item.id,
    }));
    const handleReorder = React.useCallback((newItems) => {
        // Extract the raw IDs (strip 'nav:state:' prefix) for the IPC call
        const orderedIds = newItems.map(item => {
            // Strip navigation prefix to get the actual status/label ID
            const parts = item.id.split(':');
            return parts[parts.length - 1];
        });
        onReorder(orderedIds);
    }, [onReorder]);
    return (_jsx("div", { className: "flex flex-col select-none", children: _jsxs("div", { className: "pl-5 pr-0 relative", children: [_jsx("div", { className: "absolute left-[13px] top-1 bottom-1 w-px bg-foreground/10", "aria-hidden": "true" }), _jsx(SortableList, { items: sortableItems, onReorder: handleReorder, className: "grid gap-0.5", renderItem: (item) => (_jsx("div", { className: "group/section", children: item.contextMenu ? (_jsxs(ContextMenu, { modal: true, children: [_jsx(ContextMenuTrigger, { asChild: true, children: _jsx(SidebarButton, { link: item, itemProps: getItemProps?.(item.id) }) }), _jsx(StyledContextMenuContent, { children: _jsx(ContextMenuProvider, { children: _jsx(SidebarMenu, { type: item.contextMenu.type, statusId: item.contextMenu.statusId, labelId: item.contextMenu.labelId, onConfigureStatuses: item.contextMenu.onConfigureStatuses, onMarkAllRead: item.contextMenu.onMarkAllRead, onConfigureLabels: item.contextMenu.onConfigureLabels, onAddLabel: item.contextMenu.onAddLabel, onDeleteLabel: item.contextMenu.onDeleteLabel, onAddSource: item.contextMenu.onAddSource, onAddSkill: item.contextMenu.onAddSkill, onAddAutomation: item.contextMenu.onAddAutomation, sourceType: item.contextMenu.sourceType, onConfigureViews: item.contextMenu.onConfigureViews, viewId: item.contextMenu.viewId, onDeleteView: item.contextMenu.onDeleteView }) }) })] })) : (_jsx(SidebarButton, { link: item, itemProps: getItemProps?.(item.id) })) })), renderOverlay: (item) => (_jsx(SidebarButton, { link: item, isOverlay: true })) }), trailingItems && trailingItems.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "my-1 ml-2", "aria-hidden": "true", children: _jsx("div", { className: "h-px bg-foreground/5" }) }), _jsx("div", { className: "grid gap-0.5", children: trailingItems.map(item => (_jsx("div", { className: "group/section", children: _jsx(SidebarButton, { link: item, itemProps: getItemProps?.(item.id) }) }, item.id))) })] }))] }) }));
}
// forwardRef is required so Radix's ContextMenuTrigger (asChild) can attach its ref
// and pass props like data-state="open" directly onto this button element.
const SidebarButton = React.forwardRef(({ link, itemProps, isOverlay, className: extraClassName, ...radixProps }, forwardedRef) => {
    return (_jsxs("button", { ...(isOverlay ? {} : (() => {
            // Separate ref from itemProps so we can merge it with forwardedRef
            const { ref: _itemRef, ...rest } = itemProps || { ref: undefined };
            return rest;
        })()), ...radixProps, ref: (el) => {
            // Merge forwarded ref (from Radix) and itemProps ref (for keyboard nav)
            if (typeof forwardedRef === 'function')
                forwardedRef(el);
            else if (forwardedRef)
                forwardedRef.current = el;
            if (!isOverlay && itemProps?.ref)
                itemProps.ref(el);
        }, onClick: isOverlay ? undefined : link.onClick, "data-tutorial": link.dataTutorial, className: cn("group flex w-full items-center gap-2 rounded-[6px] text-[13px] select-none outline-none", "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring", 
        // Compact mode: 4px less total height (py-[3px] vs py-[5px])
        link.compact ? "py-[3px]" : "py-[5px]", "px-2", link.variant === "default"
            ? "bg-foreground/[0.07]"
            // Highlight on hover, context menu open (data-state), or EditPopover active (data-edit-active)
            : "hover:bg-sidebar-hover data-[state=open]:bg-sidebar-hover data-[edit-active=true]:bg-sidebar-hover", extraClassName), children: [_jsx("span", { className: "relative h-3.5 w-3.5 shrink-0 flex items-center justify-center", children: link.expandable && !isOverlay ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-150", children: renderIcon(link) }), _jsx("span", { className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer", "data-no-dnd": "true", onClick: (e) => {
                                e.stopPropagation();
                                link.onToggle?.();
                            }, children: _jsx(ChevronRight, { className: cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", link.expanded && "rotate-90") }) })] })) : (renderIcon(link)) }), link.title, link.afterTitle && (_jsx("span", { className: "ml-auto opacity-0 group-hover/section:opacity-100 group-data-[state=open]:opacity-100 group-data-[edit-active=true]:opacity-100 transition-opacity", children: link.afterTitle })), link.label && (_jsx("span", { className: cn(link.afterTitle ? 'ml-0' : 'ml-auto', 'text-xs text-foreground/30 opacity-0 group-hover/section:opacity-100 group-data-[state=open]:opacity-100 group-data-[edit-active=true]:opacity-100 transition-opacity'), children: link.label }))] }));
});
/**
 * Helper to render icon - either component (function/forwardRef) or React element.
 * Colors are always applied via inline style (resolved CSS color strings from EntityColor).
 */
function renderIcon(link) {
    const isComponent = typeof link.icon === 'function' ||
        (typeof link.icon === 'object' && link.icon !== null && 'render' in link.icon);
    // Default color for items without explicit iconColor (foreground at 60% opacity)
    const defaultColor = 'color-mix(in oklch, var(--foreground) 60%, transparent)';
    // Lucide components are always colorable; ReactNode icons check iconColorable
    // Default to true for backwards compatibility (most icons are colorable)
    const applyColor = link.iconColorable !== false;
    const colorStyle = applyColor ? { color: link.iconColor || defaultColor } : undefined;
    if (isComponent) {
        const Icon = link.icon;
        return (_jsx(Icon, { className: "h-3.5 w-3.5 shrink-0", style: colorStyle }));
    }
    // Already a React element or primitive ReactNode
    // Clone with bare={true} to remove EntityIcon container, wrapper provides sizing
    // Only pass bare to components that accept it (have acceptsBare marker) to avoid
    // forwarding unknown props to DOM elements (e.g., Lucide icons → SVG)
    const iconElement = link.icon;
    const bareIcon = React.isValidElement(iconElement)
        ? (typeof iconElement.type === 'function' && iconElement.type.acceptsBare)
            ? React.cloneElement(iconElement, { bare: true })
            : iconElement
        : iconElement;
    return (_jsx("span", { className: "h-3.5 w-3.5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full", style: colorStyle, children: bareIcon }));
}
//# sourceMappingURL=LeftSidebar.js.map