export function isConversationWorkspace(workspace) {
    return workspace?.kind === 'conversation';
}
export function isProtectedWorkspace(workspace) {
    return workspace?.isProtected === true || isConversationWorkspace(workspace);
}
export function getWorkspaceDisplayName(workspace, t) {
    if (!workspace)
        return t('workspace.selectWorkspace', 'Select workspace');
    if (isConversationWorkspace(workspace))
        return t('workspace.defaultConversation', 'Chats');
    return workspace.name;
}
export function getWorkspaceInitial(workspace, t) {
    const name = getWorkspaceDisplayName(workspace, t);
    return name.charAt(0) || 'W';
}
//# sourceMappingURL=workspace.js.map