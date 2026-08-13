export async function releaseBrowserOwnershipOnForcedStop(browserPaneManager, sessionId) {
    if (!browserPaneManager)
        return;
    await browserPaneManager.clearVisualsForSession(sessionId);
    browserPaneManager.unbindAllForSession(sessionId);
}
//# sourceMappingURL=session-browser-release.js.map