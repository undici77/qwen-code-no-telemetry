import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { useWebShellPortalRoot } from '../../portalRoot';
function TooltipProvider({ delayDuration = 0, ...props }) {
  return _jsx(TooltipPrimitive.Provider, {
    'data-slot': 'tooltip-provider',
    delayDuration: delayDuration,
    ...props,
  });
}
function Tooltip({ ...props }) {
  return _jsx(TooltipPrimitive.Root, { 'data-slot': 'tooltip', ...props });
}
function TooltipTrigger({ ...props }) {
  return _jsx(TooltipPrimitive.Trigger, {
    'data-slot': 'tooltip-trigger',
    ...props,
  });
}
// With TooltipPrimitive.Arrow present, Radix's offset middleware computes
// `mainAxis: sideOffset + arrowHeight`, so the arrow's 10px box already
// pushes the content out. The previous pseudo-element arrow took no layout
// space and was tuned against sideOffset 8; keeping 8 here would move every
// tooltip ~10px farther from its trigger.
function TooltipContent({ className, sideOffset = 0, children, ...props }) {
  const portalRoot = useWebShellPortalRoot();
  return _jsx(TooltipPrimitive.Portal, {
    container: portalRoot ?? undefined,
    children: _jsxs(TooltipPrimitive.Content, {
      'data-slot': 'tooltip-content',
      sideOffset: sideOffset,
      className: cn(
        'relative z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=instant-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
        className,
      ),
      ...props,
      children: [
        children,
        _jsx(TooltipPrimitive.Arrow, {
          'data-slot': 'tooltip-arrow',
          className:
            'z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] border-r border-b border-border bg-popover fill-popover',
        }),
      ],
    }),
  });
}
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
//# sourceMappingURL=tooltip.js.map
