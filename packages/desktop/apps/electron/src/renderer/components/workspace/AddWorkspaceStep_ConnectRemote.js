import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle, XCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { AddWorkspaceContainer, AddWorkspaceStepHeader, AddWorkspacePrimaryButton, AddWorkspaceSecondaryButton } from "./primitives";
const CREATE_NEW_VALUE = '__create_new__';
/**
 * Resolve a unique local workspace slug by appending suffixes if needed.
 * Tries: baseName → baseName-remote → baseName-2 → baseName-3 → ...
 */
async function resolveUniqueSlug(baseName) {
    const baseSlug = slugify(baseName);
    if (!baseSlug)
        return { slug: 'remote', path: '' };
    let slug = baseSlug;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const result = await window.electronAPI.checkWorkspaceSlug(slug);
        if (!result.exists) {
            return { slug, path: result.path };
        }
        attempt++;
        slug = attempt === 1 ? `${baseSlug}-remote` : `${baseSlug}-${attempt}`;
        if (attempt > 20) {
            // Safety valve — shouldn't happen in practice
            return { slug: `${baseSlug}-${Date.now()}`, path: result.path.replace(baseSlug, `${baseSlug}-${Date.now()}`) };
        }
    }
}
/**
 * AddWorkspaceStep_ConnectRemote - Connect to a remote Qwen Code Server
 *
 * Two paths:
 * 1. Connect to existing workspace — select from dropdown, no name needed, auto-resolve local slug
 * 2. Create new workspace — type a name, creates on server, then connects
 */
