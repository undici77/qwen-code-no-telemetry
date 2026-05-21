/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Abstract base class for all session event emitters.
 * Provides common functionality and access to session context.
 */
export class BaseEmitter {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    /**
     * Converts an ISO timestamp string or epoch ms to epoch ms number.
     * Returns undefined if the input is not a valid timestamp.
     */
    static toEpochMs(ts) {
        if (typeof ts === 'number') {
            return Number.isFinite(ts) ? ts : undefined;
        }
        if (typeof ts === 'string') {
            const ms = new Date(ts).getTime();
            return Number.isFinite(ms) ? ms : undefined;
        }
        return undefined;
    }
    /**
     * Sends a session update to the ACP client.
     * If a message rewriter is configured, updates pass through it first
     * (original messages are sent as-is, rewritten versions are appended).
     */
    async sendUpdate(update) {
        if (this.ctx.messageRewriter) {
            return this.ctx.messageRewriter.interceptUpdate(update);
        }
        return this.ctx.sendUpdate(update);
    }
    /**
     * Gets the session configuration.
     */
    get config() {
        return this.ctx.config;
    }
    /**
     * Gets the session ID.
     */
    get sessionId() {
        return this.ctx.sessionId;
    }
}
//# sourceMappingURL=BaseEmitter.js.map