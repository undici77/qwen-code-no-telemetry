/**
 * WS-mode preload — replaces the full IPC preload (index.ts).
 *
 * Normal mode (local server):
 *   Creates a RoutedClient that routes LOCAL_ONLY channels to the local
 *   Electron server and REMOTE_ELIGIBLE channels to whichever server owns
 *   the active workspace (local or remote). Workspace switches swap the
 *   workspace client transparently.
 *
 * Thin-client mode (CRAFT_SERVER_URL):
 *   Creates a single WsRpcClient connected to the remote server.
 *   All channels go to the remote server.
 *
 * On localhost the WS handshake completes in <1ms. The React app takes >100ms
 * to initialise, so by the time any component calls an API method, the
 * connection is established.
 */
import '@sentry/electron/preload';
import { contextBridge, ipcRenderer, shell, webUtils } from 'electron';
import { WsRpcClient } from '../transport/client';
import { RoutedClient } from '../transport/routed-client';
import { buildClientApi } from '../transport/build-api';
import { CHANNEL_MAP } from '../transport/channel-map';
import { createCallbackServer } from '@craft-agent/shared/auth/callback-server';
import { CLIENT_OPEN_EXTERNAL, CLIENT_OPEN_PATH, CLIENT_SHOW_IN_FOLDER, CLIENT_CONFIRM_DIALOG, CLIENT_OPEN_FILE_DIALOG, LOCAL_CLIENT_CAPABILITIES, } from '@craft-agent/server-core/transport';
// ---------------------------------------------------------------------------
// Connection setup
// ---------------------------------------------------------------------------
const webContentsId = ipcRenderer.sendSync('__get-web-contents-id');
const isClientOnly = !!process.env.CRAFT_SERVER_URL;
const DESKTOP_RPC_REQUEST_TIMEOUT_MS = 150_000;
let client;
if (isClientOnly) {
    // ── Thin-client mode ───────────────────────────────────────────────────
    // Single WsRpcClient connected directly to the remote server.
    // No local server, no routing — all channels go to remote.
    const wsUrl = process.env.CRAFT_SERVER_URL;
    const wsToken = process.env.CRAFT_SERVER_TOKEN ?? '';
    // Block unencrypted ws:// to non-localhost servers — tokens would be sent in cleartext
    const parsed = new URL(wsUrl);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
    if (parsed.protocol === 'ws:' && !isLocalhost) {
        throw new Error(`Refusing to connect to remote server over unencrypted ws://. ` +
            `Use wss:// (TLS) for non-localhost connections. ` +
            `Set CRAFT_RPC_TLS_CERT/KEY on the server to enable TLS.`);
    }
    // Workspace ID is optional — if missing, renderer shows a workspace picker
    const workspaceId = process.env.CRAFT_WORKSPACE_ID || ipcRenderer.sendSync('__get-workspace-id') || undefined;
    const wsClient = new WsRpcClient(wsUrl, {
        token: wsToken,
        workspaceId,
        webContentsId,
        autoReconnect: true,
        mode: 'remote',
        requestTimeout: DESKTOP_RPC_REQUEST_TIMEOUT_MS,
        clientCapabilities: [...LOCAL_CLIENT_CAPABILITIES],
    });
    wsClient.connect();
    client = wsClient;
}
else {
    // ── Normal mode ────────────────────────────────────────────────────────
    // RoutedClient routes LOCAL_ONLY to local server, REMOTE_ELIGIBLE to
    // whichever server owns the workspace (local or remote).
    const wsPort = ipcRenderer.sendSync('__get-ws-port');
    const wsToken = ipcRenderer.sendSync('__get-ws-token');
    const workspaceId = ipcRenderer.sendSync('__get-workspace-id');
    const localClient = new WsRpcClient(`ws://127.0.0.1:${wsPort}`, {
        token: wsToken,
        workspaceId,
        webContentsId,
        autoReconnect: true,
        mode: 'local',
        requestTimeout: DESKTOP_RPC_REQUEST_TIMEOUT_MS,
        clientCapabilities: [...LOCAL_CLIENT_CAPABILITIES],
    });
    // Check if the current workspace is remote (synchronous IPC during preload eval)
    const remoteConfig = ipcRenderer.sendSync('__get-workspace-remote-config');
    let initialWorkspaceClient;
    if (remoteConfig && typeof remoteConfig.url === 'string') {
        // Workspace is remote — create a direct connection to the remote server
        initialWorkspaceClient = new WsRpcClient(remoteConfig.url, {
            token: remoteConfig.token,
            workspaceId: remoteConfig.remoteWorkspaceId,
            webContentsId,
            autoReconnect: true,
            mode: 'remote',
            requestTimeout: DESKTOP_RPC_REQUEST_TIMEOUT_MS,
            clientCapabilities: [...LOCAL_CLIENT_CAPABILITIES],
            tlsRejectUnauthorized: false,
        });
        initialWorkspaceClient.connect();
    }
    else {
        // Workspace is local — workspace client IS the local client
        initialWorkspaceClient = localClient;
    }
    const routedClient = new RoutedClient(localClient, initialWorkspaceClient);
    // Set workspace ID mapping if initial workspace is remote
    if (remoteConfig) {
        routedClient.setWorkspaceMapping(workspaceId, remoteConfig.remoteWorkspaceId);
    }
    // Factory for creating remote workspace clients on switch
    routedClient.setClientFactory((remoteServer) => {
        return new WsRpcClient(remoteServer.url, {
            token: remoteServer.token,
            workspaceId: remoteServer.remoteWorkspaceId,
            webContentsId,
            autoReconnect: true,
            mode: 'remote',
            requestTimeout: DESKTOP_RPC_REQUEST_TIMEOUT_MS,
            clientCapabilities: [...LOCAL_CLIENT_CAPABILITIES],
            tlsRejectUnauthorized: false,
        });
    });
    localClient.connect();
    client = routedClient;
}
// ---------------------------------------------------------------------------
// Register client-side capability handlers (server can invoke these)
// ---------------------------------------------------------------------------
client.handleCapability(CLIENT_OPEN_EXTERNAL, (url) => shell.openExternal(url));
client.handleCapability(CLIENT_OPEN_PATH, async (path) => {
    const error = await shell.openPath(path);
    return { error: error || undefined };
});
client.handleCapability(CLIENT_SHOW_IN_FOLDER, (path) => {
    shell.showItemInFolder(path);
});
client.handleCapability(CLIENT_CONFIRM_DIALOG, async (spec) => {
    return await ipcRenderer.invoke('__dialog:showMessageBox', spec);
});
client.handleCapability(CLIENT_OPEN_FILE_DIALOG, async (spec) => {
    return await ipcRenderer.invoke('__dialog:showOpenDialog', spec);
});
// ---------------------------------------------------------------------------
// Build ElectronAPI proxy
// ---------------------------------------------------------------------------
const api = buildClientApi(client, CHANNEL_MAP, (ch) => client.isChannelAvailable(ch));
api.getRuntimeEnvironment = () => 'electron';
// ---------------------------------------------------------------------------
// Transport connection state logging (for remote connections)
// ---------------------------------------------------------------------------
function formatTransportReason(state) {
    const err = state.lastError;
    if (err) {
        const codePart = err.code ? ` [${err.code}]` : '';
        return `${err.kind}${codePart}: ${err.message}`;
    }
    if (state.lastClose?.code != null) {
        const reason = state.lastClose.reason ? ` (${state.lastClose.reason})` : '';
        return `close ${state.lastClose.code}${reason}`;
    }
    return 'no additional details';
}
// Log remote connection state changes to main process (visible in terminal + main.log).
// Activates whenever the workspace connection is remote (thin client or remote workspace).
client.onConnectionStateChanged((state) => {
    if (state.mode !== 'remote')
        return;
    const emitToMain = (level, message) => {
        ipcRenderer.send('__transport:status', {
            level,
            message,
            status: state.status,
            attempt: state.attempt,
            nextRetryInMs: state.nextRetryInMs,
            error: state.lastError,
            close: state.lastClose,
            url: state.url,
        });
    };
    if (state.status === 'connected') {
        const message = `[transport] connected to ${state.url}`;
        console.info(message);
        emitToMain('info', message);
        return;
    }
    if (state.status === 'reconnecting') {
        const retry = state.nextRetryInMs != null ? ` retry in ${state.nextRetryInMs}ms` : '';
        const message = `[transport] reconnecting (attempt ${state.attempt})${retry} — ${formatTransportReason(state)}`;
        console.warn(message);
        emitToMain('warn', message);
        return;
    }
    if (state.status === 'failed' || state.status === 'disconnected') {
        const message = `[transport] ${state.status} — ${formatTransportReason(state)}`;
        console.error(message);
        emitToMain('error', message);
    }
});
api.getTransportConnectionState = async () => client.getConnectionState();
api.onTransportConnectionStateChanged = (callback) => {
    return client.onConnectionStateChanged(callback);
};
api.reconnectTransport = async () => {
    client.reconnectNow();
};
api.getVoiceStreamUrl = () => ipcRenderer.sendSync('__get-voice-stream-url');
api.performOAuth = async (args) => {
    let callbackServer = null;
    let flowId;
    let state;
    try {
        // 1. Start local callback server to receive OAuth redirect
        callbackServer = await createCallbackServer({ appType: 'electron' });
        const callbackUrl = `${callbackServer.url}/callback`;
        // 2. Ask server to prepare the flow (PKCE, auth URL, store in flow store)
        const startResult = await client.invoke('oauth:start', {
            sourceSlug: args.sourceSlug,
            callbackUrl,
            sessionId: args.sessionId,
            authRequestId: args.authRequestId,
        });
        flowId = startResult.flowId;
        state = startResult.state;
        // 3. Open browser for user consent (local — must open on the user's machine, not remote server)
        await shell.openExternal(startResult.authUrl);
        // 4. Wait for OAuth provider to redirect to our callback server
        const callback = await callbackServer.promise;
        // 5. Check for errors from the provider
        if (callback.query.error) {
            const error = callback.query.error_description || callback.query.error;
            await client.invoke('oauth:cancel', { flowId, state });
            return { success: false, error };
        }
        const code = callback.query.code;
        if (!code) {
            await client.invoke('oauth:cancel', { flowId, state });
            return { success: false, error: 'No authorization code received' };
        }
        // 6. Send code to server for token exchange + credential storage
        const result = await client.invoke('oauth:complete', { flowId, code, state });
        return { success: result.success, error: result.error, email: result.email };
    }
    catch (err) {
        // Clean up server-side flow on error
        if (flowId && state) {
            client.invoke('oauth:cancel', { flowId, state }).catch(() => { });
        }
        return {
            success: false,
            error: err instanceof Error ? err.message : 'OAuth flow failed',
        };
    }
    finally {
        callbackServer?.close();
    }
};
api.relaunchApp = () => ipcRenderer.invoke('app:relaunch');
api.removeWorkspace = (workspaceId) => ipcRenderer.invoke('workspace:remove', workspaceId);
api.setWorkspacePinned = (workspaceId, pinned) => ipcRenderer.invoke('workspace:pinned:set', workspaceId, pinned);
api.reorderWorkspaces = (orderedIds) => ipcRenderer.invoke('workspace:reorder', orderedIds);
api.invokeOnServer = (url, token, channel, ...args) => ipcRenderer.invoke('server:invokeOnServer', url, token, channel, ...args);
api.transferSessionToWorkspace = (sessionId, targetWorkspaceId, sessionIndex, sessionCount) => ipcRenderer.invoke('session:transferToRemoteWorkspace', sessionId, targetWorkspaceId, sessionIndex, sessionCount);
api.onTransferProgress = (cb) => {
    const handler = (_e, progress) => cb(progress);
    ipcRenderer.on('transfer:progress', handler);
    return () => { ipcRenderer.removeListener('transfer:progress', handler); };
};
api.getSystemWarnings = async () => ({
    vcredistMissing: process.env.CRAFT_VCREDIST_MISSING === '1',
    downloadUrl: process.env.CRAFT_VCREDIST_URL,
});
api.changeLanguage = (lang) => ipcRenderer.invoke('i18n:changeLanguage', lang);
api.getFilePath = (file) => {
    try {
        return webUtils.getPathForFile(file) || null;
    }
    catch {
        return null;
    }
};
contextBridge.exposeInMainWorld('electronAPI', api);
//# sourceMappingURL=bootstrap.js.map