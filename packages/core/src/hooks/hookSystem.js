/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { HookRegistry } from './hookRegistry.js';
import { HookRunner } from './hookRunner.js';
import { HookAggregator } from './hookAggregator.js';
import { HookPlanner } from './hookPlanner.js';
import { HookEventHandler } from './hookEventHandler.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { createHookOutput } from './types.js';
import { SessionHooksManager } from './sessionHooksManager.js';
const debugLogger = createDebugLogger('TRUSTED_HOOKS');
/**
 * Main hook system that coordinates all hook-related functionality
 */
export class HookSystem {
    hookRegistry;
    hookRunner;
    hookAggregator;
    hookPlanner;
    hookEventHandler;
    sessionHooksManager;
    /** Optional provider for automatically fetching conversation history */
    messagesProvider;
    constructor(config) {
        // Get allowed HTTP URLs from config
        const allowedHttpUrls = config.getAllowedHttpHookUrls();
        // Initialize components
        this.hookRegistry = new HookRegistry(config);
        this.hookRunner = new HookRunner(allowedHttpUrls, config); // Pass config for prompt hooks
        this.hookAggregator = new HookAggregator();
        this.hookPlanner = new HookPlanner(this.hookRegistry);
        this.sessionHooksManager = new SessionHooksManager();
        this.hookEventHandler = new HookEventHandler(config, this.hookPlanner, this.hookRunner, this.hookAggregator, this.sessionHooksManager);
    }
    /**
     * Initialize the hook system
     */
    async initialize() {
        await this.hookRegistry.initialize();
        debugLogger.debug('Hook system initialized successfully');
    }
    /**
     * Set the messages provider for automatic conversation history passing
     * to function hooks during execution
     */
    setMessagesProvider(provider) {
        this.messagesProvider = provider;
        this.hookEventHandler.setMessagesProvider(provider);
    }
    /**
     * Get the current messages provider
     */
    getMessagesProvider() {
        return this.messagesProvider;
    }
    /**
     * Get the hook event bus for firing events
     */
    getEventHandler() {
        return this.hookEventHandler;
    }
    /**
     * Get hook registry for management operations
     */
    getRegistry() {
        return this.hookRegistry;
    }
    /**
     * Enable or disable a hook
     */
    setHookEnabled(hookName, enabled) {
        this.hookRegistry.setHookEnabled(hookName, enabled);
    }
    /**
     * Get all registered hooks for display/management
     */
    getAllHooks() {
        return this.hookRegistry.getAllHooks();
    }
    /**
     * Check if there are any enabled hooks registered for a specific event.
     * This is a fast-path check to avoid expensive MessageBus round-trips
     * when no hooks are configured for a given event.
     */
    hasHooksForEvent(eventName, sessionId) {
        const event = eventName;
        if (this.hookRegistry.getHooksForEvent(event).length > 0)
            return true;
        return this.sessionHooksManager.hasHooksForEvent(event, sessionId);
    }
    async fireUserPromptSubmitEvent(prompt, signal) {
        const result = await this.hookEventHandler.fireUserPromptSubmitEvent(prompt, signal);
        return result.finalOutput
            ? createHookOutput('UserPromptSubmit', result.finalOutput)
            : undefined;
    }
    async fireStopEvent(stopHookActive = false, lastAssistantMessage = '', signal) {
        return this.hookEventHandler.fireStopEvent(stopHookActive, lastAssistantMessage, signal);
    }
    async fireSessionStartEvent(source, model, permissionMode, agentType, signal) {
        const result = await this.hookEventHandler.fireSessionStartEvent(source, model, permissionMode, agentType, signal);
        return result.finalOutput
            ? createHookOutput('SessionStart', result.finalOutput)
            : undefined;
    }
    async fireSessionEndEvent(reason, signal) {
        const result = await this.hookEventHandler.fireSessionEndEvent(reason, signal);
        return result.finalOutput
            ? createHookOutput('SessionEnd', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a PreToolUse event - called before tool execution
     */
    async firePreToolUseEvent(toolName, toolInput, toolUseId, permissionMode, signal) {
        const result = await this.hookEventHandler.firePreToolUseEvent(toolName, toolInput, toolUseId, permissionMode, signal);
        return result.finalOutput
            ? createHookOutput('PreToolUse', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a PostToolUse event - called after successful tool execution
     */
    async firePostToolUseEvent(toolName, toolInput, toolResponse, toolUseId, permissionMode, signal) {
        const result = await this.hookEventHandler.firePostToolUseEvent(toolName, toolInput, toolResponse, toolUseId, permissionMode, signal);
        return result.finalOutput
            ? createHookOutput('PostToolUse', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a PostToolUseFailure event - called when tool execution fails
     */
    async firePostToolUseFailureEvent(toolUseId, toolName, toolInput, errorMessage, isInterrupt, permissionMode, signal) {
        const result = await this.hookEventHandler.firePostToolUseFailureEvent(toolUseId, toolName, toolInput, errorMessage, isInterrupt, permissionMode, signal);
        return result.finalOutput
            ? createHookOutput('PostToolUseFailure', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a PreCompact event - called before conversation compaction
     */
    async firePreCompactEvent(trigger, customInstructions = '', signal) {
        const result = await this.hookEventHandler.firePreCompactEvent(trigger, customInstructions, signal);
        return result.finalOutput
            ? createHookOutput('PreCompact', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a Notification event
     */
    async fireNotificationEvent(message, notificationType, title, signal) {
        const result = await this.hookEventHandler.fireNotificationEvent(message, notificationType, title, signal);
        return result.finalOutput
            ? createHookOutput('Notification', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a SubagentStart event - called when a subagent is spawned
     */
    async fireSubagentStartEvent(agentId, agentType, permissionMode, signal) {
        const result = await this.hookEventHandler.fireSubagentStartEvent(agentId, agentType, permissionMode, signal);
        return result.finalOutput
            ? createHookOutput('SubagentStart', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a SubagentStop event - called when a subagent finishes
     */
    async fireSubagentStopEvent(agentId, agentType, agentTranscriptPath, lastAssistantMessage, stopHookActive, permissionMode, signal) {
        const result = await this.hookEventHandler.fireSubagentStopEvent(agentId, agentType, agentTranscriptPath, lastAssistantMessage, stopHookActive, permissionMode, signal);
        return result.finalOutput
            ? createHookOutput('SubagentStop', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a StopFailure event - called when an API error ends the turn
     * Fire-and-forget: output and exit codes are ignored
     */
    async fireStopFailureEvent(error, errorDetails, lastAssistantMessage, signal) {
        return this.hookEventHandler.fireStopFailureEvent(error, errorDetails, lastAssistantMessage, signal);
    }
    /**
     * Fire a PostCompact event - called after conversation compaction completes
     */
    async firePostCompactEvent(trigger, compactSummary, signal) {
        const result = await this.hookEventHandler.firePostCompactEvent(trigger, compactSummary, signal);
        return result.finalOutput
            ? createHookOutput('PostCompact', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a PermissionRequest event
     */
    async firePermissionRequestEvent(toolName, toolInput, permissionMode, permissionSuggestions, signal) {
        const result = await this.hookEventHandler.firePermissionRequestEvent(toolName, toolInput, permissionMode, permissionSuggestions, signal);
        return result.finalOutput
            ? createHookOutput('PermissionRequest', result.finalOutput)
            : undefined;
    }
    /**
     * Fire a TodoCreated event
     * Called when a new todo item is added to the list
     */
    async fireTodoCreatedEvent(todoId, todoContent, todoStatus, allTodos, phase, signal) {
        return this.hookEventHandler.fireTodoCreatedEvent(todoId, todoContent, todoStatus, allTodos, phase, signal);
    }
    /**
     * Fire a TodoCompleted event
     * Called when a todo item's status changes to 'completed'
     */
    async fireTodoCompletedEvent(todoId, todoContent, previousStatus, allTodos, phase, signal) {
        return this.hookEventHandler.fireTodoCompletedEvent(todoId, todoContent, previousStatus, allTodos, phase, signal);
    }
    // ==================== Session Hooks API ====================
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
    addFunctionHook(sessionId, event, matcher, callback, errorMessage, options) {
        return this.sessionHooksManager.addFunctionHook(sessionId, event, matcher, callback, errorMessage, options);
    }
    /**
     * Add a command or HTTP hook for a session
     * @param sessionId Session ID
     * @param event Hook event name
     * @param matcher Matcher pattern
     * @param hook Hook configuration (command or HTTP)
     * @param options Additional options
     * @returns Hook ID
     */
    addSessionHook(sessionId, event, matcher, hook, options) {
        return this.sessionHooksManager.addSessionHook(sessionId, event, matcher, hook, options);
    }
    /**
     * Remove a function hook by ID
     * @param sessionId Session ID
     * @param event Hook event name
     * @param hookId Hook ID to remove
     * @returns True if hook was found and removed
     */
    removeFunctionHook(sessionId, event, hookId) {
        return this.sessionHooksManager.removeFunctionHook(sessionId, event, hookId);
    }
    /**
     * Remove a hook by ID (searches all events)
     * @param sessionId Session ID
     * @param hookId Hook ID to remove
     * @returns True if hook was found and removed
     */
    removeSessionHook(sessionId, hookId) {
        return this.sessionHooksManager.removeHook(sessionId, hookId);
    }
    /**
     * Check if a session has any hooks registered
     * @param sessionId Session ID
     * @returns True if session has hooks
     */
    hasSessionHooks(sessionId) {
        return this.sessionHooksManager.hasSessionHooks(sessionId);
    }
    /**
     * Clear all hooks for a session
     * @param sessionId Session ID
     */
    clearSessionHooks(sessionId) {
        this.sessionHooksManager.clearSessionHooks(sessionId);
        // Also clear async hooks for this session
        this.getAsyncRegistry().clearSession(sessionId);
    }
    /**
     * Get the session hooks manager
     */
    getSessionHooksManager() {
        return this.sessionHooksManager;
    }
    // ==================== Async Hooks API ====================
    /**
     * Get the async hook registry
     */
    getAsyncRegistry() {
        return this.hookRunner.getAsyncRegistry();
    }
    /**
     * Get all pending async hooks
     */
    getPendingAsyncHooks() {
        return this.getAsyncRegistry().getPendingHooks();
    }
    /**
     * Get pending async hooks for a specific session
     */
    getPendingAsyncHooksForSession(sessionId) {
        return this.getAsyncRegistry().getPendingHooksForSession(sessionId);
    }
    /**
     * Get and clear pending async output for delivery to the next turn
     */
    getPendingAsyncOutput() {
        return this.getAsyncRegistry().getPendingOutput();
    }
    /**
     * Check if there are any pending async outputs
     */
    hasPendingAsyncOutput() {
        return this.getAsyncRegistry().hasPendingOutput();
    }
    /**
     * Check if there are any running async hooks
     */
    hasRunningAsyncHooks() {
        return this.getAsyncRegistry().hasRunningHooks();
    }
    /**
     * Check for timed out async hooks and mark them
     */
    checkAsyncHookTimeouts() {
        this.getAsyncRegistry().checkTimeouts();
    }
    /**
     * Update allowed HTTP hook URLs
     */
    updateAllowedHttpUrls(allowedUrls) {
        this.hookRunner.updateAllowedHttpUrls(allowedUrls);
    }
}
//# sourceMappingURL=hookSystem.js.map