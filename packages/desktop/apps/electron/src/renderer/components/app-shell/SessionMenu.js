import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SessionMenu - Shared menu content for session actions
 *
 * Used by:
 * - SessionList (dropdown via "..." button, context menu via right-click)
 * - ChatPage (title dropdown menu)
 *
 * Uses MenuComponents context to render with either DropdownMenu or ContextMenu
 * primitives, allowing the same component to work in both scenarios.
 *
 * Provides consistent session actions:
 * - Share / Shared submenu
 * - Status submenu
 * - Flag/Unflag
 * - Mark as Unread
 * - Rename
 * - Open in New Window
 * - Show in file manager
 * - Delete
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore, Trash2, Pencil, Flag, FlagOff, MailOpen, FolderOpen, Copy, AppWindow, Columns2, CloudUpload, RefreshCw, Tag, Send, } from 'lucide-react';
import { toast } from 'sonner';
import { navigate, routes } from '@/lib/navigate';
import { useMenuComponents } from '@/components/ui/menu-context';
import { getStateColor, getStateIcon, } from '@/config/session-status-config';
import { extractLabelId } from '@craft-agent/shared/labels';
import { LabelMenuItems, StatusMenuItems, ShareMenuItems, } from './SessionMenuParts';
import { getFileManagerName } from '@/lib/platform';
import { getSessionStatus, hasUnreadMeta, hasMessagesMeta, } from '@/utils/session';
import { MessagingSessionMenuItem } from '@/components/messaging/MessagingSessionMenuItem';
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
/**
 * SessionMenu - Renders the menu items for session actions
 * This is the content only, not wrapped in a DropdownMenu
 */
