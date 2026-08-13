/**
 * ConfigWatcherManager
 *
 * Provides a simplified interface for watching configuration file changes.
 * Wraps the underlying ConfigWatcher with agent-focused callbacks.
 *
 * Used by backend agents for hot-reloading:
 * - Source config changes (add/update/delete)
 * - Skills config changes
 * - Permissions config changes
 * - Validation errors
 */
import { ConfigWatcher, createConfigWatcher, } from '../../config/watcher.ts';
import { debug } from '../../utils/debug.ts';
// ============================================================
// ConfigWatcherManager Class
// ============================================================
/**
 * Manages config file watching for agent hot-reload functionality.
 *
 * Provides a simplified interface over ConfigWatcher that:
 * - Only exposes agent-relevant callbacks
 * - Handles headless mode (no-op)
 * - Provides consistent debug logging
 */
export class ConfigWatcherManager {
    watcher = null;
    workspaceRootPath;
    isHeadless;
    callbacks;
    onDebugCallback;
    constructor(config, callbacks = {}) {
        this.workspaceRootPath = config.workspaceRootPath;
        this.isHeadless = config.isHeadless ?? false;
        this.callbacks = callbacks;
        this.onDebugCallback = config.onDebug ?? null;
    }
    /**
     * Start watching configuration files.
     * No-op if already running or in headless mode.
     */
    start() {
        if (this.watcher) {
            return; // Already running
        }
        if (this.isHeadless) {
            this.debug('Config watching disabled in headless mode');
            return;
        }
        // Create the underlying ConfigWatcher with our simplified callbacks
        const watcherCallbacks = {
            onSourceChange: (slug, source) => {
                this.debug(`Source changed: ${slug} ${source ? 'updated' : 'deleted'}`);
                this.callbacks.onSourceChange?.(slug, source);
            },
            onSourcesListChange: (sources) => {
                this.debug(`Sources list changed: ${sources.length} sources`);
                this.callbacks.onSourcesListChange?.(sources);
            },
            onSkillChange: (slug, skill) => {
                this.debug(`Skill changed: ${slug} ${skill ? 'updated' : 'deleted'}`);
                this.callbacks.onSkillChange?.(slug, skill);
            },
            onSkillsListChange: (skills) => {
                this.debug(`Skills list changed: ${skills.length} skills`);
                this.callbacks.onSkillsListChange?.(skills);
            },
            onWorkspacePermissionsChange: (workspaceId) => {
                this.debug(`Workspace permissions changed: ${workspaceId}`);
                this.callbacks.onWorkspacePermissionsChange?.(workspaceId);
            },
            onSourcePermissionsChange: (sourceSlug) => {
                this.debug(`Source permissions changed: ${sourceSlug}`);
                this.callbacks.onSourcePermissionsChange?.(sourceSlug);
            },
            onDefaultPermissionsChange: () => {
                this.debug('Default permissions changed');
                this.callbacks.onDefaultPermissionsChange?.();
            },
            onValidationError: (file, result) => {
                // Map ValidationIssue objects to string messages for the callback
                const errorMessages = result.errors.map(e => e.message);
                this.debug(`Config validation error: ${file} - ${errorMessages.join(', ')}`);
                this.callbacks.onValidationError?.(file, errorMessages);
            },
            onError: (file, error) => {
                this.debug(`Config file error: ${file} - ${error.message}`);
                this.callbacks.onError?.(file, error);
            },
        };
        this.watcher = createConfigWatcher(this.workspaceRootPath, watcherCallbacks);
        this.debug('Config watcher started');
    }
    /**
     * Stop watching configuration files.
     */
    stop() {
        if (this.watcher) {
            this.watcher.stop();
            this.watcher = null;
            this.debug('Config watcher stopped');
        }
    }
    /**
     * Check if the watcher is currently running.
     */
    isRunning() {
        return this.watcher !== null;
    }
    /**
     * Update callbacks after construction.
     * Useful when callbacks need to reference agent state that isn't available at construction.
     */
    updateCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    /**
     * Get the workspace root path being watched.
     */
    getWorkspaceRootPath() {
        return this.workspaceRootPath;
    }
    debug(message) {
        const formattedMessage = `[ConfigWatcherManager] ${message}`;
        if (this.onDebugCallback) {
            this.onDebugCallback(formattedMessage);
        }
        debug(formattedMessage);
    }
}
/**
 * Create and optionally start a ConfigWatcherManager.
 *
 * @param config - Manager configuration
 * @param callbacks - Callbacks for config changes
 * @param autoStart - Whether to start watching immediately (default: true)
 * @returns ConfigWatcherManager instance
 */
export function createConfigWatcherManager(config, callbacks = {}, autoStart = true) {
    const manager = new ConfigWatcherManager(config, callbacks);
    if (autoStart) {
        manager.start();
    }
    return manager;
}
//# sourceMappingURL=config-watcher-manager.js.map