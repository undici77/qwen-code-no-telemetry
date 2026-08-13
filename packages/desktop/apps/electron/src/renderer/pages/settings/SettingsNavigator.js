import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsNavigator
 *
 * Navigator panel content for settings. Displays a list of settings sections
 * (App, Workspace, Shortcuts, Preferences) that can be selected to show in the details panel.
 *
 * Styling follows SessionList/SourcesListPanel patterns for visual consistency.
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, AppWindow } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem, } from '@/components/ui/styled-dropdown';
import { DropdownMenuProvider } from '@/components/ui/menu-context';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { SETTINGS_ITEMS } from '../../../shared/menu-schema';
import { SETTINGS_ICONS } from '@/components/icons/SettingsIcons';
export const meta = {
    navigator: 'settings',
    slug: 'navigator',
};
/**
 * SettingsItemRow - Individual settings item with dropdown menu
 * Tracks menu open state to keep "..." button visible when menu is open
 */
function SettingsItemRow({ item, isSelected, isFirst, onSelect }) {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const Icon = item.icon;
    // Open settings page in a new window via deep link
    const handleOpenInNewWindow = () => {
        window.electronAPI.openUrl(`craftagents://settings/${item.id}?window=focused`);
    };
    return (_jsxs("div", { className: "settings-item", "data-selected": isSelected || undefined, children: [!isFirst && (_jsx("div", { className: "settings-separator pl-12 pr-4", children: _jsx(Separator, {}) })), _jsxs("div", { className: "settings-content relative group select-none pl-2 mr-2", children: [_jsx("div", { className: "absolute left-[20px] top-[14px] z-10", children: _jsx(Icon, { className: cn('w-4 h-4 shrink-0', isSelected ? 'text-foreground' : 'text-muted-foreground') }) }), _jsxs("button", { type: "button", onClick: onSelect, className: cn('flex w-full items-start gap-2 pl-2 pr-4 py-3 text-left text-sm outline-none rounded-[8px]', 
                        // Fast hover transition (75ms vs default 150ms)
                        'transition-[background-color] duration-75', isSelected
                            ? 'bg-foreground/5 hover:bg-foreground/7'
                            : 'hover:bg-foreground/2'), children: [_jsx("div", { className: "w-6 h-5 shrink-0" }), _jsxs("div", { className: "flex flex-col min-w-0 flex-1", children: [_jsx("span", { className: cn('font-medium', isSelected ? 'text-foreground' : 'text-foreground/80'), children: item.label }), _jsx("span", { className: "text-xs text-foreground/60 line-clamp-1", children: item.description })] })] }), _jsx("div", { className: cn('absolute right-2 top-2 transition-opacity z-10', menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'), children: _jsx("div", { className: "flex items-center rounded-[8px] overflow-hidden border border-transparent hover:border-border/50", children: _jsxs(DropdownMenu, { modal: true, onOpenChange: setMenuOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("div", { className: "p-1.5 hover:bg-foreground/10 data-[state=open]:bg-foreground/10 cursor-pointer", children: _jsx(MoreHorizontal, { className: "h-4 w-4 text-muted-foreground" }) }) }), _jsx(StyledDropdownMenuContent, { align: "end", children: _jsx(DropdownMenuProvider, { children: _jsxs(StyledDropdownMenuItem, { onClick: handleOpenInNewWindow, children: [_jsx(AppWindow, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.openInNewWindow") })] }) }) })] }) }) })] })] }));
}
export default function SettingsNavigator({ selectedSubpage, onSelectSubpage, }) {
    const { t } = useTranslation();
    const settingsItems = useMemo(() => SETTINGS_ITEMS.map((item) => ({
        id: item.id,
        label: t(item.labelKey),
        icon: SETTINGS_ICONS[item.id],
        description: t(item.descriptionKey),
    })), [t]);
    return (_jsx("div", { className: "flex flex-col h-full", children: _jsx("div", { className: "flex-1 overflow-y-auto", children: _jsx("div", { className: "pt-2", children: settingsItems.map((item, index) => (_jsx(SettingsItemRow, { item: item, isSelected: selectedSubpage === item.id, isFirst: index === 0, onSelect: () => onSelectSubpage(item.id) }, item.id))) }) }) }));
}
//# sourceMappingURL=SettingsNavigator.js.map