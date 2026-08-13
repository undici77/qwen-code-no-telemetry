const workspacesByToken = new Map();
export const CHANNEL_WORKER_PROMPT_AUTHORIZATION_META_KEY = 'qwen.daemon.channelPromptAuthorization';
export function registerChannelWorkerPromptAuthorization(token, workspaceCwd) {
    workspacesByToken.set(token, workspaceCwd);
}
export function revokeChannelWorkerPromptAuthorization(token) {
    workspacesByToken.delete(token);
}
export function isChannelWorkerPromptAuthorized(token, workspaceCwd) {
    return (typeof token === 'string' && workspacesByToken.get(token) === workspaceCwd);
}
//# sourceMappingURL=channel-worker-prompt-authorization.js.map