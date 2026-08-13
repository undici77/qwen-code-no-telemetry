/**
 * Network proxy manager — configures both Node.js (undici) and Electron session proxies.
 *
 * - Node side: replaces the global undici dispatcher with a ProtocolProxyDispatcher
 *   that routes HTTP/HTTPS through different ProxyAgent instances and respects NO_PROXY.
 * - Electron side: calls session.setProxy() on default + browser-pane sessions.
 */
import { app, session } from 'electron';
import { Agent, Dispatcher, ProxyAgent, setGlobalDispatcher } from 'undici';
import { parseNoProxyRules, shouldBypassProxy, splitCommaSeparated, } from './network-proxy-utils';
import { getNetworkProxySettings, setNetworkProxySettings, } from '@craft-agent/shared/config/storage';
import { BROWSER_PANE_SESSION_PARTITION } from './browser-pane-manager';
import log from './logger';
// Track the current dispatcher so we can close it when reconfiguring
let currentProxyDispatcher = null;
/**
 * Custom undici Dispatcher that routes requests through proxy agents based on protocol,
 * bypasses proxied destinations listed in NO_PROXY rules, and falls back to a direct Agent.
 */
class ProtocolProxyDispatcher extends Dispatcher {
    httpProxy;
    httpsProxy;
    direct;
    rules;
    constructor(opts) {
        super();
        this.httpProxy = opts.httpProxy ? new ProxyAgent(opts.httpProxy) : null;
        this.httpsProxy = opts.httpsProxy ? new ProxyAgent(opts.httpsProxy) : null;
        this.direct = new Agent();
        this.rules = parseNoProxyRules(opts.noProxy);
    }
    dispatch(opts, handler) {
        const url = typeof opts.origin === 'string' ? opts.origin : opts.origin?.toString();
        // If URL matches bypass rules, go direct
        if (url && shouldBypassProxy(url, this.rules)) {
            return this.direct.dispatch(opts, handler);
        }
        // Route based on protocol
        const isHttps = url?.startsWith('https:');
        const proxy = isHttps
            ? (this.httpsProxy ?? this.httpProxy)
            : this.httpProxy;
        if (proxy) {
            return proxy.dispatch(opts, handler);
        }
        return this.direct.dispatch(opts, handler);
    }
    async close() {
        await Promise.all([
            this.httpProxy?.close(),
            this.httpsProxy?.close(),
            this.direct.close(),
        ]);
    }
    async destroy() {
        await Promise.all([
            this.httpProxy?.destroy(),
            this.httpsProxy?.destroy(),
            this.direct.destroy(),
        ]);
    }
}
/**
 * Configure the Node.js global undici dispatcher for proxy routing.
 */
function configureNodeProxy(settings) {
    // Close previous dispatcher (proxy or direct — both are tracked)
    if (currentProxyDispatcher) {
        currentProxyDispatcher.close().catch(() => { });
        currentProxyDispatcher = null;
    }
    if (!settings?.enabled || (!settings.httpProxy && !settings.httpsProxy)) {
        // Restore a direct dispatcher and track it so next reconfigure can close it
        const direct = new Agent();
        setGlobalDispatcher(direct);
        currentProxyDispatcher = direct;
        return;
    }
    const dispatcher = new ProtocolProxyDispatcher({
        httpProxy: settings.httpProxy,
        httpsProxy: settings.httpsProxy,
        noProxy: settings.noProxy,
    });
    setGlobalDispatcher(dispatcher);
    currentProxyDispatcher = dispatcher;
}
/**
 * Configure Electron session proxies (default session + browser-pane partition).
 * Requires app to be ready.
 */
async function configureElectronProxy(settings) {
    if (!app.isReady())
        return;
    const proxyConfig = settings?.enabled
        ? buildElectronProxyConfig(settings)
        : { mode: 'direct' };
    const sessions = [
        session.defaultSession,
        session.fromPartition(BROWSER_PANE_SESSION_PARTITION),
    ];
    await Promise.all(sessions.map((ses) => ses.setProxy(proxyConfig)));
}
function buildElectronProxyConfig(settings) {
    const rules = [];
    if (settings.httpsProxy) {
        rules.push(`https=${settings.httpsProxy}`);
    }
    if (settings.httpProxy) {
        rules.push(`http=${settings.httpProxy}`);
    }
    if (rules.length === 0) {
        return { mode: 'direct' };
    }
    return {
        mode: 'fixed_servers',
        proxyRules: rules.join(';'),
        proxyBypassRules: settings.noProxy
            ? splitCommaSeparated(settings.noProxy).join(',')
            : undefined,
    };
}
/**
 * Read persisted proxy settings and apply to both Node and Electron.
 * Safe to call before app.whenReady() — Electron session setup is skipped until ready.
 */
export async function applyConfiguredProxySettings() {
    const settings = getNetworkProxySettings();
    const hasHttpProxy = !!settings?.httpProxy;
    const hasNoProxy = !!settings?.noProxy;
    log.info('[proxy] Applying proxy settings:', {
        enabled: settings?.enabled ?? false,
        hasHttpProxy,
        hasHttpsProxy: !!settings?.httpsProxy,
        hasNoProxy,
    });
    configureNodeProxy(settings);
    await configureElectronProxy(settings);
}
/**
 * Persist new proxy settings and apply immediately.
 */
export async function updateConfiguredProxySettings(settings) {
    setNetworkProxySettings(settings);
    await applyConfiguredProxySettings();
}
//# sourceMappingURL=network-proxy.js.map