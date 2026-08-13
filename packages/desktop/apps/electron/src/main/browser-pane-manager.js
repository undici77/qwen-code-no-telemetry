/**
 * BrowserPaneManager
 *
 * Owns browser instances as native web contents views. Instances can live in
 * a dedicated BrowserWindow or be docked into an app window.
 */
import { join, parse as parsePath } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { validateFilePath, getWorkspaceAllowedDirs } from '@craft-agent/server-core/handlers';
import { BrowserWindow, View, WebContentsView, app, ipcMain, nativeTheme, session, shell } from 'electron';
import { mainLog } from './logger';
import { BrowserCDP } from './browser-cdp';
import {} from '../shared/types';
import { DEFAULT_THEME, loadAppTheme } from '@craft-agent/shared/config';
import { getBrowserLiveFxCornerRadii } from '../shared/browser-live-fx';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const TOOLBAR_LOAD_MAX_RETRIES = 4;
const TOOLBAR_LOAD_RETRY_DELAY_MS = 500;
const TOOLBAR_HEIGHT = 48;
const DOCK_CONTAINER_RADIUS = process.platform === 'darwin' ? 14 : 8;
const DOCK_PAGE_CLIP_LEFT_INSET = 1;
const DOCK_PAGE_CLIP_CSS = `
html {
  clip-path: inset(0 0 0 ${DOCK_PAGE_CLIP_LEFT_INSET}px round 0 0 ${DOCK_CONTAINER_RADIUS}px 0) !important;
}
body {
  min-height: 100vh !important;
}
`;
const MAX_CONSOLE_LOG_ENTRIES = 500;
const MAX_NETWORK_LOG_ENTRIES = 500;
const MAX_DOWNLOAD_LOG_ENTRIES = 200;
const DEFAULT_WAIT_TIMEOUT_MS = 10_000;
const DEFAULT_WAIT_POLL_MS = 100;
const SCREENSHOT_HIDDEN_CAPTURE_ATTEMPTS = 3;
const SCREENSHOT_RETRY_DELAY_MS = 120;
const SCREENSHOT_RESCUE_PAINT_DELAY_MS = 180;
const SCREENSHOT_NETWORK_IDLE_TIMEOUT_MS = 1_000;
const SCREENSHOT_NETWORK_IDLE_MS = 300;
const THEME_COLOR_SIGNAL_PREFIX = '__craft_theme_color__:';
const THEME_COLOR_NULL_SENTINEL = '__NULL__';
const THEME_OBSERVER_MIN_INTERVAL_MS = 120;
const EARLY_THEME_EXTRACTION_DELAY_MS = 100;
const BROWSER_EMPTY_STATE_PAGE = 'browser-empty-state.html';
const CRAFT_DEEPLINK_SCHEME_PREFIX = `${process.env.CRAFT_DEEPLINK_SCHEME || 'craftagents'}://`;
function getBrowserViewBackgroundColor() {
    return nativeTheme.shouldUseDarkColors ? '#2b292e' : '#fafafb';
}
function isNavigationAbortError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return candidate.code === 'ERR_ABORTED' || candidate.errno === -3;
}
const THEME_COLOR_EXTRACTOR_FN = String.raw `
() => {
  const toHex = (r, g, b) => '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');

  const parseColor = (str) => {
    if (!str) return null;
    str = str.trim();
    const hm = /^#([0-9a-f]{3,8})$/i.exec(str);
    if (hm) {
      const h = hm[1];
      let r, g, b;
      if (h.length === 3) { r = parseInt(h[0]+h[0],16); g = parseInt(h[1]+h[1],16); b = parseInt(h[2]+h[2],16); }
      else if (h.length >= 6) { r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16); }
      else return null;
      return toHex(r, g, b);
    }
    const rm = str.match(/rgba?[\(]\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
    if (rm) return toHex(+rm[1], +rm[2], +rm[3]);
    return null;
  };

  const parseBg = (el) => {
    if (!el) return null;
    const bg = getComputedStyle(el).backgroundColor;
    if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return null;
    return parseColor(bg);
  };

  // 1. theme-color meta — respect media attribute for light/dark
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  for (const m of metas) {
    const media = m.getAttribute('media');
    if (media && !window.matchMedia(media).matches) continue;
    const c = parseColor(m.content);
    if (c) return c;
  }

  // 2. Safari-like approach: sample fixed/sticky elements at viewport top-center
  const els = document.elementsFromPoint(window.innerWidth / 2, 4);
  for (const el of els) {
    if (el === document.documentElement || el === document.body) continue;
    const style = getComputedStyle(el);
    const pos = style.position;
    if (pos !== 'fixed' && pos !== 'sticky') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < window.innerWidth * 0.8) continue;
    const c = parseBg(el);
    if (c) return c;
  }

  // 3. Fallback: body then html
  return parseBg(document.body) || parseBg(document.documentElement) || null;
}
`;
/** IPC channels for the browser toolbar preload */
const TOOLBAR_CHANNELS = {
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
export const BROWSER_PANE_SESSION_PARTITION = 'persist:browser-pane';
const SESSION_PARTITION = BROWSER_PANE_SESSION_PARTITION;
let instanceCounter = 0;
export class BrowserPaneManager {
    instances = new Map();
    destroyingIds = new Set();
    stateChangeCallback = null;
    removedCallback = null;
    interactedCallback = null;
    partitionPermissionsInitialized = false;
    partitionObserversInitialized = false;
    inFlightRequestsByWebContentsId = new Map();
    lastNetworkActivityByWebContentsId = new Map();
    popupWindowsByParentInstanceId = new Map();
    popupParentByWebContentsId = new Map();
    windowManager = null;
    sessionPathResolver = null;
    setWindowManager(windowManager) {
        this.windowManager = windowManager;
    }
    setSessionPathResolver(fn) {
        this.sessionPathResolver = fn;
    }
    onStateChange(callback) {
        this.stateChangeCallback = callback;
    }
    onRemoved(callback) {
        this.removedCallback = callback;
    }
    onInteracted(callback) {
        this.interactedCallback = callback;
    }
    createInstance(id, options) {
        const instanceId = id || `browser-${++instanceCounter}`;
        const shouldShow = options?.show ?? false;
        const ownerType = options?.ownerType ?? 'manual';
        const ownerSessionId = ownerType === 'session' ? (options?.ownerSessionId ?? null) : null;
        const presentation = options?.presentation ?? 'window';
        const existingInstance = this.instances.get(instanceId);
        if (existingInstance) {
            mainLog.warn(`[browser-pane] Instance already exists, reusing: ${instanceId}`);
            if (options?.presentation) {
                existingInstance.presentation = options.presentation;
            }
            if (shouldShow) {
                if (existingInstance.presentation === 'docked') {
                    existingInstance.isVisible = true;
                    existingInstance.pendingShowOnReady = false;
                    existingInstance.pendingShowToken += 1;
                    this.emitStateChange(existingInstance);
                }
                else {
                    this.focus(existingInstance.id);
                }
            }
            return instanceId;
        }
        const ses = session.fromPartition(SESSION_PARTITION);
        this.setupSessionPermissions(ses);
        this.setupSessionObservers(ses);
        // Match background to current OS theme to prevent black/white flash on open
        const bgColor = getBrowserViewBackgroundColor();
        const window = new BrowserWindow({
            width: 1200,
            height: 900,
            minWidth: 700,
            minHeight: 500,
            show: false, // Always hidden until toolbar is painted (ready-to-show)
            backgroundColor: bgColor,
            // Fully chromeless — toolbar is rendered in a dedicated WebContentsView
            frame: false,
            webPreferences: {
                partition: SESSION_PARTITION,
                session: ses,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });
        const containerView = new View();
        containerView.setBackgroundColor('#00000000');
        const toolbarView = new WebContentsView({
            webPreferences: {
                preload: join(__dirname, 'browser-toolbar-preload.cjs'),
                partition: SESSION_PARTITION,
                session: ses,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false,
            },
        });
        const pageView = new WebContentsView({
            webPreferences: {
                partition: SESSION_PARTITION,
                session: ses,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });
        const supportsMultiView = typeof window.contentView?.addChildView === 'function';
        if (!supportsMultiView) {
            throw new Error('[browser-pane] Native overlay requires BrowserWindow.contentView.addChildView');
        }
        const nativeOverlayView = new WebContentsView({
            webPreferences: {
                partition: SESSION_PARTITION,
                session: ses,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });
        // Set view backgrounds to match theme so about:blank doesn't flash white.
        toolbarView.setBackgroundColor('#00000000');
        pageView.setBackgroundColor(bgColor);
        nativeOverlayView.setBackgroundColor('#00000000');
        const cdp = new BrowserCDP(pageView.webContents);
        const instance = {
            id: instanceId,
            window,
            viewHostWindow: window,
            containerView,
            toolbarView,
            pageView,
            nativeOverlayView,
            cdp,
            currentUrl: 'about:blank',
            title: 'New Tab',
            favicon: null,
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            boundSessionId: ownerSessionId,
            ownerType,
            ownerSessionId,
            isVisible: presentation === 'docked' ? shouldShow : false,
            presentation,
            dockBounds: null,
            dockExpanded: false,
            keepAliveOnWindowClose: true,
            toolbarReady: false,
            toolbarMenuOpen: false,
            toolbarMenuHeight: 0,
            toolbarMenuOverlayActive: false,
            showOnCreate: presentation === 'window' ? shouldShow : false,
            pendingShowOnReady: false,
            pendingShowToken: 0,
            lastAction: null,
            agentControl: null,
            lockState: {
                active: false,
                previousResizable: this.getWindowResizable(window),
            },
            nativeOverlayReady: false,
            themeColor: null,
            inPageThemeTimer: null,
            themeObserverToken: null,
            dockClipCssKey: null,
            dockClipCssPending: false,
            dockClipGeneration: 0,
            consoleLogs: [],
            networkLogs: [],
            downloads: [],
            lastLaunchToken: null,
        };
        const defaultUa = pageView.webContents.userAgent || '';
        const sanitizedUa = defaultUa.replace(/\sElectron\/[^\s]+/g, '');
        if (sanitizedUa && sanitizedUa !== defaultUa) {
            pageView.webContents.setUserAgent(sanitizedUa);
        }
        containerView.addChildView(pageView);
        containerView.addChildView(nativeOverlayView);
        containerView.addChildView(toolbarView);
        window.contentView.addChildView(containerView);
        void this.loadNativeOverlayPage(instance);
        this.layoutAllViews(instance);
        this.setupWindowListeners(instance);
        this.instances.set(instanceId, instance);
        this.emitStateChange(instance);
        mainLog.info(`[browser-pane] toolbar version: v4-react-chromeless`);
        mainLog.info(`[browser-pane] Created instance: ${instanceId} (show=${shouldShow}, ownerType=${ownerType}, ownerSessionId=${ownerSessionId ?? 'none'})`);
        void this.loadToolbarPage(instance)
            .finally(() => {
            // Safety net: if Electron never fires ready-to-show, still unblock focus/show behavior.
            if (!instance.toolbarReady) {
                this.markToolbarReady(instance, 'toolbar-load-finalized');
            }
        });
        void this.loadEmptyStatePage(instance).catch((error) => {
            if (isNavigationAbortError(error))
                return;
            mainLog.warn(`[browser-pane] empty-state load failed id=${instance.id}: ${error instanceof Error ? error.message : String(error)}`);
            void pageView.webContents.loadURL('about:blank');
        });
        return instanceId;
    }
    destroyInstance(id) {
        const instance = this.instances.get(id);
        if (!instance) {
            mainLog.info(`[browser-pane] destroy requested for missing instance id=${id}`);
            return;
        }
        const destroyedBefore = instance.window.isDestroyed();
        mainLog.info(`[browser-pane] destroy requested id=${id} destroyedBefore=${destroyedBefore} keepAlive=${instance.keepAliveOnWindowClose}`);
        // Clear pending timers before destroying the window
        if (instance.inPageThemeTimer) {
            clearTimeout(instance.inPageThemeTimer);
            instance.inPageThemeTimer = null;
        }
        instance.themeObserverToken = null;
        instance.pendingShowOnReady = false;
        instance.pendingShowToken += 1;
        // Clean up in-flight network tracking for this instance's webContents
        const wcId = instance.pageView.webContents.id;
        this.inFlightRequestsByWebContentsId.delete(wcId);
        this.lastNetworkActivityByWebContentsId.delete(wcId);
        const runCleanup = (label, action) => {
            try {
                action();
            }
            catch (error) {
                mainLog.warn(`[browser-pane] destroy cleanup failed id=${id} step=${label} error=${error instanceof Error ? error.message : String(error)}`);
            }
        };
        runCleanup('closePopupsForParent', () => this.closePopupsForParent(instance.id, 'parent_destroy'));
        runCleanup('applyAgentControlLock', () => this.applyAgentControlLock(instance, false));
        runCleanup('updateNativeOverlayState', () => this.updateNativeOverlayState(instance));
        runCleanup('restoreViewsToOwner', () => {
            if (!instance.window.isDestroyed()) {
                this.attachViewsToHost(instance, instance.window);
            }
        });
        try {
            if (!instance.window.isDestroyed()) {
                this.destroyingIds.add(id);
                instance.window.destroy();
            }
        }
        catch (error) {
            mainLog.warn(`[browser-pane] destroy failed id=${id} error=${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            // Finalize synchronously in case closed does not fire (or fires later).
            this.finalizeDestroyedInstance(instance, 'destroy');
            mainLog.info(`[browser-pane] destroy completed id=${id} removed=${!this.instances.has(id)}`);
        }
    }
    getInstance(id) {
        return this.instances.get(id);
    }
    cleanupDestroyedInstance(instance, reason) {
        this.finalizeDestroyedInstance(instance, 'closed');
        mainLog.info(`[browser-pane] cleaned up stale instance ${instance.id}: ${reason}`);
    }
    /**
     * Get an instance that is confirmed alive (window not destroyed).
     * Throws a clear error if the instance is missing or its window was closed.
     * Automatically cleans up stale entries from the instance map.
     */
    requireAliveInstance(id) {
        const instance = this.instances.get(id);
        if (!instance)
            throw new Error(`Browser instance not found: ${id}`);
        if (instance.window.isDestroyed()) {
            this.cleanupDestroyedInstance(instance, `lookup by id ${id}`);
            throw new Error(`Browser window was closed (instance: ${id})`);
        }
        return instance;
    }
    async handleEmptyStateLaunchFromRenderer(senderWebContentsId, payload) {
        const instance = this.findInstanceByPageWebContentsId(senderWebContentsId);
        if (!instance) {
            mainLog.warn(`[browser-pane] empty-state launch ignored: sender not mapped senderWebContentsId=${senderWebContentsId}`);
            return { ok: false, handled: false, reason: 'instance_not_found' };
        }
        const route = payload.route?.trim();
        if (!route) {
            mainLog.warn(`[browser-pane] empty-state launch missing route id=${instance.id}`);
            return { ok: false, handled: false, reason: 'missing_route' };
        }
        const token = payload.token ?? null;
        const handled = await this.triggerEmptyStateRouteLaunch(instance, route, token, 'ipc');
        return {
            ok: true,
            handled,
            reason: handled ? undefined : 'duplicate',
        };
    }
    findInstanceByPageWebContentsId(senderWebContentsId) {
        for (const instance of this.instances.values()) {
            if (instance.pageView.webContents.id === senderWebContentsId) {
                return instance;
            }
        }
        return undefined;
    }
    resolveLaunchWorkspaceId() {
        if (!this.windowManager)
            return null;
        const focusedWindow = this.windowManager.getFocusedWindow();
        if (focusedWindow) {
            const focusedWorkspaceId = this.windowManager.getWorkspaceForWindow(focusedWindow.webContents.id);
            if (focusedWorkspaceId) {
                return focusedWorkspaceId;
            }
        }
        const managedWindows = this.windowManager.getAllWindows();
        return managedWindows[0]?.workspaceId ?? null;
    }
    buildDeepLinkFromRoute(route) {
        const queryStart = route.indexOf('?');
        const routePath = queryStart >= 0 ? route.slice(0, queryStart) : route;
        const routeQuery = queryStart >= 0 ? route.slice(queryStart + 1) : '';
        let normalizedPath = routePath.replace(/^\/+/, '');
        const workspaceId = this.resolveLaunchWorkspaceId();
        if (workspaceId && !normalizedPath.startsWith('workspace/')) {
            normalizedPath = `workspace/${encodeURIComponent(workspaceId)}/${normalizedPath}`;
        }
        return `${CRAFT_DEEPLINK_SCHEME_PREFIX}${normalizedPath}${routeQuery ? `?${routeQuery}` : ''}`;
    }
    async triggerEmptyStateRouteLaunch(instance, route, token, source) {
        const dedupeToken = token ?? route;
        if (dedupeToken && instance.lastLaunchToken === dedupeToken) {
            mainLog.info(`[browser-pane] ignoring duplicate empty-state launch id=${instance.id} source=${source} token=${dedupeToken}`);
            return false;
        }
        instance.lastLaunchToken = dedupeToken;
        const deepLink = this.buildDeepLinkFromRoute(route);
        mainLog.info(`[browser-pane] handling empty-state launch id=${instance.id} source=${source} route=${route} deepLink=${deepLink}`);
        await this.handleDeepLinkUrl(deepLink);
        return true;
    }
    listInstances() {
        const infos = [];
        for (const instance of this.instances.values()) {
            if (instance.window.isDestroyed()) {
                this.cleanupDestroyedInstance(instance, 'listInstances');
                continue;
            }
            infos.push(this.toInfo(instance));
        }
        return infos;
    }
    getWindowCount() {
        return this.instances.size;
    }
    getBrowserWindows() {
        return Array.from(this.instances.values())
            .map((instance) => instance.window)
            .filter((win) => !win.isDestroyed());
    }
    async navigate(id, url) {
        const instance = this.requireAliveInstance(id);
        let normalizedUrl = url.trim();
        const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedUrl);
        const isAbout = normalizedUrl.startsWith('about:');
        if (!hasScheme && !isAbout) {
            const looksLikeHost = /^(localhost|\d{1,3}(?:\.\d{1,3}){3}|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:[/?#]|$)/i.test(normalizedUrl);
            if (looksLikeHost) {
                const candidate = `https://${normalizedUrl}`;
                try {
                    new URL(candidate);
                    normalizedUrl = candidate;
                }
                catch {
                    // The host pattern admits octets above 255 and ports above 65535,
                    // which Chromium rejects; search only the host part so path or
                    // query data is never sent to the search provider.
                    const host = normalizedUrl.split(/[/?#]/, 1)[0];
                    normalizedUrl = `https://duckduckgo.com/?q=${encodeURIComponent(host)}`;
                }
            }
            else {
                normalizedUrl = `https://duckduckgo.com/?q=${encodeURIComponent(normalizedUrl.toWellFormed())}`;
            }
        }
        const timeoutMs = 30_000;
        let timeoutHandle = null;
        try {
            const loaded = (async () => {
                instance.pageView.webContents.stop();
                if (!instance.isLoading) {
                    instance.isLoading = true;
                    this.emitStateChange(instance);
                    void this.pushToolbarState(instance);
                }
                try {
                    await instance.pageView.webContents.loadURL(normalizedUrl);
                }
                catch (error) {
                    if (!isNavigationAbortError(error))
                        throw error;
                    instance.pageView.webContents.stop();
                    if (!instance.isLoading) {
                        instance.isLoading = true;
                        this.emitStateChange(instance);
                        void this.pushToolbarState(instance);
                    }
                    await instance.pageView.webContents.loadURL(normalizedUrl);
                }
            })();
            const timeout = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => reject(new Error(`Navigation to "${normalizedUrl}" timed out after ${timeoutMs / 1000}s`)), timeoutMs);
            });
            await Promise.race([loaded, timeout]);
            this.pushToolbarState(instance);
            return { url: instance.currentUrl, title: instance.title };
        }
        finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        }
    }
    async goBack(id) {
        const instance = this.requireAliveInstance(id);
        if (instance.pageView.webContents.canGoBack()) {
            instance.pageView.webContents.goBack();
        }
    }
    async goForward(id) {
        const instance = this.requireAliveInstance(id);
        if (instance.pageView.webContents.canGoForward()) {
            instance.pageView.webContents.goForward();
        }
    }
    reload(id) {
        const instance = this.instances.get(id);
        if (!instance || instance.window.isDestroyed())
            return;
        instance.pageView.webContents.reload();
    }
    stop(id) {
        const instance = this.instances.get(id);
        if (!instance || instance.window.isDestroyed())
            return;
        instance.pageView.webContents.stop();
    }
    focus(id) {
        const instance = this.instances.get(id);
        if (!instance)
            return;
        const win = instance.window;
        if (win.isDestroyed())
            return;
        if (instance.presentation === 'docked') {
            instance.isVisible = true;
            const hostWindow = this.getViewHostWindow(instance);
            if (hostWindow && hostWindow !== instance.window) {
                if (hostWindow.isMinimized())
                    hostWindow.restore();
                hostWindow.focus();
                instance.pageView.webContents.focus();
            }
            this.emitStateChange(instance);
            return;
        }
        // If toolbar hasn't painted yet, defer showing until markToolbarReady runs.
        // Token guard prevents stale deferred focus from showing after hide/destroy.
        if (!instance.toolbarReady) {
            if (instance.pendingShowOnReady)
                return;
            instance.pendingShowOnReady = true;
            const token = ++instance.pendingShowToken;
            mainLog.info(`[browser-pane] focus deferred until ready id=${instance.id} token=${token}`);
            return;
        }
        if (win.isMinimized())
            win.restore();
        win.show();
        win.focus();
        instance.isVisible = true;
        this.emitStateChange(instance);
    }
    dock(id, hostWindow, bounds) {
        const instance = this.instances.get(id);
        if (!instance || instance.window.isDestroyed() || hostWindow.isDestroyed())
            return;
        const nextBounds = {
            x: Math.max(0, Math.round(bounds.x)),
            y: Math.max(0, Math.round(bounds.y)),
            width: Math.max(0, Math.round(bounds.width)),
            height: Math.max(0, Math.round(bounds.height)),
        };
        const previousBounds = instance.dockBounds;
        const boundsChanged = !previousBounds
            || previousBounds.x !== nextBounds.x
            || previousBounds.y !== nextBounds.y
            || previousBounds.width !== nextBounds.width
            || previousBounds.height !== nextBounds.height;
        const stateChanged = instance.presentation !== 'docked'
            || !instance.isVisible
            || instance.viewHostWindow !== hostWindow;
        instance.presentation = 'docked';
        instance.dockBounds = nextBounds;
        if (nextBounds.width > 0 && nextBounds.height > 0) {
            instance.isVisible = true;
        }
        instance.pendingShowOnReady = false;
        instance.pendingShowToken += 1;
        this.attachViewsToHost(instance, hostWindow);
        if (!instance.window.isDestroyed() && instance.window.isVisible()) {
            instance.window.hide();
        }
        this.layoutAllViews(instance);
        if (stateChanged || boundsChanged) {
            this.emitStateChange(instance);
        }
    }
    toggleDockExpanded(id) {
        const instance = this.instances.get(id);
        if (!instance || instance.presentation !== 'docked')
            return;
        instance.dockExpanded = !instance.dockExpanded;
        this.forceCloseToolbarMenu(instance, 'dock-toggle');
        this.pushToolbarState(instance);
        this.emitStateChange(instance);
    }
    hide(id) {
        const instance = this.instances.get(id);
        if (!instance)
            return;
        const win = instance.window;
        if (win.isDestroyed())
            return;
        // Cancel any deferred show request queued before toolbar was ready.
        if (instance.pendingShowOnReady) {
            instance.pendingShowOnReady = false;
            instance.pendingShowToken += 1;
        }
        this.forceCloseToolbarMenu(instance, 'window-hide');
        if (instance.presentation === 'docked') {
            instance.isVisible = false;
            instance.dockBounds = null;
            this.hideHostedViews(instance);
            this.emitStateChange(instance);
            return;
        }
        win.hide();
        instance.isVisible = false;
        this.emitStateChange(instance);
    }
    async getAccessibilitySnapshot(id) {
        const instance = this.requireAliveInstance(id);
        return instance.cdp.getAccessibilitySnapshot();
    }
    async clickAtCoordinates(id, x, y) {
        const instance = this.requireAliveInstance(id);
        try {
            await instance.cdp.clickAtCoordinates(x, y);
            instance.lastAction = {
                tool: 'browser_click_at',
                status: 'succeeded',
                timestamp: Date.now(),
            };
        }
        catch (error) {
            instance.lastAction = {
                tool: 'browser_click_at',
                status: 'failed',
                timestamp: Date.now(),
            };
            throw error;
        }
    }
    async drag(id, x1, y1, x2, y2) {
        const instance = this.requireAliveInstance(id);
        try {
            await instance.cdp.drag(x1, y1, x2, y2);
            instance.lastAction = {
                tool: 'browser_drag',
                status: 'succeeded',
                timestamp: Date.now(),
            };
        }
        catch (error) {
            instance.lastAction = {
                tool: 'browser_drag',
                status: 'failed',
                timestamp: Date.now(),
            };
            throw error;
        }
    }
    async typeText(id, text) {
        const instance = this.requireAliveInstance(id);
        try {
            await instance.cdp.typeText(text);
            instance.lastAction = {
                tool: 'browser_type',
                status: 'succeeded',
                timestamp: Date.now(),
            };
        }
        catch (error) {
            instance.lastAction = {
                tool: 'browser_type',
                status: 'failed',
                timestamp: Date.now(),
            };
            throw error;
        }
    }
    async setClipboard(id, text) {
        const instance = this.requireAliveInstance(id);
        await instance.cdp.setClipboard(text);
    }
    async getClipboard(id) {
        const instance = this.requireAliveInstance(id);
        return instance.cdp.getClipboard();
    }
    async clickElement(id, ref, options) {
        const instance = this.requireAliveInstance(id);
        try {
            const geometry = await instance.cdp.clickElement(ref);
            instance.lastAction = {
                tool: 'browser_click',
                ref,
                status: 'succeeded',
                geometry,
                timestamp: Date.now(),
            };
            const waitFor = options?.waitFor ?? 'none';
            if (waitFor === 'navigation') {
                const timeoutMs = Math.max(100, options?.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS);
                await new Promise((resolve, reject) => {
                    const timer = setTimeout(() => {
                        cleanup();
                        reject(new Error(`Click navigation wait timed out after ${timeoutMs}ms (no navigation event observed). `
                            + `Tip: retry with "click ${ref}" (no navigation wait), then use "wait url <pattern>" or "wait network-idle".`));
                    }, timeoutMs);
                    const onNav = () => {
                        cleanup();
                        resolve();
                    };
                    const cleanup = () => {
                        clearTimeout(timer);
                        instance.pageView.webContents.removeListener('did-navigate', onNav);
                        instance.pageView.webContents.removeListener('did-navigate-in-page', onNav);
                    };
                    instance.pageView.webContents.once('did-navigate', onNav);
                    instance.pageView.webContents.once('did-navigate-in-page', onNav);
                });
            }
            else if (waitFor === 'network-idle') {
                await this.waitFor(id, { kind: 'network-idle', timeoutMs: options?.timeoutMs });
            }
        }
        catch (error) {
            instance.lastAction = {
                tool: 'browser_click',
                ref,
                status: 'failed',
                timestamp: Date.now(),
            };
            throw error;
        }
    }
    async fillElement(id, ref, value) {
        const instance = this.requireAliveInstance(id);
        try {
            const geometry = await instance.cdp.fillElement(ref, value);
            instance.lastAction = {
                tool: 'browser_fill',
                ref,
                status: 'succeeded',
                geometry,
                timestamp: Date.now(),
            };
        }
        catch (error) {
            instance.lastAction = {
                tool: 'browser_fill',
                ref,
                status: 'failed',
                timestamp: Date.now(),
            };
            throw error;
        }
    }
    async selectOption(id, ref, value) {
        const instance = this.requireAliveInstance(id);
        try {
            const geometry = await instance.cdp.selectOption(ref, value);
            instance.lastAction = {
                tool: 'browser_select',
                ref,
                status: 'succeeded',
                geometry,
                timestamp: Date.now(),
            };
        }
        catch (error) {
            instance.lastAction = {
                tool: 'browser_select',
                ref,
                status: 'failed',
                timestamp: Date.now(),
            };
            throw error;
        }
    }
    suspendOverlayForCapture(instance) {
        const shouldSuspend = !!instance.agentControl?.active
            && instance.nativeOverlayReady;
        if (!shouldSuspend)
            return false;
        instance.nativeOverlayView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        return true;
    }
    restoreOverlayAfterCapture(instance, suspended) {
        if (!suspended)
            return;
        this.updateNativeOverlayState(instance);
    }
    async screenshot(id, options) {
        const instance = this.requireAliveInstance(id);
        // Hide native agent overlay so it doesn't appear in captures
        const suspendedOverlay = this.suspendOverlayForCapture(instance);
        try {
            // When annotating, force agent mode and gather refs from accessibility tree
            const annotate = !!options?.annotate;
            const mode = (annotate || options?.mode === 'agent') ? 'agent' : 'raw';
            if (mode === 'raw') {
                const viewport = await instance.cdp.getViewportMetrics();
                const captured = await this.capturePageWithRecovery(instance, {
                    mode,
                    errorPrefix: 'screenshot',
                    dpr: viewport.dpr,
                    format: options?.format,
                    jpegQuality: options?.jpegQuality,
                });
                return {
                    imageBuffer: captured.imageBuffer,
                    imageFormat: captured.imageFormat,
                    metadata: options?.includeMetadata
                        ? {
                            mode: 'raw',
                            warnings: captured.warnings.length > 0 ? captured.warnings : undefined,
                        }
                        : undefined,
                };
            }
            const warnings = [];
            const geometries = [];
            const MAX_ANNOTATED_REFS = 100;
            let refs = options?.refs ?? [];
            if (annotate) {
                try {
                    const snapshot = await instance.cdp.getAccessibilitySnapshot();
                    refs = snapshot.nodes.map((node) => node.ref).slice(0, MAX_ANNOTATED_REFS);
                    if (snapshot.nodes.length > MAX_ANNOTATED_REFS) {
                        warnings.push(`Annotation capped at ${MAX_ANNOTATED_REFS} of ${snapshot.nodes.length} elements`);
                    }
                }
                catch (error) {
                    warnings.push(`Accessibility snapshot for annotation failed: ${error instanceof Error ? error.message : String(error)}`);
                    refs = [];
                }
            }
            const settled = await Promise.allSettled(refs.map((ref) => instance.cdp.getElementGeometry(ref)));
            for (let i = 0; i < settled.length; i++) {
                const result = settled[i];
                if (result.status === 'fulfilled') {
                    geometries.push(result.value);
                }
                else if (!annotate) {
                    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
                    warnings.push(`Could not resolve ref ${refs[i]}: ${reason}`);
                }
            }
            if (options?.includeLastAction && instance.lastAction?.geometry) {
                geometries.push(instance.lastAction.geometry);
            }
            const metadataText = instance.lastAction
                ? `${instance.lastAction.tool} • ${instance.lastAction.status} • ${new Date(instance.lastAction.timestamp).toISOString()}`
                : `browser_screenshot • ${new Date().toISOString()}`;
            let annotationPartial = false;
            try {
                if (geometries.length > 0 || options?.includeMetadata) {
                    await instance.cdp.renderTemporaryOverlay({
                        geometries,
                        includeMetadata: !!options?.includeMetadata,
                        metadataText,
                        includeClickPoints: true,
                    });
                }
            }
            catch (error) {
                annotationPartial = true;
                warnings.push(`Annotation overlay failed: ${error instanceof Error ? error.message : String(error)}`);
            }
            try {
                const viewport = await instance.cdp.getViewportMetrics();
                const captured = await this.capturePageWithRecovery(instance, {
                    mode,
                    errorPrefix: 'screenshot',
                    dpr: viewport.dpr,
                    format: options?.format,
                    jpegQuality: options?.jpegQuality,
                });
                if (captured.warnings.length > 0) {
                    warnings.push(...captured.warnings);
                }
                return {
                    imageBuffer: captured.imageBuffer,
                    imageFormat: captured.imageFormat,
                    metadata: {
                        mode: 'agent',
                        viewport,
                        targets: geometries.map((g) => ({
                            ref: g.ref,
                            role: g.role,
                            name: g.name,
                            box: g.box,
                            clickPoint: g.clickPoint,
                        })),
                        action: instance.lastAction
                            ? {
                                tool: instance.lastAction.tool,
                                ref: instance.lastAction.ref,
                                status: instance.lastAction.status,
                                timestamp: instance.lastAction.timestamp,
                            }
                            : undefined,
                        annotationPartial,
                        warnings: warnings.length > 0 ? warnings : undefined,
                    },
                };
            }
            finally {
                try {
                    await instance.cdp.clearTemporaryOverlay();
                }
                catch {
                    // ignore cleanup errors
                }
            }
        }
        finally {
            this.restoreOverlayAfterCapture(instance, suspendedOverlay);
        }
    }
    async screenshotRegion(id, target) {
        const instance = this.instances.get(id);
        if (!instance)
            throw new Error(`Browser instance not found: ${id}`);
        const hasCoords = [target.x, target.y, target.width, target.height].every((v) => typeof v === 'number');
        const hasRef = typeof target.ref === 'string' && target.ref.length > 0;
        const hasSelector = typeof target.selector === 'string' && target.selector.length > 0;
        const modeCount = [hasCoords, hasRef, hasSelector].filter(Boolean).length;
        if (modeCount === 0) {
            throw new Error('Region screenshot requires either coordinates, ref, or selector');
        }
        if (modeCount > 1) {
            throw new Error('Region screenshot target is ambiguous. Provide only one of coordinates, ref, or selector');
        }
        const suspendedOverlay = this.suspendOverlayForCapture(instance);
        try {
            let box;
            if (hasRef) {
                const geometry = await instance.cdp.getElementGeometry(String(target.ref));
                box = { ...geometry.box };
            }
            else if (hasSelector) {
                const geometry = await instance.cdp.getElementGeometryBySelector(String(target.selector));
                box = { ...geometry.box };
            }
            else {
                box = {
                    x: Number(target.x),
                    y: Number(target.y),
                    width: Number(target.width),
                    height: Number(target.height),
                };
            }
            const padding = Math.max(0, Number(target.padding ?? 0));
            box = {
                x: box.x - padding,
                y: box.y - padding,
                width: box.width + padding * 2,
                height: box.height + padding * 2,
            };
            const viewport = await instance.cdp.getViewportMetrics();
            const clippedX = Math.max(0, Math.floor(box.x));
            const clippedY = Math.max(0, Math.floor(box.y));
            const maxWidth = Math.max(0, Math.floor(viewport.width - clippedX));
            const maxHeight = Math.max(0, Math.floor(viewport.height - clippedY));
            const clippedWidth = Math.min(Math.max(1, Math.floor(box.width)), maxWidth);
            const clippedHeight = Math.min(Math.max(1, Math.floor(box.height)), maxHeight);
            if (maxWidth <= 0 || maxHeight <= 0 || clippedWidth <= 0 || clippedHeight <= 0) {
                throw new Error('Resolved screenshot region is outside the current viewport');
            }
            const captured = await this.capturePageWithRecovery(instance, {
                mode: 'region',
                errorPrefix: 'region screenshot',
                rect: {
                    x: clippedX,
                    y: clippedY,
                    width: clippedWidth,
                    height: clippedHeight,
                },
                dpr: viewport.dpr,
                format: target.format,
                jpegQuality: target.jpegQuality,
            });
            return {
                imageBuffer: captured.imageBuffer,
                imageFormat: captured.imageFormat,
                metadata: {
                    mode: 'raw',
                    viewport,
                    region: {
                        x: clippedX,
                        y: clippedY,
                        width: clippedWidth,
                        height: clippedHeight,
                    },
                    targetMode: hasRef ? 'ref' : hasSelector ? 'selector' : 'coords',
                    warnings: captured.warnings.length > 0 ? captured.warnings : undefined,
                },
            };
        }
        finally {
            this.restoreOverlayAfterCapture(instance, suspendedOverlay);
        }
    }
    async capturePageWithRecovery(instance, options) {
        let rescueUsed = false;
        let sawDisplaySurfaceUnavailable = false;
        const warnings = [];
        const imageOpts = { dpr: options.dpr, format: options.format, jpegQuality: options.jpegQuality };
        for (let attempt = 1; attempt <= SCREENSHOT_HIDDEN_CAPTURE_ATTEMPTS; attempt += 1) {
            let result = null;
            try {
                result = await this.capturePageImage(instance, {
                    rect: options.rect,
                    useHiddenCaptureOptions: true,
                    ...imageOpts,
                });
            }
            catch (error) {
                if (this.isDisplaySurfaceUnavailableError(error)) {
                    sawDisplaySurfaceUnavailable = true;
                    mainLog.warn(`[browser-pane] ${options.errorPrefix} display surface unavailable instance=${instance.id} mode=${options.mode} attempt=${attempt}/${SCREENSHOT_HIDDEN_CAPTURE_ATTEMPTS} visible=${instance.isVisible} url=${instance.currentUrl}`);
                }
                else {
                    throw error;
                }
            }
            if (result) {
                if (attempt > 1) {
                    warnings.push(`Capture recovered after ${attempt} hidden attempt${attempt === 1 ? '' : 's'}.`);
                }
                return { imageBuffer: result.buffer, imageFormat: result.format, warnings };
            }
            mainLog.warn(`[browser-pane] ${options.errorPrefix} empty capture attempt instance=${instance.id} mode=${options.mode} attempt=${attempt}/${SCREENSHOT_HIDDEN_CAPTURE_ATTEMPTS} visible=${instance.isVisible} isLoading=${instance.isLoading} url=${instance.currentUrl}`);
            if (attempt < SCREENSHOT_HIDDEN_CAPTURE_ATTEMPTS) {
                await this.waitForScreenshotReadiness(instance.id);
            }
        }
        const window = instance.window;
        const wasVisible = instance.isVisible;
        if (!window.isDestroyed()) {
            try {
                if (!wasVisible) {
                    if (window.isMinimized()) {
                        window.restore();
                    }
                    window.showInactive();
                    instance.isVisible = true;
                    this.emitStateChange(instance);
                    rescueUsed = true;
                    await this.sleep(SCREENSHOT_RESCUE_PAINT_DELAY_MS);
                    await this.waitForScreenshotReadiness(instance.id);
                }
                let rescueResult = null;
                try {
                    rescueResult = await this.capturePageImage(instance, {
                        rect: options.rect,
                        useHiddenCaptureOptions: false,
                        ...imageOpts,
                    });
                }
                catch (error) {
                    if (this.isDisplaySurfaceUnavailableError(error)) {
                        sawDisplaySurfaceUnavailable = true;
                        mainLog.warn(`[browser-pane] ${options.errorPrefix} display surface unavailable during rescue instance=${instance.id} mode=${options.mode} visible=${instance.isVisible} url=${instance.currentUrl}`);
                    }
                    else {
                        throw error;
                    }
                }
                if (rescueResult) {
                    if (rescueUsed) {
                        warnings.push('Capture required temporary inactive reveal for rendering; browser visibility was restored immediately.');
                    }
                    return { imageBuffer: rescueResult.buffer, imageFormat: rescueResult.format, warnings };
                }
            }
            finally {
                if (!wasVisible && !window.isDestroyed()) {
                    window.hide();
                    instance.isVisible = false;
                    this.emitStateChange(instance);
                }
            }
        }
        mainLog.warn(`[browser-pane] ${options.errorPrefix} capture failed after recovery instance=${instance.id} mode=${options.mode} visible=${instance.isVisible} isLoading=${instance.isLoading} url=${instance.currentUrl} rescueUsed=${rescueUsed}`);
        if (sawDisplaySurfaceUnavailable) {
            throw new Error(`Failed to capture ${options.errorPrefix}: current display surface is unavailable. `
                + `Try focusing the browser window first ("focus ${instance.id}" or "open --foreground") and retry.`);
        }
        throw new Error(`Failed to capture ${options.errorPrefix}: empty image buffer`);
    }
    isDisplaySurfaceUnavailableError(error) {
        if (!(error instanceof Error))
            return false;
        return error.message.toLowerCase().includes('current display surface not available for capture');
    }
    async capturePageImage(instance, options) {
        const captureOpts = options.useHiddenCaptureOptions
            ? { stayHidden: true, stayAwake: true }
            : undefined;
        let image = options.rect
            ? await instance.pageView.webContents.capturePage(options.rect, captureOpts)
            : await instance.pageView.webContents.capturePage(undefined, captureOpts);
        if (image.isEmpty()) {
            return null;
        }
        // Downscale from device pixels to CSS pixels so screenshot coordinates
        // match click-at viewport coordinates (uses Skia Lanczos via 'best')
        const dpr = options.dpr ?? 1;
        if (dpr > 1) {
            const size = image.getSize();
            image = image.resize({
                width: Math.round(size.width / dpr),
                height: Math.round(size.height / dpr),
                quality: 'best',
            });
        }
        const fmt = options.format ?? 'png';
        const encoded = fmt === 'jpeg'
            ? image.toJPEG(options.jpegQuality ?? 80)
            : image.toPNG();
        if (!encoded || encoded.length === 0) {
            return null;
        }
        return { buffer: encoded, format: fmt };
    }
    async waitForScreenshotReadiness(instanceId) {
        try {
            await this.waitFor(instanceId, {
                kind: 'network-idle',
                timeoutMs: SCREENSHOT_NETWORK_IDLE_TIMEOUT_MS,
                idleMs: SCREENSHOT_NETWORK_IDLE_MS,
            });
        }
        catch {
            // network-idle can fail on continuously active pages; still proceed after bounded delay
        }
        await this.sleep(SCREENSHOT_RETRY_DELAY_MS);
    }
    getConsoleLogs(id, options) {
        const instance = this.requireAliveInstance(id);
        const level = options?.level ?? 'all';
        const limit = Math.max(1, Math.min(500, Number(options?.limit ?? 50)));
        const filtered = level === 'all'
            ? instance.consoleLogs
            : instance.consoleLogs.filter((entry) => entry.level === level);
        return filtered.slice(-limit);
    }
    getNetworkLogs(id, options) {
        const instance = this.requireAliveInstance(id);
        const statusFilter = options?.status ?? 'all';
        const limit = Math.max(1, Math.min(500, Number(options?.limit ?? 50)));
        const method = options?.method?.toUpperCase();
        const resourceType = options?.resourceType?.toLowerCase();
        const filtered = instance.networkLogs.filter((entry) => {
            if (method && entry.method !== method)
                return false;
            if (resourceType && entry.resourceType.toLowerCase() !== resourceType)
                return false;
            if (statusFilter === 'all')
                return true;
            if (statusFilter === 'failed')
                return !entry.ok;
            if (statusFilter === '2xx')
                return entry.status >= 200 && entry.status < 300;
            if (statusFilter === '3xx')
                return entry.status >= 300 && entry.status < 400;
            if (statusFilter === '4xx')
                return entry.status >= 400 && entry.status < 500;
            if (statusFilter === '5xx')
                return entry.status >= 500 && entry.status < 600;
            return true;
        });
        return filtered.slice(-limit);
    }
    async waitFor(id, args) {
        const instance = this.requireAliveInstance(id);
        const timeoutMs = Math.max(100, args.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS);
        const pollMs = Math.max(25, args.pollMs ?? DEFAULT_WAIT_POLL_MS);
        const idleMs = Math.max(100, args.idleMs ?? 700);
        const started = Date.now();
        const until = async (predicate, detail) => {
            while (Date.now() - started <= timeoutMs) {
                if (await predicate()) {
                    return {
                        ok: true,
                        kind: args.kind,
                        elapsedMs: Date.now() - started,
                        detail,
                    };
                }
                await this.sleep(pollMs);
            }
            throw new Error(`Wait timed out after ${timeoutMs}ms (${args.kind})`);
        };
        if (args.kind === 'selector') {
            const selector = args.value?.trim();
            if (!selector)
                throw new Error('browser_wait selector requires value');
            return until(async () => {
                const exists = await instance.pageView.webContents.executeJavaScript(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
                return Boolean(exists);
            }, `selector matched: ${selector}`);
        }
        if (args.kind === 'text') {
            const text = args.value?.trim();
            if (!text)
                throw new Error('browser_wait text requires value');
            return until(async () => {
                const found = await instance.pageView.webContents.executeJavaScript(`document.body && document.body.innerText && document.body.innerText.includes(${JSON.stringify(text)})`);
                return Boolean(found);
            }, `text found: ${text}`);
        }
        if (args.kind === 'url') {
            const needle = args.value?.trim();
            if (!needle)
                throw new Error('browser_wait url requires value');
            return until(async () => {
                return instance.currentUrl.includes(needle);
            }, `url matched: ${needle}`);
        }
        if (args.kind === 'network-idle') {
            const wcId = instance.pageView.webContents.id;
            return until(async () => {
                const inflight = this.inFlightRequestsByWebContentsId.get(wcId) ?? 0;
                const last = this.lastNetworkActivityByWebContentsId.get(wcId) ?? started;
                return inflight === 0 && (Date.now() - last) >= idleMs;
            }, `network idle for ${idleMs}ms`);
        }
        throw new Error(`Unknown wait kind: ${args.kind}`);
    }
    async sendKey(id, args) {
        const instance = this.requireAliveInstance(id);
        const key = args.key?.trim();
        if (!key)
            throw new Error('browser_key requires key');
        const modifiers = (args.modifiers ?? []);
        instance.pageView.webContents.sendInputEvent({
            type: 'keyDown',
            keyCode: key,
            modifiers,
        });
        instance.pageView.webContents.sendInputEvent({
            type: 'keyUp',
            keyCode: key,
            modifiers,
        });
    }
    async getDownloads(id, options) {
        const instance = this.requireAliveInstance(id);
        const action = options?.action ?? 'list';
        const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 20)));
        if (action === 'wait') {
            const timeoutMs = Math.max(100, Number(options?.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS));
            const started = Date.now();
            while (Date.now() - started <= timeoutMs) {
                const hasTerminal = instance.downloads.some((d) => d.state === 'completed' || d.state === 'interrupted' || d.state === 'cancelled');
                if (hasTerminal)
                    break;
                await this.sleep(100);
            }
        }
        return instance.downloads.slice(-limit);
    }
    // validateUploadFilePath removed — uses shared validateFilePath from @craft-agent/server-core/handlers
    async uploadFile(id, ref, filePaths) {
        const instance = this.requireAliveInstance(id);
        const safePaths = [];
        for (const p of filePaths) {
            const workspaceId = this.resolveLaunchWorkspaceId();
            const safePath = await validateFilePath(p, getWorkspaceAllowedDirs(workspaceId));
            if (!existsSync(safePath))
                throw new Error(`File not found: ${p}`);
            safePaths.push(safePath);
        }
        return instance.cdp.setFileInputFiles(ref, safePaths);
    }
    windowResize(id, width, height) {
        const instance = this.requireAliveInstance(id);
        const requestedViewportWidth = Math.max(320, Math.floor(width));
        const requestedViewportHeight = Math.max(240, Math.floor(height));
        instance.window.setContentSize(requestedViewportWidth, requestedViewportHeight + TOOLBAR_HEIGHT);
        this.layoutAllViews(instance);
        // Return effective viewport dimensions after OS/window min-size constraints are applied.
        const [appliedContentWidth, appliedContentHeight] = instance.window.getContentSize();
        return {
            width: Math.max(0, Math.floor(appliedContentWidth)),
            height: Math.max(0, Math.floor(appliedContentHeight - TOOLBAR_HEIGHT)),
        };
    }
    async evaluate(id, expression) {
        const instance = this.requireAliveInstance(id);
        return instance.pageView.webContents.executeJavaScript(expression);
    }
    async detectSecurityChallenge(id) {
        const instance = this.instances.get(id);
        if (!instance || instance.window.isDestroyed())
            return { detected: false, provider: 'none', signals: [] };
        const signals = [];
        const title = instance.title || '';
        const url = instance.currentUrl || '';
        // Title-based detection
        if (/^Just a moment/i.test(title)) {
            signals.push('title:just-a-moment');
        }
        // URL-based detection
        if (url.includes('/cdn-cgi/challenge-platform/')) {
            signals.push('url:cdn-cgi-challenge');
        }
        // DOM-based detection via JS evaluation
        try {
            const domSignals = await instance.pageView.webContents.executeJavaScript(`(() => {
        const signals = [];
        const bodyText = (document.body?.innerText || '').slice(0, 2000);
        if (/Verify you are human/i.test(bodyText)) signals.push('text:verify-human');
        if (/Checking (if the site connection is secure|your browser)/i.test(bodyText)) signals.push('text:checking-browser');
        if (/Performing security verification/i.test(bodyText)) signals.push('text:security-verification');
        if (document.querySelector('#challenge-form')) signals.push('dom:challenge-form');
        if (document.querySelector('#turnstile-wrapper')) signals.push('dom:turnstile-wrapper');
        if (document.querySelector('.cf-turnstile')) signals.push('dom:cf-turnstile');
        if (document.querySelector('iframe[src*="challenges.cloudflare.com"]')) signals.push('dom:cf-challenge-iframe');
        return signals;
      })()`);
            if (Array.isArray(domSignals)) {
                signals.push(...domSignals);
            }
        }
        catch {
            // JS evaluation can fail if page is in a weird state — don't block on it
        }
        try {
            const snapshot = await instance.cdp.getAccessibilitySnapshot();
            const actionableRoles = new Set([
                'button', 'link', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch',
                'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'option', 'slider', 'spinbutton', 'listbox',
            ]);
            const actionableCount = snapshot.nodes.filter((node) => {
                const role = (node.role || '').toLowerCase();
                return actionableRoles.has(role) && !node.disabled;
            }).length;
            if (snapshot.nodes.length > 0 && actionableCount <= 2) {
                signals.push(`ax:near-empty(${actionableCount}/${snapshot.nodes.length})`);
            }
        }
        catch {
            // AX snapshot can fail transiently during navigation; ignore
        }
        const detected = signals.length > 0;
        const isCloudflare = signals.some(s => s.includes('cf-') || s.includes('challenge') || s.includes('turnstile') || s === 'title:just-a-moment');
        const provider = detected ? (isCloudflare ? 'cloudflare' : 'unknown') : 'none';
        if (detected) {
            mainLog.info(`[browser-pane] security challenge detected id=${id} provider=${provider} signals=[${signals.join(', ')}]`);
        }
        return { detected, provider, signals };
    }
    async scroll(id, direction, amount = 500) {
        const instance = this.requireAliveInstance(id);
        const deltaX = direction === 'left' ? -amount : direction === 'right' ? amount : 0;
        const deltaY = direction === 'up' ? -amount : direction === 'down' ? amount : 0;
        await instance.pageView.webContents.executeJavaScript(`window.scrollBy(${deltaX}, ${deltaY})`);
    }
    bindSession(id, sessionId) {
        const instance = this.instances.get(id);
        if (instance) {
            instance.boundSessionId = sessionId;
            instance.ownerType = 'session';
            instance.ownerSessionId = sessionId;
            this.emitStateChange(instance);
        }
    }
    unbindSession(id) {
        const instance = this.instances.get(id);
        if (instance) {
            instance.boundSessionId = null;
            instance.ownerType = 'manual';
            // Preserve ownerSessionId as last-known owner for lifecycle targeting.
            this.emitStateChange(instance);
        }
    }
    /** Unbind all instances bound to the given session (non-destructive — window stays alive and reusable). */
    unbindAllForSession(sessionId) {
        for (const instance of this.instances.values()) {
            if (instance.boundSessionId === sessionId) {
                instance.boundSessionId = null;
                instance.ownerType = 'manual';
                // Keep ownerSessionId for post-turn lifecycle commands like `close` and `hide`.
                instance.ownerSessionId = instance.ownerSessionId ?? sessionId;
                this.emitStateChange(instance);
                mainLog.info(`[browser-pane] Unbound instance ${instance.id} from session ${sessionId} (owner retained: ${instance.ownerSessionId ?? 'none'})`);
            }
        }
    }
    getBoundForSession(sessionId) {
        for (const instance of this.instances.values()) {
            if (instance.ownerType === 'session' && instance.ownerSessionId === sessionId) {
                if (instance.window.isDestroyed()) {
                    this.cleanupDestroyedInstance(instance, `getBoundForSession(${sessionId})`);
                    continue;
                }
                return instance.id;
            }
        }
        return null;
    }
    findReusableUnboundInstance() {
        const unbound = Array.from(this.instances.values()).filter(i => i.boundSessionId === null && i.ownerType === 'manual');
        if (unbound.length === 0)
            return null;
        // Prefer visible windows first, then fall back to first available.
        return unbound.find(i => i.isVisible) ?? unbound[0];
    }
    createForSession(sessionId, options) {
        const existing = this.getBoundForSession(sessionId);
        if (existing) {
            if (options?.show) {
                this.focus(existing);
            }
            return existing;
        }
        // Reuse an unbound/manual window before creating a new one.
        // This helps agents avoid unnecessary browser window sprawl.
        const reusable = this.findReusableUnboundInstance();
        if (reusable) {
            this.bindSession(reusable.id, sessionId);
            if (options?.show) {
                this.focus(reusable.id);
            }
            mainLog.info(`[browser-pane] Reused unbound instance ${reusable.id} for session ${sessionId}`);
            return reusable.id;
        }
        return this.createInstance(undefined, {
            show: options?.show ?? false,
            ownerType: 'session',
            ownerSessionId: sessionId,
        });
    }
    focusBoundForSession(sessionId) {
        const id = this.createForSession(sessionId, { show: true });
        this.focus(id);
        return id;
    }
    getOrCreateForSession(sessionId) {
        return this.createForSession(sessionId, { show: false });
    }
    getBoundInstanceId(sessionId) {
        for (const [id, instance] of this.instances) {
            if (instance.boundSessionId === sessionId) {
                if (instance.window.isDestroyed()) {
                    this.cleanupDestroyedInstance(instance, `getBoundInstanceId(${sessionId})`);
                    continue;
                }
                return id;
            }
        }
        return null;
    }
    destroyForSession(sessionId) {
        for (const [id, instance] of this.instances) {
            if (instance.boundSessionId === sessionId) {
                this.destroyInstance(id);
            }
        }
    }
    async clearVisualsForSession(sessionId) {
        for (const instance of this.instances.values()) {
            if (instance.boundSessionId === sessionId) {
                instance.agentControl = null;
                this.applyAgentControlLock(instance, false);
                this.updateNativeOverlayState(instance);
                this.emitStateChange(instance);
            }
        }
    }
    getAgentControlLabel(agentControl) {
        if (agentControl?.intent) {
            return `${agentControl.displayName ?? 'Agent'} — ${agentControl.intent}`;
        }
        return agentControl?.displayName ?? 'Agent is working…';
    }
    reapplyAgentControlVisual(instance) {
        const active = !!instance.agentControl?.active;
        this.applyAgentControlLock(instance, active);
        this.updateNativeOverlayState(instance);
    }
    /** Resolve the app's current accent color as a concrete CSS value (not a var reference). */
    getResolvedAccentColor() {
        const isDark = nativeTheme.shouldUseDarkColors;
        const userTheme = loadAppTheme();
        const accent = isDark
            ? (userTheme?.dark?.accent ?? userTheme?.accent ?? DEFAULT_THEME.dark.accent)
            : (userTheme?.accent ?? DEFAULT_THEME.accent);
        return accent;
    }
    async loadNativeOverlayPage(instance) {
        const liveFxPlatform = process.platform === 'darwin' || process.platform === 'win32' || process.platform === 'linux'
            ? process.platform
            : 'other';
        const cornerRadii = getBrowserLiveFxCornerRadii(liveFxPlatform);
        const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #overlay {
        position: fixed;
        inset: 0;
        border: 2px solid transparent;
        border-top-left-radius: ${cornerRadii.topLeft};
        border-top-right-radius: ${cornerRadii.topRight};
        border-bottom-left-radius: ${cornerRadii.bottomLeft};
        border-bottom-right-radius: ${cornerRadii.bottomRight};
        box-sizing: border-box;
        pointer-events: none;
      }
      #chip {
        position: fixed;
        top: 8px;
        right: 8px;
        padding: 4px 8px;
        border-radius: 7px;
        background: rgba(2, 6, 23, 0.82);
        color: rgba(236, 254, 255, 0.95);
        font-size: 11px;
        line-height: 1.2;
        backdrop-filter: blur(4px);
        max-width: calc(100vw - 16px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #shield {
        position: fixed;
        inset: 0;
        pointer-events: none;
        cursor: default;
      }
    </style>
  </head>
  <body>
    <div id="overlay">
      <div id="shield"></div>
      <div id="chip">Agent is working…</div>
    </div>
  </body>
</html>`;
        try {
            await instance.nativeOverlayView.webContents.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
            instance.nativeOverlayReady = true;
            mainLog.info(`[browser-pane] native overlay ready id=${instance.id} platform=${liveFxPlatform} corners=${cornerRadii.bottomLeft}/${cornerRadii.bottomRight}`);
            this.updateNativeOverlayState(instance);
        }
        catch (error) {
            instance.nativeOverlayReady = false;
            mainLog.warn(`[browser-pane] native overlay load failed id=${instance.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getToolbarEffectiveHeight(instance) {
        if (instance.presentation === 'docked')
            return 0;
        if (!instance.toolbarMenuOpen)
            return TOOLBAR_HEIGHT;
        const frame = this.getLayoutFrame(instance);
        return Math.max(TOOLBAR_HEIGHT, frame?.height ?? TOOLBAR_HEIGHT);
    }
    getLayoutFrame(instance) {
        if (instance.presentation === 'docked') {
            if (!instance.isVisible || !instance.dockBounds)
                return null;
            return instance.dockBounds;
        }
        if (instance.window.isDestroyed())
            return null;
        const [width, height] = instance.window.getContentSize();
        return { x: 0, y: 0, width, height };
    }
    getViewHostWindow(instance) {
        return instance.viewHostWindow.isDestroyed() ? null : instance.viewHostWindow;
    }
    removeViewsFromWindow(window, instance) {
        if (window.isDestroyed())
            return;
        try {
            window.contentView.removeChildView(instance.containerView);
        }
        catch {
            // Electron throws if a view is not attached to this host.
        }
    }
    attachViewsToHost(instance, hostWindow) {
        if (hostWindow.isDestroyed())
            return;
        if (instance.viewHostWindow === hostWindow && !hostWindow.isDestroyed())
            return;
        this.removeViewsFromWindow(instance.viewHostWindow, instance);
        hostWindow.contentView.addChildView(instance.containerView);
        instance.viewHostWindow = hostWindow;
    }
    hideHostedViews(instance) {
        instance.containerView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        instance.toolbarView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        instance.pageView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        instance.nativeOverlayView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
    raiseToolbarView(instance) {
        instance.containerView.addChildView(instance.toolbarView);
    }
    resetDockedPageClip(instance) {
        instance.dockClipCssKey = null;
        instance.dockClipCssPending = false;
        instance.dockClipGeneration += 1;
    }
    applyDockedPageClip(instance) {
        if (instance.presentation !== 'docked'
            || instance.dockClipCssKey
            || instance.dockClipCssPending) {
            return;
        }
        const webContents = instance.pageView.webContents;
        if (webContents.isDestroyed())
            return;
        const generation = instance.dockClipGeneration;
        instance.dockClipCssPending = true;
        void webContents
            .insertCSS(DOCK_PAGE_CLIP_CSS, { cssOrigin: 'user' })
            .then((key) => {
            if (instance.presentation === 'docked'
                && instance.dockClipGeneration === generation
                && !webContents.isDestroyed()) {
                instance.dockClipCssKey = key;
                return;
            }
            if (!webContents.isDestroyed()) {
                void webContents.removeInsertedCSS(key).catch(() => { });
            }
        })
            .catch((error) => {
            mainLog.warn(`[browser-pane] dock page clip failed id=${instance.id}: ${error instanceof Error ? error.message : String(error)}`);
        })
            .finally(() => {
            if (instance.dockClipGeneration === generation) {
                instance.dockClipCssPending = false;
            }
        });
    }
    removeDockedPageClip(instance) {
        const key = instance.dockClipCssKey;
        instance.dockClipCssKey = null;
        instance.dockClipCssPending = false;
        instance.dockClipGeneration += 1;
        if (!key || instance.pageView.webContents.isDestroyed())
            return;
        void instance.pageView.webContents.removeInsertedCSS(key).catch(() => { });
    }
    layoutContainerView(instance) {
        const frame = this.getLayoutFrame(instance);
        if (!frame) {
            this.hideHostedViews(instance);
            return null;
        }
        const isDocked = instance.presentation === 'docked';
        instance.containerView.setBounds(frame);
        instance.containerView.setBorderRadius(0);
        instance.toolbarView.setBorderRadius(0);
        instance.pageView.setBorderRadius(0);
        instance.nativeOverlayView.setBorderRadius(0);
        instance.pageView.setBackgroundColor(isDocked ? '#00000000' : getBrowserViewBackgroundColor());
        if (isDocked) {
            this.applyDockedPageClip(instance);
        }
        else {
            this.removeDockedPageClip(instance);
        }
        return frame;
    }
    layoutToolbarView(instance) {
        const frame = this.layoutContainerView(instance);
        if (!frame) {
            return;
        }
        const toolbarHeight = this.getToolbarEffectiveHeight(instance);
        instance.toolbarView.setBounds({
            x: 0,
            y: 0,
            width: frame.width,
            height: toolbarHeight,
        });
    }
    updateNativeOverlayState(instance) {
        const control = instance.agentControl;
        const agentActive = !!control?.active;
        const menuActive = !!instance.toolbarMenuOverlayActive;
        const shouldShow = agentActive || menuActive;
        const hostWindow = this.getViewHostWindow(instance);
        const frame = this.getLayoutFrame(instance);
        if (!shouldShow || !instance.nativeOverlayReady || !hostWindow || !frame) {
            instance.nativeOverlayView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
            this.raiseToolbarView(instance);
            return;
        }
        const toolbarHeight = this.getToolbarEffectiveHeight(instance);
        const overlayHeight = Math.max(100, frame.height - toolbarHeight);
        instance.nativeOverlayView.setBounds({
            x: 0,
            y: toolbarHeight,
            width: frame.width,
            height: overlayHeight,
        });
        this.raiseToolbarView(instance);
        const dockedOverlayRadius = instance.presentation === 'docked' ? `${DOCK_CONTAINER_RADIUS}px` : '';
        const dockedOverlaySquareRadius = instance.presentation === 'docked' ? '0px' : '';
        const dockedOverlayClip = instance.presentation === 'docked'
            ? `inset(0 0 0 ${DOCK_PAGE_CLIP_LEFT_INSET}px round 0 0 ${DOCK_CONTAINER_RADIUS}px 0)`
            : '';
        if (agentActive) {
            const label = this.getAgentControlLabel(control);
            const accent = this.getResolvedAccentColor();
            void instance.nativeOverlayView.webContents.executeJavaScript(`(() => {
        const overlay = document.getElementById('overlay');
        const chip = document.getElementById('chip');
        const shield = document.getElementById('shield');
        if (!overlay || !chip || !shield) return;

        overlay.style.borderTopLeftRadius = ${JSON.stringify(dockedOverlaySquareRadius)};
        overlay.style.borderTopRightRadius = ${JSON.stringify(dockedOverlaySquareRadius)};
        overlay.style.borderBottomLeftRadius = ${JSON.stringify(dockedOverlaySquareRadius)};
        overlay.style.borderBottomRightRadius = ${JSON.stringify(dockedOverlayRadius)};
        overlay.style.clipPath = ${JSON.stringify(dockedOverlayClip)};
        overlay.style.borderColor = ${JSON.stringify(accent)};
        overlay.style.boxShadow = 'inset 0 0 0 1px color-mix(in oklab, ' + ${JSON.stringify(accent)} + ' 45%, transparent), inset 0 0 24px color-mix(in oklab, ' + ${JSON.stringify(accent)} + ' 28%, transparent)';
        chip.textContent = ${JSON.stringify(label)};
        chip.style.display = 'inline-flex';
        shield.style.pointerEvents = 'auto';
        shield.style.cursor = 'not-allowed';
        shield.style.background = 'rgba(2, 6, 23, 0.03)';
      })()`).catch(() => { });
            return;
        }
        // Menu mode: transparent full-page tap-catcher, no visuals
        void instance.nativeOverlayView.webContents.executeJavaScript(`(() => {
      const overlay = document.getElementById('overlay');
      const chip = document.getElementById('chip');
      const shield = document.getElementById('shield');
      if (!overlay || !chip || !shield) return;

      overlay.style.borderTopLeftRadius = ${JSON.stringify(dockedOverlaySquareRadius)};
      overlay.style.borderTopRightRadius = ${JSON.stringify(dockedOverlaySquareRadius)};
      overlay.style.borderBottomLeftRadius = ${JSON.stringify(dockedOverlaySquareRadius)};
      overlay.style.borderBottomRightRadius = ${JSON.stringify(dockedOverlayRadius)};
      overlay.style.clipPath = ${JSON.stringify(dockedOverlayClip)};
      overlay.style.borderColor = 'transparent';
      overlay.style.boxShadow = 'none';
      chip.style.display = 'none';
      shield.style.pointerEvents = 'auto';
      shield.style.cursor = 'default';
      shield.style.background = 'rgba(0, 0, 0, 0.001)';
    })()`).catch(() => { });
    }
    getWindowResizable(window) {
        return typeof window.isResizable === 'function' ? window.isResizable() : true;
    }
    setWindowResizable(window, value) {
        if (typeof window.setResizable === 'function') {
            window.setResizable(value);
        }
    }
    applyAgentControlLock(instance, active) {
        const wantsLock = active && !!instance.agentControl?.active;
        if (wantsLock && !instance.lockState.active) {
            instance.lockState.previousResizable = this.getWindowResizable(instance.window);
            this.setWindowResizable(instance.window, false);
            instance.lockState.active = true;
            mainLog.info(`[browser-pane] interaction lock enabled id=${instance.id}`);
            return;
        }
        if (!wantsLock && instance.lockState.active) {
            this.setWindowResizable(instance.window, instance.lockState.previousResizable);
            instance.lockState.active = false;
            mainLog.info(`[browser-pane] interaction lock released id=${instance.id}`);
        }
    }
    destroyAll() {
        for (const id of [...this.instances.keys()]) {
            this.destroyInstance(id);
        }
    }
    finalizeDestroyedInstance(instance, source) {
        if (!this.instances.has(instance.id)) {
            return;
        }
        this.destroyingIds.delete(instance.id);
        this.closePopupsForParent(instance.id, 'parent_destroy');
        this.applyAgentControlLock(instance, false);
        this.updateNativeOverlayState(instance);
        instance.cdp.detach();
        this.instances.delete(instance.id);
        this.removedCallback?.(instance.id);
        mainLog.info(`[browser-pane] Destroyed instance: ${instance.id} (${source})`);
    }
    layoutPageView(instance) {
        const frame = this.layoutContainerView(instance);
        if (!frame) {
            this.updateNativeOverlayState(instance);
            return;
        }
        const toolbarHeight = this.getToolbarEffectiveHeight(instance);
        instance.pageView.setBounds({
            x: 0,
            y: toolbarHeight,
            width: frame.width,
            height: Math.max(100, frame.height - toolbarHeight),
        });
        this.updateNativeOverlayState(instance);
    }
    layoutAllViews(instance) {
        this.layoutToolbarView(instance);
        this.layoutPageView(instance);
        this.raiseToolbarView(instance);
    }
    forceCloseToolbarMenu(instance, reason) {
        if (!instance.toolbarMenuOpen && instance.toolbarMenuHeight === 0 && !instance.toolbarMenuOverlayActive) {
            return;
        }
        instance.toolbarMenuOpen = false;
        instance.toolbarMenuHeight = 0;
        instance.toolbarMenuOverlayActive = false;
        this.layoutAllViews(instance);
        if (!instance.window.isDestroyed() && !instance.toolbarView.webContents.isDestroyed()) {
            instance.toolbarView.webContents.send(TOOLBAR_CHANNELS.FORCE_CLOSE_MENU, { reason });
        }
    }
    isBrowserEmptyStateUrl(url) {
        if (!url)
            return false;
        return url.includes(`/${BROWSER_EMPTY_STATE_PAGE}`) || url.includes(`\\${BROWSER_EMPTY_STATE_PAGE}`);
    }
    normalizePageState(url, title) {
        if (this.isBrowserEmptyStateUrl(url)) {
            return { url: 'about:blank', title: 'New Tab' };
        }
        return { url, title };
    }
    async loadEmptyStatePage(instance) {
        if (VITE_DEV_SERVER_URL) {
            await instance.pageView.webContents.loadURL(`${VITE_DEV_SERVER_URL}/${BROWSER_EMPTY_STATE_PAGE}`);
            return;
        }
        await instance.pageView.webContents.loadFile(join(__dirname, `renderer/${BROWSER_EMPTY_STATE_PAGE}`));
    }
    async handleDeepLinkUrl(url) {
        if (!url.startsWith(CRAFT_DEEPLINK_SCHEME_PREFIX))
            return;
        try {
            if (!this.windowManager) {
                mainLog.warn('[browser-pane] window manager unavailable for deep-link handling, falling back to shell.openExternal');
                await shell.openExternal(url);
                return;
            }
            const { handleDeepLink } = await import('./deep-link');
            const sink = this.windowManager.getRpcEventSink() ?? undefined;
            const resolver = (wcId) => this.windowManager?.getClientIdForWindow(wcId);
            const result = await handleDeepLink(url, this.windowManager, sink, resolver);
            if (!result.success) {
                mainLog.warn(`[browser-pane] deep-link handling failed: ${result.error ?? 'unknown error'} url=${url}`);
            }
        }
        catch (error) {
            mainLog.warn(`[browser-pane] deep-link handling threw, falling back to shell.openExternal: ${error instanceof Error ? error.message : String(error)}`);
            await shell.openExternal(url);
        }
    }
    async maybeHandleEmptyStateLaunch(instance, url) {
        if (!this.isBrowserEmptyStateUrl(url) || !url.includes('#launch=')) {
            return false;
        }
        let parsed;
        try {
            parsed = new URL(url);
        }
        catch {
            return false;
        }
        const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
        const launchPayload = hash.startsWith('launch=') ? hash.slice('launch='.length) : hash;
        if (!launchPayload)
            return false;
        const params = new URLSearchParams(launchPayload);
        const route = params.get('route');
        const token = params.get('ts') ?? route ?? null;
        if (!route) {
            mainLog.warn(`[browser-pane] empty-state launch missing route id=${instance.id}`);
            return false;
        }
        const handled = await this.triggerEmptyStateRouteLaunch(instance, route, token, 'hash');
        try {
            await instance.pageView.webContents.executeJavaScript("if (window.location.hash.includes('launch=')) history.replaceState(null, '', window.location.pathname + window.location.search);");
        }
        catch {
            // Best effort cleanup only
        }
        return handled;
    }
    async loadToolbarPage(instance) {
        const query = `instanceId=${encodeURIComponent(instance.id)}`;
        let lastError = null;
        for (let attempt = 0; attempt <= TOOLBAR_LOAD_MAX_RETRIES; attempt++) {
            try {
                if (VITE_DEV_SERVER_URL) {
                    await instance.toolbarView.webContents.loadURL(`${VITE_DEV_SERVER_URL}/browser-toolbar.html?${query}`);
                }
                else {
                    await instance.toolbarView.webContents.loadFile(join(__dirname, 'renderer/browser-toolbar.html'), { query: { instanceId: instance.id } });
                }
                if (attempt > 0) {
                    mainLog.info(`[browser-pane] toolbar load recovered id=${instance.id} attempt=${attempt + 1}`);
                }
                return;
            }
            catch (error) {
                lastError = error;
                const retrying = attempt < TOOLBAR_LOAD_MAX_RETRIES;
                mainLog.warn(`[browser-pane] toolbar load failed id=${instance.id} attempt=${attempt + 1}/${TOOLBAR_LOAD_MAX_RETRIES + 1}: ${error instanceof Error ? error.message : String(error)}${retrying ? ' (retrying)' : ''}`);
                if (retrying) {
                    await this.sleep(TOOLBAR_LOAD_RETRY_DELAY_MS);
                }
            }
        }
        const errorText = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
        await this.loadToolbarFallback(instance, errorText);
    }
    async loadToolbarFallback(instance, reason) {
        const safeReason = reason.replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] || ch));
        const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Browser Toolbar Error</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafafb; color: #1f2937; }
      @media (prefers-color-scheme: dark) { html, body { background: #2b292e; color: #e5e7eb; } }
      .wrap { height: 100%; display: flex; align-items: center; justify-content: center; }
      .card { max-width: 640px; margin: 0 20px; padding: 14px 16px; border-radius: 10px; background: rgba(127,127,127,0.12); font-size: 12px; line-height: 1.45; }
      .title { font-weight: 600; margin-bottom: 6px; }
      .muted { opacity: 0.8; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="title">Browser toolbar failed to load</div>
        <div class="muted">The page area still works, but toolbar UI is unavailable. Try reopening the browser window.</div>
        <div class="muted" style="margin-top: 8px; word-break: break-word;">Reason: ${safeReason}</div>
      </div>
    </div>
  </body>
</html>`;
        try {
            await instance.toolbarView.webContents.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
            mainLog.warn(`[browser-pane] Loaded toolbar fallback id=${instance.id}`);
        }
        catch (error) {
            mainLog.error(`[browser-pane] Failed to load toolbar fallback id=${instance.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    pushToolbarState(instance) {
        if (instance.window.isDestroyed() || instance.toolbarView.webContents.isDestroyed())
            return;
        const state = {
            url: instance.currentUrl,
            title: instance.title,
            isLoading: instance.isLoading,
            canGoBack: instance.canGoBack,
            canGoForward: instance.canGoForward,
            themeColor: instance.themeColor,
            presentation: instance.presentation,
            dockExpanded: instance.dockExpanded,
        };
        instance.toolbarView.webContents.send(TOOLBAR_CHANNELS.STATE_UPDATE, state);
    }
    /** Register IPC handlers for toolbar actions. Call once at app startup. */
    registerToolbarIpc() {
        const findInstance = (instanceId) => {
            return this.instances.get(instanceId);
        };
        ipcMain.handle(TOOLBAR_CHANNELS.NAVIGATE, async (_event, instanceId, url) => {
            const inst = findInstance(instanceId);
            if (inst)
                await this.navigate(inst.id, url);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.GO_BACK, async (_event, instanceId) => {
            const inst = findInstance(instanceId);
            if (inst)
                await this.goBack(inst.id);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.GO_FORWARD, async (_event, instanceId) => {
            const inst = findInstance(instanceId);
            if (inst)
                await this.goForward(inst.id);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.RELOAD, async (_event, instanceId) => {
            const inst = findInstance(instanceId);
            if (inst)
                this.reload(inst.id);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.STOP, async (_event, instanceId) => {
            const inst = findInstance(instanceId);
            if (inst)
                this.stop(inst.id);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.MENU_GEOMETRY, async (_event, instanceId, open, height) => {
            const inst = findInstance(instanceId);
            if (!inst)
                return;
            const normalizedOpen = !!open;
            const normalizedHeight = Math.max(0, Math.ceil(Number(height ?? 0)));
            if (!normalizedOpen) {
                this.forceCloseToolbarMenu(inst, 'renderer-close');
                return;
            }
            const changed = !inst.toolbarMenuOpen
                || inst.toolbarMenuHeight !== normalizedHeight
                || !inst.toolbarMenuOverlayActive;
            if (!changed)
                return;
            inst.toolbarMenuOpen = true;
            inst.toolbarMenuHeight = normalizedHeight;
            inst.toolbarMenuOverlayActive = true;
            this.layoutAllViews(inst);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.TOGGLE_DOCK_EXPANDED, async (_event, instanceId) => {
            this.toggleDockExpanded(instanceId);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.HIDE, async (_event, instanceId) => {
            const inst = findInstance(instanceId);
            mainLog.info(`[browser-pane] toolbar ipc hide requested instanceId=${instanceId} resolved=${inst?.id ?? 'none'}`);
            if (inst)
                this.hide(inst.id);
        });
        ipcMain.handle(TOOLBAR_CHANNELS.DESTROY, async (_event, instanceId) => {
            const inst = findInstance(instanceId);
            mainLog.info(`[browser-pane] toolbar ipc destroy requested instanceId=${instanceId} resolved=${inst?.id ?? 'none'}`);
            if (inst)
                this.destroyInstance(inst.id);
        });
        mainLog.info('[browser-pane] Toolbar IPC handlers registered');
    }
    markToolbarReady(instance, reason) {
        if (instance.toolbarReady || instance.window.isDestroyed())
            return;
        instance.toolbarReady = true;
        mainLog.info(`[browser-pane] toolbar ready id=${instance.id} reason=${reason}`);
        const shouldShowNow = instance.showOnCreate || instance.pendingShowOnReady;
        if (!shouldShowNow)
            return;
        const tokenAtReady = instance.pendingShowToken;
        instance.pendingShowOnReady = false;
        if (instance.window.isDestroyed())
            return;
        if (instance.pendingShowToken !== tokenAtReady)
            return;
        if (instance.presentation === 'docked') {
            instance.isVisible = true;
            this.emitStateChange(instance);
            return;
        }
        instance.window.show();
        instance.window.focus();
        instance.isVisible = true;
        this.emitStateChange(instance);
    }
    // ---------------------------------------------------------------------------
    // Agent Control — persistent overlay while agent is using the browser
    // ---------------------------------------------------------------------------
    /**
     * Activate or update the agent control overlay on the browser instance
     * bound to the given session. Called from sessions.ts on browser_* tool_start events.
     */
    setAgentControl(sessionId, meta) {
        for (const instance of this.instances.values()) {
            if (instance.boundSessionId === sessionId) {
                instance.agentControl = {
                    active: true,
                    sessionId,
                    displayName: meta.displayName,
                    intent: meta.intent,
                };
                const label = this.getAgentControlLabel(instance.agentControl);
                this.reapplyAgentControlVisual(instance);
                this.emitStateChange(instance);
                mainLog.info(`[browser-pane] agent control activated session=${sessionId} label=${label}`);
                return;
            }
        }
    }
    /**
     * Clear the agent control overlay for the given session.
     * Called on explicit browser_tool release and session/window teardown.
     */
    clearAgentControl(sessionId) {
        for (const instance of this.instances.values()) {
            if (instance.boundSessionId === sessionId && instance.agentControl?.active) {
                instance.agentControl = null;
                this.applyAgentControlLock(instance, false);
                this.updateNativeOverlayState(instance);
                this.emitStateChange(instance);
                mainLog.info(`[browser-pane] agent control released session=${sessionId}`);
            }
        }
    }
    clearAgentControlForInstance(instanceId, sessionId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            return { released: false, reason: `Browser window "${instanceId}" not found.` };
        }
        if (sessionId) {
            if (instance.boundSessionId && instance.boundSessionId !== sessionId) {
                return { released: false, reason: `Browser window "${instanceId}" is locked to session ${instance.boundSessionId}.` };
            }
            if (!instance.boundSessionId && instance.ownerSessionId && instance.ownerSessionId !== sessionId) {
                return { released: false, reason: `Browser window "${instanceId}" is currently owned by session ${instance.ownerSessionId}.` };
            }
        }
        if (!instance.agentControl?.active) {
            return { released: false, reason: 'No active agent overlay on the target window.' };
        }
        instance.agentControl = null;
        this.applyAgentControlLock(instance, false);
        this.updateNativeOverlayState(instance);
        this.emitStateChange(instance);
        mainLog.info(`[browser-pane] agent control released instance=${instanceId}${sessionId ? ` session=${sessionId}` : ''}`);
        return { released: true };
    }
    /**
     * Extract a theme color from the page using Safari 26-style heuristics.
     * Priority: media-aware theme-color meta → elementsFromPoint (fixed/sticky headers) → body/html bg.
     * All colors pass through (including white/black) — contrast is handled by the renderer.
     * Guards against stale extraction (URL change during async executeJavaScript).
     */
    async extractThemeColor(instance) {
        if (instance.themeColor)
            return; // already set by did-change-theme-color or observer
        const urlAtStart = instance.currentUrl;
        try {
            const color = await instance.pageView.webContents.executeJavaScript(`(${THEME_COLOR_EXTRACTOR_FN})()`);
            // Guard: if user navigated away during extraction, discard stale result
            if (instance.currentUrl !== urlAtStart)
                return;
            if (typeof color === 'string' && color.length > 0) {
                this.applyThemeColor(instance, color);
            }
        }
        catch {
            // page destroyed or JS error — ignore
        }
    }
    applyThemeColor(instance, color) {
        if (instance.themeColor === color)
            return;
        instance.themeColor = color;
        if (!instance.window.isDestroyed() && !instance.toolbarView.webContents.isDestroyed()) {
            instance.toolbarView.webContents.send(TOOLBAR_CHANNELS.THEME_COLOR, color);
        }
        this.emitStateChange(instance);
    }
    installThemeObserver(instance, allowRetry = true) {
        const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const urlAtInstall = instance.currentUrl;
        instance.themeObserverToken = token;
        void instance.pageView.webContents.executeJavaScript(`
      (() => {
        const token = ${JSON.stringify(token)};
        const prefix = ${JSON.stringify(THEME_COLOR_SIGNAL_PREFIX)} + token + ':';
        const nullSentinel = ${JSON.stringify(THEME_COLOR_NULL_SENTINEL)};
        const extractThemeColor = ${THEME_COLOR_EXTRACTOR_FN};

        const w = window;
        const previousCleanup = w.__CRAFT_THEME_OBSERVER_CLEANUP__;
        if (typeof previousCleanup === 'function') {
          try { previousCleanup(); } catch {}
        }

        let lastColor = '__unset__';
        let rafId = 0;
        let timerId = 0;
        let lastRunAt = 0;
        const minIntervalMs = ${THEME_OBSERVER_MIN_INTERVAL_MS};

        const clearScheduled = () => {
          if (timerId) {
            clearTimeout(timerId);
            timerId = 0;
          }
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        };

        const emit = (color) => {
          const normalized = typeof color === 'string' && color.length > 0 ? color : null;
          if (normalized === lastColor) return;
          lastColor = normalized;
          console.info(prefix + (normalized ?? nullSentinel));
        };

        const run = () => {
          rafId = 0;
          lastRunAt = Date.now();
          try {
            emit(extractThemeColor());
          } catch {}
        };

        const schedule = () => {
          if (rafId || timerId) return;
          const waitMs = Math.max(0, minIntervalMs - (Date.now() - lastRunAt));
          if (waitMs > 0) {
            timerId = setTimeout(() => {
              timerId = 0;
              rafId = requestAnimationFrame(run);
            }, waitMs);
            return;
          }
          rafId = requestAnimationFrame(run);
        };

        const onScroll = () => schedule();
        const onResize = () => schedule();
        const onMutation = () => schedule();

        const headObserver = new MutationObserver(onMutation);
        if (document.head) {
          headObserver.observe(document.head, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['name', 'content', 'media'],
          });
        }

        const rootObserver = new MutationObserver(onMutation);
        if (document.documentElement) {
          rootObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style'],
          });
        }
        if (document.body) {
          rootObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'style'],
          });
        }

        w.addEventListener('scroll', onScroll, { passive: true });
        w.addEventListener('resize', onResize, { passive: true });

        const mql = w.matchMedia('(prefers-color-scheme: dark)');
        const onSchemeChange = () => schedule();
        if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onSchemeChange);
        else if (typeof mql.addListener === 'function') mql.addListener(onSchemeChange);

        w.__CRAFT_THEME_OBSERVER_CLEANUP__ = () => {
          headObserver.disconnect();
          rootObserver.disconnect();
          w.removeEventListener('scroll', onScroll);
          w.removeEventListener('resize', onResize);
          if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onSchemeChange);
          else if (typeof mql.removeListener === 'function') mql.removeListener(onSchemeChange);
          clearScheduled();
        };

        // Fast first color for initial toolbar paint and after SPA route changes
        schedule();
      })()
    `).catch(() => {
            if (!allowRetry)
                return;
            setTimeout(() => {
                if (!this.instances.has(instance.id))
                    return;
                if (instance.currentUrl !== urlAtInstall)
                    return;
                if (instance.themeObserverToken !== token)
                    return;
                this.installThemeObserver(instance, false);
            }, 120);
        });
    }
    scheduleEarlyThemeExtraction(instance, urlAtSchedule) {
        setTimeout(() => {
            if (!this.instances.has(instance.id))
                return;
            if (instance.currentUrl !== urlAtSchedule)
                return;
            void this.extractThemeColor(instance);
        }, EARLY_THEME_EXTRACTION_DELAY_MS);
    }
    getInstanceByWebContentsId(webContentsId) {
        for (const instance of this.instances.values()) {
            if (instance.pageView.webContents.id === webContentsId)
                return instance;
        }
        return undefined;
    }
    registerPopupWindow(parentInstance, popupWindow, sourceUrl) {
        const popupWcId = popupWindow.webContents.id;
        const existingParent = this.popupParentByWebContentsId.get(popupWcId);
        if (existingParent && existingParent !== parentInstance.id) {
            this.unregisterPopupWindow(popupWindow, 'reparented');
        }
        let popups = this.popupWindowsByParentInstanceId.get(parentInstance.id);
        if (!popups) {
            popups = new Set();
            this.popupWindowsByParentInstanceId.set(parentInstance.id, popups);
        }
        popups.add(popupWindow);
        this.popupParentByWebContentsId.set(popupWcId, parentInstance.id);
        const initialUrl = sourceUrl || popupWindow.webContents.getURL?.() || 'about:blank';
        mainLog.info(`[browser-pane] popup created parent=${parentInstance.id} popupWebContentsId=${popupWcId} url=${initialUrl}`);
        popupWindow.webContents.on('did-navigate', (_event, urlFromEvent) => {
            const popupUrl = typeof popupWindow.webContents.getURL === 'function'
                ? popupWindow.webContents.getURL()
                : (urlFromEvent || initialUrl);
            mainLog.info(`[browser-pane] popup did-navigate parent=${parentInstance.id} popupWebContentsId=${popupWcId} url=${popupUrl}`);
        });
        popupWindow.webContents.on('did-redirect-navigation', (_event, popupUrl, isInPlace, isMainFrame) => {
            mainLog.info(`[browser-pane] popup redirect parent=${parentInstance.id} popupWebContentsId=${popupWcId} url=${popupUrl} inPlace=${isInPlace} mainFrame=${isMainFrame}`);
        });
        popupWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            if (!isMainFrame)
                return;
            mainLog.warn(`[browser-pane] popup did-fail-load parent=${parentInstance.id} popupWebContentsId=${popupWcId} code=${errorCode} url=${validatedURL} error=${errorDescription}`);
        });
        popupWindow.on('closed', () => {
            this.unregisterPopupWindow(popupWindow, 'closed');
        });
    }
    unregisterPopupWindow(popupWindow, reason) {
        const popupWcId = popupWindow.webContents.id;
        const parentId = this.popupParentByWebContentsId.get(popupWcId);
        if (!parentId)
            return;
        this.popupParentByWebContentsId.delete(popupWcId);
        const popups = this.popupWindowsByParentInstanceId.get(parentId);
        if (popups) {
            popups.delete(popupWindow);
            if (popups.size === 0) {
                this.popupWindowsByParentInstanceId.delete(parentId);
            }
        }
        mainLog.info(`[browser-pane] popup closed parent=${parentId} popupWebContentsId=${popupWcId} reason=${reason}`);
    }
    closePopupsForParent(parentId, reason) {
        const popups = this.popupWindowsByParentInstanceId.get(parentId);
        if (!popups || popups.size === 0)
            return;
        for (const popupWindow of Array.from(popups)) {
            const popupWcId = popupWindow.webContents.id;
            this.unregisterPopupWindow(popupWindow, reason);
            try {
                if (!popupWindow.isDestroyed()) {
                    popupWindow.destroy();
                }
            }
            catch (error) {
                mainLog.warn(`[browser-pane] popup destroy failed parent=${parentId} popupWebContentsId=${popupWcId} reason=${reason} error=${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    pushNetworkLog(instance, entry) {
        instance.networkLogs.push(entry);
        if (instance.networkLogs.length > MAX_NETWORK_LOG_ENTRIES) {
            instance.networkLogs.splice(0, instance.networkLogs.length - MAX_NETWORK_LOG_ENTRIES);
        }
    }
    pushDownloadLog(instance, entry) {
        instance.downloads.push(entry);
        if (instance.downloads.length > MAX_DOWNLOAD_LOG_ENTRIES) {
            instance.downloads.splice(0, instance.downloads.length - MAX_DOWNLOAD_LOG_ENTRIES);
        }
    }
    resolveDownloadsDir(instance) {
        const sessionId = instance.boundSessionId ?? instance.ownerSessionId;
        if (sessionId && this.sessionPathResolver) {
            const sessionPath = this.sessionPathResolver(sessionId);
            if (sessionPath) {
                const dir = join(sessionPath, 'downloads');
                mkdirSync(dir, { recursive: true });
                return dir;
            }
        }
        // Fallback: OS downloads folder for manual/unbound windows
        return app.getPath('downloads');
    }
    uniqueFilename(dir, filename) {
        if (!existsSync(join(dir, filename)))
            return filename;
        const { name, ext } = parsePath(filename);
        let counter = 1;
        while (existsSync(join(dir, `${name}_${counter}${ext}`))) {
            counter++;
        }
        return `${name}_${counter}${ext}`;
    }
    setupSessionObservers(ses) {
        if (this.partitionObserversInitialized)
            return;
        this.partitionObserversInitialized = true;
        ses.webRequest.onBeforeRequest((details, callback) => {
            const wcId = details.webContentsId;
            if (typeof wcId === 'number' && wcId > 0) {
                const current = this.inFlightRequestsByWebContentsId.get(wcId) ?? 0;
                this.inFlightRequestsByWebContentsId.set(wcId, current + 1);
                this.lastNetworkActivityByWebContentsId.set(wcId, Date.now());
            }
            callback({});
        });
        ses.webRequest.onCompleted((details) => {
            const wcId = details.webContentsId;
            if (typeof wcId !== 'number' || wcId <= 0)
                return;
            const current = this.inFlightRequestsByWebContentsId.get(wcId) ?? 0;
            this.inFlightRequestsByWebContentsId.set(wcId, Math.max(0, current - 1));
            this.lastNetworkActivityByWebContentsId.set(wcId, Date.now());
            const instance = this.getInstanceByWebContentsId(wcId);
            if (!instance)
                return;
            this.pushNetworkLog(instance, {
                timestamp: Date.now(),
                method: details.method ?? 'GET',
                url: details.url ?? '',
                status: details.statusCode ?? 0,
                resourceType: String(details.resourceType ?? 'unknown'),
                ok: (details.statusCode ?? 0) >= 200 && (details.statusCode ?? 0) < 400,
            });
        });
        ses.webRequest.onErrorOccurred((details) => {
            const wcId = details.webContentsId;
            if (typeof wcId !== 'number' || wcId <= 0)
                return;
            const current = this.inFlightRequestsByWebContentsId.get(wcId) ?? 0;
            this.inFlightRequestsByWebContentsId.set(wcId, Math.max(0, current - 1));
            this.lastNetworkActivityByWebContentsId.set(wcId, Date.now());
            const instance = this.getInstanceByWebContentsId(wcId);
            if (!instance)
                return;
            this.pushNetworkLog(instance, {
                timestamp: Date.now(),
                method: details.method ?? 'GET',
                url: details.url ?? '',
                status: 0,
                resourceType: String(details.resourceType ?? 'unknown'),
                ok: false,
            });
        });
        ses.on('will-download', (_event, item, webContents) => {
            const wcId = webContents?.id;
            if (typeof wcId !== 'number')
                return;
            const instance = this.getInstanceByWebContentsId(wcId);
            if (!instance)
                return;
            // Auto-save: set a deterministic path so Electron doesn't show a native dialog
            const downloadsDir = this.resolveDownloadsDir(instance);
            const filename = this.uniqueFilename(downloadsDir, item.getFilename());
            const savePath = join(downloadsDir, filename);
            item.setSavePath(savePath);
            const downloadId = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const started = {
                id: downloadId,
                timestamp: Date.now(),
                url: item.getURL(),
                filename,
                state: 'started',
                bytesReceived: item.getReceivedBytes(),
                totalBytes: item.getTotalBytes(),
                mimeType: item.getMimeType() || 'application/octet-stream',
                savePath,
            };
            this.pushDownloadLog(instance, started);
            const onUpdated = (_e, state) => {
                const latest = instance.downloads.find((d) => d.id === downloadId);
                if (!latest)
                    return;
                latest.bytesReceived = item.getReceivedBytes();
                latest.totalBytes = item.getTotalBytes();
                if (state === 'interrupted')
                    latest.state = 'interrupted';
            };
            item.on('updated', onUpdated);
            item.once('done', (_e, state) => {
                item.removeListener('updated', onUpdated);
                const latest = instance.downloads.find((d) => d.id === downloadId);
                if (!latest)
                    return;
                latest.bytesReceived = item.getReceivedBytes();
                latest.totalBytes = item.getTotalBytes();
                latest.savePath = item.getSavePath();
                latest.state = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted';
            });
        });
    }
    logPermissionDecision(kind, permission, origin) {
        const isNonBlockingNoise = permission === 'background-sync';
        const suffix = isNonBlockingNoise ? ' (non-blocking)' : '';
        const message = `[browser-pane] permission denied (${kind}): ${permission} origin=${origin}${suffix}`;
        if (isNonBlockingNoise) {
            mainLog.info(message);
            return;
        }
        mainLog.warn(message);
    }
    setupSessionPermissions(ses) {
        if (this.partitionPermissionsInitialized)
            return;
        this.partitionPermissionsInitialized = true;
        const allow = new Set([
            'fullscreen',
            'pointerLock',
            'window-management',
            'notifications',
            'geolocation',
            'media',
            'clipboard-read',
            'clipboard-sanitized-write',
            'idle-detection',
        ]);
        if (typeof ses.setPermissionCheckHandler === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ses.setPermissionCheckHandler((_webContents, permission, requestingOrigin, _details) => {
                const allowed = allow.has(permission);
                if (!allowed) {
                    this.logPermissionDecision('check', permission, requestingOrigin);
                }
                return allowed;
            });
        }
        if (typeof ses.setPermissionRequestHandler === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ses.setPermissionRequestHandler((_webContents, permission, callback, details) => {
                const allowed = allow.has(permission);
                if (!allowed) {
                    this.logPermissionDecision('request', permission, details?.requestingOrigin ?? 'unknown');
                }
                callback(allowed);
            });
        }
    }
    isToolbarUiDocumentUrl(url) {
        if (!url)
            return false;
        if (url.startsWith('data:text/html'))
            return true;
        try {
            const parsed = new URL(url);
            return parsed.pathname.toLowerCase().endsWith('/browser-toolbar.html');
        }
        catch {
            return /browser-toolbar\.html(?:$|[?#])/i.test(url);
        }
    }
    setupWindowListeners(instance) {
        const pageWc = instance.pageView.webContents;
        const toolbarWc = instance.toolbarView.webContents;
        const overlayWc = instance.nativeOverlayView.webContents;
        instance.window.on('close', (event) => {
            const explicitDestroy = this.destroyingIds.has(instance.id);
            const interceptToHide = !explicitDestroy && instance.keepAliveOnWindowClose;
            mainLog.info(`[browser-pane] window close requested id=${instance.id} explicitDestroy=${explicitDestroy} keepAlive=${instance.keepAliveOnWindowClose} interceptToHide=${interceptToHide}`);
            if (interceptToHide) {
                event.preventDefault();
                this.hide(instance.id);
            }
        });
        instance.window.on('resize', () => {
            this.layoutAllViews(instance);
        });
        toolbarWc.on('did-finish-load', () => {
            const loadedUrl = typeof toolbarWc.getURL === 'function' ? toolbarWc.getURL() : '';
            if (!this.isToolbarUiDocumentUrl(loadedUrl)) {
                mainLog.info(`[browser-pane] toolbar did-finish-load ignored id=${instance.id} url=${loadedUrl || 'unknown'}`);
                this.pushToolbarState(instance);
                return;
            }
            this.markToolbarReady(instance, 'did-finish-load');
            this.pushToolbarState(instance);
        });
        toolbarWc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            if (!isMainFrame)
                return;
            mainLog.warn(`[browser-pane] toolbar did-fail-load id=${instance.id} code=${errorCode} url=${validatedURL} error=${errorDescription}`);
        });
        pageWc.on('did-start-loading', () => {
            instance.isLoading = true;
            this.resetDockedPageClip(instance);
            this.emitStateChange(instance);
            void this.pushToolbarState(instance);
        });
        pageWc.on('did-stop-loading', () => {
            instance.isLoading = false;
            instance.canGoBack = pageWc.canGoBack();
            instance.canGoForward = pageWc.canGoForward();
            // Drain in-flight count — all pending requests are settled once loading stops
            this.inFlightRequestsByWebContentsId.set(pageWc.id, 0);
            this.lastNetworkActivityByWebContentsId.set(pageWc.id, Date.now());
            this.emitStateChange(instance);
            void this.pushToolbarState(instance);
            void this.extractThemeColor(instance);
            this.reapplyAgentControlVisual(instance);
        });
        pageWc.on('dom-ready', () => {
            this.applyDockedPageClip(instance);
            this.installThemeObserver(instance);
            void this.extractThemeColor(instance);
        });
        pageWc.on('before-input-event', (_event, _input) => {
            if (instance.lockState.active) {
                _event.preventDefault();
            }
        });
        toolbarWc.on('before-input-event', (event) => {
            if (instance.lockState.active) {
                event.preventDefault();
            }
        });
        overlayWc.on('before-input-event', (event, input) => {
            if (!instance.toolbarMenuOverlayActive)
                return;
            const inputType = input.type || '';
            if (inputType === 'mouseDown' || inputType === 'touchStart' || inputType === 'pointerDown') {
                event.preventDefault();
                this.forceCloseToolbarMenu(instance, 'overlay-tap');
            }
        });
        pageWc.on('did-navigate', (_event, urlFromEvent) => {
            const url = typeof pageWc.getURL === 'function' ? pageWc.getURL() : (urlFromEvent || instance.currentUrl);
            const previousUrl = instance.currentUrl;
            if (instance.inPageThemeTimer) {
                clearTimeout(instance.inPageThemeTimer);
                instance.inPageThemeTimer = null;
            }
            instance.themeObserverToken = null;
            instance.themeColor = null; // reset for new page (batched with state push below)
            const normalized = this.normalizePageState(url, pageWc.getTitle());
            instance.currentUrl = normalized.url;
            instance.title = normalized.title;
            mainLog.info(`[browser-pane] did-navigate id=${instance.id} from=${previousUrl} to=${instance.currentUrl}`);
            instance.canGoBack = pageWc.canGoBack();
            instance.canGoForward = pageWc.canGoForward();
            // Drain in-flight count — prior page's requests are cancelled on navigation
            this.inFlightRequestsByWebContentsId.set(pageWc.id, 0);
            this.lastNetworkActivityByWebContentsId.set(pageWc.id, Date.now());
            this.emitStateChange(instance);
            void this.pushToolbarState(instance);
            this.scheduleEarlyThemeExtraction(instance, url);
            this.reapplyAgentControlVisual(instance);
        });
        pageWc.on('did-redirect-navigation', (_event, url, isInPlace, isMainFrame) => {
            if (!isMainFrame)
                return;
            mainLog.info(`[browser-pane] did-redirect-navigation id=${instance.id} url=${url} inPlace=${isInPlace}`);
        });
        pageWc.on('did-navigate-in-page', (_event, urlFromEvent) => {
            const url = typeof pageWc.getURL === 'function' ? pageWc.getURL() : (urlFromEvent || instance.currentUrl);
            const normalized = this.normalizePageState(url, instance.title);
            instance.currentUrl = normalized.url;
            instance.title = normalized.title;
            instance.canGoBack = pageWc.canGoBack();
            instance.canGoForward = pageWc.canGoForward();
            void this.maybeHandleEmptyStateLaunch(instance, url).then((handled) => {
                if (handled) {
                    this.emitStateChange(instance);
                    void this.pushToolbarState(instance);
                    return;
                }
                // SPA route change — re-extract theme color (debounced)
                if (instance.inPageThemeTimer)
                    clearTimeout(instance.inPageThemeTimer);
                instance.themeObserverToken = null;
                instance.themeColor = null;
                this.emitStateChange(instance);
                void this.pushToolbarState(instance);
                this.installThemeObserver(instance);
                instance.inPageThemeTimer = setTimeout(() => { void this.extractThemeColor(instance); }, 300);
                this.reapplyAgentControlVisual(instance);
            }).catch((error) => {
                mainLog.warn(`[browser-pane] empty-state launch handling failed id=${instance.id}: ${error instanceof Error ? error.message : String(error)}`);
            });
        });
        pageWc.on('page-title-updated', (_event, title) => {
            const normalized = this.normalizePageState(pageWc.getURL(), title);
            instance.title = normalized.title;
            this.emitStateChange(instance);
            void this.pushToolbarState(instance);
        });
        pageWc.on('page-favicon-updated', (_event, favicons) => {
            instance.favicon = favicons[0] || null;
            this.emitStateChange(instance);
        });
        pageWc.on('did-change-theme-color', (_event, color) => {
            this.applyThemeColor(instance, color ?? null);
        });
        pageWc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
            mainLog.warn(`[browser-pane] did-fail-load id=${instance.id} code=${errorCode} url=${validatedURL} error=${errorDescription}`);
        });
        pageWc.on('console-message', (_event, level, message) => {
            if (message.startsWith(THEME_COLOR_SIGNAL_PREFIX)) {
                const payload = message.slice(THEME_COLOR_SIGNAL_PREFIX.length);
                const delimiterIdx = payload.indexOf(':');
                if (delimiterIdx > 0) {
                    const token = payload.slice(0, delimiterIdx);
                    const value = payload.slice(delimiterIdx + 1).trim();
                    if (token === instance.themeObserverToken) {
                        if (value === THEME_COLOR_NULL_SENTINEL) {
                            this.applyThemeColor(instance, null);
                        }
                        else if (value.length > 0) {
                            this.applyThemeColor(instance, value);
                        }
                    }
                }
                return;
            }
            const mappedLevel = level >= 3 ? 'error' : level === 2 ? 'warn' : level === 1 ? 'info' : 'log';
            instance.consoleLogs.push({
                timestamp: Date.now(),
                level: mappedLevel,
                message,
            });
            if (instance.consoleLogs.length > MAX_CONSOLE_LOG_ENTRIES) {
                instance.consoleLogs.splice(0, instance.consoleLogs.length - MAX_CONSOLE_LOG_ENTRIES);
            }
            if (level >= 2) {
                mainLog.warn(`[browser-pane] console id=${instance.id} level=${level}: ${message}`);
            }
        });
        pageWc.on('will-navigate', (event, url) => {
            if (url.startsWith(CRAFT_DEEPLINK_SCHEME_PREFIX)) {
                event.preventDefault();
                void this.handleDeepLinkUrl(url);
            }
        });
        pageWc.on('did-create-window', (popupWindow, details) => {
            const popupUrl = details?.url || popupWindow.webContents.getURL?.() || 'about:blank';
            this.registerPopupWindow(instance, popupWindow, popupUrl);
        });
        pageWc.setWindowOpenHandler((details) => {
            mainLog.info(`[browser-pane] window-open requested id=${instance.id} url=${details.url} disposition=${details.disposition ?? 'unknown'} frameName=${details.frameName || 'none'}`);
            if (details.url.startsWith(CRAFT_DEEPLINK_SCHEME_PREFIX)) {
                void this.handleDeepLinkUrl(details.url);
                return { action: 'deny' };
            }
            let parsed;
            try {
                parsed = new URL(details.url);
            }
            catch {
                mainLog.warn(`[browser-pane] window-open denied id=${instance.id} reason=invalid_url url=${details.url}`);
                return { action: 'deny' };
            }
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                mainLog.warn(`[browser-pane] window-open denied id=${instance.id} reason=unsupported_protocol protocol=${parsed.protocol} url=${details.url}`);
                return { action: 'deny' };
            }
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 520,
                    height: 720,
                    minWidth: 420,
                    minHeight: 520,
                    show: true,
                    autoHideMenuBar: true,
                    parent: instance.window,
                    modal: false,
                    webPreferences: {
                        partition: SESSION_PARTITION,
                        session: pageWc.session,
                        contextIsolation: true,
                        nodeIntegration: false,
                        sandbox: true,
                    },
                },
            };
        });
        pageWc.on('focus', () => {
            this.interactedCallback?.(instance.id);
        });
        instance.window.on('focus', () => {
            this.interactedCallback?.(instance.id);
        });
        instance.window.on('show', () => {
            instance.isVisible = true;
            this.emitStateChange(instance);
            this.reapplyAgentControlVisual(instance);
            this.pushToolbarState(instance);
            this.updateNativeOverlayState(instance);
            if (!instance.themeColor) {
                void this.extractThemeColor(instance);
            }
        });
        instance.window.on('hide', () => {
            if (instance.presentation === 'docked')
                return;
            instance.isVisible = false;
            this.emitStateChange(instance);
            this.updateNativeOverlayState(instance);
        });
        instance.window.on('closed', () => {
            this.finalizeDestroyedInstance(instance, 'closed');
        });
    }
    toInfo(instance) {
        return {
            id: instance.id,
            url: instance.currentUrl,
            title: instance.title,
            favicon: instance.favicon,
            isLoading: instance.isLoading,
            canGoBack: instance.canGoBack,
            canGoForward: instance.canGoForward,
            boundSessionId: instance.boundSessionId,
            ownerType: instance.ownerType,
            ownerSessionId: instance.ownerSessionId,
            isVisible: instance.isVisible,
            agentControlActive: !!instance.agentControl?.active,
            themeColor: instance.themeColor,
            presentation: instance.presentation,
            dockExpanded: instance.dockExpanded,
        };
    }
    emitStateChange(instance) {
        if (!this.instances.has(instance.id)) {
            return;
        }
        this.stateChangeCallback?.(this.toInfo(instance));
    }
}
//# sourceMappingURL=browser-pane-manager.js.map