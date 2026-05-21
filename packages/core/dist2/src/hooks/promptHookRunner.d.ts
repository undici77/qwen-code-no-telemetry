/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PromptHookConfig, HookInput, HookExecutionResult, HookEventName } from './types.js';
import type { Config } from '../config/config.js';
/**
 * Prompt Hook Runner - executes prompt hooks using LLM evaluation
 */
export declare class PromptHookRunner {
    private config;
    constructor(config: Config);
    /**
     * Execute a prompt hook
     * @param hookConfig Prompt hook configuration
     * @param eventName Event name
     * @param input Hook input
     * @param signal Optional AbortSignal for cancellation
     */
    execute(hookConfig: PromptHookConfig, eventName: HookEventName, input: HookInput, signal?: AbortSignal): Promise<HookExecutionResult>;
    /**
     * Get model to use for prompt hook evaluation
     * Priority: 1. User configured model in hook, 2. Main model from config
     * Uses the user's current model by default to ensure API compatibility
     */
    private getModel;
    /**
     * Replace $ARGUMENTS placeholder in prompt with JSON input
     */
    private replaceArgumentsPlaceholder;
    /**
     * Check whether the current prompt hook model should be treated as a
     * reasoning model for request-shaping compatibility.
     */
    private isReasoningModel;
    /**
     * Execute LLM query with timeout support
     */
    private executeWithTimeout;
    /**
     * Parse LLM response text into structured LLMHookResponse
     */
    private parseResponse;
    /**
     * Process LLM response into HookExecutionResult
     */
    private processResult;
}
/**
 * Factory function to create PromptHookRunner
 */
export declare function createPromptHookRunner(config: Config): PromptHookRunner;
