import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SendResourceToWorkspaceDialog — Copy a source, skill, or automation to another workspace.
 *
 * Uses the resources:export → resources:import RPC pipeline.
 * Supports both local and remote target workspaces:
 * - Local: both RPC calls go to the same server
 * - Remote: export runs locally, import runs via invokeOnServer on the target
 *
 * Adapted from SendToWorkspaceDialog (session transfer).
 */
import { useTranslation } from 'react-i18next';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Cloud, CloudOff, Monitor, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CrossfadeAvatar } from '@/components/ui/avatar';
import { useWorkspaceIcons } from '@/hooks/useWorkspaceIcon';
import { cn } from '@/lib/utils';
import { getWorkspaceDisplayName, getWorkspaceInitial, } from '@/utils/workspace';
const RESOURCE_TYPE_LABELS = {
    source: { singular: 'source', plural: 'sources' },
    skill: { singular: 'skill', plural: 'skills' },
    automation: { singular: 'automation', plural: 'automations' },
};
export function SendResourceToWorkspaceDialog({ open, onOpenChange, resourceType, resourceIds, resourceLabel, workspaces, activeWorkspaceId, onTransferComplete, }) {
    const { t } = useTranslation();
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const workspaceIconMap = useWorkspaceIcons(workspaces);
    // Health check results for remote workspaces
    const [remoteHealthMap, setRemoteHealthMap] = useState(new Map());
    const healthCheckAbort = useRef(null);
    // All workspaces except current (both local and remote)
    const targetWorkspaces = useMemo(() => workspaces.filter((w) => w.id !== activeWorkspaceId), [activeWorkspaceId, workspaces]);
    // Health-check remote workspaces when dialog opens
    useEffect(() => {
        if (!open) {
            healthCheckAbort.current?.abort();
            return;
        }
        healthCheckAbort.current?.abort();
        const abort = new AbortController();
        healthCheckAbort.current = abort;
        const remoteTargets = targetWorkspaces.filter((w) => w.remoteServer);
        if (remoteTargets.length === 0)
            return;
        // Mark all remote as checking
        setRemoteHealthMap(() => {
            const next = new Map();
            for (const ws of remoteTargets)
                next.set(ws.id, 'checking');
            return next;
        });
        // Fire parallel checks
        for (const ws of remoteTargets) {
            window.electronAPI
                .testRemoteConnection(ws.remoteServer.url, ws.remoteServer.token)
                .then((result) => {
                if (abort.signal.aborted)
                    return;
                setRemoteHealthMap((prev) => new Map(prev).set(ws.id, result.ok ? 'ok' : 'error'));
            })
                .catch(() => {
                if (abort.signal.aborted)
                    return;
                setRemoteHealthMap((prev) => new Map(prev).set(ws.id, 'error'));
            });
        }
        return () => abort.abort();
    }, [open, targetWorkspaces]);
    const handleSend = useCallback(async () => {
        if (!selectedWorkspaceId || !activeWorkspaceId || resourceIds.length === 0)
            return;
        const targetWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);
        if (!targetWorkspace)
            return;
        setIsSending(true);
        const targetName = targetWorkspace.name;
        const { singular, plural } = RESOURCE_TYPE_LABELS[resourceType];
        const count = resourceIds.length;
        const label = count === 1 ? singular : plural;
        const mode = 'skip';
        const toastId = toast.loading(`Sending ${resourceLabel} to ${targetName}...`);
        try {
            // 1. Export the selected resource(s) from current workspace
            const exportOptions = {};
            if (resourceType === 'source')
                exportOptions.sources = resourceIds;
            else if (resourceType === 'skill')
                exportOptions.skills = resourceIds;
            else if (resourceType === 'automation')
                exportOptions.automations = resourceIds;
            const { bundle } = await window.electronAPI.exportResources(activeWorkspaceId, exportOptions);
            // 2. Import into target workspace
            let importResult;
            if (targetWorkspace.remoteServer) {
                // Remote target — use invokeOnServer
                const { url, token, remoteWorkspaceId } = targetWorkspace.remoteServer;
                importResult = (await window.electronAPI.invokeOnServer(url, token, 'resources:import', remoteWorkspaceId, bundle, mode));
            }
            else {
                // Local target — direct RPC
                importResult = await window.electronAPI.importResources(selectedWorkspaceId, bundle, mode);
            }
            // 3. Report result
            const bucketKey = resourceType === 'source'
                ? 'sources'
                : resourceType === 'skill'
                    ? 'skills'
                    : 'automations';
            const bucket = importResult[bucketKey];
            const imported = bucket?.imported?.length ?? 0;
            const skipped = bucket?.skipped?.length ?? 0;
            if (imported > 0 && skipped === 0) {
                toast.success(`Sent ${resourceLabel} to ${targetName}`, {
                    id: toastId,
                });
            }
            else if (imported > 0 && skipped > 0) {
                toast.success(`Sent ${imported} ${label}, ${skipped} already existed`, {
                    id: toastId,
                });
            }
            else if (skipped > 0) {
                toast.info(`${resourceLabel} already exists in ${targetName}`, {
                    id: toastId,
                });
            }
            else {
                toast.warning(`Nothing was sent to ${targetName}`, { id: toastId });
            }
            onOpenChange(false);
            setSelectedWorkspaceId(null);
            onTransferComplete?.();
        }
        catch (error) {
            const errorCode = error && typeof error === 'object' && 'code' in error
                ? error.code
                : undefined;
            const errorMessage = error instanceof Error ? error.message : undefined;
            const isUnsupported = errorCode === 'CHANNEL_NOT_FOUND' ||
                (errorMessage ?? '').includes('No handler for');
            const message = isUnsupported
                ? `${targetName} is running an older version that doesn't support resource import. Update the remote server and try again.`
                : (errorMessage ?? 'Unknown error');
            toast.error(`Failed to send ${label}`, {
                id: toastId,
                description: message,
            });
        }
        finally {
            setIsSending(false);
        }
    }, [
        selectedWorkspaceId,
        activeWorkspaceId,
        resourceIds,
        resourceType,
        resourceLabel,
        workspaces,
        onOpenChange,
        onTransferComplete,
    ]);
    return (_jsx(Dialog, { open: open, onOpenChange: (isOpen) => {
            if (!isSending) {
                onOpenChange(isOpen);
                if (!isOpen)
                    setSelectedWorkspaceId(null);
            }
        }, children: _jsxs(DialogContent, { className: "sm:max-w-sm", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Send, { className: "h-4 w-4" }), "Send to Workspace"] }), _jsxs(DialogDescription, { children: ["Send ", resourceLabel, " to another workspace."] })] }), _jsx("div", { className: "flex flex-col gap-1 max-h-64 overflow-y-auto py-1", children: targetWorkspaces.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground px-2 py-4 text-center", children: "No other workspaces available." })) : (targetWorkspaces.map((workspace) => {
                        const isSelected = selectedWorkspaceId === workspace.id;
                        const isRemote = !!workspace.remoteServer;
                        const healthStatus = remoteHealthMap.get(workspace.id);
                        const isDisconnected = isRemote && healthStatus === 'error';
                        const isChecking = isRemote && healthStatus === 'checking';
                        const displayName = getWorkspaceDisplayName(workspace, t);
                        return (_jsxs("button", { type: "button", disabled: isSending || isDisconnected, onClick: () => setSelectedWorkspaceId(workspace.id), className: cn('flex items-center gap-2 w-full px-2 py-2 rounded-md text-left text-sm transition-colors', 'hover:bg-foreground/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring', isSelected && 'bg-foreground/10 ring-1 ring-foreground/15', isDisconnected &&
                                'opacity-50 cursor-not-allowed hover:bg-transparent'), children: [_jsx(CrossfadeAvatar, { src: workspaceIconMap.get(workspace.id), alt: displayName, className: "h-5 w-5 rounded-full ring-1 ring-border/50 shrink-0", fallbackClassName: "bg-muted text-[10px] rounded-full", fallback: getWorkspaceInitial(workspace, t) }), _jsx("span", { className: "flex-1 truncate", children: displayName }), isRemote ? (isDisconnected ? (_jsx(CloudOff, { className: "h-3.5 w-3.5 text-muted-foreground/50 shrink-0" })) : (_jsx(Cloud, { className: cn('h-3.5 w-3.5 shrink-0', isChecking
                                        ? 'text-muted-foreground/30 animate-pulse'
                                        : 'text-muted-foreground') }))) : (_jsx(Monitor, { className: "h-3.5 w-3.5 text-muted-foreground/50 shrink-0" }))] }, workspace.id));
                    })) }), _jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: isSending, children: "Cancel" }), _jsx(Button, { onClick: handleSend, disabled: !selectedWorkspaceId || isSending, children: isSending ? 'Sending...' : 'Send' })] })] }) }));
}
//# sourceMappingURL=SendResourceToWorkspaceDialog.js.map