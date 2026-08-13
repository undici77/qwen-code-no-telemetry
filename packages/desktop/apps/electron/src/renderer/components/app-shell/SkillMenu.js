import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SkillMenu - Shared menu content for skill actions
 *
 * Used by:
 * - SkillsListPanel (dropdown via "..." button, context menu via right-click)
 * - SkillInfoPage (title dropdown menu)
 *
 * Uses MenuComponents context to render with either DropdownMenu or ContextMenu
 * primitives, allowing the same component to work in both scenarios.
 *
 * Provides consistent skill actions:
 * - Open in New Window
 * - Show in file manager
 * - Delete (workspace skills only)
 */
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { Trash2, FolderOpen, AppWindow, Send, } from 'lucide-react';
import { useMenuComponents } from '@/components/ui/menu-context';
import { getFileManagerName } from '@/lib/platform';
/**
 * SkillMenu - Renders the menu items for skill actions
 * This is the content only, not wrapped in a DropdownMenu or ContextMenu
 */
export function SkillMenu({ skillSlug, skillName, onOpenInNewWindow, onShowInFinder, onDelete, canShowInFinder = true, canDelete = true, deleteLabel, onSendToWorkspace, }) {
    const { t } = useTranslation();
    // Get menu components from context (works with both DropdownMenu and ContextMenu)
    const { MenuItem, Separator } = useMenuComponents();
    return (_jsxs(_Fragment, { children: [_jsxs(MenuItem, { onClick: onOpenInNewWindow, children: [_jsx(AppWindow, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.openInNewWindow") })] }), _jsxs(MenuItem, { onClick: onShowInFinder, disabled: !canShowInFinder, children: [_jsx(FolderOpen, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.showInFileManager", { fileManager: getFileManagerName() }) })] }), onSendToWorkspace && (_jsxs(MenuItem, { onClick: onSendToWorkspace, children: [_jsx(Send, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.sendToWorkspace") })] })), canDelete && onDelete && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsxs(MenuItem, { onClick: onDelete, variant: "destructive", children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: deleteLabel || t("sidebarMenu.deleteSkill") })] })] }))] }));
}
//# sourceMappingURL=SkillMenu.js.map