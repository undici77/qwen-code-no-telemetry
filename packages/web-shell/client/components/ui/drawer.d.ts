import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
declare function Drawer({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
declare function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
declare function DrawerPortal({ container, ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>): import("react/jsx-runtime").JSX.Element;
declare function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>): import("react/jsx-runtime").JSX.Element;
declare const DrawerOverlay: React.ForwardRefExoticComponent<Omit<Omit<import("@radix-ui/react-dialog").DialogOverlayProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content> & {
    overlayProps?: React.ComponentProps<typeof DrawerPrimitive.Overlay>;
};
declare const DrawerContent: React.ForwardRefExoticComponent<Omit<DrawerContentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
declare function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
declare function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>): import("react/jsx-runtime").JSX.Element;
declare function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>): import("react/jsx-runtime").JSX.Element;
export { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, };
