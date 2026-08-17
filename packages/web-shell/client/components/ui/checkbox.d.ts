import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
declare const Checkbox: React.ForwardRefExoticComponent<
  Omit<
    CheckboxPrimitive.CheckboxProps & React.RefAttributes<HTMLButtonElement>,
    'ref'
  > &
    React.RefAttributes<HTMLButtonElement>
>;
export { Checkbox };
