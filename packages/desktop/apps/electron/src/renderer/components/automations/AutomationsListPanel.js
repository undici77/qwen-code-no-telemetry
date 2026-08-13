import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AutomationsListPanel
 *
 * Navigator panel for displaying automations in the 2nd column.
 * Follows the SourcesListPanel pattern with avatar, title, subtitle, badges.
 * Title and Plus button are handled by the shared PanelHeader in AppShell.
 *
 * Supports CMD/CTRL+click multi-select and Shift+click range select,
 * using the shared EntityRow + createEntitySelection infrastructure.
 */
import * as React from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Webhook } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EntityListEmptyScreen } from '@/components/ui/entity-list-empty';
import { EntityRow } from '@/components/ui/entity-row';
import { EditPopover, getEditConfig } from '@/components/ui/EditPopover';
import { SessionSearchHeader } from '@/components/app-shell/SessionSearchHeader';
import { AutomationMenu } from './AutomationMenu';
import { BatchAutomationMenu } from './BatchAutomationMenu';
import { AutomationAvatar } from './AutomationAvatar';
import { SendResourceToWorkspaceDialog } from '@/components/app-shell/SendResourceToWorkspaceDialog';
import { useAppShellContext } from '@/context/AppShellContext';
import { cn } from '@/lib/utils';
import { automationSelection } from '@/hooks/useEntitySelection';
import { APP_EVENTS, AGENT_EVENTS, getEventDisplayName } from './types';
import { formatShortRelativeTime } from './utils';
const { useSelection: useAutomationSelection, } = automationSelection;
/** Tiny inline badge used for event name and action type in automation rows */
function MicroBadge({ children, colorClass }) {
    return (_jsx("span", { className: cn('shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded', colorClass), children: children }));
}
function AutomationItem({ automation, isSelected, isInMultiSelect, isMultiSelectActive, isFirst, onClick, onToggleSelect, onRangeSelect, onDelete, onToggleEnabled, onTest, onDuplicate, onSendToWorkspace, }) {
    const { t } = useTranslation();
    const handleClick = useCallback((e) => {
        if (e.button === 2) {
            // Right-click: auto-add to selection if multi-select active
            if (isMultiSelectActive && !isInMultiSelect && onToggleSelect)
                onToggleSelect();
            return;
        }
        if ((e.metaKey || e.ctrlKey) && onToggleSelect) {
            e.preventDefault();
            onToggleSelect();
            return;
        }
        if (e.shiftKey && onRangeSelect) {
            e.preventDefault();
            onRangeSelect();
            return;
        }
        onClick();
    }, [isMultiSelectActive, isInMultiSelect, onToggleSelect, onRangeSelect, onClick]);
    return (_jsx(EntityRow, { className: cn('automation-item', !automation.enabled && 'opacity-50'), showSeparator: !isFirst, separatorClassName: "pl-10 pr-4", isSelected: isSelected, isInMultiSelect: isInMultiSelect, onMouseDown: handleClick, icon: _jsx(AutomationAvatar, { event: automation.event, size: "sm" }), title: automation.name, badges: _jsxs(_Fragment, { children: [_jsx(MicroBadge, { colorClass: "bg-foreground/8 text-foreground/60", children: getEventDisplayName(automation.event) }), automation.actions.some(a => a.type === 'prompt') && (_jsx(MicroBadge, { colorClass: "bg-accent/10 text-accent", children: t('automations.badgePrompt') })), automation.actions.some(a => a.type === 'webhook') && (_jsx(MicroBadge, { colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400", children: t('automations.badgeWebhook') }))] }), trailing: automation.lastExecutedAt ? (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("span", { className: "shrink-0 text-[11px] text-foreground/40 whitespace-nowrap cursor-default", children: formatShortRelativeTime(automation.lastExecutedAt) }) }), _jsx(TooltipContent, { side: "bottom", sideOffset: 4, children: t('automations.lastRan', { time: formatShortRelativeTime(automation.lastExecutedAt) }) })] })) : undefined, menuContent: _jsx(AutomationMenu, { automationId: automation.id, automationName: automation.name, enabled: automation.enabled, onToggleEnabled: onToggleEnabled, onTest: onTest, onDuplicate: onDuplicate, onDelete: onDelete, onSendToWorkspace: onSendToWorkspace }), contextMenuContent: isMultiSelectActive && isInMultiSelect ? _jsx(BatchAutomationMenu, {}) : undefined }));
}
export function AutomationsListPanel({ automations, automationFilter, onAutomationClick, onDeleteAutomation, onToggleAutomation, onTestAutomation, onDuplicateAutomation, selectedAutomationId, workspaceRootPath, className, }) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchActive, setSearchActive] = useState(false);
    const { workspaces, activeWorkspaceId } = useAppShellContext();
    const hasOtherWorkspaces = workspaces.length > 1;
    // Send to Workspace dialog state
    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [sendResourceId, setSendResourceId] = useState(null);
    const [sendResourceLabel, setSendResourceLabel] = useState('');
    const { select: selectAutomation, toggle: toggleAutomation, selectRange, isMultiSelectActive, isSelected: isInSelection, } = useAutomationSelection();
    const isSearchMode = searchActive && searchQuery.length >= 2;
    // Filter automations based on sidebar-driven filter (from route)
    const categoryFiltered = React.useMemo(() => {
        const kind = automationFilter?.kind ?? 'all';
        if (kind === 'all')
            return automations;
        if (kind === 'scheduled')
            return automations.filter(a => a.event === 'SchedulerTick');
        if (kind === 'app')
            return automations.filter(a => APP_EVENTS.includes(a.event) && a.event !== 'SchedulerTick');
        if (kind === 'agent')
            return automations.filter(a => AGENT_EVENTS.includes(a.event));
        return automations;
    }, [automations, automationFilter?.kind]);
    // Further filter by search query (name, summary, event display name)
    const searchFiltered = React.useMemo(() => {
        if (!isSearchMode)
            return categoryFiltered;
        const q = searchQuery.toLowerCase();
        return categoryFiltered.filter(a => a.name.toLowerCase().includes(q) ||
            a.summary.toLowerCase().includes(q) ||
            getEventDisplayName(a.event).toLowerCase().includes(q));
    }, [categoryFiltered, isSearchMode, searchQuery]);
    // Sort: most recently executed first, never-run at the bottom
    const filteredAutomations = React.useMemo(() => {
        return [...searchFiltered].sort((a, b) => {
            if (!a.lastExecutedAt && !b.lastExecutedAt)
                return 0;
            if (!a.lastExecutedAt)
                return 1;
            if (!b.lastExecutedAt)
                return -1;
            return new Date(b.lastExecutedAt).getTime() - new Date(a.lastExecutedAt).getTime();
        });
    }, [searchFiltered]);
    const handleItemClick = useCallback((automationId, index) => {
        selectAutomation(automationId, index);
        onAutomationClick(automationId);
    }, [selectAutomation, onAutomationClick]);
    const handleToggleSelect = useCallback((automationId, index) => {
        toggleAutomation(automationId, index);
    }, [toggleAutomation]);
    const handleRangeSelect = useCallback((toIndex) => {
        const allIds = filteredAutomations.map(a => a.id);
        selectRange(toIndex, allIds);
    }, [filteredAutomations, selectRange]);
    // Empty state
    if (automations.length === 0) {
        return (_jsx("div", { className: cn('flex flex-col flex-1 min-h-0', className), children: _jsx(EntityListEmptyScreen, { icon: _jsx(Webhook, {}), title: t('automations.noAutomationsConfigured'), description: t('automations.emptyDescription'), docKey: "automations", children: workspaceRootPath && (_jsx(EditPopover, { align: "center", trigger: _jsx("button", { className: "inline-flex items-center h-7 px-3 text-xs font-medium rounded-[8px] bg-background shadow-minimal hover:bg-foreground/[0.03] transition-colors", children: t('automations.addAutomation') }), ...getEditConfig('automation-config', workspaceRootPath) })) }) }));
    }
    return (_jsxs("div", { className: cn('flex flex-col flex-1 min-h-0', className), children: [searchActive && (_jsx(SessionSearchHeader, { searchQuery: searchQuery, onSearchChange: setSearchQuery, onSearchClose: () => {
                    setSearchActive(false);
                    setSearchQuery('');
                }, placeholder: t('automations.searchPlaceholder'), resultCount: isSearchMode ? filteredAutomations.length : undefined })), filteredAutomations.length === 0 ? (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center gap-1", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: isSearchMode ? t('automations.noAutomationsFound') : t('automations.noAutomationsConfigured') }), isSearchMode && (_jsx("button", { onClick: () => setSearchQuery(''), className: "text-xs text-foreground hover:underline", children: t('automations.clearSearch') }))] })) : (_jsx(ScrollArea, { className: "flex-1", children: _jsx("div", { className: "pb-2", children: _jsx("div", { className: "pt-1", children: filteredAutomations.map((automation, index) => (_jsx(AutomationItem, { automation: automation, isSelected: selectedAutomationId === automation.id, isInMultiSelect: isMultiSelectActive && isInSelection(automation.id), isMultiSelectActive: isMultiSelectActive, isFirst: index === 0, onClick: () => handleItemClick(automation.id, index), onToggleSelect: () => handleToggleSelect(automation.id, index), onRangeSelect: () => handleRangeSelect(index), onDelete: () => onDeleteAutomation?.(automation.id), onToggleEnabled: () => onToggleAutomation?.(automation.id), onTest: () => onTestAutomation?.(automation.id), onDuplicate: () => onDuplicateAutomation?.(automation.id), onSendToWorkspace: hasOtherWorkspaces ? () => {
                                setSendResourceId(automation.id);
                                setSendResourceLabel(automation.name);
                                setSendDialogOpen(true);
                            } : undefined }, automation.id))) }) }) })), sendResourceId && (_jsx(SendResourceToWorkspaceDialog, { open: sendDialogOpen, onOpenChange: setSendDialogOpen, resourceType: "automation", resourceIds: [sendResourceId], resourceLabel: sendResourceLabel, workspaces: workspaces, activeWorkspaceId: activeWorkspaceId }))] }));
}
//# sourceMappingURL=AutomationsListPanel.js.map