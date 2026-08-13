/**
 * useStatuses Hook
 *
 * React hook to load and manage workspace statuses.
 * Auto-refreshes when workspace changes.
 */
import { useState, useEffect, useCallback } from 'react';
import { clearIconCache } from '@/config/session-status-config';
/**
 * Load statuses for a workspace via IPC
 * Auto-refreshes when workspaceId changes
 *
 * To detect agent edits to status config files, you could:
 * - Poll periodically (simple)
 * - Use file watcher in main process (more complex but real-time)
 */
export function useStatuses(workspaceId) {
    const [statuses, setStatuses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!workspaceId) {
            setStatuses([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const configs = await window.electronAPI.listStatuses(workspaceId);
            setStatuses(configs);
            setError(null);
        }
        catch (err) {
            console.error('[useStatuses] Failed to load statuses:', err);
            setError(err instanceof Error ? err.message : 'Failed to load statuses');
        }
        finally {
            setIsLoading(false);
        }
    }, [workspaceId]);
    // Load statuses when workspace changes
    useEffect(() => {
        refresh();
    }, [refresh]);
    // Subscribe to live status changes (config or icon file changes)
    useEffect(() => {
        if (!workspaceId)
            return;
        const cleanup = window.electronAPI.onStatusesChanged((changedWorkspaceId) => {
            // Only refresh if this is our workspace
            if (changedWorkspaceId === workspaceId) {
                clearIconCache(); // Clear cached icon files before refreshing
                refresh();
            }
        });
        return cleanup;
    }, [workspaceId, refresh]);
    return {
        statuses,
        isLoading,
        error,
        refresh,
    };
}
//# sourceMappingURL=useStatuses.js.map