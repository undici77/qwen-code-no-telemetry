/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FunctionHookConfig, HookInput, HookExecutionResult, HookEventName, FunctionHookContext } from './types.js';
/**
 * Function Hook Runner - executes function hooks (callbacks)
 * Used primarily for Session Hooks registered via SDK
 */
export declare class FunctionHookRunner {
    /**
     * Execute a function hook
     * @param hookConfig Function hook configuration
     * @param eventName Event name
     * @param input Hook input
     * @param context Optional context (messages, toolUseID, signal)
     */
    execute(hookConfig: FunctionHookConfig, eventName: HookEventName, input: HookInput, context?: FunctionHookContext): Promise<HookExecutionResult>;
    /**
     * Process hook result and convert to execution result
     */
    private processHookResult;
    /**
     * Determine outcome from HookOutput
     */
    private determineOutcome;
    /**
     * Execute callback with timeout support using Promise.race for proper race condition handling
     */
    private executeWithTimeout;
}
