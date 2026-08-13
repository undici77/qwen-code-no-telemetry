/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { useOptionalDaemonActions } from '../../session/DaemonSessionProvider.js';
import { useDaemonWorkspace } from '../DaemonWorkspaceProvider.js';
import { useDaemonResource } from './useDaemonResource.js';
export function useDaemonSessions(options = {}) {
    const { pageSize, cursor, archiveState, view, group, sourceType, ...resourceOptions } = options;
    const workspace = useDaemonWorkspace();
    const sessionActions = useOptionalDaemonActions();
    const load = useCallback(() => {
        const listOptions = {
            ...(pageSize !== undefined ? { pageSize } : {}),
            ...(cursor !== undefined ? { cursor } : {}),
            ...(archiveState !== undefined ? { archiveState } : {}),
            ...(view !== undefined ? { view } : {}),
            ...(group !== undefined ? { group } : {}),
            ...(sourceType !== undefined ? { sourceType } : {}),
        };
        return workspace.actions.listSessionsPage(listOptions);
    }, [
        archiveState,
        cursor,
        group,
        pageSize,
        sourceType,
        view,
        workspace.actions,
    ]);
    const workspaceReady = !!workspace.workspaceCwd;
    const result = useDaemonResource(load, {
        ...resourceOptions,
        enabled: (resourceOptions.enabled ?? true) && workspaceReady,
    });
    const reloadPage = result.reload;
    const reload = useCallback(async () => {
        const reloaded = await reloadPage();
        return reloaded?.sessions;
    }, [reloadPage]);
    const page = result.data;
    const sessions = page?.sessions ?? [];
    const deleteSession = useCallback(async (sessionId) => {
        const removed = await workspace.actions.deleteSession(sessionId);
        if (removed)
            reload();
        return removed;
    }, [workspace.actions, reload]);
    const deleteSessions = useCallback(async (sessionIds) => {
        const res = await workspace.actions.deleteSessions(sessionIds);
        if (res.removed.length > 0 || res.notFound.length > 0)
            reload();
        return res;
    }, [workspace.actions, reload]);
    const exportSession = useCallback((sessionId, format = 'html') => workspace.actions.exportSession(sessionId, format), [workspace.actions]);
    const archiveSession = useCallback(async (sessionId) => {
        const archived = await workspace.actions.archiveSession(sessionId);
        if (archived)
            reload();
        return archived;
    }, [workspace.actions, reload]);
    const unarchiveSession = useCallback(async (sessionId) => {
        const unarchived = await workspace.actions.unarchiveSession(sessionId);
        if (unarchived)
            reload();
        return unarchived;
    }, [workspace.actions, reload]);
    return {
        ...result,
        data: page !== undefined ? sessions : undefined,
        reload,
        sessions,
        nextCursor: page?.nextCursor,
        liveMergeFailed: page?.liveMergeFailed === true,
        truncated: page?.truncated === true,
        loadSession: sessionActions?.loadSession,
        resumeSession: sessionActions?.resumeSession,
        newSession: sessionActions?.newSession,
        releaseSession: sessionActions?.releaseSession,
        deleteSession,
        deleteSessions,
        exportSession,
        archiveSession,
        unarchiveSession,
    };
}
//# sourceMappingURL=useDaemonSessions.js.map