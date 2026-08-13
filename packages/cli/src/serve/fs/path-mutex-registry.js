/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export class PathMutexRegistry {
    tails = new Map();
    async runExclusive(key, fn) {
        const previous = this.tails.get(key) ?? Promise.resolve();
        let release;
        const current = new Promise((resolve) => {
            release = resolve;
        });
        const tail = previous.catch(() => undefined).then(() => current);
        this.tails.set(key, tail);
        await previous.catch(() => undefined);
        try {
            return await fn();
        }
        finally {
            release();
            if (this.tails.get(key) === tail)
                this.tails.delete(key);
        }
    }
}
//# sourceMappingURL=path-mutex-registry.js.map