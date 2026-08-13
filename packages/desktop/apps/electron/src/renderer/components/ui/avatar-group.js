import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AvatarGroup - Display overlapping avatars with overflow indicator
 *
 * Shows up to `max` avatars with slight overlap, plus a "+N" badge for overflow.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
export function AvatarGroup({ children, max = 3, className }) {
    const childArray = React.Children.toArray(children);
    const shown = childArray.slice(0, max);
    const overflow = childArray.length - max;
    return (_jsxs("div", { className: cn("flex -space-x-1.5", className), children: [shown.map((child, i) => (_jsx("div", { className: "ring-1 ring-background rounded-full", children: child }, i))), overflow > 0 && (_jsxs("div", { className: "flex items-center justify-center h-4 w-4 rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-1 ring-background", children: ["+", overflow] }))] }));
}
//# sourceMappingURL=avatar-group.js.map