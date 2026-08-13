import { registerCoreRpcHandlers, } from '@craft-agent/server-core/handlers/rpc';
export { registerCoreRpcHandlers };
// GUI-only handlers remain local (Electron-specific imports)
import { registerSystemGuiHandlers } from './system';
import { registerWorkspaceGuiHandlers } from './workspace';
import { registerBrowserHandlers } from './browser';
import { registerSettingsGuiHandlers } from './settings';
import { registerWindowDragGuiHandlers } from './window-drag';
import { registerPetWindowGuiHandlers } from './pet-window';
export function registerGuiRpcHandlers(server, deps) {
    registerSystemGuiHandlers(server, deps);
    registerWorkspaceGuiHandlers(server, deps);
    registerBrowserHandlers(server, deps);
    registerSettingsGuiHandlers(server, deps);
    registerWindowDragGuiHandlers(server, deps);
    registerPetWindowGuiHandlers(server, deps);
}
export function registerAllRpcHandlers(server, deps, serverCtx) {
    registerCoreRpcHandlers(server, deps, serverCtx);
    registerGuiRpcHandlers(server, deps);
}
//# sourceMappingURL=index.js.map