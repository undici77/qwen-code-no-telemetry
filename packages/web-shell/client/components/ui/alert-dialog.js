import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWebShellPortalRoot } from '../../portalRoot';
function AlertDialog({ ...props }) {
    return _jsx(AlertDialogPrimitive.Root, { "data-slot": "alert-dialog", ...props });
}
function AlertDialogTrigger({ ...props }) {
    return (_jsx(AlertDialogPrimitive.Trigger, { "data-slot": "alert-dialog-trigger", ...props }));
}
function AlertDialogPortal({ container, ...props }) {
    const portalRoot = useWebShellPortalRoot();
    return (_jsx(AlertDialogPrimitive.Portal, { "data-slot": "alert-dialog-portal", container: container ?? portalRoot ?? undefined, ...props }));
}
const AlertDialogOverlay = React.forwardRef(function AlertDialogOverlay({ className, ...props }, ref) {
    return (_jsx(AlertDialogPrimitive.Overlay, { ref: ref, "data-slot": "alert-dialog-overlay", className: cn(
        // No backdrop-blur: see DialogOverlay — blurring the whole backdrop on
        // open freezes the page when a long transcript sits behind it.
        'fixed inset-0 z-50 bg-black/10 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0', className), ...props }));
});
const AlertDialogContent = React.forwardRef(function AlertDialogContent({ className, size = 'default', ...props }, ref) {
    return (_jsxs(AlertDialogPortal, { children: [_jsx(AlertDialogOverlay, {}), _jsx(AlertDialogPrimitive.Content, { ref: ref, "data-slot": "alert-dialog-content", "data-size": size, className: cn('group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100vh-2rem)] w-full -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=middle]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-sm data-[size=middle]:sm:max-w-xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95', className), ...props })] }));
});
function AlertDialogHeader({ className, ...props }) {
    return (_jsx("div", { "data-slot": "alert-dialog-header", className: cn('grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]', className), ...props }));
}
function AlertDialogFooter({ className, ...props }) {
    return (_jsx("div", { "data-slot": "alert-dialog-footer", className: cn('-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end', className), ...props }));
}
function AlertDialogMedia({ className, ...props }) {
    return (_jsx("div", { "data-slot": "alert-dialog-media", className: cn("mb-2 inline-flex size-10 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6", className), ...props }));
}
function AlertDialogTitle({ className, ...props }) {
    return (_jsx(AlertDialogPrimitive.Title, { "data-slot": "alert-dialog-title", className: cn('text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2', className), ...props }));
}
function AlertDialogDescription({ className, ...props }) {
    return (_jsx(AlertDialogPrimitive.Description, { "data-slot": "alert-dialog-description", className: cn('text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground', className), ...props }));
}
function AlertDialogAction({ className, variant = 'default', size = 'default', ...props }) {
    return (_jsx(Button, { variant: variant, size: size, asChild: true, children: _jsx(AlertDialogPrimitive.Action, { "data-slot": "alert-dialog-action", className: cn(className), ...props }) }));
}
function AlertDialogCancel({ className, variant = 'outline', size = 'default', ...props }) {
    return (_jsx(Button, { variant: variant, size: size, asChild: true, children: _jsx(AlertDialogPrimitive.Cancel, { "data-slot": "alert-dialog-cancel", className: cn(className), ...props }) }));
}
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, };
//# sourceMappingURL=alert-dialog.js.map