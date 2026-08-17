import { useCallback, useMemo } from 'react';
import { useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
import { WEB_SHELL_SESSION_SOURCE_TYPE } from '../constants/sessions';
import {
  useSessionCatalogController,
  useSessionCatalogQuery,
  useWebShellSessions,
} from '../session-catalog/session-catalog-hooks';
export function useScopedSessions(workspaceCwd, options = {}) {
  const {
    autoLoad = false,
    enabled = true,
    maxAgeMs,
    pageSize,
    archiveState,
    view,
    group,
    pollIntervalMs,
  } = options;
  const primary = useWebShellSessions({
    autoLoad,
    enabled: enabled && !workspaceCwd,
    maxAgeMs,
    pageSize,
    archiveState,
    view,
    group,
    sourceType: WEB_SHELL_SESSION_SOURCE_TYPE,
    ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
  });
  const primaryDeleteSession = primary.deleteSession;
  const primaryDeleteSessions = primary.deleteSessions;
  const primaryReleaseSessionAction = primary.releaseSessionAction;
  const workspace = useWorkspace();
  const controller = useSessionCatalogController(workspace.client);
  const query = useMemo(
    () =>
      workspaceCwd
        ? {
            routeKind: 'qualified',
            workspaceCwd,
            options: {
              ...(pageSize !== undefined ? { pageSize } : {}),
              ...(archiveState !== undefined ? { archiveState } : {}),
              ...(view !== undefined ? { view } : {}),
              ...(group !== undefined ? { group } : {}),
              sourceType: WEB_SHELL_SESSION_SOURCE_TYPE,
            },
          }
        : undefined,
    [archiveState, group, pageSize, view, workspaceCwd],
  );
  const scoped = useSessionCatalogQuery(workspace.client, query, {
    autoLoad,
    enabled: enabled && Boolean(workspaceCwd),
    ...(maxAgeMs !== undefined ? { maxAgeMs } : {}),
    ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
  });
  const reloadScopedPage = scoped.reload;
  const reloadScoped = useCallback(async () => {
    const page = await reloadScopedPage();
    return page?.sessions ?? [];
  }, [reloadScopedPage]);
  const deleteSessions = useCallback(
    async (sessionIds) => {
      if (!workspaceCwd) return primaryDeleteSessions(sessionIds);
      try {
        return await workspace.client
          .workspaceByCwd(workspaceCwd)
          .deleteSessionsData(sessionIds);
      } finally {
        controller.invalidateWorkspace(workspaceCwd);
      }
    },
    [controller, primaryDeleteSessions, workspace.client, workspaceCwd],
  );
  const deleteSession = useCallback(
    async (sessionId) => {
      if (!workspaceCwd) return primaryDeleteSession(sessionId);
      const result = await deleteSessions([sessionId]);
      if (result.errors.length > 0) throw new Error(result.errors[0].error);
      return result.removed.length > 0 || result.notFound.length > 0;
    },
    [deleteSessions, primaryDeleteSession, workspaceCwd],
  );
  const releaseSession = useCallback(
    async (sessionId) => {
      try {
        return await primaryReleaseSessionAction?.(sessionId);
      } finally {
        if (workspaceCwd) controller.invalidateWorkspace(workspaceCwd);
      }
    },
    [controller, primaryReleaseSessionAction, workspaceCwd],
  );
  if (!workspaceCwd) return primary;
  return {
    data: scoped.page ? scoped.sessions : undefined,
    sessions: scoped.sessions,
    loading: scoped.loading,
    error: scoped.error,
    reload: reloadScoped,
    deleteSession,
    deleteSessions,
    releaseSession: primaryReleaseSessionAction ? releaseSession : undefined,
  };
}
//# sourceMappingURL=useScopedSessions.js.map
