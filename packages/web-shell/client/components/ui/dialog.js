'use client';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import { useWebShellPortalRoot } from '../../portalRoot';
function Dialog({ ...props }) {
  return _jsx(DialogPrimitive.Root, { 'data-slot': 'dialog', ...props });
}
function DialogTrigger({ ...props }) {
  return _jsx(DialogPrimitive.Trigger, {
    'data-slot': 'dialog-trigger',
    ...props,
  });
}
function DialogPortal({ container, ...props }) {
  const portalRoot = useWebShellPortalRoot();
  return _jsx(DialogPrimitive.Portal, {
    'data-slot': 'dialog-portal',
    container: container ?? portalRoot ?? undefined,
    ...props,
  });
}
function DialogClose({ ...props }) {
  return _jsx(DialogPrimitive.Close, { 'data-slot': 'dialog-close', ...props });
}
const DialogOverlay = React.forwardRef(function DialogOverlay(
  { className, ...props },
  ref,
) {
  return _jsx(DialogPrimitive.Overlay, {
    ref: ref,
    'data-slot': 'dialog-overlay',
    className: cn(
      // No backdrop-blur: it forces the browser to rasterize and blur the
      // entire content behind the overlay on open, which freezes the page
      // when a long transcript sits behind it. The bg-black/10 scrim keeps
      // the visual separation without that cost.
      'fixed inset-0 isolate z-[var(--web-shell-dialog-backdrop-z-index,50)] bg-black/10 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
      className,
    ),
    ...props,
  });
});
const DialogContent = React.forwardRef(function DialogContent(
  { className, children, showCloseButton = true, overlayProps, ...props },
  ref,
) {
  return _jsxs(DialogPortal, {
    children: [
      _jsx(DialogOverlay, { ...overlayProps }),
      _jsxs(DialogPrimitive.Content, {
        ref: ref,
        'data-slot': 'dialog-content',
        className: cn(
          'fixed top-1/2 left-1/2 z-[var(--web-shell-dialog-backdrop-z-index,50)] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        ),
        ...props,
        children: [
          children,
          showCloseButton &&
            _jsx(DialogPrimitive.Close, {
              'data-slot': 'dialog-close',
              asChild: true,
              children: _jsxs(Button, {
                variant: 'ghost',
                className: 'absolute top-2 right-2',
                size: 'icon-sm',
                children: [
                  _jsx(XIcon, {}),
                  _jsx('span', { className: 'sr-only', children: 'Close' }),
                ],
              }),
            }),
        ],
      }),
    ],
  });
});
function DialogHeader({ className, ...props }) {
  return _jsx('div', {
    'data-slot': 'dialog-header',
    className: cn('flex flex-col gap-2', className),
    ...props,
  });
}
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return _jsxs('div', {
    'data-slot': 'dialog-footer',
    className: cn(
      '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
      className,
    ),
    ...props,
    children: [
      children,
      showCloseButton &&
        _jsx(DialogPrimitive.Close, {
          asChild: true,
          children: _jsx(Button, { variant: 'outline', children: 'Close' }),
        }),
    ],
  });
}
function DialogTitle({ className, ...props }) {
  return _jsx(DialogPrimitive.Title, {
    'data-slot': 'dialog-title',
    className: cn('text-base leading-none font-medium', className),
    ...props,
  });
}
function DialogDescription({ className, ...props }) {
  return _jsx(DialogPrimitive.Description, {
    'data-slot': 'dialog-description',
    className: cn(
      'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
      className,
    ),
    ...props,
  });
}
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
//# sourceMappingURL=dialog.js.map
