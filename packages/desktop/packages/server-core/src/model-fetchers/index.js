/**
 * Model Refresh Service
 *
 * Centralized service for fetching and refreshing model lists across all providers.
 * Replaces the scattered fetchAndStore*Models() functions and startCodexModelRefresh().
 *
 * Fallback chain:
 * 1. Provider runtime discovery via backend driver dispatch
 * 2. Persisted connection.models — previously fetched, survives offline/restart
 * 3. MODEL_REGISTRY — hardcoded offline seed data, last resort
 *
 * Qwen is the exception: Qwen Code's ACP response is the source of truth, so
 * discovered models are kept in memory and never persisted to config.json.
 */
import { getLlmConnections, getLlmConnection, } from '@craft-agent/shared/config';
import { MODEL_FETCHERS } from './registry';
import { handlerLog } from './runtime';
// ============================================================
// ModelRefreshService
// ============================================================
class ModelRefreshService {
    fetchers;
    getCredentials;
    timers = new Map();
    inFlight = new Map();
    runtimeModels = new Map();
    constructor(fetchers, getCredentials) {
        this.fetchers = fetchers;
        this.getCredentials = getCredentials;
    }
    /**
     * Fetch models for a connection through the fallback chain.
     * Deduplicates concurrent calls for the same slug — if a refresh is already
     * in progress, callers share the same promise instead of racing.
     */
    async refreshConnection(slug) {
        const existing = this.inFlight.get(slug);
        if (existing)
            return existing;
        const promise = this._doRefresh(slug).finally(() => {
            this.inFlight.delete(slug);
        });
        this.inFlight.set(slug, promise);
        return promise;
    }
    getRuntimeModelState(slug) {
        const state = this.runtimeModels.get(slug);
        if (!state)
            return undefined;
        return {
            models: state.models.map(model => ({ ...model })),
            serverDefault: state.serverDefault,
        };
    }
    setRuntimeModelState(slug, state) {
        const previous = this.runtimeModels.get(slug);
        const sameModels = JSON.stringify(previous?.models ?? []) === JSON.stringify(state.models);
        const sameDefault = previous?.serverDefault === state.serverDefault;
        this.runtimeModels.set(slug, {
            models: state.models.map(model => ({ ...model })),
            serverDefault: state.serverDefault,
        });
        return !(sameModels && sameDefault);
    }
    /**
     * Internal: actual refresh logic with fallback chain.
     * Qwen ACP model metadata remains runtime-only and is never persisted.
     */
    async _doRefresh(slug) {
        const connection = getLlmConnection(slug);
        if (!connection) {
            handlerLog.warn(`Model refresh: connection not found: ${slug}`);
            return;
        }
        const providerType = connection.providerType;
        const fetcher = this.fetchers[providerType];
        if (!fetcher) {
            handlerLog.warn(`Model refresh: no fetcher for provider type: ${providerType}`);
            return;
        }
        let newModels = null;
        let serverDefault;
        // Layer 1: Provider API/SDK
        let fetchError = null;
        try {
            const credentials = await this.getCredentials(slug);
            handlerLog.info(`Model refresh [${slug}]: fetching (provider=${connection.providerType})`);
            const result = await fetcher.fetchModels(connection, credentials);
            newModels = result.models;
            serverDefault = result.serverDefault;
            handlerLog.info(`Model refresh [${slug}]: fetched ${newModels.length} models from provider: ${newModels.map(m => m.id).join(', ')}`);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            fetchError = error instanceof Error ? error : new Error(msg);
            handlerLog.warn(`Model refresh [${slug}]: provider fetch failed: ${msg}`);
        }
        if (newModels && newModels.length > 0) {
            this.setRuntimeModelState(slug, { models: newModels, serverDefault });
        }
        else {
            handlerLog.warn(`Model refresh [${slug}]: no ACP models available`);
            throw fetchError ?? new Error(`Model refresh [${slug}]: no ACP models available`);
        }
    }
    /**
     * Start periodic refresh timers for all existing connections.
     * Also runs an immediate non-blocking fetch for each.
     * Call on app startup after IPC handlers are registered.
     */
    startAll() {
        const connections = getLlmConnections();
        for (const conn of connections) {
            const providerType = conn.providerType;
            const fetcher = this.fetchers[providerType];
            if (!fetcher)
                continue;
            // Immediate non-blocking fetch
            this.refreshConnection(conn.slug).catch(err => {
                handlerLog.warn(`Initial model refresh failed for ${conn.slug}: ${err instanceof Error ? err.message : err}`);
            });
            if (fetcher.refreshIntervalMs > 0) {
                this.startTimer(conn.slug, fetcher.refreshIntervalMs);
            }
        }
    }
    /**
     * Stop all refresh timers. Call on app quit.
     */
    stopAll() {
        for (const [slug, timer] of this.timers) {
            clearInterval(timer);
            handlerLog.info(`Stopped model refresh timer for ${slug}`);
        }
        this.timers.clear();
        this.runtimeModels.clear();
    }
    /**
     * Trigger an immediate refresh for a specific connection.
     * Also starts a periodic timer if the fetcher supports it.
     * Called when: connection created, auth completed, user clicks refresh.
     */
    async refreshNow(slug) {
        await this.refreshConnection(slug);
        // Ensure periodic timer is running
        const connection = getLlmConnection(slug);
        if (!connection)
            return;
        const providerType = connection.providerType;
        const fetcher = this.fetchers[providerType];
        if (fetcher && fetcher.refreshIntervalMs > 0 && !this.timers.has(slug)) {
            this.startTimer(slug, fetcher.refreshIntervalMs);
        }
    }
    /**
     * Stop timer for a specific connection (e.g., when deleted).
     */
    stopConnection(slug) {
        const timer = this.timers.get(slug);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(slug);
        }
        this.runtimeModels.delete(slug);
    }
    startTimer(slug, intervalMs) {
        // Don't create duplicate timers
        if (this.timers.has(slug))
            return;
        const timer = setInterval(async () => {
            try {
                await this.refreshConnection(slug);
            }
            catch (err) {
                handlerLog.warn(`Periodic model refresh failed for ${slug}: ${err instanceof Error ? err.message : err}`);
            }
        }, intervalMs);
        this.timers.set(slug, timer);
    }
}
// ============================================================
// Singleton Instance
// ============================================================
let _service = null;
/**
 * Get the ModelRefreshService singleton.
 * Must be initialized with initModelRefreshService() before use.
 */
export function getModelRefreshService() {
    if (!_service) {
        throw new Error('ModelRefreshService not initialized. Call initModelRefreshService() first.');
    }
    return _service;
}
/**
 * Initialize the ModelRefreshService with a credential resolver.
 * Called once during app startup.
 */
export function initModelRefreshService(getCredentials) {
    _service = new ModelRefreshService(MODEL_FETCHERS, getCredentials);
    return _service;
}
export { setFetcherPlatform } from './runtime';
//# sourceMappingURL=index.js.map