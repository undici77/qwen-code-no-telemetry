/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookEventName, CommandHookConfig, HttpHookConfig, FunctionHookCallback, HookConfig, HookExecutionResult } from './types.js';
/**
 * Session hook entry with matcher and configuration
 */
export interface SessionHookEntry {
    hookId: string;
    eventName: HookEventName;
    matcher: string;
    config: HookConfig;
    sequential?: boolean;
    /** Optional skill root path for skill-scoped hooks */
    skillRoot?: string;
}
/**
 * Session Hooks Manager - manages hooks registered at runtime for specific sessions
 * Used primarily for SDK integration where hooks are registered programmatically
 */
export declare class SessionHooksManager {
    private readonly sessions;
    /**
     * Get or create session storage
     */
    private getSessionStorage;
    /**
     * Add a function hook for a session
     * @param sessionId Session ID
     * @param event Hook event name
     * @param matcher Matcher pattern (e.g., 'Bash', '*', 'Write|Edit', or regex)
     * @param callback Function callback to execute
     * @param errorMessage Error message to display on failure
     * @param options Additional options
     * @returns Hook ID for later removal
     */
    addFunctionHook(sessionId: string, event: HookEventName, matcher: string, callback: FunctionHookCallback, errorMessage: string, options?: {
        timeout?: number;
        id?: string;
        name?: string;
        description?: string;
        statusMessage?: string;
        onHookSuccess?: (result: HookExecutionResult) => void;
        skillRoot?: string;
    }): string;
    /**
     * Add a command or HTTP hook for a session
     * @param sessionId Session ID
     * @param event Hook event name
     * @param matcher Matcher pattern
     * @param hook Hook configuration (command or HTTP)
     * @param options Additional options
     */
    addSessionHook(sessionId: string, event: HookEventName, matcher: string, hook: CommandHookConfig | HttpHookConfig, options?: {
        sequential?: boolean;
        skillRoot?: string;
    }): string;
    /**
     * Remove a function hook by ID
     * @param sessionId Session ID
     * @param event Hook event name
     * @param hookId Hook ID to remove
     * @returns True if hook was found and removed
     */
    removeFunctionHook(sessionId: string, event: HookEventName, hookId: string): boolean;
    /**
     * Remove a hook by ID (searches all events)
     * @param sessionId Session ID
     * @param hookId Hook ID to remove
     * @returns True if hook was found and removed
     */
    removeHook(sessionId: string, hookId: string): boolean;
    /**
     * Get all hooks for a session and event
     * @param sessionId Session ID
     * @param event Hook event name
     * @returns Array of session hook entries
     */
    getHooksForEvent(sessionId: string, event: HookEventName): SessionHookEntry[];
    /**
     * Returns true when any session (or just `sessionId`, when provided) has at
     * least one hook registered for `event`. Used as the fast-path skip check by
     * the turn engine so it knows to actually fire the event for session-scoped
     * hooks like `/goal`.
     */
    hasHooksForEvent(event: HookEventName, sessionId?: string): boolean;
    /**
     * Get hooks that match a specific tool/target
     * @param sessionId Session ID
     * @param event Hook event name
     * @param target Target to match (e.g., tool name)
     * @returns Array of matching hook entries
     */
    getMatchingHooks(sessionId: string, event: HookEventName, target: string): SessionHookEntry[];
    /**
     * Check if a target matches a pattern
     * Supports: exact match, '*' wildcard, '|' for alternatives, regex syntax
     *
     * Matching priority:
     * 1. '*' - matches everything
     * 2. Pipe-separated alternatives (e.g., 'Write|Edit|Read')
     * 3. Regex syntax (e.g., '^Bash.*', 'Write|Edit')
     * 4. Exact match (fallback)
     */
    private matchesPattern;
    /**
     * Check if a session has any hooks registered
     * @param sessionId Session ID
     * @returns True if session has hooks
     */
    hasSessionHooks(sessionId: string): boolean;
    /**
     * Clear all hooks for a session
     * @param sessionId Session ID
     */
    clearSessionHooks(sessionId: string): void;
    /**
     * Get all session IDs with registered hooks
     */
    getActiveSessions(): string[];
    /**
     * Get hook count for a session
     */
    getHookCount(sessionId: string): number;
    /**
     * Get all hooks for a session across all events
     * @param sessionId Session ID
     * @returns Array of all session hook entries
     */
    getAllSessionHooks(sessionId: string): SessionHookEntry[];
}
