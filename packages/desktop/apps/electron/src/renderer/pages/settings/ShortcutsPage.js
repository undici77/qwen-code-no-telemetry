import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ShortcutsPage
 *
 * Displays keyboard shortcuts reference from the centralized action registry.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsSection, SettingsCard, SettingsRow } from '@/components/settings';
import { isMac } from '@/lib/platform';
import { actionsByCategory, useActionLabel } from '@/actions';
export const meta = {
    navigator: 'settings',
    slug: 'shortcuts',
};
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
            title: t('shortcuts.chatInput'),
            shortcuts: [
                { keys: ['Enter'], description: t('shortcuts.sendMessage') },
                { keys: ['Shift', 'Enter'], description: t('shortcuts.newLine') },
                { keys: ['Esc'], description: t('shortcuts.closeDialogBlur') },
            ],
        },
    ];
}
function Kbd({ children }) {
    return (_jsx("kbd", { className: "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium font-sans bg-muted border border-border rounded", children: children }));
}
/**
 * Renders a shortcut row for an action from the registry
 */
// Map action IDs to i18n keys for translated labels
const ACTION_LABEL_KEYS = {
    'app.newChat': 'shortcuts.action.newChat',
    'app.newChatInPanel': 'shortcuts.action.newChatInPanel',
    'app.settings': 'shortcuts.action.settings',
    'app.toggleTheme': 'shortcuts.action.toggleTheme',
    'app.search': 'shortcuts.action.search',
    'app.keyboardShortcuts': 'shortcuts.action.keyboardShortcuts',
    'app.newWindow': 'shortcuts.action.newWindow',
    'app.quit': 'shortcuts.action.quit',
    'nav.focusSidebar': 'shortcuts.action.focusSidebar',
    'nav.focusNavigator': 'shortcuts.action.focusNavigator',
    'nav.focusChat': 'shortcuts.action.focusChat',
    'nav.nextZone': 'shortcuts.action.focusNextZone',
    'nav.goBack': 'shortcuts.action.goBack',
    'nav.goForward': 'shortcuts.action.goForward',
    'nav.goBackAlt': 'shortcuts.action.goBack',
    'nav.goForwardAlt': 'shortcuts.action.goForward',
    'view.toggleSidebar': 'shortcuts.action.toggleSidebar',
    'view.toggleFocusMode': 'shortcuts.action.toggleFocusMode',
    'navigator.selectAll': 'shortcuts.action.selectAll',
    'navigator.clearSelection': 'shortcuts.action.clearSelection',
    'panel.focusNext': 'shortcuts.action.focusNextPanel',
    'panel.focusPrev': 'shortcuts.action.focusPrevPanel',
    'chat.stopProcessing': 'shortcuts.action.stopProcessing',
    'chat.cyclePermissionMode': 'shortcuts.action.cyclePermissionMode',
    'chat.nextSearchMatch': 'shortcuts.action.nextSearchMatch',
    'chat.prevSearchMatch': 'shortcuts.action.prevSearchMatch',
};
function ActionShortcutRow({ actionId }) {
    const { t } = useTranslation();
    const { label, hotkey } = useActionLabel(actionId);
    if (!hotkey)
        return null;
    // Split hotkey into individual keys for display
    // Mac: symbols are concatenated (⌘⇧N) - need smart splitting
    // Windows: separated by + (Ctrl+Shift+N) - split on +
    const keys = isMac
        ? hotkey.match(/[⌘⇧⌥←→]|Tab|Esc|./g) || []
        : hotkey.split('+');
    return (_jsx(SettingsRow, { label: ACTION_LABEL_KEYS[actionId] ? t(ACTION_LABEL_KEYS[actionId]) : label, children: _jsx("div", { className: "flex items-center gap-1", children: keys.map((key, keyIndex) => (_jsx(Kbd, { children: key }, keyIndex))) }) }));
}
export default function ShortcutsPage() {
    const { t } = useTranslation();
    const componentSpecificSections = useComponentSpecificSections();
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.shortcuts.title") }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsxs("div", { className: "px-5 py-7 max-w-3xl mx-auto space-y-8", children: [Object.entries(actionsByCategory).map(([category, actions]) => (_jsx(SettingsSection, { title: t(`shortcuts.category.${category.toLowerCase()}`), children: _jsx(SettingsCard, { children: actions.map(action => (_jsx(ActionShortcutRow, { actionId: action.id }, action.id))) }) }, category))), componentSpecificSections.map((section) => (_jsx(SettingsSection, { title: section.title, children: _jsx(SettingsCard, { children: section.shortcuts.map((shortcut, index) => (_jsx(SettingsRow, { label: shortcut.description, children: _jsx("div", { className: "flex items-center gap-1", children: shortcut.keys.map((key, keyIndex) => (_jsx(Kbd, { children: key }, keyIndex))) }) }, index))) }) }, section.title)))] }) }) })] }));
}
//# sourceMappingURL=ShortcutsPage.js.map