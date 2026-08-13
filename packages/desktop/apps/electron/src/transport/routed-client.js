/**
 * RoutedClient — client-side channel router.
 *
 * Wraps two WsRpcClient instances: localClient (always the embedded Electron
 * server) and workspaceClient (whichever server owns the active workspace).
 *
 * - LOCAL_ONLY channels always route to localClient
 * - Everything else routes to workspaceClient
 * - On workspace switch, workspaceClient is swapped and REMOTE_ELIGIBLE
 *   listeners are re-subscribed transparently (make-before-break)
 */
import { isLocalOnly, RPC_CHANNELS } from '@craft-agent/shared/protocol';
// ---------------------------------------------------------------------------
// RoutedClient
// ---------------------------------------------------------------------------
export class RoutedClient {
    localClient;
    workspaceClient;
    /** REMOTE_ELIGIBLE listener registry — survives workspace switches. */
    remoteListeners = new Map();
    /** Capability handlers — re-registered on workspace switch. */
    capabilities = new Map();
    /** Connection state listeners (delegates to workspaceClient). */
    connectionStateListeners = new Set();
    connectionStateUnsub = null;
    /** Factory for creating remote workspace clients on switch. */
    clientFactory = null;
    /**
     * Workspace ID mapping — translates local workspace IDs to remote ones.
     * When set, REMOTE_ELIGIBLE invoke() calls replace the local ID in
     * arguments with the remote ID so the server can resolve the workspace.
     */
    workspaceIdMapping = null;
    constructor(localClient, initialWorkspaceClient) {
        this.localClient = localClient;
        this.workspaceClient = initialWorkspaceClient;
        this.bindConnectionState();
    }
    /** Set factory for creating remote workspace clients. */
    setClientFactory(factory) {
        this.clientFactory = factory;
    }
    /**
     * Set workspace ID mapping for remote workspaces.
     * When a remote workspace is active, RPC calls pass the local workspace ID
     * as arguments, but the remote server only knows its own workspace IDs.
     * This mapping translates local → remote in invoke() arguments.
     */
    setWorkspaceMapping(localId, remoteId) {
        this.workspaceIdMapping = { localId, remoteId };
    }
    /** Clear workspace ID mapping (when switching to a local workspace). */
    clearWorkspaceMapping() {
        this.workspaceIdMapping = null;
    }
    // -------------------------------------------------------------------------
    // RpcClient interface
    // -------------------------------------------------------------------------
    async invoke(channel, ...args) {
        const isLocal = isLocalOnly(channel);
        const target = isLocal ? this.localClient : this.workspaceClient;
        // Translate local workspace IDs → remote workspace IDs for remote-routed calls.
        // RPC handlers receive workspaceId as a method argument (not from connection context).
        // When routing to a remote server, the renderer's local workspace ID must be replaced
        // with the server's workspace ID so the handler can resolve the workspace.
        // Handles both top-level string args (e.g., getSkills(workspaceId)) and
        // object args with a workspaceId property (e.g., testAutomation({ workspaceId, ... })).
        const translatedArgs = (!isLocal && this.workspaceIdMapping)
            ? args.map(arg => {
                if (arg === this.workspaceIdMapping.localId)
                    return this.workspaceIdMapping.remoteId;
                if (arg && typeof arg === 'object' && 'workspaceId' in arg && arg.workspaceId === this.workspaceIdMapping.localId) {
                    return { ...arg, workspaceId: this.workspaceIdMapping.remoteId };
                }
                return arg;
            })
            : args;
        const result = await target.invoke(channel, ...translatedArgs);
        // Intercept SWITCH_WORKSPACE response to swap workspace client
        if (channel === RPC_CHANNELS.window.SWITCH_WORKSPACE) {
            this.handleWorkspaceSwitch(result);
        }
        return result;
    }
    on(channel, callback) {
        if (isLocalOnly(channel)) {
            return this.localClient.on(channel, callback);
        }
        // REMOTE_ELIGIBLE — subscribe on workspaceClient and track for re-subscription
        const unsub = this.workspaceClient.on(channel, callback);
        let set = this.remoteListeners.get(channel);
        if (!set) {
            set = new Set();
            this.remoteListeners.set(channel, set);
        }
        const entry = { callback, unsub };
        set.add(entry);
        return () => {
            entry.unsub();
            set.delete(entry);
            if (set.size === 0)
                this.remoteListeners.delete(channel);
        };
    }
    handleCapability(channel, handler) {
        this.capabilities.set(channel, handler);
        // Register on both clients — either server can invoke capabilities
        this.localClient.handleCapability(channel, handler);
        if (this.workspaceClient !== this.localClient) {
            this.workspaceClient.handleCapability(channel, handler);
        }
    }
    // -------------------------------------------------------------------------
    // Extended interface (used by bootstrap / build-api)
    // -------------------------------------------------------------------------
    isChannelAvailable(channel) {
        const target = isLocalOnly(channel) ? this.localClient : this.workspaceClient;
        return target.isChannelAvailable(channel);
    }
    getConnectionState() {
        return this.workspaceClient.getConnectionState();
    }
    onConnectionStateChanged(callback) {
        this.connectionStateListeners.add(callback);
        callback(this.getConnectionState());
        return () => { this.connectionStateListeners.delete(callback); };
    }
    reconnectNow() {
        this.workspaceClient.reconnectNow();
    }
    // -------------------------------------------------------------------------
    // Workspace switch
    // -------------------------------------------------------------------------
    handleWorkspaceSwitch(result) {
        if (!result)
            return;
        if (result.remoteServer && this.clientFactory) {
            // Remote workspace — set up ID mapping and create + connect new client
            this.setWorkspaceMapping(result.workspaceId, result.remoteServer.remoteWorkspaceId);
            const newClient = this.clientFactory(result.remoteServer);
            newClient.connect();
            this.swapWorkspaceClient(newClient);
        }
        else if (!result.remoteServer && this.workspaceClient !== this.localClient) {
            // Switching to local workspace — clear mapping and revert to local client
            this.clearWorkspaceMapping();
            this.swapWorkspaceClient(this.localClient);
        }
    }
    swapWorkspaceClient(newClient) {
        const old = this.workspaceClient;
        this.workspaceClient = newClient;
        // Re-register capabilities on new client
        for (const [channel, handler] of this.capabilities) {
            newClient.handleCapability(channel, handler);
        }
        // Re-subscribe REMOTE_ELIGIBLE listeners (make-before-break:
        // subscribe on new first, then unsubscribe from old)
        for (const [channel, entries] of this.remoteListeners) {
            for (const entry of entries) {
                const oldUnsub = entry.unsub;
                entry.unsub = newClient.on(channel, entry.callback);
                oldUnsub();
            }
        }
        // Rebind connection state delegation
        this.bindConnectionState();
        // Destroy old client (unless it's the local client or same as new)
        if (old !== this.localClient && old !== newClient) {
            old.destroy();
        }
        // Emit synthetic stale reconnect once the new client connects.
        // Workspace switches create a brand-new client (not a reconnect), so
        // __transport:reconnected never fires naturally. This triggers the App's
        // stale recovery logic to refresh sessions that changed while no client
        // was watching this workspace.
        if (newClient !== this.localClient) {
            const unsub = newClient.onConnectionStateChanged((state) => {
                if (state.status === 'connected') {
                    unsub();
                    newClient.emitReconnected(true);
                }
            });
        }
    }
    bindConnectionState() {
        this.connectionStateUnsub?.();
        this.connectionStateUnsub = this.workspaceClient.onConnectionStateChanged((state) => {
            const snapshot = { ...state };
            for (const cb of this.connectionStateListeners) {
                try {
                    cb(snapshot);
                }
                catch { /* listener errors must not break transport */ }
            }
        });
    }
}
//# sourceMappingURL=routed-client.js.map