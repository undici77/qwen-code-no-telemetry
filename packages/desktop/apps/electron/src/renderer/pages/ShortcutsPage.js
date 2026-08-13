import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ShortcutsPage
 *
 * Displays keyboard shortcuts reference from the centralized action registry.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { routes } from '@/lib/navigate';
import { isMac } from '@/lib/platform';
import { actionsByCategory, useActionLabel } from '@/actions';
// Component-specific shortcuts that aren't in the centralized registry
function useComponentSpecificSections() {
    const { t } = useTranslation();
    return [
        {
            title: t('shortcuts.listNavigation'),
            shortcuts: [
                { keys: ['↑', '↓'], description: t('shortcuts.navigateItems') },
                { keys: ['Home'], description: t('shortcuts.goToFirst') },
                { keys: ['End'], description: t('shortcuts.goToLast') },
            ],
        },
        {
            title: t('shortcuts.sessionList'),
            shortcuts: [
                { keys: ['Enter'], description: t('shortcuts.focusChatInput') },
                { keys: ['Right-click'], description: t('shortcuts.openContextMenu') },
                { keys: [isMac ? '⌥' : 'Alt', 'Click'], description: t('shortcuts.addFilterExcluded') },
            ],
        },
        {
            title: t('shortcuts.agentTree'),
            shortcuts: [
                { keys: ['←'], description: t('shortcuts.collapseFolder') },
                { keys: ['→'], description: t('shortcuts.expandFolder') },
            ],
        },
        {
            title: t('shortcuts.chatInput'),
            shortcuts: [
                { keys: ['Enter'], description: t('shortcuts.sendMessage') },
                { keys: ['Shift', 'Enter'], description: t('shortcuts.newLine') },
                { keys: ['Esc'], description: t('shortcuts.closeDialogBlur') },
            ],
        },
    ];
}
function Kbd({ children, className }) {
    return (_jsx("kbd", { className: `inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium font-sans bg-muted border border-border rounded ${className || ''}`, children: children }));
}
/**
 * Renders a shortcut row for an action from the registry
 */
function ActionShortcutRow({ actionId }) {
    const { label, hotkey } = useActionLabel(actionId);
    if (!hotkey)
        return null;
    // Split hotkey into individual keys for display
    // Mac: symbols are concatenated (⌘⇧N) - need smart splitting
    // Windows: separated by + (Ctrl+Shift+N) - split on +
    const keys = isMac
        ? hotkey.match(/[⌘⇧⌥←→]|Tab|Esc|./g) || []
        : hotkey.split('+');
    return (_jsxs("div", { className: "group flex items-center justify-between py-1.5", children: [_jsx("span", { className: "text-sm", children: label }), _jsx("div", { className: "flex-1 mx-3 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_8px)] opacity-0 group-hover:opacity-15" }), _jsx("div", { className: "flex items-center gap-1", children: keys.map((key, keyIndex) => (_jsx(Kbd, { className: "group-hover:bg-foreground/10 group-hover:border-foreground/20", children: key }, keyIndex))) })] }));
}
export default function ShortcutsPage() {
    const { t } = useTranslation();
    const componentSpecificSections = useComponentSpecificSections();
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("shortcuts.title"), actions: _jsx(HeaderMenu, { route: routes.view.settings('shortcuts') }) }), _jsx(Separator, {}), _jsx(ScrollArea, { className: "flex-1", children: _jsx("div", { className: "px-5 py-4", children: _jsxs("div", { className: "space-y-6", children: [Object.entries(actionsByCategory).map(([category, actions]) => (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1.5 border-b border-border/50", children: category }), _jsx("div", { className: "space-y-0.5", children: actions.map(action => (_jsx(ActionShortcutRow, { actionId: action.id }, action.id))) })] }, category))), componentSpecificSections.map((section) => (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1.5 border-b border-border/50", children: section.title }), _jsx("div", { className: "space-y-0.5", children: section.shortcuts.map((shortcut, index) => (_jsxs("div", { className: "group flex items-center justify-between py-1.5", children: [_jsx("span", { className: "text-sm", children: shortcut.description }), _jsx("div", { className: "flex-1 mx-3 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_8px)] opacity-0 group-hover:opacity-15" }), _jsx("div", { className: "flex items-center gap-1", children: shortcut.keys.map((key, keyIndex) => (_jsx(Kbd, { className: "group-hover:bg-foreground/10 group-hover:border-foreground/20", children: key }, keyIndex))) })] }, index))) })] }, section.title)))] }) }) })] }));
}
//# sourceMappingURL=ShortcutsPage.js.map