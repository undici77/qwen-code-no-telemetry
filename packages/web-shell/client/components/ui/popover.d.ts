import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
declare function Popover({
  ...props
}: React.ComponentProps<
  typeof PopoverPrimitive.Root
>): import('react/jsx-runtime').JSX.Element;
declare const PopoverTrigger: React.ForwardRefExoticComponent<
  Omit<
    PopoverPrimitive.PopoverTriggerProps &
      React.RefAttributes<HTMLButtonElement>,
    'ref'
  > &
    React.RefAttributes<HTMLButtonElement>
>;
declare const PopoverContent: React.ForwardRefExoticComponent<
  Omit<
    PopoverPrimitive.PopoverContentProps & React.RefAttributes<HTMLDivElement>,
    'ref'
  > &
    React.RefAttributes<HTMLDivElement>
>;
declare const PopoverAnchor: React.ForwardRefExoticComponent<
  Omit<
    PopoverPrimitive.PopoverAnchorProps & React.RefAttributes<HTMLDivElement>,
    'ref'
  > &
    React.RefAttributes<HTMLDivElement>
>;
declare function PopoverHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): import('react/jsx-runtime').JSX.Element;
declare function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<'h2'>): import('react/jsx-runtime').JSX.Element;
declare function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): import('react/jsx-runtime').JSX.Element;
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
