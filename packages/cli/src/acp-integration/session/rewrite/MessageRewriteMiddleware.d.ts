/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionUpdate } from '@agentclientprotocol/sdk';
import type { Config } from '@qwen-code/qwen-code-core';
import type { MessageRewriteConfig } from './types.js';
export declare class MessageRewriteMiddleware {
    private readonly sendUpdate;
    private readonly turnBuffer;
    private readonly rewriter;
    private readonly target;
    private readonly timeoutMs;
    private turnIndex;
    constructor(config: Config, rewriteConfig: MessageRewriteConfig, sendUpdate: (update: SessionUpdate) => Promise<void>);
    /**
     * Intercept an ACP update. Original messages pass through,
     * thought/message chunks are also accumulated for turn-end rewriting.
     */
    interceptUpdate(update: SessionUpdate, signal?: AbortSignal): Promise<void>;
    /** Pending rewrite promises — all must settle before session exits */
    private pendingRewrites;
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
    flushTurn(signal?: AbortSignal): Promise<void>;
    /**
     * Wait for all pending rewrites to complete.
     * Call this before session ends to ensure all rewrites are flushed.
     */
    waitForPendingRewrites(): Promise<void>;
}
