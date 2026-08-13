import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { Check, Globe, Copy, RefreshCw, Link2Off } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusIconStyle } from '@/config/session-status-config';
import { sortLabelsForDisplay } from '@craft-agent/shared/labels';
import { LabelIcon } from '@/components/ui/label-icon';
export function ShareMenuItems({ sessionId, sharedUrl, menu }) {
    const { t } = useTranslation();
    const { MenuItem, Separator } = menu;
    const handleOpenInBrowser = () => {
        window.electronAPI.openUrl(sharedUrl);
    };
    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(sharedUrl);
        toast.success(t("toast.linkCopied"));
    };
    const handleUpdateShare = async () => {
        const result = await window.electronAPI.sessionCommand(sessionId, { type: 'updateShare' });
        if (result && 'success' in result && result.success) {
            toast.success(t("chat.shareUpdated"));
        }
        else {
            const errorMsg = result && 'error' in result ? result.error : undefined;
            toast.error(t("chat.failedToUpdateShare"), { description: errorMsg });
        }
    };
    const handleRevokeShare = async () => {
        const result = await window.electronAPI.sessionCommand(sessionId, { type: 'revokeShare' });
        if (result && 'success' in result && result.success) {
            toast.success(t("chat.sharingStopped"));
        }
        else {
            const errorMsg = result && 'error' in result ? result.error : undefined;
            toast.error(t("chat.failedToStopSharing"), { description: errorMsg });
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(MenuItem, { onClick: handleOpenInBrowser, children: [_jsx(Globe, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.openInBrowser") })] }), _jsxs(MenuItem, { onClick: handleCopyLink, children: [_jsx(Copy, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.copyLink") })] }), _jsxs(MenuItem, { onClick: handleUpdateShare, children: [_jsx(RefreshCw, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.updateShare") })] }), _jsx(Separator, {}), _jsxs(MenuItem, { onClick: handleRevokeShare, variant: "destructive", children: [_jsx(Link2Off, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.stopSharing") })] })] }));
}
export function StatusMenuItems({ sessionStatuses, activeStateId, onSelect, menu, }) {
    const { MenuItem } = menu;
    return (_jsx(_Fragment, { children: sessionStatuses.map((state) => {
            const bareIcon = React.isValidElement(state.icon)
                ? React.cloneElement(state.icon, { bare: true })
                : state.icon;
            return (_jsxs(MenuItem, { onClick: () => onSelect(state.id), className: activeStateId === state.id ? 'bg-foreground/5' : '', children: [_jsx("span", { style: getStatusIconStyle(state), children: bareIcon }), _jsx("span", { className: "flex-1", children: state.label })] }, state.id));
        }) }));
}
/**
 * Count how many labels in a subtree (including the root) are currently applied.
 * Used to show selection counts on parent SubTriggers so users can see
 * where in the tree their selections are.
 */
function countAppliedInSubtree(label, appliedIds) {
    let count = appliedIds.has(label.id) ? 1 : 0;
    if (label.children) {
        for (const child of label.children) {
            count += countAppliedInSubtree(child, appliedIds);
        }
    }
    return count;
}
/**
 * LabelMenuItems - Recursive component for rendering label tree as nested sub-menus.
 *
 * Labels with children render as nested Sub/SubTrigger/SubContent menus (the parent
 * itself appears as the first toggleable item inside its submenu, followed by children).
 * Leaf labels render as simple toggleable menu items with checkmarks.
 * Parent triggers show a count of applied descendants so users can see where selections are.
 */
export function LabelMenuItems({ labels, appliedLabelIds, onToggle, menu, }) {
    const { MenuItem, Separator, Sub, SubTrigger, SubContent } = menu;
    const displayLabels = React.useMemo(() => sortLabelsForDisplay(labels), [labels]);
    const renderItems = (nodes) => (_jsx(_Fragment, { children: nodes.map(label => {
            const hasChildren = label.children && label.children.length > 0;
            const isApplied = appliedLabelIds.has(label.id);
            if (hasChildren) {
                const subtreeCount = countAppliedInSubtree(label, appliedLabelIds);
                return (_jsxs(Sub, { children: [_jsxs(SubTrigger, { className: "pr-2", children: [_jsx(LabelIcon, { label: label, size: "sm", hasChildren: true }), _jsx("span", { className: "flex-1", children: label.name }), subtreeCount > 0 && (_jsx("span", { className: "text-[10px] text-foreground/50 tabular-nums -mr-2.5", children: subtreeCount }))] }), _jsxs(SubContent, { children: [_jsxs(MenuItem, { onSelect: (e) => {
                                        e.preventDefault();
                                        onToggle(label.id);
                                    }, children: [_jsx(LabelIcon, { label: label, size: "sm", hasChildren: true }), _jsx("span", { className: "flex-1", children: label.name }), _jsx("span", { className: "w-3.5 ml-4", children: isApplied && _jsx(Check, { className: "h-3.5 w-3.5 text-foreground" }) })] }), _jsx(Separator, {}), renderItems(label.children)] })] }, label.id));
            }
            return (_jsxs(MenuItem, { onSelect: (e) => {
                    e.preventDefault();
                    onToggle(label.id);
                }, children: [_jsx(LabelIcon, { label: label, size: "sm" }), _jsx("span", { className: "flex-1", children: label.name }), _jsx("span", { className: "w-3.5 ml-4", children: isApplied && _jsx(Check, { className: "h-3.5 w-3.5 text-foreground" }) })] }, label.id));
        }) }));
    return renderItems(displayLabels);
}
//# sourceMappingURL=SessionMenuParts.js.map