/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookOutput, PendingAsyncHook, PendingAsyncOutput } from './types.js';
/**
 * Generate a unique hook ID
 */
export declare function generateHookId(): string;
/**
 * Configuration options for AsyncHookRegistry
 */
export interface AsyncHookRegistryOptions {
    maxConcurrentHooks?: number;
    enableAutoTimeoutCheck?: boolean;
    timeoutCheckInterval?: number;
}
/**
 * Async Hook Registry - tracks and manages asynchronously executing hooks
 * with concurrency limits and automatic timeout checking
 */
export declare class AsyncHookRegistry {
    private readonly pendingHooks;
    private readonly completedOutputs;
    private readonly completedContexts;
    private readonly maxConcurrentHooks;
    private timeoutCheckTimer;
    constructor(options?: AsyncHookRegistryOptions);
    /**
     * Start automatic timeout checking
     */
    private startTimeoutChecker;
    /**
     * Stop automatic timeout checking
     */
    stopTimeoutChecker(): void;
    /**
     * Get current number of running hooks
     */
    getRunningCount(): number;
    /**
     * Check if we can accept more async hooks
     */
    canAcceptMore(): boolean;
    /**
     * Register a new async hook execution
     * @returns hookId if registered, null if rejected due to concurrency limit
     */
    register(hook: Omit<PendingAsyncHook, 'status'>): string | null;
    /**
     * Update hook output (stdout/stderr)
     */
    updateOutput(hookId: string, stdout?: string, stderr?: string): void;
    /**
     * Mark a hook as completed with output
     */
    complete(hookId: string, output?: HookOutput): void;
    /**
     * Mark a hook as failed
     */
    fail(hookId: string, error: Error): void;
    /**
     * Mark a hook as timed out and terminate the process if running
     */
    timeout(hookId: string): void;
    /**
     * Get all pending hooks
     */
    getPendingHooks(): PendingAsyncHook[];
    /**
     * Get pending hooks for a specific session
     */
    getPendingHooksForSession(sessionId: string): PendingAsyncHook[];
    /**
     * Get and clear pending output for delivery to the next turn
     */
    getPendingOutput(): PendingAsyncOutput;
    /**
     * Check if there are any pending outputs
     */
    hasPendingOutput(): boolean;
    /**
     * Check if there are any running hooks
     */
    hasRunningHooks(): boolean;
    /**
     * Check for timed out hooks and mark them
     */
    checkTimeouts(): void;
    /**
     * Clear all pending hooks for a session (e.g., on session end)
     */
    clearSession(sessionId: string): void;
    /**
     * Process completed hook output for delivery
     */
    private processCompletedOutput;
}
