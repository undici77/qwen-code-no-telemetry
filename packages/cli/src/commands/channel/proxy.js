import { normalizeProxyUrl } from '@qwen-code/qwen-code-core';
import { loadUndici } from '../../utils/load-undici.js';
/**
 * Resolve and apply proxy settings for channel service processes.
 *
 * The normal CLI path applies proxy via loadCliConfig -> Config constructor ->
 * setGlobalDispatcher, but channel runtimes do not call loadCliConfig. This
 * mirrors that resolution logic and also returns the resolved URL so channel
 * adapters can configure non-fetch HTTP clients.
 *
 * Async because undici loads behind a dynamic import to keep it out of the
 * eager startup closure (issue #7264).
 */
export async function resolveProxy(cliProxy, settingsProxy) {
    const proxyUrl = resolveProxyUrl(cliProxy, settingsProxy);
    if (proxyUrl) {
        const { EnvHttpProxyAgent, setGlobalDispatcher } = await loadUndici();
        setGlobalDispatcher(new EnvHttpProxyAgent({ httpProxy: proxyUrl, httpsProxy: proxyUrl }));
    }
    return proxyUrl;
}
export function resolveProxyUrl(cliProxy, settingsProxy) {
    return normalizeProxyUrl(cliProxy ||
        settingsProxy ||
        process.env['HTTPS_PROXY'] ||
        process.env['https_proxy'] ||
        process.env['HTTP_PROXY'] ||
        process.env['http_proxy']);
}
//# sourceMappingURL=proxy.js.map