import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config';
import { pushTyped } from '@craft-agent/server-core/transport';
export const HANDLED_CHANNELS = [
    RPC_CHANNELS.labels.LIST,
    RPC_CHANNELS.labels.CREATE,
    RPC_CHANNELS.labels.DELETE,
];
export function registerLabelsHandlers(server, _deps) {
    // List all labels for a workspace
    server.handle(RPC_CHANNELS.labels.LIST, async (_ctx, workspaceId) => {
        const workspace = getWorkspaceByNameOrId(workspaceId);
        if (!workspace)
            throw new Error('Workspace not found');
        const { listLabels } = await import('@craft-agent/shared/labels/storage');
        return listLabels(workspace.rootPath);
    });
    // Create a new label in a workspace
    server.handle(RPC_CHANNELS.labels.CREATE, async (_ctx, workspaceId, input) => {
        const workspace = getWorkspaceByNameOrId(workspaceId);
        if (!workspace)
            throw new Error('Workspace not found');
        const { createLabel } = await import('@craft-agent/shared/labels/crud');
        const label = createLabel(workspace.rootPath, input);
        pushTyped(server, RPC_CHANNELS.labels.CHANGED, { to: 'workspace', workspaceId }, workspaceId);
        return label;
    });
    // Delete a label (and descendants) from a workspace
    server.handle(RPC_CHANNELS.labels.DELETE, async (_ctx, workspaceId, labelId) => {
        const workspace = getWorkspaceByNameOrId(workspaceId);
        if (!workspace)
            throw new Error('Workspace not found');
        const { deleteLabel } = await import('@craft-agent/shared/labels/crud');
        const result = deleteLabel(workspace.rootPath, labelId);
        pushTyped(server, RPC_CHANNELS.labels.CHANGED, { to: 'workspace', workspaceId }, workspaceId);
        return result;
    });
}
//# sourceMappingURL=labels.js.map