/**
 * Decide whether an input-affecting custom event should be handled by
 * this FreeFormInput instance.
 */
export function shouldHandleScopedInputEvent({ sessionId, isFocusedPanel, targetSessionId, }) {
    if (targetSessionId) {
        return targetSessionId === sessionId;
    }
    return isFocusedPanel;
}
//# sourceMappingURL=input-event-guards.js.map