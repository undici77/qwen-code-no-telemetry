/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import path from 'node:path';
export class PersistedSessionListCache {
    ttlMs;
    maxRetainedSummaries;
    slots = new Map();
    retainedSummaries = 0;
    constructor(ttlMs, maxRetainedSummaries) {
        this.ttlMs = ttlMs;
        this.maxRetainedSummaries = maxRetainedSummaries;
    }
    lookup(scope, loader, options = {}) {
        options.signal?.throwIfAborted();
        const key = this.key(scope);
        let slot = this.slots.get(key);
        if (!slot) {
            slot = { generation: 0 };
            this.slots.set(key, slot);
        }
        const now = Date.now();
        if (slot.value) {
            const cacheAgeMs = Math.max(0, now - slot.value.completedAt);
            if (cacheAgeMs < this.ttlMs) {
                const snapshot = slot.value.snapshot;
                return {
                    status: 'cache_hit',
                    promise: Promise.resolve().then(() => {
                        options.signal?.throwIfAborted();
                        return snapshot;
                    }),
                    cacheAgeMs,
                };
            }
            this.removeValue(slot);
        }
        if (slot.inFlight !== undefined &&
            slot.inFlight.generation === slot.generation &&
            !slot.inFlight.controller.signal.aborted) {
            return {
                status: 'single_flight',
                promise: this.attachWaiter(key, slot, slot.inFlight, options.signal),
            };
        }
        const generation = slot.generation;
        const controller = new AbortController();
        const load = {
            generation,
            controller,
            promise: undefined,
            waiterCount: 0,
            settled: false,
        };
        const managed = Promise.resolve()
            .then(() => {
            controller.signal.throwIfAborted();
            return loader(controller.signal);
        })
            .then((snapshot) => {
            load.settled = true;
            const current = this.slots.get(key);
            if (current === slot && current.inFlight === load) {
                current.inFlight = undefined;
                if (current.generation === generation &&
                    !controller.signal.aborted &&
                    snapshot.sessions.length <= this.maxRetainedSummaries) {
                    this.installValue(key, current, snapshot);
                }
                else if (current.value === undefined) {
                    this.slots.delete(key);
                }
            }
            return snapshot;
        }, (error) => {
            load.settled = true;
            const current = this.slots.get(key);
            if (current === slot && current.inFlight === load) {
                current.inFlight = undefined;
                if (current.value === undefined)
                    this.slots.delete(key);
            }
            throw error;
        });
        load.promise = managed;
        slot.inFlight = load;
        return {
            status: 'scan',
            promise: this.attachWaiter(key, slot, load, options.signal),
        };
    }
    invalidate(scope) {
        const key = this.key(scope);
        const slot = this.slots.get(key);
        if (!slot)
            return;
        slot.generation += 1;
        this.removeValue(slot);
        if (slot.inFlight === undefined)
            this.slots.delete(key);
    }
    clear() {
        for (const slot of this.slots.values()) {
            if (slot.value)
                clearTimeout(slot.value.expiryTimer);
        }
        this.slots.clear();
        this.retainedSummaries = 0;
    }
    installValue(key, slot, snapshot) {
        const completedAt = Date.now();
        this.evictFor(snapshot.sessions.length);
        const remainingTtlMs = Math.max(0, this.ttlMs - (Date.now() - completedAt));
        const expiryTimer = setTimeout(() => {
            const current = this.slots.get(key);
            if (current !== slot || current.value?.expiryTimer !== expiryTimer) {
                return;
            }
            this.removeValue(current);
            if (current.inFlight === undefined)
                this.slots.delete(key);
        }, remainingTtlMs);
        if (typeof expiryTimer.unref === 'function')
            expiryTimer.unref();
        const value = { snapshot, completedAt, expiryTimer };
        slot.value = value;
        this.retainedSummaries += snapshot.sessions.length;
    }
    evictFor(incomingSummaries) {
        while (this.retainedSummaries + incomingSummaries >
            this.maxRetainedSummaries) {
            let oldest;
            for (const [key, slot] of this.slots) {
                if (slot.value &&
                    (oldest === undefined || slot.value.completedAt < oldest.completedAt)) {
                    oldest = { key, slot, completedAt: slot.value.completedAt };
                }
            }
            if (!oldest)
                return;
            this.removeValue(oldest.slot);
            if (oldest.slot.inFlight === undefined)
                this.slots.delete(oldest.key);
        }
    }
    removeValue(slot) {
        const value = slot.value;
        if (!value)
            return;
        clearTimeout(value.expiryTimer);
        this.retainedSummaries -= value.snapshot.sessions.length;
        slot.value = undefined;
    }
    attachWaiter(key, slot, load, signal) {
        load.waiterCount += 1;
        return new Promise((resolve, reject) => {
            let settled = false;
            const settle = (finish) => {
                if (settled)
                    return;
                settled = true;
                signal?.removeEventListener('abort', onAbort);
                load.waiterCount -= 1;
                if (load.waiterCount === 0 && !load.settled) {
                    load.controller.abort(new DOMException('No active session list waiters', 'AbortError'));
                    const current = this.slots.get(key);
                    if (current === slot && current.inFlight === load) {
                        current.inFlight = undefined;
                        if (current.value === undefined)
                            this.slots.delete(key);
                    }
                }
                finish();
            };
            const onAbort = () => {
                if (load.settled)
                    return;
                settle(() => reject(signal?.reason));
            };
            signal?.addEventListener('abort', onAbort, { once: true });
            if (signal?.aborted)
                onAbort();
            void load.promise.then((snapshot) => settle(() => resolve(snapshot)), (error) => settle(() => reject(error)));
        });
    }
    key(scope) {
        return JSON.stringify([
            path.resolve(scope.runtimeBaseDir),
            scope.workspaceCwd,
            scope.archiveState,
        ]);
    }
}
//# sourceMappingURL=persisted-session-list-cache.js.map