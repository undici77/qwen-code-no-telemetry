import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useSessions, useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
import { getSessionCatalogQueryKey, getSessionCatalogStore, } from './session-catalog-store';
const EMPTY_SNAPSHOTS = [];
const EMPTY_QUERIES = [];
export function useSessionCatalogQuery(client, query, options = {}) {
    const { autoLoad = false, enabled = true, maxAgeMs, pollIntervalMs, } = options;
    const store = useMemo(() => getSessionCatalogStore(client), [client]);
    const queryKey = query ? getSessionCatalogQueryKey(query) : undefined;
    const stableQueryRef = useRef({});
    if (stableQueryRef.current.key !== queryKey) {
        stableQueryRef.current = { key: queryKey, query };
    }
    const stableQuery = stableQueryRef.current.query;
    const subscribe = useCallback((listener) => {
        if (!enabled || !stableQuery)
            return () => undefined;
        return store.subscribe(stableQuery, listener, {
            autoLoad,
            ...(maxAgeMs !== undefined ? { maxAgeMs } : {}),
            ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
        });
    }, [autoLoad, enabled, maxAgeMs, pollIntervalMs, stableQuery, store]);
    const getSnapshot = useCallback(() => enabled && stableQuery
        ? store.getSnapshot(stableQuery)
        : store.getEmptySnapshot(), [enabled, stableQuery, store]);
    const getServerSnapshot = useCallback(() => store.getEmptySnapshot(), [store]);
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const reload = useCallback(() => {
        if (!enabled || !stableQuery)
            return Promise.resolve(undefined);
        return store.refresh(stableQuery);
    }, [enabled, stableQuery, store]);
    return {
        ...snapshot,
        sessions: snapshot.page?.sessions ?? [],
        nextCursor: snapshot.page?.nextCursor,
        liveMergeFailed: snapshot.page?.liveMergeFailed === true,
        truncated: snapshot.page?.truncated === true,
        reload,
    };
}
export function useSessionCatalogQueries(client, queries, options = {}) {
    const { autoLoad = false, enabled = true, maxAgeMs, pollIntervalMs, } = options;
    const store = useMemo(() => getSessionCatalogStore(client), [client]);
    const queriesKey = queries.map(getSessionCatalogQueryKey).join('\n');
    const stableQueriesRef = useRef({ queries: EMPTY_QUERIES });
    if (stableQueriesRef.current.key !== queriesKey) {
        stableQueriesRef.current = { key: queriesKey, queries: [...queries] };
    }
    const stableQueries = stableQueriesRef.current.queries;
    const cachedSnapshots = useRef([]);
    const subscribe = useCallback((listener) => {
        if (!enabled)
            return () => undefined;
        const unsubscribes = stableQueries.map((query) => store.subscribe(query, listener, {
            autoLoad,
            ...(maxAgeMs !== undefined ? { maxAgeMs } : {}),
            ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
        }));
        return () => {
            for (const unsubscribe of unsubscribes)
                unsubscribe();
        };
    }, [autoLoad, enabled, maxAgeMs, pollIntervalMs, stableQueries, store]);
    const getSnapshot = useCallback(() => {
        if (!enabled || stableQueries.length === 0) {
            cachedSnapshots.current = EMPTY_SNAPSHOTS;
            return cachedSnapshots.current;
        }
        const next = stableQueries.map((query) => store.getSnapshot(query));
        const current = cachedSnapshots.current;
        if (current.length === next.length &&
            current.every((snapshot, index) => snapshot === next[index])) {
            return current;
        }
        cachedSnapshots.current = next;
        return next;
    }, [enabled, stableQueries, store]);
    return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOTS);
}
export function useSessionCatalogPolling(client, query, pollIntervalMs) {
    useSessionCatalogQuery(client, query, {
        enabled: pollIntervalMs !== undefined,
        ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
    });
}
export function useSessionCatalogController(client) {
    const store = useMemo(() => getSessionCatalogStore(client), [client]);
    return useMemo(() => {
        const update = (operation) => {
            try {
                operation();
            }
            catch (error) {
                console.warn('[session-catalog] failed to update catalog:', error);
            }
        };
        return {
            refreshQueries(queries) {
                for (const query of queries) {
                    void store.loadOnce(query, { fresh: true }).catch((error) => {
                        console.warn('[session-catalog] failed to refresh catalog:', error);
                    });
                }
            },
            invalidateWorkspace(workspaceCwd) {
                update(() => store.invalidateWorkspace(workspaceCwd));
            },
            sessionCreated(workspaceCwd, _sessionId) {
                update(() => {
                    store.invalidateWorkspace(workspaceCwd);
                    store.scheduleWorkspaceRefresh(workspaceCwd);
                });
            },
            promptAdmitted(workspaceCwd, sessionId) {
                update(() => {
                    store.patchSession(workspaceCwd, sessionId, {
                        hasActivePrompt: true,
                    });
                    store.invalidateWorkspace(workspaceCwd);
                    store.scheduleWorkspaceRefresh(workspaceCwd);
                });
            },
            promptAdmissionUncertain(workspaceCwd) {
                update(() => {
                    store.invalidateWorkspace(workspaceCwd);
                    store.scheduleWorkspaceRefresh(workspaceCwd);
                });
            },
            renamed(workspaceCwd, sessionId, displayName) {
                update(() => {
                    store.patchSession(workspaceCwd, sessionId, { displayName });
                    store.invalidateWorkspace(workspaceCwd);
                });
            },
            turnCompleted(workspaceCwd) {
                update(() => {
                    store.invalidateWorkspace(workspaceCwd);
                    store.scheduleWorkspaceRefresh(workspaceCwd);
                });
            },
        };
    }, [store]);
}
export function useWebShellSessions(options = {}) {
    const { autoLoad = false, enabled = true, maxAgeMs, pollIntervalMs, pageSize, cursor, archiveState, view, group, sourceType, sourceId, parentSessionId, } = options;
    const workspace = useWorkspace();
    const legacy = useSessions({
        autoLoad: false,
        enabled: false,
        pageSize,
        cursor,
        archiveState,
        view,
        group,
        sourceType,
    });
    const legacyReleaseSession = legacy.releaseSession;
    const controller = useSessionCatalogController(workspace.client);
    const workspaceCwd = workspace.workspaceCwd;
    const listOptions = useMemo(() => ({
        ...(pageSize !== undefined ? { pageSize } : {}),
        ...(cursor !== undefined ? { cursor } : {}),
        ...(archiveState !== undefined ? { archiveState } : {}),
        ...(view !== undefined ? { view } : {}),
        ...(group !== undefined ? { group } : {}),
        ...(sourceType !== undefined ? { sourceType } : {}),
        ...(sourceId !== undefined ? { sourceId } : {}),
        ...(parentSessionId !== undefined ? { parentSessionId } : {}),
    }), [
        archiveState,
        cursor,
        group,
        pageSize,
        parentSessionId,
        sourceId,
        sourceType,
        view,
    ]);
    const query = useMemo(() => workspaceCwd
        ? {
            routeKind: 'legacy',
            workspaceCwd,
            options: listOptions,
        }
        : undefined, [listOptions, workspaceCwd]);
    const result = useSessionCatalogQuery(workspace.client, query, {
        autoLoad,
        enabled: enabled && Boolean(workspaceCwd),
        ...(maxAgeMs !== undefined ? { maxAgeMs } : {}),
        ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
    });
    const reloadPage = result.reload;
    const reload = useCallback(async () => {
        try {
            return (await reloadPage())?.sessions;
        }
        catch {
            return undefined;
        }
    }, [reloadPage]);
    const invalidate = useCallback(() => {
        if (workspaceCwd)
            controller.invalidateWorkspace(workspaceCwd);
    }, [controller, workspaceCwd]);
    const deleteSession = useCallback(async (sessionId) => {
        try {
            return await workspace.actions.deleteSession(sessionId);
        }
        finally {
            invalidate();
        }
    }, [invalidate, workspace.actions]);
    const deleteSessions = useCallback(async (sessionIds) => {
        try {
            return await workspace.actions.deleteSessions(sessionIds);
        }
        finally {
            invalidate();
        }
    }, [invalidate, workspace.actions]);
    const archiveSession = useCallback(async (sessionId) => {
        try {
            return await workspace.actions.archiveSession(sessionId);
        }
        finally {
            invalidate();
        }
    }, [invalidate, workspace.actions]);
    const unarchiveSession = useCallback(async (sessionId) => {
        try {
            return await workspace.actions.unarchiveSession(sessionId);
        }
        finally {
            invalidate();
        }
    }, [invalidate, workspace.actions]);
    const releaseSession = useCallback(async (sessionId) => {
        try {
            if (!legacyReleaseSession)
                return;
            return await legacyReleaseSession(sessionId);
        }
        finally {
            invalidate();
        }
    }, [invalidate, legacyReleaseSession]);
    const page = result.page;
    return {
        data: page ? page.sessions : undefined,
        sessions: result.sessions,
        loading: result.loading,
        error: result.error,
        reload,
        nextCursor: page?.nextCursor,
        liveMergeFailed: page?.liveMergeFailed === true,
        truncated: page?.truncated === true,
        loadSession: legacy.loadSession,
        resumeSession: legacy.resumeSession,
        newSession: legacy.newSession,
        releaseSession: legacyReleaseSession ? releaseSession : undefined,
        releaseSessionAction: legacyReleaseSession,
        deleteSession,
        deleteSessions,
        exportSession: legacy.exportSession,
        archiveSession,
        unarchiveSession,
        catalogQuery: query,
    };
}
//# sourceMappingURL=session-catalog-hooks.js.map