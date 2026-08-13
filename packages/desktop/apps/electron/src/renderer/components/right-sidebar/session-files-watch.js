export async function restoreSessionFileWatch(sessionId, reloadFiles) {
    try {
        await window.electronAPI.watchSessionFiles(sessionId);
    }
    catch (error) {
        console.error(`[SessionFiles] Failed to restore file watch for ${sessionId}:`, error);
    }
    try {
        await reloadFiles();
    }
    catch (error) {
        console.error(`[SessionFiles] Failed to reload files for ${sessionId} after reconnect:`, error);
    }
}
//# sourceMappingURL=session-files-watch.js.map