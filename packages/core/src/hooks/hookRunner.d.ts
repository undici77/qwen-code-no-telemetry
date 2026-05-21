/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { HookEventName } from './types.js';
import type { HookConfig, HookInput, HookExecutionResult, FunctionHookContext } from './types.js';
import { AsyncHookRegistry } from './asyncHookRegistry.js';
import type { Config } from '../config/config.js';
/**
 * Hook runner that executes command, HTTP, function, and prompt hooks
 */
export declare class HookRunner {
    private readonly httpRunner;
    private readonly functionRunner;
    private readonly promptRunner;
    private readonly asyncRegistry;
    constructor(allowedHttpUrls?: string[], config?: Config);
    /**
     * Get the async hook registry
     */
    getAsyncRegistry(): AsyncHookRegistry;
    /**
     * Update allowed HTTP URLs
     */
    updateAllowedHttpUrls(allowedUrls: string[]): void;
    /**
     * Execute a single hook
     * @param hookConfig Hook configuration
     * @param eventName Event name
     * @param input Hook input
     * @param contextOrSignal Optional context (for function hooks) or AbortSignal
     */
    executeHook(hookConfig: HookConfig, eventName: HookEventName, input: HookInput, contextOrSignal?: FunctionHookContext | AbortSignal): Promise<HookExecutionResult>;
    /**
     * Check if a hook should be executed asynchronously
     */
    private isAsyncHook;
    /**
     * Get a unique identifier for a hook
     */
    private getHookId;
    /**
     * Get shell configuration for a hook, respecting hookConfig.shell override
     */
    private getShellConfigForHook;
    /**
     * Execute a command hook asynchronously (non-blocking)
     */
    private executeAsyncHook;
    /**
     * Execute a command hook in the background
     */
    private executeCommandHookInBackground;
    /**
     * Execute multiple hooks in parallel
     * @param context Optional function hook context (messages, toolUseID)
     */
    executeHooksParallel(hookConfigs: HookConfig[], eventName: HookEventName, input: HookInput, onHookStart?: (config: HookConfig, index: number) => void, onHookEnd?: (config: HookConfig, result: HookExecutionResult) => void, signal?: AbortSignal, context?: FunctionHookContext): Promise<HookExecutionResult[]>;
    /**
     * Execute multiple hooks sequentially
     * @param context Optional function hook context (messages, toolUseID)
     */
    executeHooksSequential(hookConfigs: HookConfig[], eventName: HookEventName, input: HookInput, onHookStart?: (config: HookConfig, index: number) => void, onHookEnd?: (config: HookConfig, result: HookExecutionResult) => void, signal?: AbortSignal, context?: FunctionHookContext): Promise<HookExecutionResult[]>;
    /**
     * Apply hook output to modify input for the next hook in sequential execution
     */
    private applyHookOutputToInput;
    /**
     * Execute a command hook
     * @param hookConfig Hook configuration
     * @param eventName Event name
     * @param input Hook input
     * @param startTime Start time for duration calculation
     * @param signal Optional AbortSignal to cancel hook execution
     */
    private executeCommandHook;
    /**
     * Expand command with environment variables and input context
     */
    private expandCommand;
    /**
     * Convert plain text output to structured HookOutput
     */
    private convertPlainTextToHookOutput;
}
