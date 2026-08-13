/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { CLIENT_MCP_OVER_WS_CONFIG_FLAG, } from '@qwen-code/acp-bridge/bridgeTypes';
/**
 * Process-scoped registry mapping an advertised client-hosted MCP server name
 * to the WS connection's `sendSdkMcpMessage`. One instance per daemon, shared
 * by the bridge (read side, via {@link ClientMcpSenderRegistry.lookup}) and the
 * WS provider (write side).
 *
 * Server names are unique per daemon: the WS layer rejects a second
 * `mcp_register` for a name on the same connection (`already_registered`), and
 * the bridge's `addRuntimeMcpServer` reconciles a cross-connection collision by
 * replacing the runtime server. `set` therefore last-writer-wins; the matching
 * `addRuntimeMcpServer` already tore down the prior server's transport.
 *
 * Each entry remembers its OWNER (the registering connection's stable client
 * id). `delete` is ownership-scoped: a disconnecting connection only removes
 * the entry if it still owns it. Otherwise connection A's teardown could delete
 * a same-named entry that connection B re-registered after A — silently
 * breaking B's live tools.
 */
export class ClientMcpSenderRegistry {
    senders = new Map();
    sessionSenders = new Map();
    sessionScopedServerNames = new Set();
    /**
     * Record a server's WS sender, owned by `owner` (the registering
     * connection's stable client id). Idempotent; last writer wins and takes
     * ownership, so the new owner's `delete` is the one that takes effect.
     */
    set(serverName, sender, owner) {
        this.senders.set(serverName, { sender, owner });
    }
    /**
     * Forget a server's WS sender — but only when `owner` still owns the entry.
     * Idempotent. The ownership guard stops a disconnecting connection from
     * clobbering an entry a later connection re-registered under the same name.
     */
    delete(serverName, owner) {
        if (this.senders.get(serverName)?.owner === owner) {
            this.senders.delete(serverName);
        }
    }
    /** Whether `owner` currently owns the entry for `serverName`. */
    owns(serverName, owner) {
        return this.senders.get(serverName)?.owner === owner;
    }
    setSession(serverName, sessionId, sender, owner) {
        let bySession = this.sessionSenders.get(serverName);
        if (!bySession) {
            bySession = new Map();
            this.sessionSenders.set(serverName, bySession);
        }
        bySession.set(sessionId, { sender, owner });
        this.sessionScopedServerNames.add(serverName);
    }
    ownsSession(serverName, sessionId, owner) {
        return this.sessionSenders.get(serverName)?.get(sessionId)?.owner === owner;
    }
    deleteSession(serverName, sessionId, owner) {
        const bySession = this.sessionSenders.get(serverName);
        if (bySession?.get(sessionId)?.owner !== owner)
            return false;
        bySession.delete(sessionId);
        if (bySession.size === 0) {
            this.sessionSenders.delete(serverName);
        }
        return true;
    }
    /** Currently-registered server names (tests / accounting). */
    serverNames() {
        return [...this.senders.keys()];
    }
    /**
     * The {@link ClientMcpMessageSender} the bridge consumes. Returns a
     * `(payload) => Promise<payload>` bound to the named server, or `undefined`
     * when no client currently hosts it. The bridge passes a `JSONRPCMessage` as
     * `payload`; we keep the public type `unknown` to match the bridge's
     * SDK-free contract.
     */
    lookup = (serverName) => {
        const entry = this.senders.get(serverName);
        const sessionEntries = this.sessionSenders.get(serverName);
        if (!entry && !sessionEntries)
            return undefined;
        return (payload, context) => {
            if (context?.sessionId) {
                const sessionEntry = sessionEntries?.get(context.sessionId);
                if (sessionEntry)
                    return sessionEntry.sender(payload);
                if (this.sessionScopedServerNames.has(serverName)) {
                    return Promise.reject(new Error(`No session-scoped MCP sender for '${serverName}' in session '${context.sessionId}'.`));
                }
            }
            if (this.sessionScopedServerNames.has(serverName)) {
                return Promise.reject(new Error(`Session-scoped MCP server '${serverName}' requires a session context.`));
            }
            if (!entry) {
                return Promise.reject(new Error(`No client MCP sender for '${serverName}'.`));
            }
            return entry.sender(serverName, payload);
        };
    };
}
/**
 * Build the `ClientMcpServerProvider` the WS connection injects. Wires the
 * per-connection registrar's sender into the shared registry and drives the
 * child-side runtime MCP add/remove through the bridge.
 *
 * @param registry shared process-scoped sender registry (also passed to the
 *        bridge as `clientMcpSender`).
 * @param bridge the live ACP bridge (add/remove runtime MCP server).
 * @param originatorClientId stable client id for this WS connection — used as
 *        the runtime-MCP mutation originator (audit / event attribution).
 */
export function createClientMcpServerProvider(registry, bridge, originatorClientId) {
    return {
        async registerClientMcpServer(serverName, sendSdkMcpMessage) {
            // Record the sender FIRST so the child's discovery handshake — which the
            // bridge add triggers synchronously — can route `client_mcp/message`
            // frames back to this WS. Owned by this connection's client id so a peer
            // re-registering the same name can't be deleted by our teardown.
            registry.set(serverName, sendSdkMcpMessage, originatorClientId);
            try {
                const runtimeConfig = {
                    // SDK-type so the child binds `SdkControlClientTransport`
                    // (`isSdkMcpServerConfig`); the flag tells the child to KEEP the
                    // type and bind `sendSdkMcpMessage` to the reverse ext-method.
                    type: 'sdk',
                    [CLIENT_MCP_OVER_WS_CONFIG_FLAG]: true,
                };
                const result = await bridge.addRuntimeMcpServer(serverName, runtimeConfig, originatorClientId);
                if (result.skipped) {
                    registry.delete(serverName, originatorClientId);
                    throw new Error(`runtime MCP add skipped: ${result.reason ?? 'unknown'}`);
                }
                // Refuse to let a browser-hosted client shadow a server the user
                // configured in settings: the runtime overlay would otherwise reroute
                // that server's discovery and tool calls back through this WS client.
                // Roll back the child-side add (the catch below drops the sender route).
                if (result.shadowedSettings) {
                    await bridge
                        .removeRuntimeMcpServer(serverName, originatorClientId)
                        .catch(() => { });
                    throw new Error(`client MCP server '${serverName}' conflicts with a configured MCP server`);
                }
                return { toolCount: result.toolCount };
            }
            catch (err) {
                // Roll back the sender on any failure so a half-registered name can't
                // leak a dangling route.
                registry.delete(serverName, originatorClientId);
                throw err;
            }
        },
        async unregisterClientMcpServer(serverName) {
            // Only tear down if THIS connection still owns the route. A later
            // connection may have re-registered the same name (last-writer-wins), and
            // `Config.removeRuntimeMcpServer` is NOT owner-scoped — removing the
            // child server by name alone would kill the newer owner's live tools.
            if (!registry.owns(serverName, originatorClientId))
                return;
            registry.delete(serverName, originatorClientId);
            // Best-effort: drop the child-side runtime server too. Idempotent on the
            // bridge (`not_present` skip).
            await bridge
                .removeRuntimeMcpServer(serverName, originatorClientId)
                .catch(() => { });
        },
    };
}
//# sourceMappingURL=client-mcp-sender-registry.js.map