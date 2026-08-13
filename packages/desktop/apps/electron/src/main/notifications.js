/**
 * Notification Service
 *
 * Handles native OS notifications and app badge count.
 * - Shows notifications when new messages arrive (when app is not focused)
 * - Updates dock badge count with total unread messages
 * - Clicking notification navigates to the relevant session
 */
import { Notification, app, BrowserWindow, nativeImage } from 'electron';
import { join } from 'path';
import { mainLog } from './logger';
import { RPC_CHANNELS } from '../shared/types';
let windowManager = null;
let eventSink = null;
let clientResolver = null;
let baseIconPath = null;
let baseIconDataUrl = null;
let currentBadgeCount = 0;
let instanceNumber = null; // Multi-instance dev: instance number for dock badge
/**
 * Initialize the notification service with window manager reference
 */
export function initNotificationService(wm) {
    windowManager = wm;
}
/**
 * Set the event sink for notification broadcasts (called after server creation).
 *
 * When a resolver is provided we can route session navigation events to a
 * single client instead of broadcasting to every window in the workspace.
 */
export function setNotificationEventSink(sink, resolver) {
    eventSink = sink;
    clientResolver = resolver ?? null;
}
/**
 * Show a native notification for a new message
 *
 * @param title - Notification title (e.g., session name)
 * @param body - Notification body (e.g., message preview)
 * @param workspaceId - Workspace ID for navigation
 * @param sessionId - Session ID for navigation
 */
export function showNotification(title, body, workspaceId, sessionId) {
    if (!Notification.isSupported()) {
        mainLog.info('Notifications not supported on this platform');
        return;
    }
    const notification = new Notification({
        title,
        body,
        // macOS-specific options
        silent: false,
        // Use the app icon
        icon: undefined, // Will use app icon by default on macOS
    });
    notification.on('click', () => {
        mainLog.info('Notification clicked:', { workspaceId, sessionId });
        handleNotificationClick(workspaceId, sessionId);
    });
    notification.show();
    mainLog.info('Notification shown:', { title, sessionId });
}
/**
 * Handle notification click - focus window and navigate to session
 */
export function handleNotificationClick(workspaceId, sessionId) {
    if (!windowManager) {
        mainLog.error('WindowManager not initialized for notification click');
        return;
    }
    // Find or create window for this workspace
    let window = windowManager.getWindowByWorkspace(workspaceId);
    if (!window) {
        // Create a new window for this workspace
        windowManager.createWindow({ workspaceId });
        window = windowManager.getWindowByWorkspace(workspaceId);
    }
    if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
        // Focus the window
        if (window.isMinimized()) {
            window.restore();
        }
        window.focus();
        // Send navigation event to renderer to open the session.
        // Prefer a single-client target to avoid cross-window navigation side effects.
        if (eventSink) {
            const clientId = clientResolver?.(window.webContents.id);
            if (clientId) {
                eventSink(RPC_CHANNELS.notification.NAVIGATE, { to: 'client', clientId }, {
                    workspaceId,
                    sessionId,
                });
            }
            else {
                eventSink(RPC_CHANNELS.notification.NAVIGATE, { to: 'workspace', workspaceId }, {
                    workspaceId,
                    sessionId,
                });
            }
        }
    }
}
/**
 * Initialize the base icon for badge overlay
 * Call this during app startup
 */
export function initBadgeIcon(iconPath) {
    try {
        baseIconPath = iconPath;
        const icon = nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) {
            baseIconDataUrl = null;
            mainLog.warn('Badge icon could not be loaded:', iconPath);
            return;
        }
        const iconBuffer = icon.toPNG();
        baseIconDataUrl = `data:image/png;base64,${iconBuffer.toString('base64')}`;
        mainLog.info('Badge icon initialized:', iconPath);
    }
    catch (error) {
        mainLog.error('Failed to initialize badge icon:', error);
    }
}
/**
 * Update the app badge count (cross-platform)
 *
 * - macOS: Uses a canvas-based approach to draw the badge directly onto the dock icon.
 * - Windows: Uses taskbar overlay icon for badge display.
 * - Linux: Uses app.setBadgeCount() where supported (Unity, KDE).
 *
 * @param count - Number to show on badge (0 to clear)
 */
