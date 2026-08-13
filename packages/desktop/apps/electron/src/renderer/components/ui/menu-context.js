import { jsx as _jsx } from "react/jsx-runtime";
/**
 * MenuComponents Context
 *
 * Provides menu primitives (MenuItem, Separator, Sub, SubTrigger, SubContent)
 * that work with both DropdownMenu and ContextMenu.
 *
 * This allows menu content components (SessionMenu, SourceMenu, SkillMenu) to
 * render identically in both dropdown and context menu scenarios without duplication.
 *
 * Usage:
 * - Wrap dropdown menu content with <DropdownMenuProvider>
 * - Wrap context menu content with <ContextMenuProvider>
 * - Use useMenuComponents() in menu content to get the right primitives
 */
import * as React from 'react';
import { DropdownMenuSub, StyledDropdownMenuItem, StyledDropdownMenuSeparator, StyledDropdownMenuSubTrigger, StyledDropdownMenuSubContent, } from './styled-dropdown';
import { StyledContextMenuSub, StyledContextMenuItem, StyledContextMenuSeparator, StyledContextMenuSubTrigger, StyledContextMenuSubContent, } from './styled-context-menu';
// Context with dropdown components as default (for backwards compatibility)
const MenuComponentsContext = React.createContext({
    MenuItem: StyledDropdownMenuItem,
    Separator: StyledDropdownMenuSeparator,
    Sub: DropdownMenuSub,
    SubTrigger: StyledDropdownMenuSubTrigger,
    SubContent: StyledDropdownMenuSubContent,
});
/**
 * Hook to get menu components from context.
 * Returns styled dropdown components by default if no provider is present.
 */
export function useMenuComponents() {
    return React.useContext(MenuComponentsContext);
}
// Dropdown menu components (default)
const dropdownComponents = {
    MenuItem: StyledDropdownMenuItem,
    Separator: StyledDropdownMenuSeparator,
    Sub: DropdownMenuSub,
    SubTrigger: StyledDropdownMenuSubTrigger,
    SubContent: StyledDropdownMenuSubContent,
};
// Context menu components
const contextMenuComponents = {
    MenuItem: StyledContextMenuItem,
    Separator: StyledContextMenuSeparator,
    Sub: StyledContextMenuSub,
    SubTrigger: StyledContextMenuSubTrigger,
    SubContent: StyledContextMenuSubContent,
};
/**
 * Provider for dropdown menu context.
 * Wrap dropdown menu content with this to use dropdown primitives.
 */
export function DropdownMenuProvider({ children }) {
    return (_jsx(MenuComponentsContext.Provider, { value: dropdownComponents, children: children }));
}
/**
 * Provider for context menu.
 * Wrap context menu content with this to use context menu primitives.
 */
export function ContextMenuProvider({ children }) {
    return (_jsx(MenuComponentsContext.Provider, { value: contextMenuComponents, children: children }));
}
//# sourceMappingURL=menu-context.js.map