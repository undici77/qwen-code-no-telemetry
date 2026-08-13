/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { ideContextStore } from '@qwen-code/qwen-code-core';
import { readDaemonTrustPolicySnapshot, } from './daemon-trust-policy.js';
import { onTrustedFoldersChanged } from './trustedFolders.js';
export function createDaemonTrustPolicyMonitor(options) {
    const readSnapshot = options.readSnapshot ?? readDaemonTrustPolicySnapshot;
    const pollIntervalMs = options.pollIntervalMs ?? 1000;
    const pendingReasons = new Set();
    let started = false;
    let stopped = false;
    let lastRevision;
    let timer;
    let unsubscribeIde;
    let unsubscribeTrustedFolders;
    let running;
    const drain = async () => {
        while (!stopped && pendingReasons.size > 0) {
            const reasons = new Set(pendingReasons);
            pendingReasons.clear();
            try {
                const snapshot = await readSnapshot();
                if (stopped)
                    return;
                if (snapshot.revision !== lastRevision || reasons.has('manual')) {
                    await options.onSnapshot(snapshot, reasons);
                    lastRevision = snapshot.revision;
                }
            }
            catch (error) {
                options.onError?.(error);
            }
        }
    };
    const startDrain = () => {
        running = drain().finally(() => {
            running = undefined;
            if (!stopped && pendingReasons.size > 0) {
                return startDrain();
            }
            return undefined;
        });
        return running;
    };
    const requestReconcile = (reason = 'manual') => {
        if (stopped)
            return Promise.resolve();
        pendingReasons.add(reason);
        return running ?? startDrain();
    };
    return {
        async start() {
            if (started) {
                await running;
                return;
            }
            started = true;
            unsubscribeIde = ideContextStore.subscribe(() => {
                void requestReconcile('ide');
            });
            unsubscribeTrustedFolders = onTrustedFoldersChanged(() => {
                void requestReconcile('trusted_folders');
            });
            timer = setInterval(() => {
                void requestReconcile('poll');
            }, pollIntervalMs);
            timer.unref?.();
            await requestReconcile('initial');
        },
        requestReconcile,
        stop() {
            if (stopped)
                return;
            stopped = true;
            pendingReasons.clear();
            if (timer)
                clearInterval(timer);
            unsubscribeIde?.();
            unsubscribeTrustedFolders?.();
        },
    };
}
//# sourceMappingURL=daemon-trust-policy-monitor.js.map