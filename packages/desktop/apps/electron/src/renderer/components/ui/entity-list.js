import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EntityList — Reusable container for rendering a scrollable list of EntityRow items.
 *
 * Handles:
 * - ScrollArea wrapping with proper padding
 * - Optional grouped layout with section headers
 * - Collapsible groups with chevron toggle and item count
 * - Empty state rendering (centered, outside ScrollArea)
 * - Header (e.g. search bar) and footer (e.g. infinite scroll sentinel) slots
 *
 * Domain-specific logic (filtering, keyboard nav, multi-select) lives in the consumer.
 */
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContextMenu, ContextMenuTrigger, StyledContextMenuContent, StyledContextMenuItem, StyledContextMenuSeparator, } from '@/components/ui/styled-context-menu';
import { cn } from '@/lib/utils';
// ============================================================================
// Section Header
// ============================================================================
function SectionHeader({ label }) {
    return (_jsx("div", { className: "px-4 py-2", children: _jsx("span", { className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider", children: label }) }));
}
/** Collapsible group header with chevron toggle and item count when collapsed */
function CollapsibleGroupHeader({ label, isCollapsed, itemCount, onToggle, onCollapseAll, onExpandAll, }) {
    return (_jsxs(ContextMenu, { modal: true, children: [_jsx(ContextMenuTrigger, { asChild: true, children: _jsxs("button", { onClick: onToggle, className: "w-full py-2 px-4 flex items-center gap-1.5 cursor-pointer group/header relative", children: [_jsx("div", { className: "absolute inset-y-0.5 left-2 right-2 rounded-[6px] group-hover/header:bg-foreground/2 transition-colors pointer-events-none" }), _jsx(ChevronRight, { className: cn("h-3 w-3 text-muted-foreground/60 transition-transform relative", !isCollapsed && "rotate-90") }), _jsxs("span", { className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground relative", children: [label, isCollapsed && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx("span", { className: "text-muted-foreground/50", children: itemCount })] })] })] }) }), _jsxs(StyledContextMenuContent, { children: [_jsx(StyledContextMenuItem, { onClick: onToggle, children: isCollapsed ? 'Expand' : 'Collapse' }), _jsx(StyledContextMenuSeparator, {}), _jsx(StyledContextMenuItem, { onClick: onCollapseAll, children: "Collapse All" }), _jsx(StyledContextMenuItem, { onClick: onExpandAll, children: "Expand All" })] })] }));
}
// ============================================================================
// Component
// ============================================================================
export function EntityList({ items, groups, renderItem, getKey, emptyState, header, footer, containerRef, containerProps, viewportRef, scrollAreaClassName, className, collapsedGroups, onToggleCollapse, onCollapseAll, onExpandAll, }) {
    // Determine if we have content
    const hasGroups = groups && groups.length > 0;
    const hasItems = items && items.length > 0;
    const isEmpty = !hasGroups && !hasItems;
    // Empty state — rendered outside everything for proper centering
    if (isEmpty && emptyState) {
        return (_jsxs("div", { className: cn('flex flex-col flex-1', className), children: [header, emptyState] }));
    }
    return (_jsxs("div", { className: cn('flex flex-col flex-1 min-h-0', className), children: [header, _jsx(ScrollArea, { className: cn('flex-1', scrollAreaClassName), viewportRef: viewportRef, children: _jsxs("div", { ref: containerRef, className: "flex flex-col pb-2", ...containerProps, children: [_jsx("div", { className: "pt-1", children: hasGroups
                                ? groups.map((group) => {
                                    const isCollapsed = group.collapsible && collapsedGroups?.has(group.key);
                                    return (_jsxs("div", { children: [group.collapsible && onToggleCollapse ? (_jsx(CollapsibleGroupHeader, { label: group.label, isCollapsed: !!isCollapsed, itemCount: isCollapsed ? (group.collapsedCount ?? 0) : group.items.length, onToggle: () => onToggleCollapse(group.key), onCollapseAll: onCollapseAll, onExpandAll: onExpandAll })) : (_jsx(SectionHeader, { label: group.label })), group.items.map((item, indexInGroup) => _jsx(React.Fragment, { children: renderItem(item, indexInGroup, indexInGroup === 0) }, getKey(item)))] }, group.key));
                                })
                                : items?.map((item, index) => _jsx(React.Fragment, { children: renderItem(item, index, index === 0) }, getKey(item))) }), footer] }) })] }));
}
//# sourceMappingURL=entity-list.js.map