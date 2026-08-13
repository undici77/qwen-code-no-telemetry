import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { useRegisterModal } from "@/context/ModalContext";
import { isMac } from "@/lib/platform";
import { actionsByCategory, useActionLabel } from "@/actions";
// Component-specific shortcuts that aren't in the centralized registry
// These are context-sensitive behaviors, not global actions
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
                { keys: ['Delete'], description: t('shortcuts.deleteSession') },
                { keys: ['R'], description: t('shortcuts.renameSession') },
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
function Kbd({ children }) {
    return (_jsx("kbd", { className: "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium font-sans bg-muted border border-border rounded shadow-sm", children: children }));
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
    return (_jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { className: "text-sm", children: label }), _jsx("div", { className: "flex items-center gap-1", children: keys.map((key, keyIndex) => (_jsx(Kbd, { children: key }, keyIndex))) })] }));
}
/**
 * Renders a section of shortcuts from the registry
 */
function RegistrySection({ category, actionIds }) {
    return (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2", children: category }), _jsx("div", { className: "space-y-1.5", children: actionIds.map(actionId => (_jsx(ActionShortcutRow, { actionId: actionId }, actionId))) })] }));
}
/**
 * Renders a section of static shortcuts (component-specific)
 */
function StaticSection({ section }) {
    return (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2", children: section.title }), _jsx("div", { className: "space-y-1.5", children: section.shortcuts.map((shortcut, index) => (_jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { className: "text-sm", children: shortcut.description }), _jsx("div", { className: "flex items-center gap-1", children: shortcut.keys.map((key, keyIndex) => (_jsx(Kbd, { children: key }, keyIndex))) })] }, index))) })] }));
}
export function KeyboardShortcutsDialog({ open, onOpenChange }) {
    const { t } = useTranslation();
    const componentSpecificSections = useComponentSpecificSections();
    // Register with modal context so X button / Cmd+W closes this dialog first
    useRegisterModal(open, () => onOpenChange(false));
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[500px] max-h-[80vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t("shortcuts.title") }) }), _jsxs("div", { className: "space-y-6 py-2", children: [Object.entries(actionsByCategory).map(([category, actions]) => (_jsx(RegistrySection, { category: category, actionIds: actions.map(a => a.id) }, category))), componentSpecificSections.map((section) => (_jsx(StaticSection, { section: section }, section.title)))] })] }) }));
}
//# sourceMappingURL=KeyboardShortcutsDialog.js.map