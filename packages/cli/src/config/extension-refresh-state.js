/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { AppEvent } from '../utils/events.js';
const SUPPRESS_AFTER_MS = 1000;
export const EXTENSION_RELOAD_FAILED_REASON = 'extension reload failed';
export class ExtensionRefreshState {
    events;
    extensionRefreshNeeded = false;
    reloadInProgress = false;
    changedDuringReload = false;
    contentChangedDuringReload = false;
    suppressionDepth = 0;
    suppressUntil = 0;
    constructor(events = new EventEmitter()) {
        this.events = events;
    }
    on(event, listener) {
        this.events.on(event, listener);
    }
    off(event, listener) {
        this.events.off(event, listener);
    }
    markExtensionsChanged(reason) {
        if (this.isSuppressed()) {
            return false;
        }
        if (this.reloadInProgress) {
            this.changedDuringReload = true;
            return false;
        }
        if (this.extensionRefreshNeeded) {
            return false;
        }
        this.extensionRefreshNeeded = true;
        this.events.emit(AppEvent.ExtensionRefreshNeeded, reason);
        return true;
    }
    markExtensionContentChanged(reason) {
        if (this.isSuppressed()) {
            return false;
        }
        if (this.reloadInProgress) {
            this.contentChangedDuringReload = true;
            return false;
        }
        if (this.extensionRefreshNeeded) {
            return false;
        }
        this.events.emit(AppEvent.ExtensionContentChanged, reason);
        return true;
    }
    clearExtensionsChanged() {
        const changedDuringReload = this.changedDuringReload;
        const contentChangedDuringReload = this.contentChangedDuringReload;
        this.extensionRefreshNeeded = changedDuringReload;
        this.reloadInProgress = false;
        this.changedDuringReload = false;
        this.contentChangedDuringReload = false;
        this.suppressUntil = 0;
        this.events.emit(AppEvent.ExtensionsReloaded);
        if (changedDuringReload) {
            this.events.emit(AppEvent.ExtensionRefreshNeeded, 'extension files changed during reload');
        }
        else if (contentChangedDuringReload) {
            this.events.emit(AppEvent.ExtensionContentChanged, 'extension content files changed during reload');
        }
    }
    notifyExtensionsReloadStarted() {
        this.reloadInProgress = true;
        this.changedDuringReload = false;
        this.contentChangedDuringReload = false;
        this.events.emit(AppEvent.ExtensionsReloadStarted);
    }
    markExtensionsReloadFailed(reason = EXTENSION_RELOAD_FAILED_REASON) {
        const changedDuringReload = this.changedDuringReload;
        const contentChangedDuringReload = this.contentChangedDuringReload;
        this.extensionRefreshNeeded = true;
        this.reloadInProgress = false;
        this.changedDuringReload = changedDuringReload;
        this.contentChangedDuringReload = contentChangedDuringReload;
        this.suppressUntil = 0;
        this.events.emit(AppEvent.ExtensionsReloaded);
        this.events.emit(AppEvent.ExtensionRefreshNeeded, reason);
    }
    needsExtensionRefresh() {
        return this.extensionRefreshNeeded;
    }
    isSuppressed() {
        return this.suppressionDepth > 0 || Date.now() < this.suppressUntil;
    }
    isReloadInProgress() {
        return this.reloadInProgress;
    }
    beginSuppression(onSettle) {
        this.suppressionDepth++;
        let settled = false;
        return () => {
            if (settled)
                return;
            settled = true;
            this.suppressionDepth = Math.max(0, this.suppressionDepth - 1);
            this.suppressUntil = Date.now() + SUPPRESS_AFTER_MS;
            if (this.suppressionDepth === 0) {
                onSettle?.();
            }
        };
    }
    suppressNotifications(fn, onSettle) {
        const endSuppression = this.beginSuppression(onSettle);
        try {
            const result = fn();
            if (isPromiseLike(result)) {
                return Promise.resolve(result).finally(endSuppression);
            }
            endSuppression();
            return result;
        }
        catch (error) {
            endSuppression();
            throw error;
        }
    }
    resetForTesting() {
        this.extensionRefreshNeeded = false;
        this.reloadInProgress = false;
        this.changedDuringReload = false;
        this.contentChangedDuringReload = false;
        this.suppressionDepth = 0;
        this.suppressUntil = 0;
    }
}
function isPromiseLike(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'then' in value &&
        typeof value.then === 'function');
}
//# sourceMappingURL=extension-refresh-state.js.map