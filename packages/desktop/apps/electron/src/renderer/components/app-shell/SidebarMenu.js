import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SidebarMenu - Shared menu content for sidebar navigation items
 *
 * Used by:
 * - LeftSidebar (context menu via right-click on nav items)
 * - AppShell (context menu for New Chat button)
 *
 * Uses MenuComponents context to render with either DropdownMenu or ContextMenu
 * primitives, allowing the same component to work in both scenarios.
 *
 * Provides actions based on the sidebar item type:
 * - "Configure Statuses" (for allSessions/status/flagged items) - triggers EditPopover callback
 * - "Add Source" (for sources) - triggers EditPopover callback
 * - "Add Skill" (for skills) - triggers EditPopover callback
 * - "Open in New Window" (for newSession only) - uses deep link
 */
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { AppWindow, CheckCheck, Settings2, Plus, Trash2, ExternalLink, } from 'lucide-react';
import { useMenuComponents } from '@/components/ui/menu-context';
import { getDocUrl } from '@craft-agent/shared/docs/doc-links';
/**
 * SidebarMenu - Renders the menu items for sidebar navigation actions
 * This is the content only, not wrapped in a DropdownMenu or ContextMenu
 */
export function SidebarMenu({ type, statusId, labelId, onConfigureStatuses, onMarkAllRead, onConfigureLabels, onAddLabel, onDeleteLabel, onAddSource, onAddSkill, onAddAutomation, sourceType, onConfigureViews, viewId, onDeleteView, }) {
    const { t } = useTranslation();
    // Get menu components from context (works with both DropdownMenu and ContextMenu)
    const { MenuItem, Separator } = useMenuComponents();
    // New Session: only shows "Open in New Window"
    if (type === 'newSession') {
        return (_jsxs(MenuItem, { onClick: () => window.electronAPI.openUrl('craftagents://action/new-session?window=focused'), children: [_jsx(AppWindow, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.openInNewWindow") })] }));
    }
    // All Sessions / Status / Flagged: show "Configure Statuses" (+ "Mark All Read" for allSessions)
    if ((type === 'allSessions' || type === 'status' || type === 'flagged') && onConfigureStatuses) {
        return (_jsxs(_Fragment, { children: [type === 'allSessions' && onMarkAllRead && (_jsxs(_Fragment, { children: [_jsxs(MenuItem, { onClick: onMarkAllRead, children: [_jsx(CheckCheck, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.markAllRead") })] }), _jsx(Separator, {})] })), _jsxs(MenuItem, { onClick: onConfigureStatuses, children: [_jsx(Settings2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.configureStatuses") })] })] }));
    }
    // Labels: show context-appropriate actions
    // - Header ("Labels" parent): Configure Labels + Add New Label
    // - Individual label items: Add New Label (as child) + Delete Label
    if (type === 'labels') {
        return (_jsxs(_Fragment, { children: [onAddLabel && (_jsxs(MenuItem, { onClick: () => onAddLabel(labelId), children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.addNewLabel") })] })), onConfigureLabels && (_jsxs(MenuItem, { onClick: () => onConfigureLabels(labelId), children: [_jsx(Settings2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.editLabels") })] })), labelId && onDeleteLabel && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsxs(MenuItem, { onClick: () => onDeleteLabel(labelId), children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.deleteLabel") })] })] }))] }));
    }
    // Views: show "Edit Views" and optionally "Delete View"
    if (type === 'views') {
        return (_jsxs(_Fragment, { children: [onConfigureViews && (_jsxs(MenuItem, { onClick: onConfigureViews, children: [_jsx(Settings2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.editViews") })] })), viewId && onDeleteView && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsxs(MenuItem, { onClick: () => onDeleteView(viewId), children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.deleteView") })] })] }))] }));
    }
    // Sources: show "Add Source" and "Learn More"
    if (type === 'sources') {
        // Determine which docs page to open based on source type filter
        const docFeature = sourceType
            ? `sources-${sourceType}`
            : 'sources';
        // Display label varies by source type
        const learnMoreLabel = sourceType === 'api'
            ? t('sidebarMenu.learnMoreApis')
            : sourceType === 'mcp'
                ? t('sidebarMenu.learnMoreMcp')
                : sourceType === 'local'
                    ? t('sidebarMenu.learnMoreLocalFolders')
                    : t('sidebarMenu.learnMoreSources');
        return (_jsxs(_Fragment, { children: [onAddSource && (_jsxs(MenuItem, { onClick: onAddSource, children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.addSource") })] })), _jsx(Separator, {}), _jsxs(MenuItem, { onClick: () => window.electronAPI.openUrl(getDocUrl(docFeature)), children: [_jsx(ExternalLink, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: learnMoreLabel })] })] }));
    }
    // Skills: show "Add Skill"
    if (type === 'skills' && onAddSkill) {
        return (_jsxs(MenuItem, { onClick: onAddSkill, children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.addSkill") })] }));
    }
    // Automations: show "Add Automation" and "Learn More"
    if (type === 'automations') {
        return (_jsxs(_Fragment, { children: [onAddAutomation && (_jsxs(MenuItem, { onClick: onAddAutomation, children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.addAutomation") })] })), _jsx(Separator, {}), _jsxs(MenuItem, { onClick: () => window.electronAPI.openUrl(getDocUrl('automations')), children: [_jsx(ExternalLink, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sidebarMenu.learnMoreAutomations") })] })] }));
    }
    // Fallback: return null if no handler provided (shouldn't happen)
    return null;
}
//# sourceMappingURL=SidebarMenu.js.map