export function SessionMenu({ item, hideMetadataActions = false, hideShareAction = false, hideMessagingAction = false, hideStatusAction = false, sessionStatuses, labels = [], onLabelsChange, onRename, onFlag, onUnflag, onArchive, onUnarchive, onMarkUnread, onSessionStatusChange, onOpenInNewWindow, onSendToWorkspace, onDelete, hasRemoteWorkspaces, }) {
    const { t } = useTranslation();
    // Derive display state from item
    const sessionId = item.id;
    const isFlagged = item.isFlagged ?? false;
    const isArchived = item.isArchived ?? false;
    const sharedUrl = item.sharedUrl;
    const currentSessionStatus = getSessionStatus(item);
    const sessionLabels = React.useMemo(() => item.labels ?? [], [item.labels]);
    const _hasMessages = hasMessagesMeta(item);
    const _hasUnread = hasUnreadMeta(item);
    // Share handlers
    const handleShare = async () => {
        const result = (await window.electronAPI.sessionCommand(sessionId, {
            type: 'shareToViewer',
        }));
        if (result?.success && result.url) {
            await navigator.clipboard.writeText(result.url);
            toast.success(t('toast.linkCopied'), {
                description: result.url,
                action: {
                    label: 'Open',
                    onClick: () => window.electronAPI.openUrl(result.url),
                },
            });
        }
        else {
            toast.error(t('toast.failedToShare'), {
                description: result?.error || t('toast.unknownError'),
            });
        }
    };
    const handleShowInFinder = () => {
        window.electronAPI.sessionCommand(sessionId, { type: 'showInFinder' });
    };
    const handleCopyPath = async () => {
        const result = (await window.electronAPI.sessionCommand(sessionId, {
            type: 'copyPath',
        }));
        if (result?.success && result.path) {
            await navigator.clipboard.writeText(result.path);
            toast.success(t('toast.pathCopied'));
        }
    };
    const handleRefreshTitle = async () => {
        const result = (await window.electronAPI.sessionCommand(sessionId, {
            type: 'refreshTitle',
        }));
        if (result?.success) {
            toast.success(t('toast.titleRefreshed'), { description: result.title });
        }
        else {
            toast.error(t('toast.failedToRefreshTitle'), {
                description: result?.error || t('toast.unknownError'),
            });
        }
    };
    // Set of currently applied label IDs (extracted from entries like "priority::3" → "priority")
    const appliedLabelIds = React.useMemo(() => new Set(sessionLabels.map(extractLabelId)), [sessionLabels]);
    // Toggle a label: add if not applied, remove if applied (by base ID)
    const handleLabelToggle = React.useCallback((labelId) => {
        if (!onLabelsChange)
            return;
        const isApplied = appliedLabelIds.has(labelId);
        if (isApplied) {
            // Remove all entries matching this label ID (handles valued labels too)
            const updated = sessionLabels.filter((entry) => extractLabelId(entry) !== labelId);
            onLabelsChange(updated);
        }
        else {
            // Add as a boolean label (just the ID, no value)
            onLabelsChange([...sessionLabels, labelId]);
        }
    }, [sessionLabels, appliedLabelIds, onLabelsChange]);
    const handleOpenInNewPanel = () => {
        navigate(routes.view.allSessions(sessionId), { newPanel: true });
    };
    // Get menu components from context (works with both DropdownMenu and ContextMenu)
    const { MenuItem, Separator, Sub, SubTrigger, SubContent } = useMenuComponents();
    const showShareAction = !hideMetadataActions && !hideShareAction;
    const showMessagingAction = !hideMetadataActions && !hideMessagingAction;
    const showStatusAction = !hideMetadataActions && !hideStatusAction;
    const hasLeadingActions = showShareAction ||
        showMessagingAction ||
        (hasRemoteWorkspaces && Boolean(onSendToWorkspace));
    return (_jsxs(_Fragment, { children: [showShareAction &&
                (!sharedUrl ? (_jsxs(MenuItem, { onClick: handleShare, children: [_jsx(CloudUpload, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.share') })] })) : (_jsxs(Sub, { children: [_jsxs(SubTrigger, { className: "pr-2", children: [_jsx(CloudUpload, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.shared') })] }), _jsx(SubContent, { children: _jsx(ShareMenuItems, { sessionId: sessionId, sharedUrl: sharedUrl, menu: { MenuItem, Separator } }) })] }))), hasRemoteWorkspaces && onSendToWorkspace && (_jsxs(MenuItem, { onClick: onSendToWorkspace, children: [_jsx(Send, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.sendToWorkspace') })] })), showMessagingAction && _jsx(MessagingSessionMenuItem, { sessionId: sessionId }), hasLeadingActions && _jsx(Separator, {}), (showStatusAction ||
                (FEATURE_FLAGS.sessionLabelsUi && !hideMetadataActions)) && (_jsxs(_Fragment, { children: [showStatusAction && (_jsxs(Sub, { children: [_jsxs(SubTrigger, { className: "pr-2", children: [_jsx("span", { style: {
                                            color: getStateColor(currentSessionStatus, sessionStatuses) ??
                                                'var(--foreground)',
                                        }, children: (() => {
                                            const icon = getStateIcon(currentSessionStatus, sessionStatuses);
                                            return React.isValidElement(icon)
                                                ? React.cloneElement(icon, { bare: true })
                                                : icon;
                                        })() }), _jsx("span", { className: "flex-1", children: t('sessionMenu.status') })] }), _jsx(SubContent, { children: _jsx(StatusMenuItems, { sessionStatuses: sessionStatuses, activeStateId: currentSessionStatus, onSelect: onSessionStatusChange, menu: { MenuItem } }) })] })), FEATURE_FLAGS.sessionLabelsUi && labels.length > 0 && (_jsxs(Sub, { children: [_jsxs(SubTrigger, { className: "pr-2", children: [_jsx(Tag, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.labels') }), sessionLabels.length > 0 && (_jsx("span", { className: "text-[10px] text-muted-foreground tabular-nums -mr-2.5", children: sessionLabels.length }))] }), _jsx(SubContent, { children: _jsx(LabelMenuItems, { labels: labels, appliedLabelIds: appliedLabelIds, onToggle: handleLabelToggle, menu: { MenuItem, Separator, Sub, SubTrigger, SubContent } }) })] }))] })), !isFlagged ? (_jsxs(MenuItem, { onClick: onFlag, children: [_jsx(Flag, { className: "h-3.5 w-3.5 text-info" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.flag') })] })) : (_jsxs(MenuItem, { onClick: onUnflag, children: [_jsx(FlagOff, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.unflag') })] })), !isArchived ? (_jsxs(MenuItem, { onClick: onArchive, children: [_jsx(Archive, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.archive') })] })) : (_jsxs(MenuItem, { onClick: onUnarchive, children: [_jsx(ArchiveRestore, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.unarchive') })] })), !_hasUnread && _hasMessages && (_jsxs(MenuItem, { onClick: onMarkUnread, children: [_jsx(MailOpen, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.markAsUnread') })] })), _jsx(Separator, {}), _jsxs(MenuItem, { onClick: onRename, children: [_jsx(Pencil, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('common.rename') })] }), _jsxs(MenuItem, { onClick: handleRefreshTitle, children: [_jsx(RefreshCw, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.regenerateTitle') })] }), _jsx(Separator, {}), _jsxs(MenuItem, { onClick: handleOpenInNewPanel, children: [_jsx(Columns2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.openInNewPanel') })] }), _jsxs(MenuItem, { onClick: onOpenInNewWindow, children: [_jsx(AppWindow, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.openInNewWindow') })] }), _jsxs(MenuItem, { onClick: handleShowInFinder, children: [_jsx(FolderOpen, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.showInFileManager', {
                            fileManager: getFileManagerName(),
                        }) })] }), _jsxs(MenuItem, { onClick: handleCopyPath, children: [_jsx(Copy, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.copyPath') })] }), _jsx(Separator, {}), _jsxs(MenuItem, { onClick: onDelete, variant: "destructive", children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('common.delete') })] })] }));
}
//# sourceMappingURL=SessionMenu.js.map