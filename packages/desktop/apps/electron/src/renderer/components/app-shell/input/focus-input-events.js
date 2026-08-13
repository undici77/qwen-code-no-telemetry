let pendingFocusSessionId = null;
/**
 * Queue a targeted focus request so newly-mounted inputs can consume it
 * after a session switch race (e.g., SessionList Enter).
 */
export function queuePendingFocusForSession(sessionId) {
    if (!sessionId)
        return;
    pendingFocusSessionId = sessionId;
}
/**
 * Dispatch the global focus-input event with optional session scoping.
 * Also stores a pending target to survive session switch timing races.
 */
export function dispatchFocusInputEvent(detail = {}) {
    queuePendingFocusForSession(detail.sessionId);
    window.dispatchEvent(new CustomEvent('craft:focus-input', { detail }));
}
/**
 * Consume queued focus request for a specific session. Returns true when consumed.
 */
export function consumePendingFocusForSession(sessionId) {
    if (!sessionId || pendingFocusSessionId !== sessionId)
        return false;
    pendingFocusSessionId = null;
    return true;
}
/** Clear queued focus for a session if present. */
export function clearPendingFocusForSession(sessionId) {
    if (!sessionId)
        return;
    if (pendingFocusSessionId === sessionId) {
        pendingFocusSessionId = null;
    }
}
/** Test-only reset helper. */
export function __resetPendingFocusForTests() {
    pendingFocusSessionId = null;
}
//# sourceMappingURL=focus-input-events.js.map