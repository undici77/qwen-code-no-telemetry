import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/utils';
import { useWebShellPortalRoot } from '../../portalRoot';
function Drawer({ ...props }) {
  return _jsx(DrawerPrimitive.Root, { 'data-slot': 'drawer', ...props });
}
function DrawerTrigger({ ...props }) {
  return _jsx(DrawerPrimitive.Trigger, {
    'data-slot': 'drawer-trigger',
    ...props,
  });
}
function DrawerPortal({ container, ...props }) {
  const portalRoot = useWebShellPortalRoot();
  return _jsx(DrawerPrimitive.Portal, {
    'data-slot': 'drawer-portal',
    container: container ?? portalRoot ?? undefined,
    ...props,
  });
}
function DrawerClose({ ...props }) {
  return _jsx(DrawerPrimitive.Close, { 'data-slot': 'drawer-close', ...props });
}
const DrawerOverlay = React.forwardRef(function DrawerOverlay(
  { className, ...props },
  ref,
) {
  return _jsx(DrawerPrimitive.Overlay, {
    ref: ref,
    'data-slot': 'drawer-overlay',
    className: cn(
      'fixed inset-0 isolate z-[var(--web-shell-dialog-backdrop-z-index,50)] bg-black/10 duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      className,
    ),
    ...props,
  });
});
const DrawerContent = React.forwardRef(function DrawerContent(
  { className, children, overlayProps, ...props },
  ref,
) {
  return _jsxs(DrawerPortal, {
    children: [
      _jsx(DrawerOverlay, { ...overlayProps }),
      _jsx(DrawerPrimitive.Content, {
        ref: ref,
        'data-slot': 'drawer-content',
        className: cn(
          'group/drawer-content fixed z-[var(--web-shell-dialog-backdrop-z-index,50)] flex h-auto flex-col bg-popover text-sm text-popover-foreground outline-none data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-xl data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-xl data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm',
          className,
        ),
        ...props,
        children: children,
      }),
    ],
  });
});
function DrawerHeader({ className, ...props }) {
  return _jsx('div', {
    'data-slot': 'drawer-header',
    className: cn('flex flex-col gap-0.5 p-4', className),
    ...props,
  });
}
function DrawerFooter({ className, ...props }) {
  return _jsx('div', {
    'data-slot': 'drawer-footer',
    className: cn('mt-auto flex flex-col gap-2 p-4', className),
    ...props,
  });
}
function DrawerTitle({ className, ...props }) {
  return _jsx(DrawerPrimitive.Title, {
    'data-slot': 'drawer-title',
    className: cn('text-base font-medium text-foreground', className),
    ...props,
  });
}
function DrawerDescription({ className, ...props }) {
  return _jsx(DrawerPrimitive.Description, {
    'data-slot': 'drawer-description',
    className: cn('text-sm text-muted-foreground', className),
    ...props,
  });
}
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
//# sourceMappingURL=drawer.js.map
