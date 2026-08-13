/**
 * Preload script for browser toolbar windows.
 *
 * Exposes a minimal API for the React BrowserControls component
 * to send navigation actions and receive state updates from the
 * main process BrowserPaneManager.
 */
import { contextBridge, ipcRenderer } from 'electron';
const CHANNELS = {
    NAVIGATE: 'browser-toolbar:navigate',
    GO_BACK: 'browser-toolbar:go-back',
    GO_FORWARD: 'browser-toolbar:go-forward',
    RELOAD: 'browser-toolbar:reload',
    STOP: 'browser-toolbar:stop',
    MENU_GEOMETRY: 'browser-toolbar:menu-geometry',
    FORCE_CLOSE_MENU: 'browser-toolbar:force-close-menu',
    TOGGLE_DOCK_EXPANDED: 'browser-toolbar:toggle-dock-expanded',
    HIDE: 'browser-toolbar:hide',
    DESTROY: 'browser-toolbar:destroy',
    STATE_UPDATE: 'browser-toolbar:state-update',
    THEME_COLOR: 'browser-toolbar:theme-color',
};
// Instance ID is passed via query parameter by BrowserPaneManager
const instanceId = new URLSearchParams(location.search).get('instanceId') || '';
contextBridge.exposeInMainWorld('browserToolbar', {
    instanceId,
    navigate: (url) => ipcRenderer.invoke(CHANNELS.NAVIGATE, instanceId, url),
    goBack: () => ipcRenderer.invoke(CHANNELS.GO_BACK, instanceId),
    goForward: () => ipcRenderer.invoke(CHANNELS.GO_FORWARD, instanceId),
    reload: () => ipcRenderer.invoke(CHANNELS.RELOAD, instanceId),
    stop: () => ipcRenderer.invoke(CHANNELS.STOP, instanceId),
    setMenuGeometry: (open, height = 0) => ipcRenderer.invoke(CHANNELS.MENU_GEOMETRY, instanceId, open, height),
    toggleDockExpanded: () => ipcRenderer.invoke(CHANNELS.TOGGLE_DOCK_EXPANDED, instanceId),
    hideWindow: () => ipcRenderer.invoke(CHANNELS.HIDE, instanceId),
    closeWindowEntirely: () => ipcRenderer.invoke(CHANNELS.DESTROY, instanceId),
    onStateUpdate: (callback) => {
        const handler = (_event, state) => callback(state);
        ipcRenderer.on(CHANNELS.STATE_UPDATE, handler);
        return () => { ipcRenderer.removeListener(CHANNELS.STATE_UPDATE, handler); };
    },
    onThemeColor: (callback) => {
        const handler = (_event, color) => callback(color);
        ipcRenderer.on(CHANNELS.THEME_COLOR, handler);
        return () => { ipcRenderer.removeListener(CHANNELS.THEME_COLOR, handler); };
    },
    onForceCloseMenu: (callback) => {
        const handler = (_event, payload) => callback(payload);
        ipcRenderer.on(CHANNELS.FORCE_CLOSE_MENU, handler);
        return () => { ipcRenderer.removeListener(CHANNELS.FORCE_CLOSE_MENU, handler); };
    },
});
//# sourceMappingURL=browser-toolbar.js.map