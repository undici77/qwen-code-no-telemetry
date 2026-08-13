/**
 * OAuthFlowStore — in-memory store for pending OAuth flows.
 *
 * Lives server-side. Never serialized, never sent to clients.
 * Keyed by `state` (CSRF token) for O(1) lookup on oauth:complete.
 * 5-minute TTL with lazy + periodic cleanup.
 */
const FLOW_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // sweep every minute
export class OAuthFlowStore {
    flows = new Map();
    cleanupTimer = null;
    constructor() {
        this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    }
    store(flow) {
        this.flows.set(flow.state, flow);
    }
    getByState(state) {
        const flow = this.flows.get(state);
        if (!flow)
            return null;
        // Check expiry lazily
        if (Date.now() > flow.expiresAt) {
            this.flows.delete(state);
            return null;
        }
        return flow;
    }
    remove(state) {
        this.flows.delete(state);
    }
    /** Prune expired entries. Called on interval + lazily on access. */
    cleanup() {
        const now = Date.now();
        for (const [state, flow] of this.flows) {
            if (now > flow.expiresAt) {
                this.flows.delete(state);
            }
        }
    }
    /** Stop the periodic cleanup timer (for graceful shutdown). */
    dispose() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.flows.clear();
    }
    /** Number of pending flows (for diagnostics). */
    get size() {
        return this.flows.size;
    }
}
/**
 * Create a PendingOAuthFlow with default TTL.
 * Convenience helper used by the oauth:start handler.
 */
export function createPendingFlow(params) {
    const now = Date.now();
    return {
        ...params,
        createdAt: now,
        expiresAt: now + FLOW_TTL_MS,
    };
}
//# sourceMappingURL=oauth-flow-store.js.map