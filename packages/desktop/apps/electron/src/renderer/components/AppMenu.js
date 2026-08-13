import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isMac } from "@/lib/platform";
import { useActionLabel } from "@/actions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuShortcut, DropdownMenuSub, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, StyledDropdownMenuSubTrigger, StyledDropdownMenuSubContent, } from "@/components/ui/styled-dropdown";
import * as Icons from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@craft-agent/ui";
import { CraftAgentsSymbol } from "./icons/CraftAgentsSymbol";
import { SquarePenRounded } from "./icons/SquarePenRounded";
import { TopBarButton } from "./ui/TopBarButton";
import { EDIT_MENU, VIEW_MENU, WINDOW_MENU, SETTINGS_ITEMS, getShortcutDisplay, } from "../../shared/menu-schema";
import { SETTINGS_ICONS } from "./icons/SettingsIcons";
import { BRAND } from '@craft-agent/shared/branding';
// Map of IPC handlers for role-based menu items
const roleHandlers = {
    undo: () => window.electronAPI.menuUndo(),
    redo: () => window.electronAPI.menuRedo(),
    cut: () => window.electronAPI.menuCut(),
    copy: () => window.electronAPI.menuCopy(),
    paste: () => window.electronAPI.menuPaste(),
    selectAll: () => window.electronAPI.menuSelectAll(),
    zoomIn: () => window.electronAPI.menuZoomIn(),
    zoomOut: () => window.electronAPI.menuZoomOut(),
    resetZoom: () => window.electronAPI.menuZoomReset(),
    minimize: () => window.electronAPI.menuMinimize(),
    zoom: () => window.electronAPI.menuMaximize(),
};
/**
 * Get the Lucide icon component by name
 */
function getIcon(name) {
    const IconComponent = Icons[name];
    return IconComponent ?? null;
}
/**
 * Renders a single menu item from the schema
 */
function renderMenuItem(item, index, actionHandlers, t) {
    if (item.type === 'separator') {
        return _jsx(StyledDropdownMenuSeparator, {}, `sep-${index}`);
    }
    const Icon = getIcon(item.icon);
    const shortcut = getShortcutDisplay(item, isMac);
    if (item.type === 'role') {
        const handler = roleHandlers[item.role];
        // Gracefully handle missing role handlers with console warning
        const safeHandler = handler ?? (() => {
            console.warn(`[AppMenu] No handler registered for role: ${item.role}`);
        });
        return (_jsxs(StyledDropdownMenuItem, { onClick: safeHandler, children: [Icon && _jsx(Icon, { className: "h-3.5 w-3.5" }), t(item.labelKey), shortcut && _jsx(DropdownMenuShortcut, { className: "pl-6", children: shortcut })] }, item.role));
    }
    if (item.type === 'action') {
        // Map action IDs to handlers
        const handler = item.id === 'toggleFocusMode'
            ? actionHandlers.toggleFocusMode
            : item.id === 'toggleSidebar'
                ? actionHandlers.toggleSidebar
                : undefined;
        return (_jsxs(StyledDropdownMenuItem, { onClick: handler, children: [Icon && _jsx(Icon, { className: "h-3.5 w-3.5" }), t(item.labelKey), shortcut && _jsx(DropdownMenuShortcut, { className: "pl-6", children: shortcut })] }, item.id));
    }
    return null;
}
/**
 * Renders a menu section as a submenu
 */
function renderMenuSection(section, actionHandlers, t) {
    const Icon = getIcon(section.icon);
    return (_jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [Icon && _jsx(Icon, { className: "h-3.5 w-3.5" }), t(section.labelKey)] }), _jsx(StyledDropdownMenuSubContent, { children: section.items.map((item, index) => renderMenuItem(item, index, actionHandlers, t)) })] }, section.id));
}
/**
 * AppMenu - Main application dropdown menu and top bar navigation
 *
 * Contains the Craft logo dropdown with all menu functionality:
 * - File actions (New Chat, New Window)
 * - Edit submenu (Undo, Redo, Cut, Copy, Paste, Select All)
 * - View submenu (Zoom In/Out, Reset)
 * - Window submenu (Minimize, Maximize)
 * - Settings submenu (Settings, Stored User Preferences)
 * - Help submenu (Documentation, Keyboard Shortcuts)
 * - Debug submenu (dev only)
 * - Quit
 *
 * On Windows/Linux, this is the only menu (native menu is hidden).
 * On macOS, this mirrors the native menu for consistency.
 */
