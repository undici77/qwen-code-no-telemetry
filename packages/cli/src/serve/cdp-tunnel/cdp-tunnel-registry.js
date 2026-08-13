/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Process-scoped registry pairing the (single) extension `/acp` reverse
 * connection with the `/cdp` endpoint for the Plan C "CDP tunnel" (issue #5626).
 *
 * The `/acp` WS layer registers an outbound `cdp_*` sink here when an extension
 * becomes the active CDP bridge; the `/cdp` endpoint looks it up to build a
 * {@link CdpReverseLink}. Single daemon = single extension = single browser, so
 * at most one bridge is held (last-writer-wins; a reconnect supersedes a stale
 * one). Mirrors `ClientMcpSenderRegistry` so both reverse channels wire the same
 * way through `server.ts`.
 */
import { writeStderrLine } from '../../utils/stdioHelpers.js';
/**
 * Holds the active extension CDP bridge for one daemon process. Inert until an
 * extension `/acp` connection registers and a `/cdp` client binds.
 */
export class CdpTunnelRegistry {
    active;
    /**
     * Register (or replace) the active extension bridge. Returns an unregister
     * callback the `/acp` WS layer calls on socket close. Last-writer-wins: a new
     * extension connection supersedes the previous bridge.
     */
    register(endpoint) {
        // Superseding an existing bridge: tell the old one's bound `/cdp` puppeteer
        // client it's gone so it closes, instead of running on against a dead
        // extension. Without this, the old and new puppeteer clients coexist —
        // violating the single-puppeteer design. `onExtensionGone` is idempotent
        // (its `dispose()` guards re-entry), and we skip a no-op re-register.
        const previous = this.active;
        if (previous && previous !== endpoint) {
            writeStderrLine(`qwen serve: /cdp tunnel — extension bridge '${endpoint.connectionId}' ` +
                `superseded the stale '${previous.connectionId}'`);
            previous.onExtensionGone?.();
        }
        this.active = endpoint;
        let unregistered = false;
        return () => {
            if (unregistered)
                return;
            unregistered = true;
            if (this.active === endpoint)
                this.active = undefined;
            // The extension `/acp` socket dropped: tell the bound `/cdp` puppeteer
            // socket so it fails fast instead of hanging on the CDP command timeout.
            endpoint.onExtensionGone?.();
        };
    }
    /** The active extension bridge, if any. */
    getActive() {
        return this.active;
    }
    /** Whether an extension bridge is currently registered. */
    hasActive() {
        return this.active !== undefined;
    }
    /**
     * Route an inbound `cdp_*` frame (from the extension `/acp` socket) to the
     * active bridge's bound reverse link. Returns true if consumed.
     */
    routeInbound(frame) {
        return this.active ? this.active.routeInbound(frame) : false;
    }
}
//# sourceMappingURL=cdp-tunnel-registry.js.map