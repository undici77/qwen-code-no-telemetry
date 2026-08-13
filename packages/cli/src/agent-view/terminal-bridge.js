/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export async function bridgeAgentViewTerminal(options) {
    const disposables = [];
    const bridgeAbort = new AbortController();
    const onDetach = () => bridgeAbort.abort();
    const onStdoutError = () => bridgeAbort.abort();
    let outputWrites = Promise.resolve();
    try {
        if (options.detachSignal?.aborted) {
            bridgeAbort.abort();
        }
        else {
            options.detachSignal?.addEventListener('abort', onDetach, { once: true });
        }
        options.stdout.on('error', onStdoutError);
        const dataDisposable = options.pty.onData((data) => {
            if (bridgeAbort.signal.aborted)
                return;
            outputWrites = outputWrites
                .then(() => writeWithBackpressure(options.stdout, options.pty, toBuffer(data), bridgeAbort.signal))
                .catch(() => {
                bridgeAbort.abort();
            });
        });
        if (dataDisposable) {
            disposables.push(dataDisposable);
        }
        const resizeDisposable = options.onResize?.((size) => {
            if (bridgeAbort.signal.aborted)
                return;
            void Promise.resolve(options.pty.resize?.(size)).catch(() => { });
        });
        if (resizeDisposable) {
            disposables.push(resizeDisposable);
        }
        const reason = await pumpInputToPty(options.stdin, options.pty, bridgeAbort.signal);
        await outputWrites;
        return { reason };
    }
    finally {
        bridgeAbort.abort();
        await outputWrites;
        options.detachSignal?.removeEventListener('abort', onDetach);
        options.stdout.removeListener('error', onStdoutError);
        for (const disposable of disposables.splice(0)) {
            try {
                disposable.dispose();
            }
            catch {
                // Keep tearing down the rest of the bridge.
            }
        }
    }
}
async function pumpInputToPty(stdin, pty, detachSignal) {
    const iterator = createInputIterator(stdin);
    let detached = false;
    try {
        while (!detachSignal?.aborted) {
            const next = await nextInputChunk(iterator, detachSignal);
            if (next === 'detached') {
                detached = true;
                return 'detached';
            }
            if (next.done) {
                return 'stdin-ended';
            }
            try {
                await pty.write(toBuffer(next.value));
            }
            catch {
                detached = true;
                return 'detached';
            }
        }
        detached = true;
        return 'detached';
    }
    finally {
        const returned = iterator.return?.();
        if (detached) {
            void returned?.catch(() => { });
        }
        else {
            await returned;
        }
    }
}
function createInputIterator(stdin) {
    const readableIterator = stdin.iterator;
    if (typeof readableIterator === 'function') {
        return readableIterator.call(stdin, { destroyOnReturn: false });
    }
    return stdin[Symbol.asyncIterator]();
}
async function nextInputChunk(iterator, detachSignal) {
    const next = iterator.next();
    if (!detachSignal)
        return next;
    if (detachSignal.aborted)
        return 'detached';
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            resolve('detached');
        };
        detachSignal.addEventListener('abort', onAbort, {
            once: true,
        });
        void next.then((value) => {
            detachSignal.removeEventListener('abort', onAbort);
            resolve(value);
        }, (error) => {
            detachSignal.removeEventListener('abort', onAbort);
            reject(error);
        });
    });
}
function toBuffer(data) {
    if (Buffer.isBuffer(data))
        return data;
    if (typeof data === 'string')
        return Buffer.from(data, 'utf8');
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}
function writeWithBackpressure(stdout, pty, data, signal) {
    return new Promise((resolve, reject) => {
        let paused = false;
        let settled = false;
        const finish = (error) => {
            if (settled)
                return;
            settled = true;
            if (paused)
                pty.resume?.();
            if (error)
                reject(error);
            else
                resolve();
        };
        const canContinue = stdout.write(data, (error) => {
            if (error) {
                finish(error);
                return;
            }
            if (paused && stdout.writableNeedDrain && !signal.aborted) {
                const onDrain = () => {
                    stdout.removeListener('drain', onDrain);
                    signal.removeEventListener('abort', onAbort);
                    finish();
                };
                const onAbort = () => {
                    stdout.removeListener('drain', onDrain);
                    finish();
                };
                stdout.once('drain', onDrain);
                signal.addEventListener('abort', onAbort, { once: true });
            }
            else {
                finish();
            }
        });
        if (!canContinue && !signal.aborted) {
            paused = true;
            pty.pause?.();
        }
    });
}
//# sourceMappingURL=terminal-bridge.js.map