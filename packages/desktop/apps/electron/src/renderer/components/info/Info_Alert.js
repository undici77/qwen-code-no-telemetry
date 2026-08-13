import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info_Alert
 *
 * Warning/error/info/success alert boxes with compound Title/Description.
 */
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const alertVariants = cva('rounded-[8px] border', {
    variants: {
        variant: {
            warning: 'bg-foreground/5 border-border/50',
            error: 'bg-destructive/5 border-destructive/30',
            info: 'bg-info/5 border-info/30',
            success: 'bg-success/5 border-success/30',
        },
        inline: {
            true: 'px-4 py-2',
            false: 'px-4 py-3',
        },
    },
    defaultVariants: {
        variant: 'warning',
        inline: false,
    },
});
function Info_AlertRoot({ variant, inline, icon, className, children, ...props }) {
    return (_jsx("div", { className: cn(alertVariants({ variant, inline }), className), ...props, children: _jsxs("div", { className: "flex items-start gap-2 text-sm", children: [icon && (_jsx("span", { className: "shrink-0 mt-0.5 text-muted-foreground", children: icon })), _jsx("div", { className: "flex-1 min-w-0", children: children })] }) }));
}
function Info_AlertTitle({ className, ...props }) {
    return _jsx("span", { className: cn('font-medium', className), ...props });
}
function Info_AlertDescription({ className, ...props }) {
    return _jsx("p", { className: cn('text-foreground/60 mt-0.5', className), ...props });
}
export const Info_Alert = Object.assign(Info_AlertRoot, {
    Title: Info_AlertTitle,
    Description: Info_AlertDescription,
});
//# sourceMappingURL=Info_Alert.js.map