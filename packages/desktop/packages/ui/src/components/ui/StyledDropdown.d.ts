/**
 * StyledDropdown - Shared styled dropdown components
 *
 * Pre-styled Radix dropdown wrappers matching the app's vibrancy style:
 * - popover-styled background with blur
 * - Consistent item spacing and subtle hover states (foreground/[0.03])
 * - Icon sizing standardization (3.5 × 3.5)
 *
 * Wraps raw @radix-ui/react-dropdown-menu primitives with the full class set
 * (shadcn base layer + styled additions) so consumers get the correct look
 * without depending on the shadcn wrapper layer in apps/electron.
 */
import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
/**
 * Mirror hover styles to open-state styles for Radix triggers.
 *
 * Example:
 * - hover:bg-foreground/5 -> data-[state=open]:bg-foreground/5
 *
 * Consumers can still provide explicit data-[state=open]:* classes to override.
 */
export declare function mirrorHoverToOpenStateClasses(className?: string): string | undefined;
declare const DropdownMenu: React.FC<DropdownMenuPrimitive.DropdownMenuProps>;
declare const DropdownMenuSub: React.FC<DropdownMenuPrimitive.DropdownMenuSubProps>;
interface DropdownMenuTriggerProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> {
    /** Auto-mirror hover:* classes to data-[state=open]:* while menu is open. Default: true */
    autoMirrorHoverToOpen?: boolean;
}
declare const DropdownMenuTrigger: React.ForwardRefExoticComponent<DropdownMenuTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuSub };
interface StyledDropdownMenuContentProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
    minWidth?: string;
    /** Force light mode instead of dark */
    light?: boolean;
}
export declare const StyledDropdownMenuContent: React.ForwardRefExoticComponent<StyledDropdownMenuContentProps & React.RefAttributes<HTMLDivElement>>;
interface StyledDropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
    variant?: 'default' | 'destructive';
}
export declare const StyledDropdownMenuItem: React.ForwardRefExoticComponent<StyledDropdownMenuItemProps & React.RefAttributes<HTMLDivElement>>;
export declare const StyledDropdownMenuSeparator: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSeparatorProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export declare const StyledDropdownMenuSubTrigger: React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubTriggerProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
interface StyledDropdownMenuSubContentProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> {
    minWidth?: string;
}
export declare const StyledDropdownMenuSubContent: React.ForwardRefExoticComponent<StyledDropdownMenuSubContentProps & React.RefAttributes<HTMLDivElement>>;
export declare function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>): import("react/jsx-runtime").JSX.Element;
