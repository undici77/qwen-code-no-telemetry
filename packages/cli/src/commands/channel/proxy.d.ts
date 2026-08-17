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
export declare function resolveProxy(
  cliProxy?: string,
  settingsProxy?: string,
): Promise<string | undefined>;
export declare function resolveProxyUrl(
  cliProxy?: string,
  settingsProxy?: string,
): string | undefined;
