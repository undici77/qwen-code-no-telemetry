/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
function abortReason(signal) {
    return signal.reason ?? new DOMException('Aborted', 'AbortError');
}
export function createFifoTaskQueue(limit) {
    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error(`Task queue limit must be a positive integer, got ${limit}.`);
    }
    let active = 0;
    const queued = [];
    const pump = () => {
        while (active < limit && queued.length > 0) {
            const item = queued.shift();
            const removeAbortListener = item.removeAbortListener;
            item.removeAbortListener = undefined;
            removeAbortListener?.();
            if (item.signal?.aborted) {
                item.reject(abortReason(item.signal));
                continue;
            }
            active += 1;
            try {
                item.onStart?.();
            }
            catch (error) {
                active -= 1;
                item.reject(error);
                continue;
            }
            let released = false;
            const release = () => {
                if (released)
                    return;
                released = true;
                active -= 1;
                pump();
            };
            Promise.resolve()
                .then(() => item.task(release))
                .then(item.resolve, item.reject)
                .finally(release);
        }
    };
    const enqueue = (task, options = {}) => new Promise((resolve, reject) => {
        if (options.signal?.aborted) {
            reject(abortReason(options.signal));
            return;
        }
        const item = {
            task,
            ...(options.signal ? { signal: options.signal } : {}),
            ...(options.onStart ? { onStart: options.onStart } : {}),
            resolve: resolve,
            reject,
        };
        if (options.signal) {
            const onAbort = () => {
                const index = queued.indexOf(item);
                if (index < 0)
                    return;
                queued.splice(index, 1);
                item.removeAbortListener?.();
                reject(abortReason(options.signal));
            };
            options.signal.addEventListener('abort', onAbort, { once: true });
            item.removeAbortListener = () => options.signal?.removeEventListener('abort', onAbort);
        }
        queued.push(item);
        pump();
    });
    const run = (task, options) => enqueue(async () => await task(), options);
    return { run, runUntilReleased: enqueue };
}
//# sourceMappingURL=extension-operation-scheduler.js.map