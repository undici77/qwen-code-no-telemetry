import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSub } from "./context-menu";
/**
 * Styled Context Menu Components
 *
 * Pre-styled context menu components matching the StyledDropdownMenu style.
 * These wrap the base context-menu components with consistent styling.
 */
export { ContextMenu, ContextMenuTrigger };
interface StyledContextMenuContentProps extends React.ComponentPropsWithoutRef<typeof ContextMenuContent> {
    /** Minimum width - defaults to min-w-40 */
    minWidth?: string;
}
export declare const StyledContextMenuContent: React.ForwardRefExoticComponent<StyledContextMenuContentProps & React.RefAttributes<any>>;
interface StyledContextMenuItemProps extends React.ComponentPropsWithoutRef<typeof ContextMenuItem> {
    /** Destructive variant - red text */
    variant?: "default" | "destructive";
}
export declare const StyledContextMenuItem: React.ForwardRefExoticComponent<StyledContextMenuItemProps & React.RefAttributes<any>>;
export declare const StyledContextMenuSeparator: React.ForwardRefExoticComponent<any>;
export { ContextMenuSub as StyledContextMenuSub };
export declare const StyledContextMenuSubTrigger: React.ForwardRefExoticComponent<any>;
interface StyledContextMenuSubContentProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent> {
    /** Minimum width - defaults to min-w-36 */
    minWidth?: string;
}
export declare const StyledContextMenuSubContent: React.ForwardRefExoticComponent<StyledContextMenuSubContentProps & React.RefAttributes<HTMLDivElement>>;
