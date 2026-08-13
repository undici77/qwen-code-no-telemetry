import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * BatchSessionMenu - Context menu content for batch operations on multi-selected sessions.
 *
 * Self-contained component that uses hooks to access selection state, session metadata,
 * and mutation callbacks. Renders polymorphic menu items via useMenuComponents() so it
 * works in both DropdownMenu and ContextMenu scenarios.
 *
 * Mirrors the actions from MultiSelectPanel (Status, Labels, Archive) with additions
 * for Flag and Delete that make sense in a context menu.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Archive, Flag, FlagOff, Trash2, Tag, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useMenuComponents } from '@/components/ui/menu-context';
import { useSelectedIds } from '@/hooks/useSession';
import { useSessionSelection } from '@/hooks/useSession';
import { sessionMetaMapAtom, sendToWorkspaceAtom, } from '@/atoms/sessions';
import { useAppShellContext } from '@/context/AppShellContext';
import { getStateColor, getStateIcon, } from '@/config/session-status-config';
import { extractLabelId } from '@craft-agent/shared/labels';
import { LabelMenuItems, StatusMenuItems } from './SessionMenuParts';
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
import { getSessionTitle } from '@/utils/session';
export function BatchSessionMenu({ onSendToWorkspace, hideMetadataActions = false, } = {}) {
    const { t } = useTranslation();
    const { MenuItem, Separator, Sub, SubTrigger, SubContent } = useMenuComponents();
    const selectedIds = useSelectedIds();
    const setSendToWorkspace = useSetAtom(sendToWorkspaceAtom);
    const { clearMultiSelect } = useSessionSelection();
    const sessionMetaMap = useAtomValue(sessionMetaMapAtom);
    const { onSessionStatusChange, onArchiveSession, onUnarchiveSession, onFlagSession, onUnflagSession, onSessionLabelsChange, onDeleteSession, workspaces, sessionStatuses = [], labels = [], } = useAppShellContext();
    const hasRemoteWorkspaces = workspaces?.some((w) => w.remoteServer) ?? false;
    // Hydrate selected session metadata
    const selectedMetas = useMemo(() => {
        const metas = [];
        selectedIds.forEach((id) => {
            const meta = sessionMetaMap.get(id);
            if (meta)
                metas.push(meta);
        });
        return metas;
    }, [selectedIds, sessionMetaMap]);
    // Compute shared status (if all selected have the same status)
    const activeStatusId = useMemo(() => {
        if (selectedMetas.length === 0)
            return null;
        const first = (selectedMetas[0].sessionStatus || 'todo');
        const allSame = selectedMetas.every((meta) => (meta.sessionStatus || 'todo') === first);
        return allSame ? first : null;
    }, [selectedMetas]);
    // Compute intersection of applied labels (only labels ALL selected sessions have)
    const appliedLabelIds = useMemo(() => {
        if (selectedMetas.length === 0)
            return new Set();
        const toLabelSet = (meta) => new Set((meta.labels || []).map((entry) => extractLabelId(entry)));
        const [first, ...rest] = selectedMetas.map(toLabelSet);
        const intersection = new Set(first);
        for (const labelSet of rest) {
            for (const id of [...intersection]) {
                if (!labelSet.has(id))
                    intersection.delete(id);
            }
        }
        return intersection;
    }, [selectedMetas]);
    // Check flag state: all flagged, or some/none flagged
    const allFlagged = useMemo(() => selectedMetas.length > 0 && selectedMetas.every((m) => m.isFlagged), [selectedMetas]);
    // Batch status change
    const handleBatchSetStatus = useCallback((status) => {
        selectedIds.forEach((sessionId) => {
            onSessionStatusChange(sessionId, status);
        });
    }, [selectedIds, onSessionStatusChange]);
    // Batch label toggle (all-or-nothing semantics, same as MainContentPanel)
    const handleBatchToggleLabel = useCallback((labelId) => {
        if (!onSessionLabelsChange)
            return;
        const allHaveLabel = selectedMetas.every((meta) => (meta.labels || []).some((entry) => extractLabelId(entry) === labelId));
        selectedMetas.forEach((meta) => {
            const currentLabels = meta.labels || [];
            const hasLabel = currentLabels.some((entry) => extractLabelId(entry) === labelId);
            const filtered = currentLabels.filter((entry) => extractLabelId(entry) !== labelId);
            const nextLabels = allHaveLabel
                ? filtered
                : hasLabel
                    ? currentLabels
                    : [...currentLabels, labelId];
            onSessionLabelsChange(meta.id, nextLabels);
        });
    }, [selectedMetas, onSessionLabelsChange]);
    // Batch flag/unflag
    const handleBatchFlag = useCallback(() => {
        selectedIds.forEach((id) => onFlagSession(id));
        toast(`${selectedIds.size} ${selectedIds.size === 1 ? 'session' : 'sessions'} flagged`);
    }, [selectedIds, onFlagSession]);
    const handleBatchUnflag = useCallback(() => {
        selectedIds.forEach((id) => onUnflagSession(id));
        toast(`${selectedIds.size} ${selectedIds.size === 1 ? 'session' : 'sessions'} unflagged`);
    }, [selectedIds, onUnflagSession]);
    // Batch archive
    const handleBatchArchive = useCallback(() => {
        selectedIds.forEach((id) => onArchiveSession(id));
        clearMultiSelect();
        toast(`${selectedIds.size} ${selectedIds.size === 1 ? 'session' : 'sessions'} archived`);
    }, [selectedIds, onArchiveSession, clearMultiSelect]);
    // Batch send to workspace
    const handleSendToWorkspace = useCallback(() => {
        if (onSendToWorkspace) {
            onSendToWorkspace();
        }
        else {
            setSendToWorkspace([...selectedIds]);
        }
    }, [onSendToWorkspace, selectedIds, setSendToWorkspace]);
    // Batch delete
    const handleBatchDelete = useCallback(async () => {
        const count = selectedIds.size;
        const ids = [...selectedIds];
        const firstTitle = selectedMetas[0] ? getSessionTitle(selectedMetas[0]) : undefined;
        // Delete one-by-one (first shows confirmation, rest skip if first is confirmed)
        const firstDeleted = await onDeleteSession(ids[0], false, firstTitle);
        if (!firstDeleted)
            return; // User cancelled
        for (let i = 1; i < ids.length; i++) {
            await onDeleteSession(ids[i], true); // skip confirmation for remaining
        }
        clearMultiSelect();
        toast(`${count} ${count === 1 ? 'session' : 'sessions'} deleted`);
    }, [selectedIds, selectedMetas, onDeleteSession, clearMultiSelect]);
    // Resolve current status icon for the submenu trigger
    const statusIcon = activeStatusId
        ? (() => {
            const icon = getStateIcon(activeStatusId, sessionStatuses);
            return React.isValidElement(icon)
                ? React.cloneElement(icon, {
                    bare: true,
                })
                : icon;
        })()
        : null;
    const count = selectedIds.size;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "px-2 py-1.5 text-xs text-muted-foreground font-medium", children: t('multiSelect.selected.session', { count }) }), _jsx(Separator, {}), !hideMetadataActions && (_jsxs(_Fragment, { children: [_jsxs(Sub, { children: [_jsxs(SubTrigger, { className: "pr-2", children: [statusIcon ? (_jsx("span", { style: {
                                            color: getStateColor(activeStatusId, sessionStatuses) ??
                                                'var(--foreground)',
                                        }, children: statusIcon })) : (_jsx("span", { className: "h-3.5 w-3.5" })), _jsx("span", { className: "flex-1", children: t('sessionMenu.status') })] }), _jsx(SubContent, { children: _jsx(StatusMenuItems, { sessionStatuses: sessionStatuses, activeStateId: activeStatusId ?? undefined, onSelect: handleBatchSetStatus, menu: { MenuItem } }) })] }), FEATURE_FLAGS.sessionLabelsUi && labels.length > 0 && (_jsxs(Sub, { children: [_jsxs(SubTrigger, { className: "pr-2", children: [_jsx(Tag, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sidebar.labels') })] }), _jsx(SubContent, { children: _jsx(LabelMenuItems, { labels: labels, appliedLabelIds: appliedLabelIds, onToggle: handleBatchToggleLabel, menu: { MenuItem, Separator, Sub, SubTrigger, SubContent } }) })] })), allFlagged ? (_jsxs(MenuItem, { onClick: handleBatchUnflag, children: [_jsx(FlagOff, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.unflagAll') })] })) : (_jsxs(MenuItem, { onClick: handleBatchFlag, children: [_jsx(Flag, { className: "h-3.5 w-3.5 text-info" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.flagAll') })] }))] })), _jsxs(MenuItem, { onClick: handleBatchArchive, children: [_jsx(Archive, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.archive') })] }), hasRemoteWorkspaces && (_jsxs(MenuItem, { onClick: handleSendToWorkspace, children: [_jsx(Send, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.sendToWorkspace') })] })), _jsx(Separator, {}), _jsxs(MenuItem, { onClick: handleBatchDelete, variant: "destructive", children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('common.delete') })] })] }));
}
//# sourceMappingURL=BatchSessionMenu.js.map