export function AddWorkspaceStep_ConnectRemote({ onBack, onCreate, isCreating, initialUrl, initialToken, reconnectWorkspace, onUpdate, }) {
    const { t } = useTranslation();
    const isReconnectMode = !!reconnectWorkspace;
    const [serverUrl, setServerUrl] = useState(initialUrl ?? '');
    const [token, setToken] = useState(initialToken ?? '');
    const [homeDir, setHomeDir] = useState('');
    const [testState, setTestState] = useState('idle');
    const [testError, setTestError] = useState(null);
    const [remoteWorkspaces, setRemoteWorkspaces] = useState([]);
    const [selectedValue, setSelectedValue] = useState(null); // workspace ID or CREATE_NEW_VALUE
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [serverVersion, setServerVersion] = useState(null);
    const selectPortalRef = useRef(null);
    useEffect(() => {
        window.electronAPI.getHomeDir().then(setHomeDir);
    }, []);
    const isCreateNew = selectedValue === CREATE_NEW_VALUE;
    const selectedWorkspace = !isCreateNew ? remoteWorkspaces.find(w => w.id === selectedValue) : null;
    // Fresh server (no workspaces at all) — always in create mode
    const isFreshServer = testState === 'ok' && remoteWorkspaces.length === 0;
    // Reset test state when URL or token changes
    useEffect(() => {
        setTestState('idle');
        setTestError(null);
        setRemoteWorkspaces([]);
        setSelectedValue(null);
        setNewWorkspaceName('');
    }, [serverUrl, token]);
    const handleTestConnection = useCallback(async () => {
        if (!serverUrl || !token)
            return;
        setTestState('testing');
        setTestError(null);
        try {
            const result = await window.electronAPI.testRemoteConnection(serverUrl, token);
            console.log('[ConnectRemote] testRemoteConnection result:', JSON.stringify(result, null, 2));
            if (result.ok) {
                setTestState('ok');
                setServerVersion(result.serverVersion ?? null);
                if (result.needsWorkspace) {
                    // Fresh server — no workspaces, go straight to create mode
                    setRemoteWorkspaces([]);
                    setSelectedValue(null);
                }
                else {
                    const workspaces = result.remoteWorkspaces ?? [];
                    setRemoteWorkspaces(workspaces);
                    if (workspaces.length === 1) {
                        setSelectedValue(workspaces[0].id);
                    }
                }
            }
            else {
                setTestState('error');
                setTestError(result.error || 'Connection failed');
            }
        }
        catch (err) {
            setTestState('error');
            setTestError(err instanceof Error ? err.message : 'Connection failed');
        }
    }, [serverUrl, token]);
    const handleConnect = useCallback(async () => {
        if (!serverUrl || !token)
            return;
        // Reconnect mode — update existing workspace config
        if (isReconnectMode && onUpdate) {
            try {
                await onUpdate(reconnectWorkspace.id, {
                    url: serverUrl,
                    token,
                    remoteWorkspaceId: reconnectWorkspace.remoteWorkspaceId,
                });
                return;
            }
            catch (err) {
                setTestState('error');
                setTestError(err instanceof Error ? err.message : 'Failed to reconnect workspace');
                return;
            }
        }
        if (!homeDir)
            return;
        const defaultBasePath = `${homeDir}/.craft-agent/workspaces`;
        if (isCreateNew || isFreshServer) {
            // Create new workspace on remote server via direct RPC, then connect locally
            const name = newWorkspaceName.trim();
            if (!name)
                return;
            try {
                const created = await window.electronAPI.invokeOnServer(serverUrl, token, 'server:createWorkspace', name);
                const { slug, path } = await resolveUniqueSlug(name);
                const finalPath = path || `${defaultBasePath}/${slug}`;
                await onCreate(finalPath, name, { url: serverUrl, token, remoteWorkspaceId: created.id });
            }
            catch (err) {
                setTestState('error');
                setTestError(err instanceof Error ? err.message : 'Failed to create workspace on remote server');
                return;
            }
        }
        else if (selectedWorkspace) {
            // Connect to existing workspace — auto-resolve local slug
            const { slug, path } = await resolveUniqueSlug(selectedWorkspace.name);
            const finalPath = path || `${defaultBasePath}/${slug}`;
            await onCreate(finalPath, selectedWorkspace.name, { url: serverUrl, token, remoteWorkspaceId: selectedWorkspace.id });
        }
    }, [serverUrl, token, homeDir, isCreateNew, isFreshServer, newWorkspaceName, selectedWorkspace, onCreate, isReconnectMode, onUpdate, reconnectWorkspace]);
    const canConnect = testState === 'ok' && !isCreating && (isReconnectMode ? true :
        (isFreshServer || isCreateNew) ? !!newWorkspaceName.trim() : !!selectedWorkspace);
    const showCreateMode = !isReconnectMode && (isCreateNew || isFreshServer);
    const buttonLabel = isReconnectMode ? 'Reconnect' : showCreateMode ? 'Create and Connect' : 'Connect';
    const buttonLoadingLabel = isReconnectMode ? 'Reconnecting...' : showCreateMode ? 'Creating...' : 'Connecting...';
    return (_jsxs(AddWorkspaceContainer, { children: [_jsxs("button", { onClick: onBack, disabled: isCreating, className: cn("self-start flex items-center gap-1 text-sm text-muted-foreground", "hover:text-foreground transition-colors mb-4", isCreating && "opacity-50 cursor-not-allowed"), children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Back"] }), _jsx(AddWorkspaceStepHeader, { title: isReconnectMode ? t("workspace.reconnect", { name: reconnectWorkspace.name }) : "Connect to remote server", description: isReconnectMode
                    ? "Update the server URL or token to restore the connection."
                    : "Connect to a remote Qwen Code Server for this workspace." }), _jsxs("div", { className: "mt-6 w-full space-y-5", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-foreground", children: "Server URL" }), _jsx("div", { className: "bg-background shadow-minimal rounded-lg", children: _jsx(Input, { value: serverUrl, onChange: (e) => setServerUrl(e.target.value), placeholder: "ws://192.168.1.100:9100", disabled: isCreating, autoFocus: true, className: "border-0 bg-transparent shadow-none font-mono text-sm" }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-foreground", children: "Token" }), _jsx("div", { className: "bg-background shadow-minimal rounded-lg", children: _jsx(Input, { type: "password", value: token, onChange: (e) => setToken(e.target.value), placeholder: t("workspace.serverAuthToken"), disabled: isCreating, className: "border-0 bg-transparent shadow-none" }) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AddWorkspaceSecondaryButton, { onClick: handleTestConnection, disabled: !serverUrl || !token || testState === 'testing' || isCreating, children: testState === 'testing' ? 'Testing...' : 'Test Connection' }), testState === 'ok' && !isFreshServer && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-green-600 dark:text-green-400", children: [_jsx(CheckCircle, { className: "h-3.5 w-3.5" }), "Connected", serverVersion ? ` — v${serverVersion}` : ''] })), testState === 'ok' && isFreshServer && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-green-600 dark:text-green-400", children: [_jsx(CheckCircle, { className: "h-3.5 w-3.5" }), "Connected", serverVersion ? ` — v${serverVersion}` : '', " \u2014 no workspaces yet"] })), testState === 'error' && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-destructive", children: [_jsx(XCircle, { className: "h-3.5 w-3.5" }), testError || 'Failed'] }))] }), testState === 'ok' && !serverVersion && (_jsxs("div", { className: "flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-400", children: [_jsx(XCircle, { className: "h-3.5 w-3.5 shrink-0 mt-0.5" }), _jsx("span", { children: t("workspace.olderServerWarning") })] })), _jsx("div", { ref: selectPortalRef }), !isReconnectMode && testState === 'ok' && remoteWorkspaces.length > 0 && !isCreateNew && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-foreground", children: "Workspace" }), _jsx("div", { className: "bg-background shadow-minimal rounded-lg", children: _jsxs(Select, { value: selectedValue ?? '', onValueChange: setSelectedValue, disabled: isCreating, children: [_jsx(SelectTrigger, { className: "border-0 bg-transparent shadow-none", children: _jsx(SelectValue, { placeholder: t("workspace.selectWorkspacePlaceholder") }) }), _jsx(SelectContent, { container: selectPortalRef.current, children: remoteWorkspaces.map(ws => (_jsx(SelectItem, { value: ws.id, children: ws.name }, ws.id))) })] }) }), _jsxs("button", { type: "button", onClick: () => setSelectedValue(CREATE_NEW_VALUE), disabled: isCreating, className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors", children: [_jsx(Plus, { className: "h-3 w-3" }), "Create new workspace on server"] })] })), !isReconnectMode && testState === 'ok' && showCreateMode && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-foreground", children: "Workspace name" }), _jsx("div", { className: "bg-background shadow-minimal rounded-lg", children: _jsx(Input, { value: newWorkspaceName, onChange: (e) => setNewWorkspaceName(e.target.value), placeholder: t("workspace.myRemoteWorkspace"), disabled: isCreating, className: "border-0 bg-transparent shadow-none" }) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "A workspace will be created on the remote server with this name." }), isCreateNew && remoteWorkspaces.length > 0 && (_jsxs("button", { type: "button", onClick: () => {
                                    setSelectedValue(remoteWorkspaces.length === 1 ? remoteWorkspaces[0].id : null);
                                    setNewWorkspaceName('');
                                }, disabled: isCreating, className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors", children: [_jsx(ArrowLeft, { className: "h-3 w-3" }), "Use existing workspace"] }))] })), _jsx(AddWorkspacePrimaryButton, { onClick: handleConnect, disabled: !canConnect, loading: isCreating, loadingText: buttonLoadingLabel, children: buttonLabel })] })] }));
}
//# sourceMappingURL=AddWorkspaceStep_ConnectRemote.js.map