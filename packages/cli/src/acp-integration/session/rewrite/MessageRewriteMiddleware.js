/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { TurnBuffer } from './TurnBuffer.js';
import { LlmRewriter } from './LlmRewriter.js';
const debugLogger = createDebugLogger('MESSAGE_REWRITE');
/**
 * Middleware that intercepts ACP messages and appends LLM-rewritten
 * versions with _meta.rewritten=true.
 *
 * Original messages are sent as-is (no modification).
 * At the end of each turn, a rewritten message is appended.
 *
 * Flow:
 *   1. Original chunks pass through unmodified
 *   2. Chunks are accumulated in TurnBuffer
 *   3. When a turn ends (tool_call starts, or session ends),
 *      LlmRewriter rewrites the accumulated content
 *   4. Rewritten text is emitted as agent_message_chunk with _meta.rewritten=true
 */
const DEFAULT_REWRITE_TIMEOUT_MS = 30_000;
// Intentionally empty: earlier revisions stripped backgroundTask/source/
// qwenDiscreteMessage from rewritten messages, but those keys are required
// downstream for discrete-message routing (see qwenSessionUpdateHandler).
// Kept as an explicit extension point — add a key here to drop it from a
// rewritten message's _meta.
const REWRITE_META_EXCLUDED_KEYS = new Set([]);
export class MessageRewriteMiddleware {
    sendUpdate;
    turnBuffer;
    rewriter;
    target;
    timeoutMs;
    turnIndex = 0;
    turnMeta;
    constructor(config, rewriteConfig, sendUpdate) {
        this.sendUpdate = sendUpdate;
        this.turnBuffer = new TurnBuffer();
        this.rewriter = new LlmRewriter(config, rewriteConfig);
        this.target = rewriteConfig.target;
        this.timeoutMs = rewriteConfig.timeoutMs ?? DEFAULT_REWRITE_TIMEOUT_MS;
    }
    /**
     * Intercept an ACP update. Original messages pass through,
     * thought/message chunks are also accumulated for turn-end rewriting.
     */
    async interceptUpdate(update, signal) {
        const updateRecord = update;
        const updateType = updateRecord['sessionUpdate'];
        // tool_call signals turn boundary — flush before passing through
        if (updateType === 'tool_call') {
            await this.flushTurn(signal);
            this.turnBuffer.markToolCall();
            return this.sendUpdate(update);
        }
        // tool_call_update, plan, available_commands, etc. → pass through
        if (updateType !== 'agent_thought_chunk' &&
            updateType !== 'agent_message_chunk') {
            return this.sendUpdate(update);
        }
        const content = updateRecord['content'];
        const text = content?.['text'] ?? '';
        // Always send original message as-is
        await this.sendUpdate(update);
        if (updateType === 'agent_message_chunk' &&
            updateRecord['_meta']?.['source'] === 'slash_command') {
            return;
        }
        // Accumulate for turn-end rewriting
        let didAccumulate = false;
        if (updateType === 'agent_thought_chunk') {
            if (this.target === 'thought' || this.target === 'all') {
                this.turnBuffer.appendThought(text);
                didAccumulate = true;
            }
        }
        else if (updateType === 'agent_message_chunk') {
            if (this.target === 'message' || this.target === 'all') {
                this.turnBuffer.appendMessage(text);
                didAccumulate = true;
            }
        }
        if (didAccumulate) {
            this.captureTurnMeta(updateRecord);
        }
    }
    /** Pending rewrite promises — all must settle before session exits */
    pendingRewrites = [];
    /**
     * Flush the turn buffer: rewrite accumulated content and emit.
     *
     * Non-blocking: rewrite runs in background, parallel to tool execution.
     *
     * Called when:
     * - A tool_call is about to be emitted (turn boundary)
     * - Usage metadata is emitted (end of model response)
     * - Session prompt ends
     */
    async flushTurn(signal) {
        const content = this.turnBuffer.flush();
        const turnMeta = this.turnMeta;
        this.turnMeta = undefined;
        if (!content)
            return;
        this.turnIndex++;
        const turnIdx = this.turnIndex;
        // Always enforce a timeout, combined with caller's signal if provided
        const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
        const rewriteSignal = signal
            ? AbortSignal.any([signal, timeoutSignal])
            : timeoutSignal;
        this.pendingRewrites.push((async () => {
            try {
                const rewritten = await this.rewriter.rewrite(content, rewriteSignal);
                if (!rewritten) {
                    debugLogger.info(`Turn ${turnIdx}: no rewrite output`);
                    return;
                }
                debugLogger.info(`Turn ${turnIdx}: rewritten ${rewritten.length} chars`);
                // Emit rewritten message with special _meta
                await this.sendUpdate({
                    sessionUpdate: 'agent_message_chunk',
                    content: { type: 'text', text: rewritten },
                    _meta: {
                        ...turnMeta,
                        rewritten: true,
                        turnIndex: turnIdx,
                    },
                });
            }
            catch (error) {
                debugLogger.warn(`Turn ${turnIdx}: rewrite failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        })());
    }
    captureTurnMeta(update) {
        const meta = update['_meta'];
        if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
            return;
        }
        const safeMeta = Object.fromEntries(Object.entries(meta).filter(([key]) => !REWRITE_META_EXCLUDED_KEYS.has(key)));
        if (Object.keys(safeMeta).length === 0)
            return;
        this.turnMeta = {
            ...this.turnMeta,
            ...safeMeta,
        };
    }
    /**
     * Wait for all pending rewrites to complete.
     * Call this before session ends to ensure all rewrites are flushed.
     */
    async waitForPendingRewrites() {
        // Drain in a loop: a flushTurn that lands while we're awaiting appends to
        // pendingRewrites, so snapshotting once and then reassigning to [] would
        // silently drop those late arrivals. Take the current batch, clear the
        // queue so concurrent pushes go into a fresh array, await it, then repeat
        // until nothing new was enqueued.
        while (this.pendingRewrites.length > 0) {
            const inFlight = this.pendingRewrites;
            this.pendingRewrites = [];
            await Promise.allSettled(inFlight);
        }
    }
}
//# sourceMappingURL=MessageRewriteMiddleware.js.map