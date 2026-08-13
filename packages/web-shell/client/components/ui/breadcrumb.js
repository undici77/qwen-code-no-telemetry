import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';
import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
function Breadcrumb({ className, ...props }) {
    return (_jsx("nav", { "aria-label": "breadcrumb", "data-slot": "breadcrumb", className: cn(className), ...props }));
}
function BreadcrumbList({ className, ...props }) {
    return (_jsx("ol", { "data-slot": "breadcrumb-list", className: cn('flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground', className), ...props }));
}
function BreadcrumbItem({ className, ...props }) {
    return (_jsx("li", { "data-slot": "breadcrumb-item", className: cn('inline-flex items-center gap-1', className), ...props }));
}
function BreadcrumbLink({ asChild, className, ...props }) {
    const Comp = asChild ? Slot.Root : 'a';
    return (_jsx(Comp, { "data-slot": "breadcrumb-link", className: cn('transition-colors hover:text-foreground', className), ...props }));
}
function BreadcrumbPage({ className, ...props }) {
    return (_jsx("span", { "data-slot": "breadcrumb-page", role: "link", "aria-disabled": "true", "aria-current": "page", className: cn('font-normal text-foreground', className), ...props }));
}
function BreadcrumbSeparator({ children, className, ...props }) {
    return (_jsx("li", { "data-slot": "breadcrumb-separator", role: "presentation", "aria-hidden": "true", className: cn('[&>svg]:size-3.5', className), ...props, children: children ?? _jsx(ChevronRightIcon, {}) }));
}
function BreadcrumbEllipsis({ className, ...props }) {
    return (_jsxs("span", { "data-slot": "breadcrumb-ellipsis", role: "presentation", "aria-hidden": "true", className: cn('flex size-5 items-center justify-center [&>svg]:size-4', className), ...props, children: [_jsx(MoreHorizontalIcon, {}), _jsx("span", { className: "sr-only", children: "More" })] }));
}
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, };
//# sourceMappingURL=breadcrumb.js.map