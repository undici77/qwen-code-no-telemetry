import type { CommandModule } from 'yargs';
/**
 * Resolve and apply proxy settings for the channel service process.
 *
 * The normal CLI path applies proxy via loadCliConfig → Config constructor →
 * setGlobalDispatcher, but `channel start` never calls loadCliConfig. This
 * replicates the same resolution logic (--proxy flag → settings.proxy →
 * HTTPS_PROXY → HTTP_PROXY) and applies the global dispatcher for native
 * fetch() calls. The resolved URL is also passed to channels via
 * ChannelBaseOptions so adapters can configure their own HTTP clients (e.g.
 * grammy uses node-fetch which needs a separate agent).
 */
export declare function resolveProxy(cliProxy?: string, settingsProxy?: string): string | undefined;
export declare const startCommand: CommandModule<object, {
    name?: string;
}>;
