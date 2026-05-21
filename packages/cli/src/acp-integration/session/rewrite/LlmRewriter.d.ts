/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { TurnContent, MessageRewriteConfig } from './types.js';
/**
 * Uses LLM to rewrite turn content into business-friendly text.
 * Called at the end of each model turn (after all chunks accumulated).
 */
export declare class LlmRewriter {
    private readonly config;
    private readonly prompt;
    /** Previous successful rewrite outputs, used as context for coherence */
    private outputHistory;
    /** How many previous outputs to include: 0=none, N=last N, Infinity=all */
    private readonly contextTurns;
    private readonly rewriteModel;
    constructor(config: Config, rewriteConfig: MessageRewriteConfig);
    /**
     * Rewrite a turn's content using LLM.
     * Returns null if the turn has no valuable content for users.
     */
    rewrite(turnContent: TurnContent, signal?: AbortSignal): Promise<string | null>;
}
