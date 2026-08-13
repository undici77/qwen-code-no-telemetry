/**
 * Session-Scoped Tool Callback Registry
 *
 * Extracted from session-scoped-tools.ts to break the dependency between
 * the callback registry and backend adapter layers.
 *
 * The registry is a simple Map keyed by sessionId. Each backend registers
 * callbacks when a session starts and merges additional callbacks (e.g.
 * browser pane functions) as they become available.
 */
import { debug } from '../utils/debug.ts';
// Registry of callbacks keyed by sessionId
const sessionScopedToolCallbackRegistry = new Map();
/**
 * Register callbacks for a specific session
 */
export function registerSessionScopedToolCallbacks(sessionId, callbacks) {
    sessionScopedToolCallbackRegistry.set(sessionId, callbacks);
    debug('session-scoped-tools', `Registered callbacks for session ${sessionId}`);
}
/**
 * Merge additional callbacks into an existing session's callback set.
 * Used by the Electron session manager to add browser pane functions
 * after the agent has already registered its core callbacks.
 */
export function mergeSessionScopedToolCallbacks(sessionId, callbacks) {
    const existing = sessionScopedToolCallbackRegistry.get(sessionId) ?? {};
    sessionScopedToolCallbackRegistry.set(sessionId, { ...existing, ...callbacks });
    debug('session-scoped-tools', `Merged callbacks for session ${sessionId}`);
}
/**
 * Unregister callbacks for a session
 */
export function unregisterSessionScopedToolCallbacks(sessionId) {
    sessionScopedToolCallbackRegistry.delete(sessionId);
    debug('session-scoped-tools', `Unregistered callbacks for session ${sessionId}`);
}
/**
 * Get callbacks for a session
 */
export function getSessionScopedToolCallbacks(sessionId) {
    return sessionScopedToolCallbackRegistry.get(sessionId);
}
//# sourceMappingURL=session-scoped-tool-callback-registry.js.map