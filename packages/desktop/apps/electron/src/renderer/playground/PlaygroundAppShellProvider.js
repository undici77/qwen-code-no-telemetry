import { jsx as _jsx } from "react/jsx-runtime";
/**
 * PlaygroundAppShellProvider
 *
 * Minimal stand-in for the real AppShellProvider so components that rely on
 * `useActiveWorkspace()` / `useAppShellContext()` (e.g. MessagingSettingsPage)
 * can render inside the playground without the full app shell wiring.
 *
 * All callbacks are no-op logging stubs — interactions just go to the console.
 */
import * as React from 'react';
import { AppShellProvider } from '../context/AppShellContext';
const PLAYGROUND_WORKSPACE = {
    id: 'playground-workspace',
    name: 'Playground',
    slug: 'playground',
    rootPath: '/mock/workspaces/playground-workspace',
    createdAt: Date.now(),
};
function logCall(method) {
    return (...args) => {
        console.log(`[Playground AppShell] ${method} called`, args);
    };
}
// Build a minimal value that satisfies the type. Most callbacks are no-ops;
// only `workspaces` and `activeWorkspaceId` carry real data so
// `useActiveWorkspace()` resolves to the playground workspace.
const playgroundValue = {
    workspaces: [PLAYGROUND_WORKSPACE],
    activeWorkspaceId: PLAYGROUND_WORKSPACE.id,
    activeWorkspaceSlug: PLAYGROUND_WORKSPACE.slug,
    llmConnections: [],
    refreshLlmConnections: async () => { },
    onOptimisticDefaultModelChange: () => { },
    pendingPermissions: new Map(),
    pendingCredentials: new Map(),
    getDraft: () => '',
    getDraftAttachmentRefs: () => [],
    hydrateDraftAttachments: async () => [],
    globalPermissionMode: 'ask',
    sessionOptions: new Map(),
    onCreateSession: (async () => {
        throw new Error('[Playground] onCreateSession is not available');
    }),
    onSendMessage: logCall('onSendMessage'),
    onRenameSession: logCall('onRenameSession'),
    onFlagSession: logCall('onFlagSession'),
    onUnflagSession: logCall('onUnflagSession'),
    onArchiveSession: logCall('onArchiveSession'),
    onUnarchiveSession: logCall('onUnarchiveSession'),
    onMarkSessionRead: logCall('onMarkSessionRead'),
    onMarkSessionUnread: logCall('onMarkSessionUnread'),
    onSetActiveViewingSession: logCall('onSetActiveViewingSession'),
    onSessionStatusChange: logCall('onSessionStatusChange'),
    onDeleteSession: async () => {
        console.log('[Playground AppShell] onDeleteSession called');
        return false;
    },
    onOpenFile: logCall('onOpenFile'),
    onOpenUrl: logCall('onOpenUrl'),
    onSelectWorkspace: logCall('onSelectWorkspace'),
    onOpenSettings: logCall('onOpenSettings'),
    onOpenKeyboardShortcuts: logCall('onOpenKeyboardShortcuts'),
    onOpenStoredUserPreferences: logCall('onOpenStoredUserPreferences'),
    onReset: logCall('onReset'),
    onSessionOptionsChange: logCall('onSessionOptionsChange'),
    onInputChange: logCall('onInputChange'),
    onAttachmentsChange: logCall('onAttachmentsChange'),
};
export function PlaygroundAppShellProvider({ children }) {
    return _jsx(AppShellProvider, { value: playgroundValue, children: children });
}
//# sourceMappingURL=PlaygroundAppShellProvider.js.map