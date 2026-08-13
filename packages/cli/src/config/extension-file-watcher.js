/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { watch as watchFs } from 'chokidar';
import { createDebugLogger, isSubpath, Storage, } from '@qwen-code/qwen-code-core';
import { ExtensionRefreshState } from './extension-refresh-state.js';
const debugLogger = createDebugLogger('EXTENSION_FILE_WATCHER');
const TOP_LEVEL_FILES = new Set(['extension-enablement.json']);
const EXTENSION_FILES = new Set([
    'qwen-extension.json',
    '.qwen-extension-install.json',
]);
// Keep these sets in sync with extension directory conventions. New runtime
// directories must be classified here as either content-auto-refreshable or
// package-stale.
const AUTO_REFRESH_DIRS = new Set(['commands', 'skills', 'agents']);
const STALE_DIRS = new Set(['hooks']);
export class ExtensionFileWatcher {
    config;
    extensionsDir;
    refreshState;
    watcher;
    bootstrapWatcher;
    mutationListenerDisposer;
    mutationSuppressionEnds = new Map();
    staleFiles = new Set();
    watching = false;
    watchGeneration = 0;
    storeStatePath;
    generationPoller;
    observedStoreGeneration;
    constructor(config, extensionsDir = Storage.getUserExtensionsDir(), refreshState = new ExtensionRefreshState(), storeStatePath) {
        this.config = config;
        this.extensionsDir = extensionsDir;
        this.refreshState = refreshState;
        this.storeStatePath =
            storeStatePath ??
                path.join(path.dirname(this.extensionsDir), 'extension-store', 'state.json');
        this.observedStoreGeneration = this.readStoreGeneration();
    }
    startWatching() {
        this.stopWatching();
        this.watching = true;
        const generation = ++this.watchGeneration;
        this.subscribeExtensionManagerMutations();
        this.staleFiles = this.getStaleFiles();
        const roots = this.getWatchRoots();
        if (roots.length > 0) {
            this.watcher = watchFs(roots, {
                ignoreInitial: true,
                followSymlinks: false,
                awaitWriteFinish: {
                    stabilityThreshold: 200,
                    pollInterval: 50,
                },
                ignored: (filePath) => this.isIgnored(filePath),
            })
                .on('all', (event, changedPath) => {
                if (generation !== this.watchGeneration)
                    return;
                const resolvedPath = path.resolve(changedPath);
                const action = this.getRefreshAction(event, resolvedPath);
                let marked = false;
                if (action === 'auto') {
                    marked = this.refreshState.markExtensionContentChanged('extension content files changed');
                }
                else if (action === 'stale') {
                    marked = this.refreshState.markExtensionsChanged('extension files changed');
                }
                debugLogger.debug('Extension file event classified', {
                    event,
                    path: resolvedPath,
                    action,
                    marked,
                });
            })
                .on('error', (error) => {
                debugLogger.warn('Extension file watcher error:', error);
            });
        }
        if (!fs.existsSync(this.extensionsDir)) {
            this.watchExtensionsParent();
        }
        this.startGenerationPolling();
    }
    stopWatching() {
        const watcher = this.watcher;
        const bootstrapWatcher = this.bootstrapWatcher;
        this.watcher = undefined;
        this.bootstrapWatcher = undefined;
        this.watching = false;
        this.watchGeneration++;
        if (this.generationPoller)
            clearInterval(this.generationPoller);
        this.generationPoller = undefined;
        this.mutationListenerDisposer?.();
        this.mutationListenerDisposer = undefined;
        this.endPendingMutationSuppressions();
        watcher?.close().catch((error) => {
            debugLogger.warn('Extension file watcher close error:', error);
        });
        bootstrapWatcher?.close().catch((error) => {
            debugLogger.warn('Extension bootstrap watcher close error:', error);
        });
    }
    restartWatching() {
        this.startWatching();
    }
    getWatchRoots() {
        const roots = new Set();
        if (fs.existsSync(this.extensionsDir)) {
            roots.add(this.extensionsDir);
        }
        roots.add(this.storeStatePath);
        for (const extension of this.config.getActiveExtensions()) {
            if (extension.installMetadata?.type === 'link') {
                const rawSource = extension.installMetadata.source;
                const source = rawSource ? path.resolve(rawSource) : undefined;
                if (source && fs.existsSync(source)) {
                    roots.add(source);
                }
            }
        }
        return [...roots];
    }
    getStaleFiles() {
        const files = new Set();
        for (const extension of this.config.getActiveExtensions()) {
            for (const filePath of extension.contextFiles) {
                files.add(path.resolve(filePath));
            }
            const configured = extension.config.contextFileName;
            const names = configured === undefined
                ? ['QWEN.md']
                : Array.isArray(configured)
                    ? configured
                    : [configured];
            for (const name of names) {
                files.add(path.resolve(extension.path, name));
            }
            this.addManifestFileReference(files, extension.path, extension.config.hooks);
            this.addManifestFileReference(files, extension.path, extension.config.lspServers);
        }
        return files;
    }
    addManifestFileReference(files, extensionPath, value) {
        if (typeof value !== 'string')
            return;
        files.add(path.isAbsolute(value)
            ? path.resolve(value)
            : path.resolve(extensionPath, value));
    }
    watchExtensionsParent() {
        this.closeBootstrapWatcher();
        const parentDir = path.dirname(this.extensionsDir);
        const dirBasename = path.basename(this.extensionsDir);
        const generation = this.watchGeneration;
        this.bootstrapWatcher = watchFs(parentDir, {
            ignoreInitial: true,
            followSymlinks: false,
            depth: 0,
            ignored: (filePath) => filePath !== parentDir && path.basename(filePath) !== dirBasename,
        })
            .on('all', (_event, changedPath) => {
            if (generation !== this.watchGeneration)
                return;
            if (path.basename(changedPath) !== dirBasename)
                return;
            if (!fs.existsSync(this.extensionsDir))
                return;
            this.refreshState.markExtensionsChanged('extension directory created');
            queueMicrotask(() => {
                if (this.watching) {
                    this.restartWatching();
                }
            });
        })
            .on('error', (error) => {
            debugLogger.warn('Extension bootstrap watcher error:', error);
        });
    }
    getRefreshAction(event, changedPath) {
        if (changedPath === path.resolve(this.storeStatePath)) {
            const generation = this.readStoreGeneration();
            if (generation !== undefined) {
                this.markStoreGenerationChanged(generation, true);
            }
            else {
                this.refreshState.markExtensionsChanged('extension store generation changed');
            }
            return false;
        }
        if (this.staleFiles.has(changedPath)) {
            return 'stale';
        }
        if (changedPath === path.resolve(this.extensionsDir)) {
            if (event === 'unlinkDir') {
                this.watchExtensionsParent();
                return 'stale';
            }
            return false;
        }
        if (isSubpath(this.extensionsDir, changedPath)) {
            return this.getUserExtensionRefreshAction(event, changedPath);
        }
        return this.getLinkedExtensionRefreshAction(changedPath);
    }
    getUserExtensionRefreshAction(event, changedPath) {
        const relative = path.relative(this.extensionsDir, changedPath);
        const parts = relative.split(path.sep).filter(Boolean);
        if (parts.length === 1) {
            if (TOP_LEVEL_FILES.has(parts[0]))
                return 'stale';
            if (event === 'addDir' || event === 'unlinkDir')
                return 'stale';
            return false;
        }
        if (!fs.existsSync(path.join(this.extensionsDir, parts[0], 'qwen-extension.json'))) {
            return 'stale';
        }
        const runtimePath = parts.slice(1);
        return this.getRuntimePathRefreshAction(runtimePath);
    }
    getLinkedExtensionRefreshAction(changedPath) {
        for (const extension of this.config.getActiveExtensions()) {
            if (extension.installMetadata?.type !== 'link')
                continue;
            const rawSource = extension.installMetadata.source;
            const source = rawSource ? path.resolve(rawSource) : undefined;
            if (!source || !isSubpath(source, changedPath))
                continue;
            const relative = path.relative(source, changedPath);
            const parts = relative.split(path.sep).filter(Boolean);
            return parts.length === 0
                ? 'stale'
                : this.getRuntimePathRefreshAction(parts);
        }
        return false;
    }
    getRuntimePathRefreshAction(parts) {
        if (EXTENSION_FILES.has(parts[0]) || STALE_DIRS.has(parts[0])) {
            return 'stale';
        }
        if (AUTO_REFRESH_DIRS.has(parts[0])) {
            return 'auto';
        }
        return false;
    }
    isIgnored(filePath) {
        const normalized = filePath.replace(/\\/g, '/');
        const searchablePath = `/${normalized}/`;
        if (searchablePath.includes('/node_modules/') ||
            searchablePath.includes('/.git/')) {
            return true;
        }
        const basename = normalized.split('/').pop() ?? '';
        return (basename === '.DS_Store' ||
            basename.endsWith('~') ||
            basename.endsWith('.swp') ||
            basename.endsWith('.tmp'));
    }
    subscribeExtensionManagerMutations() {
        const manager = this.config.getExtensionManager();
        this.mutationListenerDisposer = manager.addMutationListener((event) => {
            if (event.phase === 'start') {
                this.mutationSuppressionEnds.set(event.id, this.refreshState.beginSuppression(() => this.restartAfterMutation()));
                return;
            }
            const endSuppression = this.mutationSuppressionEnds.get(event.id);
            if (!endSuppression) {
                return;
            }
            this.mutationSuppressionEnds.delete(event.id);
            endSuppression();
        });
    }
    endPendingMutationSuppressions() {
        const endSuppressions = [...this.mutationSuppressionEnds.values()];
        this.mutationSuppressionEnds.clear();
        for (const endSuppression of endSuppressions) {
            endSuppression();
        }
    }
    restartAfterMutation() {
        if (this.watching) {
            this.restartWatching();
        }
    }
    closeBootstrapWatcher() {
        const bootstrapWatcher = this.bootstrapWatcher;
        this.bootstrapWatcher = undefined;
        bootstrapWatcher?.close().catch((error) => {
            debugLogger.warn('Extension bootstrap watcher close error:', error);
        });
    }
    startGenerationPolling() {
        if (this.generationPoller)
            clearInterval(this.generationPoller);
        this.pollStoreGeneration();
        this.generationPoller = setInterval(() => this.pollStoreGeneration(), 30_000);
        this.generationPoller.unref?.();
    }
    pollStoreGeneration() {
        const generation = this.readStoreGeneration();
        if (generation === undefined)
            return;
        this.markStoreGenerationChanged(generation);
    }
    markStoreGenerationChanged(generation, force = false) {
        const previous = this.observedStoreGeneration;
        // First observed generation — establish baseline without firing a change
        // notification. On a fresh install, state.json doesn't exist yet so the
        // baseline is undefined; the store then writes generation:0 and the next
        // poll sees undefined→0. That transition is baseline establishment, not
        // a real extension change (see #7029).
        if (previous === undefined) {
            this.observedStoreGeneration = generation;
            return;
        }
        if (!force && previous === generation)
            return;
        if (this.refreshState.isSuppressed())
            return;
        const marked = this.refreshState.markExtensionsChanged('extension store generation changed');
        if (marked || this.refreshState.needsExtensionRefresh()) {
            this.observedStoreGeneration = generation;
        }
    }
    readStoreGeneration() {
        try {
            const parsed = JSON.parse(fs.readFileSync(this.storeStatePath, 'utf8'));
            return typeof parsed.generation === 'number'
                ? parsed.generation
                : undefined;
        }
        catch {
            return undefined;
        }
    }
}
//# sourceMappingURL=extension-file-watcher.js.map