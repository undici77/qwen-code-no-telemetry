import type * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
declare function RadioGroup({
  className,
  ...props
}: React.ComponentProps<
  typeof RadioGroupPrimitive.Root
>): import('react/jsx-runtime').JSX.Element;
declare function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<
  typeof RadioGroupPrimitive.Item
>): import('react/jsx-runtime').JSX.Element;
export { RadioGroup, RadioGroupItem };
