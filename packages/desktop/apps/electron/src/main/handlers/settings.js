import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
export const GUI_HANDLED_CHANNELS = [
    RPC_CHANNELS.power.SET_KEEP_AWAKE,
    RPC_CHANNELS.settings.SET_NETWORK_PROXY,
];
// ============================================================
// GUI-only settings (require Electron-specific APIs)
// ============================================================
export function registerSettingsGuiHandlers(server, _deps) {
    // Set keep awake while running setting (requires Electron power-manager)
    server.handle(RPC_CHANNELS.power.SET_KEEP_AWAKE, async (_ctx, enabled) => {
        const { setKeepAwakeWhileRunning } = await import('@craft-agent/shared/config/storage');
        const { setKeepAwakeSetting } = await import('../power-manager');
        // Save to config
        setKeepAwakeWhileRunning(enabled);
        // Update the power manager's cached value and power state
        setKeepAwakeSetting(enabled);
    });
    // Set network proxy settings (requires Electron session proxy)
    server.handle(RPC_CHANNELS.settings.SET_NETWORK_PROXY, async (_ctx, settings) => {
        const { updateConfiguredProxySettings } = await import('../network-proxy');
        await updateConfiguredProxySettings(settings);
    });
}
//# sourceMappingURL=settings.js.map