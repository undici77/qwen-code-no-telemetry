import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AutomationMenu - Shared menu content for automation actions
 *
 * Used by:
 * - AutomationsListPanel (dropdown via "..." button, context menu via right-click)
 * - AutomationInfoPage (title dropdown menu)
 *
 * Uses MenuComponents context to render with either DropdownMenu or ContextMenu
 * primitives, following the same dual-menu pattern as SourceMenu.
 */
import { useTranslation } from 'react-i18next';
import { Trash2, FileCode, Copy, Play, Power, PowerOff, Send, } from 'lucide-react';
import { useMenuComponents } from '@/components/ui/menu-context';
export function AutomationMenu({ automationId, automationName, enabled, onToggleEnabled, onTest, onDuplicate, onEditJson, onDelete, onSendToWorkspace, }) {
    const { MenuItem, Separator } = useMenuComponents();
    const { t } = useTranslation();
    return (_jsxs(_Fragment, { children: [onToggleEnabled && (_jsxs(MenuItem, { onClick: onToggleEnabled, children: [enabled ? (_jsx(PowerOff, { className: "h-3.5 w-3.5" })) : (_jsx(Power, { className: "h-3.5 w-3.5" })), _jsx("span", { className: "flex-1", children: enabled ? t('automations.menuDisable') : t('automations.menuEnable') })] })), onTest && (_jsxs(MenuItem, { onClick: onTest, children: [_jsx(Play, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('automations.runTest') })] })), onDuplicate && (_jsxs(MenuItem, { onClick: onDuplicate, children: [_jsx(Copy, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('automations.menuDuplicate') })] })), onSendToWorkspace && (_jsxs(MenuItem, { onClick: onSendToWorkspace, children: [_jsx(Send, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: "Send to Workspace" })] })), onEditJson && (_jsxs(MenuItem, { onClick: onEditJson, children: [_jsx(FileCode, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('automations.menuEditConfiguration') })] })), _jsx(Separator, {}), onDelete && (_jsxs(MenuItem, { onClick: onDelete, variant: "destructive", children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('automations.menuDelete') })] }))] }));
}
//# sourceMappingURL=AutomationMenu.js.map