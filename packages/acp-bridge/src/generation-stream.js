/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Single-consumer bounded queue for request-scoped generation events.
 * Unlike EventBus, it has no replay or fan-out because generated side content
 * belongs only to the HTTP request that initiated it.
 */
export class GenerationStreamQueue {
    capacity;
    values = [];
    waiter;
    closed = false;
    failure;
    constructor(capacity) {
        this.capacity = capacity;
    }
    push(value) {
        if (this.closed)
            return false;
        if (this.waiter) {
            const waiter = this.waiter;
            this.waiter = undefined;
            waiter.resolve({ value, done: false });
            return true;
        }
        if (this.values.length >= this.capacity)
            return false;
        this.values.push(value);
        return true;
    }
    close() {
        if (this.closed)
            return;
        this.closed = true;
        this.settleWaiter();
    }
    fail(error) {
        if (this.closed)
            return;
        this.failure = error;
        this.closed = true;
        this.settleWaiter();
    }
    settleWaiter() {
        if (!this.waiter)
            return;
        const waiter = this.waiter;
        this.waiter = undefined;
        if (this.failure !== undefined)
            waiter.reject(this.failure);
        else
            waiter.resolve({ value: undefined, done: true });
    }
    next() {
        if (this.values.length > 0) {
            return Promise.resolve({ value: this.values.shift(), done: false });
        }
        if (this.failure !== undefined)
            return Promise.reject(this.failure);
        if (this.closed) {
            return Promise.resolve({ value: undefined, done: true });
        }
        if (this.waiter) {
            return Promise.reject(new Error('GenerationStreamQueue supports only one pending reader'));
        }
        return new Promise((resolve, reject) => {
            this.waiter = { resolve, reject };
        });
    }
    [Symbol.asyncIterator]() {
        return {
            next: () => this.next(),
            return: async () => {
                this.close();
                return { value: undefined, done: true };
            },
        };
    }
}
//# sourceMappingURL=generation-stream.js.map