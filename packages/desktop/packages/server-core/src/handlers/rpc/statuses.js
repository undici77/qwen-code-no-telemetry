import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config';
export const HANDLED_CHANNELS = [
    RPC_CHANNELS.statuses.LIST,
    RPC_CHANNELS.statuses.REORDER,
];
export function registerStatusesHandlers(server, _deps) {
    // List all statuses for a workspace
    server.handle(RPC_CHANNELS.statuses.LIST, async (_ctx, workspaceId) => {
        const workspace = getWorkspaceByNameOrId(workspaceId);
        if (!workspace)
            throw new Error('Workspace not found');
        const { listStatuses } = await import('@craft-agent/shared/statuses');
        return listStatuses(workspace.rootPath);
    });
    // Reorder statuses (drag-and-drop). Receives new ordered array of status IDs.
    // Config watcher will detect the file change and broadcast STATUSES_CHANGED.
    server.handle(RPC_CHANNELS.statuses.REORDER, async (_ctx, workspaceId, orderedIds) => {
        const workspace = getWorkspaceByNameOrId(workspaceId);
        if (!workspace)
            throw new Error('Workspace not found');
        const { reorderStatuses } = await import('@craft-agent/shared/statuses');
        reorderStatuses(workspace.rootPath, orderedIds);
    });
}
//# sourceMappingURL=statuses.js.map