/**
 * useLabels Hook
 *
 * React hook to load and manage workspace labels.
 * Returns the label tree (nested structure with children) from config.
 * Also exposes a flattened version for components that need flat lookups.
 * Auto-refreshes when workspace changes or label config changes.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { flattenLabels } from '@craft-agent/shared/labels';
/**
 * Load labels for a workspace via IPC.
 * Returns the tree structure (labels with nested children).
 * Auto-refreshes when workspaceId changes.
 * Subscribes to live label config changes via LABELS_CHANGED event.
 */
export function useLabels(workspaceId) {
    const [labels, setLabels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Memoized flat version of the tree for lookups
    const flatLabels = useMemo(() => flattenLabels(labels), [labels]);
    const refresh = useCallback(async () => {
        if (!workspaceId) {
            setLabels([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const configs = await window.electronAPI.listLabels(workspaceId);
            setLabels(configs);
            setError(null);
        }
        catch (err) {
            console.error('[useLabels] Failed to load labels:', err);
            setError(err instanceof Error ? err.message : 'Failed to load labels');
        }
        finally {
            setIsLoading(false);
        }
    }, [workspaceId]);
    // Load labels when workspace changes
    useEffect(() => {
        refresh();
    }, [refresh]);
    // Subscribe to live label changes (config file changes)
    useEffect(() => {
        if (!workspaceId)
            return;
        const cleanup = window.electronAPI.onLabelsChanged((changedWorkspaceId) => {
            // Only refresh if this is our workspace
            if (changedWorkspaceId === workspaceId) {
                refresh();
            }
        });
        return cleanup;
    }, [workspaceId, refresh]);
    return {
        labels,
        flatLabels,
        isLoading,
        error,
        refresh,
    };
}
//# sourceMappingURL=useLabels.js.map