/**
 * Best-effort rollback when branch creation fails during backend preflight.
 * Ensures no orphan child session remains in memory or persistent storage.
 */
export async function rollbackFailedBranchCreation(params) {
    const { managed, workspaceRootPath, sessionId, deleteFromRuntimeSessions, deleteStoredSession } = params;
    try {
        managed.agent?.destroy?.();
    }
    catch {
        // Best-effort cleanup
    }
    managed.agent = null;
    if (managed.poolServer) {
        try {
            managed.poolServer.stop?.();
        }
        catch {
            // Best-effort cleanup
        }
        managed.poolServer = undefined;
    }
    deleteFromRuntimeSessions(sessionId);
    try {
        await deleteStoredSession(workspaceRootPath, sessionId);
    }
    catch {
        // Best-effort rollback: runtime cleanup is the critical path.
    }
}
//# sourceMappingURL=session-branch-cleanup.js.map