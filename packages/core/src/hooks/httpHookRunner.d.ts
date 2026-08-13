/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HttpHookConfig, HookInput, HookExecutionResult, HookEventName } from './types.js';
/**
 * Callback for displaying status messages during hook execution
 */
export type StatusMessageCallback = (message: string) => void;
/**
 * HTTP Hook Runner - executes HTTP hooks by sending POST requests
 */
export declare class HttpHookRunner {
    private urlValidator;
    private readonly allowPrivateNetworkHosts;
    private readonly executedOnceHooks;
    private statusMessageCallback?;
    constructor(allowedUrls?: string[], allowPrivateNetworkHosts?: boolean);
    /**
     * Set callback for displaying status messages
     */
    setStatusMessageCallback(callback: StatusMessageCallback): void;
    /**
     * Execute an HTTP hook
     * @param hookConfig HTTP hook configuration
     * @param eventName Event name
     * @param input Hook input
     * @param signal Optional AbortSignal to cancel hook execution
     */
    execute(hookConfig: HttpHookConfig, eventName: HookEventName, input: HookInput, signal?: AbortSignal): Promise<HookExecutionResult>;
    /**
     * Parse HTTP response into HookOutput
     */
    private parseResponse;
    /**
     * Truncate output to MAX_OUTPUT_LENGTH characters
     * Per Qwen Code spec: output is capped at 10,000 characters
     */
    private truncateOutput;
    /**
     * Normalize response JSON into HookOutput format
     */
    private normalizeOutput;
    /**
     * Reset once hooks tracking (useful for testing)
     */
    resetOnceHooks(): void;
    /**
     * Update allowed URLs
     */
    updateAllowedUrls(allowedUrls: string[]): void;
}