export function AppMenu({ onNewChat, onNewWindow, onOpenSettings, onOpenSettingsSubpage, onOpenKeyboardShortcuts, onOpenStoredUserPreferences, onShowAbout, onBack, onForward, canGoBack = true, canGoForward = true, onToggleSidebar, onToggleFocusMode, }) {
    const { t } = useTranslation();
    const [isDebugMode, setIsDebugMode] = useState(false);
    const hasHelpMenuLinks = BRAND.helpMenuLinks.length > 0;
    // Get hotkey labels from centralized action registry
    const newChatHotkey = useActionLabel('app.newChat').hotkey;
    const newWindowHotkey = useActionLabel('app.newWindow').hotkey;
    const settingsHotkey = useActionLabel('app.settings').hotkey;
    const keyboardShortcutsHotkey = useActionLabel('app.keyboardShortcuts').hotkey;
    const quitHotkey = useActionLabel('app.quit').hotkey;
    const goBackHotkey = useActionLabel('nav.goBackAlt').hotkey;
    const goForwardHotkey = useActionLabel('nav.goForwardAlt').hotkey;
    useEffect(() => {
        window.electronAPI.isDebugMode().then(setIsDebugMode);
    }, []);
    // Action handlers for schema-driven menu items
    const actionHandlers = {
        toggleFocusMode: onToggleFocusMode,
        toggleSidebar: onToggleSidebar,
    };
    return (_jsxs("div", { className: "flex items-center gap-[5px] w-full", children: [_jsx("div", { className: "pointer-events-auto titlebar-no-drag", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(TopBarButton, { "aria-label": "Craft menu", children: _jsx(CraftAgentsSymbol, { className: "h-4 text-accent" }) }) }), _jsxs(StyledDropdownMenuContent, { align: "start", minWidth: "min-w-48", children: [_jsxs(StyledDropdownMenuItem, { onClick: onNewChat, children: [_jsx(SquarePenRounded, { className: "h-3.5 w-3.5" }), "New Chat", newChatHotkey && _jsx(DropdownMenuShortcut, { className: "pl-6", children: newChatHotkey })] }), onNewWindow && (_jsxs(StyledDropdownMenuItem, { onClick: onNewWindow, children: [_jsx(Icons.AppWindow, { className: "h-3.5 w-3.5" }), "New Window", newWindowHotkey && _jsx(DropdownMenuShortcut, { className: "pl-6", children: newWindowHotkey })] })), _jsx(StyledDropdownMenuSeparator, {}), renderMenuSection(EDIT_MENU, actionHandlers, t), renderMenuSection(VIEW_MENU, actionHandlers, t), renderMenuSection(WINDOW_MENU, actionHandlers, t), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(Icons.Settings, { className: "h-3.5 w-3.5" }), "Settings"] }), _jsxs(StyledDropdownMenuSubContent, { children: [_jsxs(StyledDropdownMenuItem, { onClick: onOpenSettings, children: [_jsx(Icons.Settings, { className: "h-3.5 w-3.5" }), "Settings...", settingsHotkey && _jsx(DropdownMenuShortcut, { className: "pl-6", children: settingsHotkey })] }), _jsx(StyledDropdownMenuSeparator, {}), SETTINGS_ITEMS.map((item) => {
                                                    const Icon = SETTINGS_ICONS[item.id];
                                                    return (_jsxs(StyledDropdownMenuItem, { onClick: () => onOpenSettingsSubpage(item.id), children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), t(item.labelKey)] }, item.id));
                                                })] })] }), _jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(Icons.HelpCircle, { className: "h-3.5 w-3.5" }), "Help"] }), _jsxs(StyledDropdownMenuSubContent, { children: [BRAND.helpMenuLinks.map((link) => {
                                                    const Icon = getIcon(link.icon) ?? Icons.ExternalLink;
                                                    return (_jsxs(StyledDropdownMenuItem, { onClick: () => window.electronAPI.openUrl(link.url), children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), t(link.labelKey), _jsx(Icons.ExternalLink, { className: "h-3 w-3 ml-auto text-muted-foreground" })] }, link.url));
                                                }), hasHelpMenuLinks && _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: onOpenKeyboardShortcuts, children: [_jsx(Icons.Keyboard, { className: "h-3.5 w-3.5" }), "Keyboard Shortcuts", keyboardShortcutsHotkey && _jsx(DropdownMenuShortcut, { className: "pl-6", children: keyboardShortcutsHotkey })] }), onShowAbout && (_jsxs(_Fragment, { children: [_jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: onShowAbout, children: [_jsx(Icons.Info, { className: "h-3.5 w-3.5" }), t("menu.aboutCraftAgents")] })] }))] })] }), isDebugMode && (_jsx(_Fragment, { children: _jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(Icons.Bug, { className: "h-3.5 w-3.5" }), "Debug"] }), _jsx(StyledDropdownMenuSubContent, { children: _jsxs(StyledDropdownMenuItem, { onClick: () => window.electronAPI.menuToggleDevTools(), children: [_jsx(Icons.Bug, { className: "h-3.5 w-3.5" }), "Toggle DevTools", _jsx(DropdownMenuShortcut, { className: "pl-6", children: isMac ? '⌥⌘I' : 'Ctrl+Shift+I' })] }) })] }) })), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: () => window.electronAPI.menuQuit(), children: [_jsx(Icons.LogOut, { className: "h-3.5 w-3.5" }), t("menu.quitCraftAgents"), quitHotkey && _jsx(DropdownMenuShortcut, { className: "pl-6", children: quitHotkey })] })] })] }) }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "pointer-events-auto titlebar-no-drag flex items-center gap-[5px]", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TopBarButton, { onClick: onBack, disabled: !canGoBack, "aria-label": "Go back", children: _jsx(Icons.ChevronLeft, { className: "h-[22px] w-[22px] text-foreground/70", strokeWidth: 1.5 }) }) }), _jsxs(TooltipContent, { side: "bottom", children: ["Back ", goBackHotkey] })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TopBarButton, { onClick: onForward, disabled: !canGoForward, "aria-label": "Go forward", children: _jsx(Icons.ChevronRight, { className: "h-[22px] w-[22px] text-foreground/70", strokeWidth: 1.5 }) }) }), _jsxs(TooltipContent, { side: "bottom", children: ["Forward ", goForwardHotkey] })] })] })] }));
}
//# sourceMappingURL=AppMenu.js.map