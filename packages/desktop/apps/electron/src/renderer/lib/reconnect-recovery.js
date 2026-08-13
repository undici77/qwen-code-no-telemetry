export function getSessionsToRefreshAfterStaleReconnect(metaMap, activeSessionId) {
    const refreshIds = new Set();
    if (activeSessionId) {
        refreshIds.add(activeSessionId);
    }
    for (const [sessionId, meta] of metaMap) {
        if (meta.isProcessing) {
            refreshIds.add(sessionId);
        }
    }
    return [...refreshIds];
}
//# sourceMappingURL=reconnect-recovery.js.map