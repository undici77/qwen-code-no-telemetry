import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useState, useCallback, useRef } from "react";
import { Check, FolderPlus, ExternalLink, ChevronDown, Cloud, CloudOff, Trash2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useSetAtom } from "jotai";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getWorkspaceDisplayName, getWorkspaceInitial, isProtectedWorkspace } from "@/utils/workspace";
import { fullscreenOverlayOpenAtom } from "@/atoms/overlay";
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, } from "@/components/ui/styled-dropdown";
import { CrossfadeAvatar } from "@/components/ui/avatar";
import { FadingText } from "@/components/ui/fading-text";
import { WorkspaceCreationScreen } from "@/components/workspace";
import { waitForTransportConnected } from '@/lib/transport-wait';
import { useWorkspaceIcons } from "@/hooks/useWorkspaceIcon";
import { useTransportConnectionState } from "@/hooks/useTransportConnectionState";
/**
 * WorkspaceSwitcher - Dropdown to select active workspace.
 *
 * Supports two trigger variants:
 * - sidebar: bottom-left selector trigger
 * - topbar: center top-bar selector trigger
 */
export function WorkspaceSwitcher({ variant = 'sidebar', isCollapsed = false, workspaces, activeWorkspaceId, onSelect, onWorkspaceCreated, onWorkspaceRemoved, }) {
    const { t } = useTranslation();
    const [showCreationScreen, setShowCreationScreen] = useState(false);
    const [reconnectTarget, setReconnectTarget] = useState(null);
    const setFullscreenOverlayOpen = useSetAtom(fullscreenOverlayOpenAtom);
    const selectedWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const selectedWorkspaceName = getWorkspaceDisplayName(selectedWorkspace, t);
    const workspaceIconMap = useWorkspaceIcons(workspaces);
    const connectionState = useTransportConnectionState();
    const isRemote = connectionState?.mode === 'remote';
    // Health check results for non-active remote workspaces (checked on dropdown open)
    const [remoteHealthMap, setRemoteHealthMap] = useState(new Map());
    const healthCheckAbort = useRef(null);
    /** Check connectivity for all non-active remote workspaces when dropdown opens. */
    const checkRemoteHealth = useCallback(() => {
        // Cancel any in-flight checks
        healthCheckAbort.current?.abort();
        const abort = new AbortController();
        healthCheckAbort.current = abort;
        const remoteWorkspaces = workspaces.filter(w => w.remoteServer && w.id !== activeWorkspaceId);
        if (remoteWorkspaces.length === 0)
            return;
        // Mark all as checking
        setRemoteHealthMap(prev => {
            const next = new Map(prev);
            for (const ws of remoteWorkspaces)
                next.set(ws.id, 'checking');
            return next;
        });
        // Fire parallel checks
        for (const ws of remoteWorkspaces) {
            window.electronAPI.testRemoteConnection(ws.remoteServer.url, ws.remoteServer.token)
                .then(result => {
                if (abort.signal.aborted)
                    return;
                setRemoteHealthMap(prev => new Map(prev).set(ws.id, result.ok ? 'ok' : 'error'));
            })
                .catch(() => {
                if (abort.signal.aborted)
                    return;
                setRemoteHealthMap(prev => new Map(prev).set(ws.id, 'error'));
            });
        }
    }, [workspaces, activeWorkspaceId]);
    /** Tooltip for disconnected remote workspaces — shows error kind. */
    const getDisconnectTooltip = (workspaceId) => {
        if (workspaceId === activeWorkspaceId && connectionState?.lastError) {
            const { kind } = connectionState.lastError;
            if (kind === 'auth')
                return t('toast.authenticationFailed');
            if (kind === 'timeout')
                return t('toast.serverUnreachable');
            if (kind === 'network')
                return t('toast.serverUnreachable');
        }
        return t('toast.disconnected');
    };
    /** True when we know a remote workspace is unreachable. */
    const isRemoteDisconnected = (workspaceId) => {
        // Active workspace: use live transport state
        if (workspaceId === activeWorkspaceId) {
            if (!isRemote || !connectionState)
                return false;
            const { status } = connectionState;
            return status !== 'connected' && status !== 'connecting' && status !== 'idle';
        }
        // Non-active: use health check result
        return remoteHealthMap.get(workspaceId) === 'error';
    };
    const handleNewWorkspace = () => {
        setShowCreationScreen(true);
        setFullscreenOverlayOpen(true);
    };
    const handleWorkspaceCreated = (workspace) => {
        setShowCreationScreen(false);
        setFullscreenOverlayOpen(false);
        toast.success(t('toast.createdWorkspace', { name: workspace.name }));
        onWorkspaceCreated?.(workspace);
        onSelect(workspace.id);
    };
    const handleRemoveWorkspace = useCallback(async (workspace) => {
        if (workspace.id === activeWorkspaceId) {
            toast.error(t('toast.cannotRemoveActiveWorkspace'));
            return;
        }
        if (isProtectedWorkspace(workspace))
            return;
        const removed = await window.electronAPI.removeWorkspace(workspace.id);
        if (removed) {
            toast.success(t('toast.removedWorkspace', { name: workspace.name }));
            onWorkspaceRemoved?.();
        }
    }, [activeWorkspaceId, onWorkspaceRemoved, t]);
    const handleCloseCreationScreen = useCallback(() => {
        setShowCreationScreen(false);
        setReconnectTarget(null);
        setFullscreenOverlayOpen(false);
    }, [setFullscreenOverlayOpen]);
    const handleReconnectWorkspace = useCallback(async (workspaceId, remoteServer) => {
        await window.electronAPI.updateWorkspaceRemoteServer(workspaceId, remoteServer);
        if (workspaceId === activeWorkspaceId) {
            await window.electronAPI.reconnectTransport();
            await waitForTransportConnected(window.electronAPI);
        }
        else {
            await Promise.resolve(onSelect(workspaceId));
            await waitForTransportConnected(window.electronAPI);
        }
        handleCloseCreationScreen();
        toast.success(t('toast.workspaceReconnected'));
    }, [activeWorkspaceId, handleCloseCreationScreen, onSelect, t]);
    return (_jsxs(_Fragment, { children: [_jsx(AnimatePresence, { children: showCreationScreen && (_jsx(WorkspaceCreationScreen, { onWorkspaceCreated: handleWorkspaceCreated, onClose: handleCloseCreationScreen, reconnectWorkspace: reconnectTarget ?? undefined, onReconnectWorkspace: handleReconnectWorkspace })) }), _jsxs(DropdownMenu, { onOpenChange: (open) => { if (open)
                    checkRemoteHealth(); }, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: variant === 'topbar' ? (_jsxs("button", { type: "button", className: "header-icon-btn titlebar-no-drag ml-1 flex-1 min-w-0 flex items-center justify-start gap-0.5 h-[30px] px-3 rounded-[8px] border border-foreground/6 text-[13px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer data-[state=open]:bg-foreground/5 data-[state=open]:text-foreground", "aria-label": "Select workspace", children: [_jsx(CrossfadeAvatar, { src: selectedWorkspace ? workspaceIconMap.get(selectedWorkspace.id) : undefined, alt: selectedWorkspaceName, className: "h-4 w-4 mr-1.5 rounded-full ring-1 ring-border/50", fallbackClassName: "bg-muted text-[10px] rounded-full", fallback: getWorkspaceInitial(selectedWorkspace, t) }), _jsx("span", { className: "truncate min-w-0 flex-1 text-left", children: selectedWorkspaceName }), selectedWorkspace?.remoteServer && (isRemoteDisconnected(selectedWorkspace.id)
                                    ? _jsx(CloudOff, { className: "h-3 w-3 text-destructive shrink-0" })
                                    : _jsx(Cloud, { className: "h-3 w-3 opacity-60 shrink-0" })), _jsx(ChevronDown, { className: "h-3 w-3 opacity-60 shrink-0" })] })) : (_jsxs("button", { className: cn("flex items-center gap-1 w-full min-w-0 justify-start px-2 py-1.5 rounded-md", "text-foreground hover:bg-foreground/5 data-[state=open]:bg-foreground/5 transition-colors duration-150", "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", isCollapsed && "h-9 w-9 shrink-0 justify-center p-0"), "aria-label": "Select workspace", children: [_jsx(CrossfadeAvatar, { src: selectedWorkspace ? workspaceIconMap.get(selectedWorkspace.id) : undefined, alt: selectedWorkspaceName, className: "h-4 w-4 rounded-full ring-1 ring-border/50", fallbackClassName: "bg-foreground text-background text-[10px] rounded-full", fallback: getWorkspaceInitial(selectedWorkspace, t) }), !isCollapsed && (_jsxs(_Fragment, { children: [_jsx(FadingText, { className: "ml-1 font-sans min-w-0 text-sm", fadeWidth: 36, children: selectedWorkspaceName }), selectedWorkspace?.remoteServer && (isRemoteDisconnected(selectedWorkspace.id)
                                            ? _jsx(CloudOff, { className: "h-3 w-3 text-destructive shrink-0" })
                                            : _jsx(Cloud, { className: "h-3 w-3 text-muted-foreground shrink-0" })), _jsx(ChevronDown, { className: "h-3 w-3 opacity-50 shrink-0" })] }))] })) }), _jsxs(StyledDropdownMenuContent, { align: variant === 'topbar' ? 'center' : 'start', sideOffset: variant === 'topbar' ? 6 : 4, minWidth: variant === 'topbar' ? 'min-w-64' : undefined, children: [workspaces.map((workspace) => {
                                const disconnected = isRemoteDisconnected(workspace.id);
                                const displayName = getWorkspaceDisplayName(workspace, t);
                                const protectedWorkspace = isProtectedWorkspace(workspace);
                                return (_jsxs(StyledDropdownMenuItem, { onClick: (e) => {
                                        if (disconnected && workspace.remoteServer) {
                                            setReconnectTarget(workspace);
                                            setShowCreationScreen(true);
                                            setFullscreenOverlayOpen(true);
                                            return;
                                        }
                                        if (disconnected)
                                            return;
                                        const openInNewWindow = e.metaKey || e.ctrlKey;
                                        onSelect(workspace.id, openInNewWindow);
                                    }, className: cn("justify-between group", activeWorkspaceId === workspace.id && "bg-foreground/10", disconnected && "opacity-60"), children: [_jsxs("div", { className: "flex items-center gap-3 font-sans min-w-0 flex-1", children: [_jsx(CrossfadeAvatar, { src: workspaceIconMap.get(workspace.id), alt: displayName, className: "h-5 w-5 rounded-full ring-1 ring-border/50", fallbackClassName: "bg-muted text-xs rounded-full", fallback: getWorkspaceInitial(workspace, t) }), _jsx("span", { className: "truncate", children: displayName }), workspace.remoteServer && (disconnected
                                                    ? _jsx("span", { title: getDisconnectTooltip(workspace.id), className: "shrink-0", children: _jsx(CloudOff, { className: "h-3.5 w-3.5 text-destructive" }) })
                                                    : _jsx(Cloud, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [activeWorkspaceId !== workspace.id && !protectedWorkspace && (_jsx("button", { className: "opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-opacity", onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleRemoveWorkspace(workspace);
                                                    }, title: t("workspace.removeWorkspace"), children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })), activeWorkspaceId !== workspace.id && !disconnected && (_jsx("button", { className: "opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-foreground/10 transition-opacity", onClick: (e) => {
                                                        e.stopPropagation();
                                                        onSelect(workspace.id, true);
                                                    }, title: t("sidebarMenu.openInNewWindow"), children: _jsx(ExternalLink, { className: "h-3.5 w-3.5" }) })), activeWorkspaceId === workspace.id && (_jsx(Check, { className: "h-3.5 w-3.5" }))] })] }, workspace.id));
                            }), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: handleNewWorkspace, className: "font-sans", children: [_jsx(FolderPlus, { className: "h-4 w-4" }), t("workspace.addWorkspace")] })] })] })] }));
}
//# sourceMappingURL=WorkspaceSwitcher.js.map