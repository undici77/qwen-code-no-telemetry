import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DatabaseZap } from 'lucide-react';
import { SourceAvatar } from '@/components/ui/source-avatar';
import { deriveConnectionStatus } from '@/components/ui/source-status-indicator';
import { EntityPanel } from '@/components/ui/entity-panel';
import { EntityListBadge } from '@/components/ui/entity-list-badge';
import { EntityListEmptyScreen } from '@/components/ui/entity-list-empty';
import { sourceSelection } from '@/hooks/useEntitySelection';
import { SourceMenu } from './SourceMenu';
import { SendResourceToWorkspaceDialog } from './SendResourceToWorkspaceDialog';
import { useAppShellContext } from '@/context/AppShellContext';
import { EditPopover, getEditConfig } from '@/components/ui/EditPopover';
const SOURCE_TYPE_CONFIG = {
    mcp: { labelKey: 'sourcesList.typeMcp', colorClass: 'bg-accent/10 text-accent' },
    api: { labelKey: 'sourcesList.typeApi', colorClass: 'bg-success/10 text-success' },
    local: { labelKey: 'sourcesList.typeLocal', colorClass: 'bg-info/10 text-info' },
};
const SOURCE_STATUS_CONFIG = {
    connected: null,
    needs_auth: { labelKey: 'sourcesList.statusAuthRequired', colorClass: 'bg-warning/10 text-warning' },
    failed: { labelKey: 'sourcesList.statusDisconnected', colorClass: 'bg-destructive/10 text-destructive' },
    untested: { labelKey: 'sourcesList.statusNotTested', colorClass: 'bg-foreground/10 text-foreground/50' },
    local_disabled: { labelKey: 'sourcesList.statusDisabled', colorClass: 'bg-foreground/10 text-foreground/50' },
};
const SOURCE_TYPE_FILTER_LABEL_KEYS = {
    api: 'sourcesList.filterApi',
    mcp: 'sourcesList.filterMcp',
    local: 'sourcesList.filterLocalFolder',
};
export function SourcesListPanel({ sources, sourceFilter, workspaceRootPath, onDeleteSource, onSourceClick, selectedSourceSlug, localMcpEnabled = true, className, }) {
    const { t } = useTranslation();
    const { workspaces, activeWorkspaceId } = useAppShellContext();
    const hasOtherWorkspaces = workspaces.length > 1;
    // Send to Workspace dialog state
    const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
    const [sendResourceSlug, setSendResourceSlug] = React.useState(null);
    const [sendResourceLabel, setSendResourceLabel] = React.useState('');
    const filteredSources = React.useMemo(() => {
        if (!sourceFilter)
            return sources;
        return sources.filter(s => s.config.type === sourceFilter.sourceType);
    }, [sources, sourceFilter]);
    const emptyMessage = React.useMemo(() => {
        if (sourceFilter?.kind === 'type') {
            const filterLabelKey = SOURCE_TYPE_FILTER_LABEL_KEYS[sourceFilter.sourceType];
            const filterLabel = filterLabelKey ? t(filterLabelKey) : sourceFilter.sourceType;
            return t('sourcesList.noSourcesOfType', { type: filterLabel });
        }
        return t('sourcesList.noSourcesConfigured');
    }, [sourceFilter, t]);
    return (_jsxs(_Fragment, { children: [_jsx(EntityPanel, { items: filteredSources, getId: (s) => s.config.slug, selection: sourceSelection, selectedId: selectedSourceSlug, onItemClick: onSourceClick, className: className, emptyState: _jsx(EntityListEmptyScreen, { icon: _jsx(DatabaseZap, {}), title: emptyMessage, description: t('sourcesList.emptyDescription'), docKey: "sources", children: workspaceRootPath && (_jsx(EditPopover, { align: "center", trigger: _jsx("button", { className: "inline-flex items-center h-7 px-3 text-xs font-medium rounded-[8px] bg-background shadow-minimal hover:bg-foreground/[0.03] transition-colors", children: t('sourcesList.addSource') }), ...getEditConfig(sourceFilter?.kind === 'type' ? `add-source-${sourceFilter.sourceType}` : 'add-source', workspaceRootPath) })) }), mapItem: (source) => {
                    const connectionStatus = deriveConnectionStatus(source, localMcpEnabled);
                    const typeConfig = SOURCE_TYPE_CONFIG[source.config.type];
                    const statusConfig = SOURCE_STATUS_CONFIG[connectionStatus];
                    const subtitle = source.config.tagline || source.config.provider || '';
                    return {
                        icon: _jsx(SourceAvatar, { source: source, size: "sm" }),
                        title: source.config.name,
                        badges: (_jsxs(_Fragment, { children: [typeConfig && _jsx(EntityListBadge, { colorClass: typeConfig.colorClass, children: t(typeConfig.labelKey) }), statusConfig && (_jsx(EntityListBadge, { colorClass: statusConfig.colorClass, tooltip: source.config.connectionError || undefined, className: "cursor-default", children: t(statusConfig.labelKey) })), subtitle && _jsx("span", { className: "truncate", children: subtitle })] })),
                        menu: (_jsx(SourceMenu, { sourceSlug: source.config.slug, sourceName: source.config.name, onOpenInNewWindow: () => window.electronAPI.openUrl(`craftagents://sources/source/${source.config.slug}?window=focused`), onShowInFinder: () => window.electronAPI.showInFolder(source.folderPath), onDelete: () => onDeleteSource(source.config.slug), onSendToWorkspace: hasOtherWorkspaces ? () => {
                                setSendResourceSlug(source.config.slug);
                                setSendResourceLabel(source.config.name);
                                setSendDialogOpen(true);
                            } : undefined })),
                    };
                } }), sendResourceSlug && (_jsx(SendResourceToWorkspaceDialog, { open: sendDialogOpen, onOpenChange: setSendDialogOpen, resourceType: "source", resourceIds: [sendResourceSlug], resourceLabel: sendResourceLabel, workspaces: workspaces, activeWorkspaceId: activeWorkspaceId }))] }));
}
//# sourceMappingURL=SourcesListPanel.js.map