export function updateBadgeCount(count) {
    // Skip if count hasn't changed
    if (count === currentBadgeCount) {
        return;
    }
    currentBadgeCount = count;
    if (process.platform === 'darwin') {
        updateBadgeCountMacOS(count);
    }
    else if (process.platform === 'win32') {
        updateBadgeCountWindows(count);
    }
    else if (process.platform === 'linux') {
        updateBadgeCountLinux(count);
    }
}
/**
 * Update badge count on macOS using dock icon overlay
 */
function updateBadgeCountMacOS(count) {
    try {
        if (count > 0) {
            // Draw badge onto icon using the renderer process (Canvas API)
            if (eventSink && baseIconDataUrl) {
                eventSink(RPC_CHANNELS.badge.DRAW, { to: 'all' }, { count, iconDataUrl: baseIconDataUrl });
            }
        }
        else {
            // Reset to original icon (no badge)
            if (baseIconPath) {
                const originalIcon = nativeImage.createFromPath(baseIconPath);
                app.dock?.setIcon(originalIcon);
            }
        }
        mainLog.info('Badge count updated (macOS):', count);
    }
    catch (error) {
        mainLog.error('Failed to update badge count (macOS):', error);
    }
}
/**
 * Update badge count on Windows using taskbar overlay icon
 */
function updateBadgeCountWindows(count) {
    try {
        if (count > 0) {
            // Draw overlay icon using the renderer process (Canvas API)
            if (eventSink) {
                eventSink(RPC_CHANNELS.badge.DRAW_WINDOWS, { to: 'all' }, { count });
            }
        }
        else {
            // Clear the overlay on all windows
            const windows = BrowserWindow.getAllWindows();
            for (const window of windows) {
                if (!window.isDestroyed()) {
                    window.setOverlayIcon(null, '');
                }
            }
        }
        mainLog.info('Badge count updated (Windows):', count);
    }
    catch (error) {
        mainLog.error('Failed to update badge count (Windows):', error);
    }
}
/**
 * Update badge count on Linux using app.setBadgeCount (Unity/KDE)
 */
function updateBadgeCountLinux(count) {
    try {
        // Electron's setBadgeCount works on Linux with Unity launcher and KDE
        app.setBadgeCount(count);
        mainLog.info('Badge count updated (Linux):', count);
    }
    catch (error) {
        mainLog.error('Failed to update badge count (Linux):', error);
    }
}
/**
 * Set the dock/taskbar icon with a pre-rendered badge image (cross-platform)
 * Called from IPC when renderer has drawn the badge
 */
export function setDockIconWithBadge(dataUrl) {
    try {
        const icon = nativeImage.createFromDataURL(dataUrl);
        if (process.platform === 'darwin') {
            app.dock?.setIcon(icon);
            mainLog.info('Dock icon updated with badge (macOS)');
        }
        else if (process.platform === 'win32') {
            // On Windows, set the taskbar overlay icon
            const windows = BrowserWindow.getAllWindows();
            const window = windows[0];
            if (window && !window.isDestroyed()) {
                window.setOverlayIcon(icon, `${currentBadgeCount} notifications`);
                mainLog.info('Taskbar overlay updated with badge (Windows)');
            }
        }
    }
    catch (error) {
        mainLog.error('Failed to set dock/taskbar icon with badge:', error);
    }
}
/**
 * Clear the app dock badge
 */
export function clearBadgeCount() {
    updateBadgeCount(0);
}
/**
 * Check if any window is currently focused
 */
export function isAnyWindowFocused() {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    return focusedWindow !== null && !focusedWindow.isDestroyed();
}
/**
 * Initialize instance badge for multi-instance development.
 *
 * When running from a numbered folder (e.g., craft-tui-agent-1), this shows
 * a permanent badge on the dock icon to distinguish between instances.
 * Uses macOS dock.setBadge() for text-based badge display.
 *
 * @param number - Instance number (1, 2, etc.) or null for default instance
 */
export function initInstanceBadge(number) {
    if (process.platform !== 'darwin') {
        // Instance badge only supported on macOS for now
        return;
    }
    instanceNumber = number;
    try {
        // Use dock.setBadge() for simple text badge
        // This shows the number in a red badge on the dock icon
        app.dock?.setBadge(String(number));
        mainLog.info(`Instance badge set: ${number}`);
    }
    catch (error) {
        mainLog.error('Failed to set instance badge:', error);
    }
}
//# sourceMappingURL=notifications.js.map