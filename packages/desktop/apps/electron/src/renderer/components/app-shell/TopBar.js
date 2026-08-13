import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * TopBar - Persistent top bar above all panels (Slack-style)
 *
 * Layout: [Sidebar] [Menu] [Back] [Forward]
 *
 * Fixed at top of window, 48px tall.
 * macOS: offset left to avoid stoplight controls.
 */
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
import { CraftAgentsSymbol } from '../icons/CraftAgentsSymbol';
import { PanelLeftRounded } from '../icons/PanelLeftRounded';
import { TopBarButton } from '../ui/TopBarButton';
import { cn } from '@/lib/utils';
import { isMac } from '@/lib/platform';
import { useActionLabel } from '@/actions';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuShortcut, DropdownMenuSub, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, StyledDropdownMenuSubTrigger, StyledDropdownMenuSubContent, } from '@/components/ui/styled-dropdown';
import { EDIT_MENU, VIEW_MENU, WINDOW_MENU, SETTINGS_ITEMS, getShortcutDisplay, } from '../../../shared/menu-schema';
import { SETTINGS_ICONS } from '../icons/SettingsIcons';
import { SquarePenRounded } from '../icons/SquarePenRounded';
import { useEffect, useState } from 'react';
import { BRAND } from '@craft-agent/shared/branding';
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
function getIcon(name) {
    const IconComponent = Icons[name];
    return IconComponent ?? null;
}
function renderMenuItem(item, index, actionHandlers, t) {
    if (item.type === 'separator') {
        return _jsx(StyledDropdownMenuSeparator, {}, `sep-${index}`);
    }
    const Icon = getIcon(item.icon);
    const shortcut = getShortcutDisplay(item, isMac);
    if (item.type === 'role') {
        const handler = roleHandlers[item.role];
        const safeHandler = handler ??
            (() => {
                window.electronAPI.debugLog(`[TopBar] No handler registered for role: ${item.role}`);
            });
        return (_jsxs(StyledDropdownMenuItem, { onClick: safeHandler, children: [Icon && _jsx(Icon, { className: "h-3.5 w-3.5" }), t(item.labelKey), shortcut && (_jsx(DropdownMenuShortcut, { className: "pl-6", children: shortcut }))] }, item.role));
    }
    if (item.type === 'action') {
        const handler = item.id === 'toggleFocusMode'
            ? actionHandlers.toggleFocusMode
            : item.id === 'toggleSidebar'
                ? actionHandlers.toggleSidebar
                : undefined;
        return (_jsxs(StyledDropdownMenuItem, { onClick: handler, children: [Icon && _jsx(Icon, { className: "h-3.5 w-3.5" }), t(item.labelKey), shortcut && (_jsx(DropdownMenuShortcut, { className: "pl-6", children: shortcut }))] }, item.id));
    }
    return null;
}
function renderMenuSection(section, actionHandlers, t) {
    const Icon = getIcon(section.icon);
    return (_jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [Icon && _jsx(Icon, { className: "h-3.5 w-3.5" }), t(section.labelKey)] }), _jsx(StyledDropdownMenuSubContent, { children: section.items.map((item, index) => renderMenuItem(item, index, actionHandlers, t)) })] }, section.id));
}
export function TopBar({ onNewChat, onNewWindow, onOpenSettings, onOpenSettingsSubpage, onOpenKeyboardShortcuts, onShowAbout, onBack, onForward, canGoBack, canGoForward, onToggleSidebar, onToggleFocusMode, isCompact, }) {
    const { t } = useTranslation();
    const [isDebugMode, setIsDebugMode] = useState(false);
    const hasHelpMenuLinks = BRAND.helpMenuLinks.length > 0;
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
    const actionHandlers = {
        toggleFocusMode: onToggleFocusMode,
        toggleSidebar: onToggleSidebar,
    };
    const menuLeftPadding = isMac ? 86 : 12;
    return (_jsx("div", { className: "fixed top-0 left-0 h-[48px] pointer-events-none", style: { zIndex: 'calc(var(--z-panel) + 10)' }, children: _jsx("div", { className: "flex h-full items-center gap-2", children: _jsxs("div", { className: "titlebar-no-drag pointer-events-auto flex min-w-0 items-center gap-0.5", style: { paddingLeft: menuLeftPadding }, children: [_jsxs("div", { className: "flex items-center gap-0.5", children: [!isCompact && (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TopBarButton, { onClick: onToggleSidebar, "aria-label": t('menu.toggleSidebar'), children: _jsx(PanelLeftRounded, { className: "h-[18px] w-[18px] text-foreground/70" }) }) }), _jsx(TooltipContent, { side: "bottom", children: t('menu.toggleSidebar') })] })), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(TopBarButton, { "aria-label": t('menu.craftMenu'), children: _jsx(CraftAgentsSymbol, { className: "h-4 text-accent" }) }) }), _jsxs(StyledDropdownMenuContent, { align: "start", minWidth: "min-w-48", children: [_jsxs(StyledDropdownMenuItem, { onClick: onNewChat, children: [_jsx(SquarePenRounded, { className: "h-3.5 w-3.5" }), t('menu.newChat'), newChatHotkey && (_jsx(DropdownMenuShortcut, { className: "pl-6", children: newChatHotkey }))] }), onNewWindow && (_jsxs(StyledDropdownMenuItem, { onClick: onNewWindow, children: [_jsx(Icons.AppWindow, { className: "h-3.5 w-3.5" }), t('menu.newWindow'), newWindowHotkey && (_jsx(DropdownMenuShortcut, { className: "pl-6", children: newWindowHotkey }))] })), _jsx(StyledDropdownMenuSeparator, {}), renderMenuSection(EDIT_MENU, actionHandlers, t), renderMenuSection(VIEW_MENU, actionHandlers, t), renderMenuSection(WINDOW_MENU, actionHandlers, t), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(Icons.Settings, { className: "h-3.5 w-3.5" }), t('sidebar.settings')] }), _jsxs(StyledDropdownMenuSubContent, { children: [_jsxs(StyledDropdownMenuItem, { onClick: onOpenSettings, children: [_jsx(Icons.Settings, { className: "h-3.5 w-3.5" }), t('menu.settings'), settingsHotkey && (_jsx(DropdownMenuShortcut, { className: "pl-6", children: settingsHotkey }))] }), _jsx(StyledDropdownMenuSeparator, {}), SETTINGS_ITEMS.map((item) => {
                                                                const Icon = SETTINGS_ICONS[item.id];
                                                                return (_jsxs(StyledDropdownMenuItem, { onClick: () => onOpenSettingsSubpage(item.id), children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), t(item.labelKey)] }, item.id));
                                                            })] })] }), _jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(Icons.HelpCircle, { className: "h-3.5 w-3.5" }), t('menu.help')] }), _jsxs(StyledDropdownMenuSubContent, { children: [BRAND.helpMenuLinks.map((link) => {
                                                                const Icon = getIcon(link.icon) ?? Icons.ExternalLink;
                                                                return (_jsxs(StyledDropdownMenuItem, { onClick: () => window.electronAPI.openUrl(link.url), children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), t(link.labelKey), _jsx(Icons.ExternalLink, { className: "h-3 w-3 ml-auto text-muted-foreground" })] }, link.url));
                                                            }), hasHelpMenuLinks && _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: onOpenKeyboardShortcuts, children: [_jsx(Icons.Keyboard, { className: "h-3.5 w-3.5" }), t('menu.keyboardShortcuts'), keyboardShortcutsHotkey && (_jsx(DropdownMenuShortcut, { className: "pl-6", children: keyboardShortcutsHotkey }))] }), onShowAbout && (_jsxs(_Fragment, { children: [_jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: onShowAbout, children: [_jsx(Icons.Info, { className: "h-3.5 w-3.5" }), t('menu.aboutCraftAgents')] })] }))] })] }), isDebugMode && (_jsx(_Fragment, { children: _jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(Icons.Bug, { className: "h-3.5 w-3.5" }), "Debug"] }), _jsx(StyledDropdownMenuSubContent, { children: _jsxs(StyledDropdownMenuItem, { onClick: () => window.electronAPI.menuToggleDevTools(), children: [_jsx(Icons.Bug, { className: "h-3.5 w-3.5" }), "Toggle DevTools", _jsx(DropdownMenuShortcut, { className: "pl-6", children: isMac ? '⌥⌘I' : 'Ctrl+Shift+I' })] }) })] }) })), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: () => window.electronAPI.menuQuit(), children: [_jsx(Icons.LogOut, { className: "h-3.5 w-3.5" }), t('menu.quitCraftAgents'), quitHotkey && (_jsx(DropdownMenuShortcut, { className: "pl-6", children: quitHotkey }))] })] })] })] }), _jsxs("div", { className: cn('ml-1 flex min-w-0 items-center gap-1', isCompact ? 'flex-1' : 'w-[clamp(220px,42vw,640px)]'), children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TopBarButton, { onClick: onBack, disabled: !canGoBack, "aria-label": t('common.back'), children: _jsx(Icons.ChevronLeft, { className: "h-[18px] w-[18px] text-foreground/70", strokeWidth: 1.5 }) }) }), _jsxs(TooltipContent, { side: "bottom", children: [t('common.back'), " ", goBackHotkey] })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(TopBarButton, { onClick: onForward, disabled: !canGoForward, "aria-label": t('common.forward'), children: _jsx(Icons.ChevronRight, { className: "h-[18px] w-[18px] text-foreground/70", strokeWidth: 1.5 }) }) }), _jsxs(TooltipContent, { side: "bottom", children: [t('common.forward'), " ", goForwardHotkey] })] })] })] }) }) }));
}
//# sourceMappingURL=TopBar.js.map