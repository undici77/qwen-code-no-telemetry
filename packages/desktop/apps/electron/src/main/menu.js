import { Menu, app, shell, BrowserWindow } from 'electron';
import { i18n } from '@craft-agent/shared/i18n';
import { BRAND } from '@craft-agent/shared/branding';
import { RPC_CHANNELS } from '../shared/types';
import { EDIT_MENU, VIEW_MENU, WINDOW_MENU } from '../shared/menu-schema';
import { isDebugMode } from './logger';
// Store references for rebuilding menu
let cachedWindowManager = null;
let cachedEventSink = null;
let cachedClientResolver = null;
/**
 * Creates and sets the application menu for macOS.
 * Includes only relevant items for the Qwen Code app.
 *
 * Call rebuildMenu() when shared menu state changes.
 */
export function createApplicationMenu(windowManager, sink, resolver) {
    cachedWindowManager = windowManager;
    cachedEventSink = sink ?? null;
    cachedClientResolver = resolver ?? null;
    rebuildMenu();
}
/**
 * Set the event sink and client resolver after server creation.
 * Called separately from createApplicationMenu since the server may not exist at menu init time.
 */
export function setMenuEventSink(sink, resolver) {
    cachedEventSink = sink;
    cachedClientResolver = resolver;
}
/**
 * Rebuilds the application menu.
 *
 * On Windows/Linux: Menu is hidden - all functionality is in the Craft logo menu.
 * On macOS: Native menu is required by Apple guidelines, so we keep it synced.
 */
