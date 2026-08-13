import { RPC_CHANNELS } from '../../shared/types';
import { pushTyped } from '@craft-agent/server-core/transport';
export const HANDLED_CHANNELS = [
    RPC_CHANNELS.browserPane.CREATE,
    RPC_CHANNELS.browserPane.DESTROY,
    RPC_CHANNELS.browserPane.LIST,
    RPC_CHANNELS.browserPane.NAVIGATE,
    RPC_CHANNELS.browserPane.GO_BACK,
    RPC_CHANNELS.browserPane.GO_FORWARD,
    RPC_CHANNELS.browserPane.RELOAD,
    RPC_CHANNELS.browserPane.STOP,
    RPC_CHANNELS.browserPane.FOCUS,
    RPC_CHANNELS.browserPane.HIDE,
    RPC_CHANNELS.browserPane.DOCK,
    RPC_CHANNELS.browserPane.TOGGLE_DOCK_EXPANDED,
    RPC_CHANNELS.browserPane.LAUNCH,
    RPC_CHANNELS.browserPane.SNAPSHOT,
    RPC_CHANNELS.browserPane.CLICK,
    RPC_CHANNELS.browserPane.FILL,
    RPC_CHANNELS.browserPane.SELECT,
    RPC_CHANNELS.browserPane.SCREENSHOT,
    RPC_CHANNELS.browserPane.EVALUATE,
    RPC_CHANNELS.browserPane.SCROLL,
];
export function registerBrowserHandlers(server, deps) {
    const { browserPaneManager, platform, windowManager } = deps;
    if (!browserPaneManager)
        return;
    server.handle(RPC_CHANNELS.browserPane.CREATE, (_ctx, input) => {
        if (typeof input === 'string') {
            return browserPaneManager.createInstance(input);
        }
        if (input?.bindToSessionId) {
            return browserPaneManager.createForSession(input.bindToSessionId, { show: input.show ?? false });
        }
        return browserPaneManager.createInstance(input?.id, {
            show: input?.show,
            presentation: input?.presentation,
        });
    });
    server.handle(RPC_CHANNELS.browserPane.DESTROY, (_ctx, id) => {
        browserPaneManager.destroyInstance(id);
    });
    server.handle(RPC_CHANNELS.browserPane.LIST, () => {
        return browserPaneManager.listInstances();
    });
    server.handle(RPC_CHANNELS.browserPane.NAVIGATE, async (_ctx, id, url) => {
        try {
            return await browserPaneManager.navigate(id, url);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] navigate failed for ${id}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.GO_BACK, async (_ctx, id) => {
        try {
            return await browserPaneManager.goBack(id);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] goBack failed for ${id}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.GO_FORWARD, async (_ctx, id) => {
        try {
            return await browserPaneManager.goForward(id);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] goForward failed for ${id}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.RELOAD, (_ctx, id) => {
        browserPaneManager.reload(id);
    });
    server.handle(RPC_CHANNELS.browserPane.STOP, (_ctx, id) => {
        browserPaneManager.stop(id);
    });
    server.handle(RPC_CHANNELS.browserPane.FOCUS, (_ctx, id) => {
        browserPaneManager.focus(id);
    });
    server.handle(RPC_CHANNELS.browserPane.HIDE, (_ctx, id) => {
        browserPaneManager.hide(id);
    });
    server.handle(RPC_CHANNELS.browserPane.DOCK, (ctx, id, bounds) => {
        const hostWindow = ctx.webContentsId && windowManager
            ? windowManager.getWindowByWebContentsId(ctx.webContentsId)
            : null;
        if (!hostWindow) {
            platform.logger.warn(`[browser-pane] dock ignored for ${id}: host window unavailable`);
            return;
        }
        browserPaneManager.dock(id, hostWindow, bounds);
    });
    server.handle(RPC_CHANNELS.browserPane.TOGGLE_DOCK_EXPANDED, (_ctx, id) => {
        browserPaneManager.toggleDockExpanded(id);
    });
    server.handle(RPC_CHANNELS.browserPane.LAUNCH, async (ctx, payload) => {
        try {
            return await browserPaneManager.handleEmptyStateLaunchFromRenderer(ctx.webContentsId, payload);
        }
        catch (err) {
            platform.logger.error('[browser-pane] empty-state launch IPC failed:', err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.SNAPSHOT, async (_ctx, id) => {
        try {
            return await browserPaneManager.getAccessibilitySnapshot(id);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] snapshot failed for ${id}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.CLICK, async (_ctx, id, ref) => {
        try {
            return await browserPaneManager.clickElement(id, ref);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] click failed for ${id} ref=${ref}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.FILL, async (_ctx, id, ref, value) => {
        try {
            return await browserPaneManager.fillElement(id, ref, value);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] fill failed for ${id} ref=${ref}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.SELECT, async (_ctx, id, ref, value) => {
        try {
            return await browserPaneManager.selectOption(id, ref, value);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] select failed for ${id} ref=${ref}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.SCREENSHOT, async (_ctx, id, options) => {
        try {
            const result = await browserPaneManager.screenshot(id, options);
            return {
                base64: result.imageBuffer.toString('base64'),
                imageFormat: result.imageFormat,
                metadata: result.metadata,
            };
        }
        catch (err) {
            platform.logger.error(`[browser-pane] screenshot failed for ${id}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.EVALUATE, async (_ctx, id, expression) => {
        try {
            return await browserPaneManager.evaluate(id, expression);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] evaluate failed for ${id}:`, err);
            throw err;
        }
    });
    server.handle(RPC_CHANNELS.browserPane.SCROLL, async (_ctx, id, direction, amount) => {
        const validDirections = ['up', 'down', 'left', 'right'];
        if (!validDirections.includes(direction)) {
            throw new Error(`Invalid scroll direction: ${direction}`);
        }
        try {
            return await browserPaneManager.scroll(id, direction, amount);
        }
        catch (err) {
            platform.logger.error(`[browser-pane] scroll failed for ${id}:`, err);
            throw err;
        }
    });
    // Forward browser state changes to all windows
    browserPaneManager.onStateChange((info) => {
        pushTyped(server, RPC_CHANNELS.browserPane.STATE_CHANGED, { to: 'all' }, info);
    });
    // Forward browser removals so renderer can immediately drop stale tabs
    browserPaneManager.onRemoved((id) => {
        pushTyped(server, RPC_CHANNELS.browserPane.REMOVED, { to: 'all' }, id);
    });
    // Forward browser interaction/focus events so renderer can align panel focus.
    browserPaneManager.onInteracted((id) => {
        pushTyped(server, RPC_CHANNELS.browserPane.INTERACTED, { to: 'all' }, id);
    });
}
//# sourceMappingURL=browser.js.map