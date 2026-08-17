import type * as React from 'react';
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
declare function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<
  typeof ScrollAreaPrimitive.Root
>): import('react/jsx-runtime').JSX.Element;
declare function ScrollBar({
  className,
  orientation,
  ...props
}: React.ComponentProps<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
>): import('react/jsx-runtime').JSX.Element;
export { ScrollArea, ScrollBar };
