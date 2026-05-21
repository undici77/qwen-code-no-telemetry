/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { HookRegistry } from './hookRegistry.js';
import { type AggregatedHookResult } from './hookAggregator.js';
import { HookEventHandler } from './hookEventHandler.js';
import type { HookRegistryEntry } from './hookRegistry.js';
import type { DefaultHookOutput, HookPhase } from './types.js';
import type { SessionStartSource, SessionEndReason, AgentType, PermissionMode, PreCompactTrigger, PostCompactTrigger, NotificationType, PermissionSuggestion, HookEventName, FunctionHookCallback, CommandHookConfig, HttpHookConfig, PendingAsyncHook, PendingAsyncOutput, MessagesProvider, StopFailureErrorType, TodoItem, TodoStatus } from './types.js';
import { SessionHooksManager } from './sessionHooksManager.js';
import type { AsyncHookRegistry } from './asyncHookRegistry.js';
export type { MessagesProvider } from './types.js';
/**
 * Main hook system that coordinates all hook-related functionality
 */
export declare class HookSystem {
    private readonly hookRegistry;
    private readonly hookRunner;
    private readonly hookAggregator;
    private readonly hookPlanner;
    private readonly hookEventHandler;
    private readonly sessionHooksManager;
    /** Optional provider for automatically fetching conversation history */
    private messagesProvider?;
    constructor(config: Config);
    /**
     * Initialize the hook system
     */
    initialize(): Promise<void>;
    /**
     * Set the messages provider for automatic conversation history passing
     * to function hooks during execution
     */
    setMessagesProvider(provider: MessagesProvider): void;
    /**
     * Get the current messages provider
     */
    getMessagesProvider(): MessagesProvider | undefined;
    /**
     * Get the hook event bus for firing events
     */
    getEventHandler(): HookEventHandler;
    /**
     * Get hook registry for management operations
     */
    getRegistry(): HookRegistry;
    /**
     * Enable or disable a hook
     */
    setHookEnabled(hookName: string, enabled: boolean): void;
    /**
     * Get all registered hooks for display/management
     */
    getAllHooks(): HookRegistryEntry[];
    /**
     * Check if there are any enabled hooks registered for a specific event.
     * This is a fast-path check to avoid expensive MessageBus round-trips
     * when no hooks are configured for a given event.
     */
    hasHooksForEvent(eventName: string, sessionId?: string): boolean;
    fireUserPromptSubmitEvent(prompt: string, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    fireStopEvent(stopHookActive?: boolean, lastAssistantMessage?: string, signal?: AbortSignal): Promise<AggregatedHookResult>;
    fireSessionStartEvent(source: SessionStartSource, model: string, permissionMode?: PermissionMode, agentType?: AgentType, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    fireSessionEndEvent(reason: SessionEndReason, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a PreToolUse event - called before tool execution
     */
    firePreToolUseEvent(toolName: string, toolInput: Record<string, unknown>, toolUseId: string, permissionMode: PermissionMode, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a PostToolUse event - called after successful tool execution
     */
    firePostToolUseEvent(toolName: string, toolInput: Record<string, unknown>, toolResponse: Record<string, unknown>, toolUseId: string, permissionMode: PermissionMode, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a PostToolUseFailure event - called when tool execution fails
     */
    firePostToolUseFailureEvent(toolUseId: string, toolName: string, toolInput: Record<string, unknown>, errorMessage: string, isInterrupt?: boolean, permissionMode?: PermissionMode, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a PreCompact event - called before conversation compaction
     */
    firePreCompactEvent(trigger: PreCompactTrigger, customInstructions?: string, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a Notification event
     */
    fireNotificationEvent(message: string, notificationType: NotificationType, title?: string, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a SubagentStart event - called when a subagent is spawned
     */
    fireSubagentStartEvent(agentId: string, agentType: AgentType | string, permissionMode: PermissionMode, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a SubagentStop event - called when a subagent finishes
     */
    fireSubagentStopEvent(agentId: string, agentType: AgentType | string, agentTranscriptPath: string, lastAssistantMessage: string, stopHookActive: boolean, permissionMode: PermissionMode, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a StopFailure event - called when an API error ends the turn
     * Fire-and-forget: output and exit codes are ignored
     */
    fireStopFailureEvent(error: StopFailureErrorType, errorDetails?: string, lastAssistantMessage?: string, signal?: AbortSignal): Promise<AggregatedHookResult>;
    /**
     * Fire a PostCompact event - called after conversation compaction completes
     */
    firePostCompactEvent(trigger: PostCompactTrigger, compactSummary: string, signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a PermissionRequest event
     */
    firePermissionRequestEvent(toolName: string, toolInput: Record<string, unknown>, permissionMode: PermissionMode, permissionSuggestions?: PermissionSuggestion[], signal?: AbortSignal): Promise<DefaultHookOutput | undefined>;
    /**
     * Fire a TodoCreated event
     * Called when a new todo item is added to the list
     */
    fireTodoCreatedEvent(todoId: string, todoContent: string, todoStatus: TodoStatus, allTodos: TodoItem[], phase: HookPhase, signal?: AbortSignal): Promise<AggregatedHookResult>;
    /**
     * Fire a TodoCompleted event
     * Called when a todo item's status changes to 'completed'
     */
    fireTodoCompletedEvent(todoId: string, todoContent: string, previousStatus: 'pending' | 'in_progress', allTodos: TodoItem[], phase: HookPhase, signal?: AbortSignal): Promise<AggregatedHookResult>;
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
        skillRoot?: string;
    }): string;
    /**
     * Add a command or HTTP hook for a session
     * @param sessionId Session ID
     * @param event Hook event name
     * @param matcher Matcher pattern
     * @param hook Hook configuration (command or HTTP)
     * @param options Additional options
     * @returns Hook ID
     */
    addSessionHook(sessionId: string, event: HookEventName, matcher: string, hook: CommandHookConfig | HttpHookConfig, options?: {
        sequential?: boolean;
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
    removeSessionHook(sessionId: string, hookId: string): boolean;
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
     * Get the session hooks manager
     */
    getSessionHooksManager(): SessionHooksManager;
    /**
     * Get the async hook registry
     */
    getAsyncRegistry(): AsyncHookRegistry;
    /**
     * Get all pending async hooks
     */
    getPendingAsyncHooks(): PendingAsyncHook[];
    /**
     * Get pending async hooks for a specific session
     */
    getPendingAsyncHooksForSession(sessionId: string): PendingAsyncHook[];
    /**
     * Get and clear pending async output for delivery to the next turn
     */
    getPendingAsyncOutput(): PendingAsyncOutput;
    /**
     * Check if there are any pending async outputs
     */
    hasPendingAsyncOutput(): boolean;
    /**
     * Check if there are any running async hooks
     */
    hasRunningAsyncHooks(): boolean;
    /**
     * Check for timed out async hooks and mark them
     */
    checkAsyncHookTimeouts(): void;
    /**
     * Update allowed HTTP hook URLs
     */
    updateAllowedHttpUrls(allowedUrls: string[]): void;
}
