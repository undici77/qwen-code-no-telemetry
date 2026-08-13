/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { getToolCallPreparations } from '@qwen-code/qwen-code-core';
/**
 * Tracks preparations exposed to ACP before their complete function calls are
 * parsed. Each model stream gets its own instance so retries, fallbacks, and
 * cancellation cannot leak pending calls into a later attempt.
 */
export class ToolCallPreparationTracker {
    emitter;
    /** Contains only calls whose start frame was emitted successfully. */
    pending = new Map();
    /** Contains calls whose start frame was intentionally suppressed. */
    suppressed = new Set();
    /** Calls parsed completely but not yet handed to tool execution. */
    resolved = new Set();
    constructor(emitter) {
        this.emitter = emitter;
    }
    /**
     * Emits at most one preparing frame per call ID before the full call arrives.
     */
    async observe(response) {
        for (const preparation of getToolCallPreparations(response)) {
            if (this.pending.has(preparation.callId) ||
                this.suppressed.has(preparation.callId)) {
                continue;
            }
            const emitted = await this.emitter.emitStart({
                callId: preparation.callId,
                toolName: preparation.toolName,
                args: {},
                status: 'pending',
                phase: 'preparing',
            });
            if (emitted) {
                this.pending.set(preparation.callId, preparation.toolName);
            }
            else {
                this.suppressed.add(preparation.callId);
            }
        }
    }
    /** Resolves preparations once their complete function calls arrive. */
    resolve(functionCalls) {
        for (const functionCall of functionCalls) {
            if (functionCall.id && this.pending.has(functionCall.id)) {
                this.resolved.add(functionCall.id);
            }
        }
    }
    /**
     * Terminates unresolved preparations. The map is cleared first so repeated
     * cleanup, including re-entry after an emission failure, cannot emit twice.
     */
    async discard(includeResolved = false) {
        const pending = [...this.pending.entries()];
        this.pending.clear();
        const resolved = new Set(this.resolved);
        this.resolved.clear();
        let firstError;
        let hasError = false;
        for (const [callId, toolName] of pending) {
            if (!includeResolved && resolved.has(callId))
                continue;
            try {
                await this.emitter.emitPreparationDiscarded(callId, toolName);
            }
            catch (error) {
                // One failed ACP update must not prevent the remaining calls from being
                // finalized. Preserve the first failure and throw it after all attempts.
                if (!hasError) {
                    firstError = error;
                    hasError = true;
                }
            }
        }
        if (hasError) {
            throw firstError;
        }
    }
}
//# sourceMappingURL=tool-call-preparation-tracker.js.map