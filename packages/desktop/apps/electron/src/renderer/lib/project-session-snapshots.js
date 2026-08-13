import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
import { extractSessionMeta } from '@/atoms/sessions';
export async function loadProjectWorkspaceSessionSnapshot(workspace, api = window.electronAPI) {
    const sessions = workspace.remoteServer
        ? await api.invokeOnServer(workspace.remoteServer.url, workspace.remoteServer.token, RPC_CHANNELS.sessions.GET_FOR_WORKSPACE, workspace.remoteServer.remoteWorkspaceId, { refreshExternal: true })
        : await api.getSessionsForWorkspace(workspace.id, { refreshExternal: true });
    return sessions.map(extractSessionMeta);
}
//# sourceMappingURL=project-session-snapshots.js.map