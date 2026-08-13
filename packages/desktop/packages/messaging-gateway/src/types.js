/**
 * Core types for the messaging gateway.
 *
 * Workspace-scoped bindings, platform adapter interface, runtime state, and
 * messaging-stack logging contracts.
 */
export const DEFAULT_BINDING_CONFIG = {
    responseMode: 'progress',
    streamResponses: true,
    showToolActivity: false,
    approvalChannel: 'chat',
    editIntervalMs: 3500,
};
export function getDefaultBindingConfig(platform) {
    return {
        ...DEFAULT_BINDING_CONFIG,
        approvalChannel: platform === 'whatsapp' ? 'app' : DEFAULT_BINDING_CONFIG.approvalChannel,
    };
}
export function normalizeBindingConfig(platform, config) {
    const base = getDefaultBindingConfig(platform);
    const resolvedResponseMode = config?.responseMode ??
        (config?.streamResponses === false ? 'final_only' : config?.streamResponses === true ? 'streaming' : base.responseMode);
    return {
        ...base,
        ...config,
        responseMode: resolvedResponseMode,
        approvalChannel: platform === 'whatsapp' ? 'app' : (config?.approvalChannel ?? base.approvalChannel),
    };
}
export const DEFAULT_MESSAGING_CONFIG = {
    enabled: false,
    platforms: {},
};
//# sourceMappingURL=types.js.map