export async function rebuildMenu() {
    if (!cachedWindowManager)
        return;
    const windowManager = cachedWindowManager;
    const isMac = process.platform === 'darwin';
    const helpMenuLinks = BRAND.helpMenuLinks.map((link) => ({
        label: i18n.t(link.labelKey),
        click: () => shell.openExternal(link.url),
    }));
    // On Windows/Linux, hide the native menu entirely
    // Users access menu via the Craft logo dropdown in the app
    if (!isMac) {
        Menu.setApplicationMenu(null);
        return;
    }
    const template = [
        // App menu (macOS only)
        ...(isMac ? [{
                label: BRAND.appName,
                submenu: [
                    { role: 'about', label: i18n.t('menu.aboutCraftAgents') },
                    { type: 'separator' },
                    {
                        label: i18n.t("menu.settings"),
                        accelerator: 'CmdOrCtrl+,',
                        registerAccelerator: false, // Action registry handles the keyboard shortcut
                        click: () => sendToRenderer(RPC_CHANNELS.menu.OPEN_SETTINGS)
                    },
                    { type: 'separator' },
                    { role: 'hide', label: i18n.t('menu.hideCraftAgents') },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit', label: i18n.t('menu.quitCraftAgents') }
                ]
            }] : []),
        // File menu
        {
            label: i18n.t("menu.file"),
            submenu: [
                {
                    label: i18n.t("menu.newChat"),
                    accelerator: 'CmdOrCtrl+N',
                    registerAccelerator: false, // Action registry handles the keyboard shortcut
                    click: () => sendToRenderer(RPC_CHANNELS.menu.NEW_CHAT)
                },
                {
                    label: i18n.t("menu.newWindow"),
                    accelerator: 'CmdOrCtrl+Shift+N',
                    registerAccelerator: false, // Action registry handles the keyboard shortcut
                    click: () => {
                        const focused = BrowserWindow.getFocusedWindow();
                        if (focused) {
                            const workspaceId = windowManager.getWorkspaceForWindow(focused.webContents.id);
                            if (workspaceId) {
                                windowManager.createWindow({ workspaceId });
                            }
                        }
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        // Edit menu (from shared schema)
        {
            label: i18n.t(EDIT_MENU.labelKey),
            submenu: EDIT_MENU.items.map(toElectronMenuItem),
        },
        // View menu (from shared schema + dev-only items)
        {
            label: i18n.t(VIEW_MENU.labelKey),
            submenu: [
                ...VIEW_MENU.items.map(toElectronMenuItem),
                // Dev tools — available in dev mode or when started with --debug
                ...(!app.isPackaged || isDebugMode ? [
                    { type: 'separator' },
                    ...(!app.isPackaged ? [
                        {
                            label: i18n.t("menu.reload"),
                            accelerator: 'CmdOrCtrl+R',
                            click: (_menuItem, window) => {
                                const browserWindow = window instanceof BrowserWindow ? window : BrowserWindow.getFocusedWindow();
                                if (!browserWindow)
                                    return;
                                const views = browserWindow.getBrowserViews();
                                if (views.length > 0) {
                                    views[0].webContents.reload();
                                }
                                else {
                                    browserWindow.webContents.reload();
                                }
                            }
                        },
                        {
                            label: i18n.t("menu.forceReload"),
                            accelerator: 'CmdOrCtrl+Shift+R',
                            click: (_menuItem, window) => {
                                const browserWindow = window instanceof BrowserWindow ? window : BrowserWindow.getFocusedWindow();
                                if (!browserWindow)
                                    return;
                                const views = browserWindow.getBrowserViews();
                                if (views.length > 0) {
                                    views[0].webContents.reloadIgnoringCache();
                                }
                                else {
                                    browserWindow.webContents.reloadIgnoringCache();
                                }
                            }
                        },
                    ] : []),
                    { role: 'toggleDevTools' },
                ] : [])
            ]
        },
        // Window menu (from shared schema + macOS-specific items)
        {
            label: i18n.t(WINDOW_MENU.labelKey),
            submenu: [
                ...WINDOW_MENU.items.map(toElectronMenuItem),
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' }
                ] : [])
            ]
        },
        // Debug menu (development only)
        ...(!app.isPackaged ? [{
                label: i18n.t("menu.debug"),
                submenu: [
                    {
                        label: i18n.t("menu.resetToDefaults"),
                        click: async () => {
                            const { dialog } = await import('electron');
                            await dialog.showMessageBox({
                                type: 'info',
                                message: i18n.t("menu.resetToDefaultsTitle"),
                                detail: i18n.t("menu.resetToDefaultsDetail"),
                                buttons: [i18n.t("common.ok")]
                            });
                        }
                    }
                ]
            }] : []),
        // Help menu
        {
            label: i18n.t("menu.help"),
            submenu: [
                ...helpMenuLinks,
                ...(helpMenuLinks.length > 0 ? [{ type: 'separator' }] : []),
                {
                    label: i18n.t("menu.keyboardShortcuts"),
                    accelerator: 'CmdOrCtrl+/',
                    registerAccelerator: false, // Action registry handles the keyboard shortcut
                    click: () => sendToRenderer(RPC_CHANNELS.menu.KEYBOARD_SHORTCUTS)
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
/**
 * Sends an event to the focused renderer window via the RPC event sink.
 */
function sendToRenderer(channel) {
    if (!cachedEventSink || !cachedClientResolver)
        return;
    const win = BrowserWindow.getFocusedWindow();
    if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
        const clientId = cachedClientResolver(win.webContents.id);
        if (clientId) {
            cachedEventSink(channel, { to: 'client', clientId });
        }
    }
}
/**
 * Converts a MenuItem from the shared schema to Electron MenuItemConstructorOptions.
 */
function toElectronMenuItem(item) {
    if (item.type === 'separator') {
        return { type: 'separator' };
    }
    if (item.type === 'role') {
        // Use Electron's built-in role - it handles accelerators automatically
        return { role: item.role };
    }
    if (item.type === 'action') {
        return {
            label: i18n.t(item.labelKey),
            accelerator: item.shortcut,
            registerAccelerator: false, // Action registry handles the keyboard shortcut
            click: () => sendToRenderer(item.ipcChannel),
        };
    }
    // Should never reach here
    return { type: 'separator' };
}
//# sourceMappingURL=menu.js.map