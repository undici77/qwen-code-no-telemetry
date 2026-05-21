/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { getHookMatcherTarget } from './hookPlanner.js';
import { HookEventName } from './types.js';
import { HookPhase, PermissionMode } from './types.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { logHookCall } from '../telemetry/loggers.js';
import { HookCallEvent } from '../telemetry/types.js';
const debugLogger = createDebugLogger('TRUSTED_HOOKS');
/**
 * Hook event bus that coordinates hook execution across the system
 */
export class HookEventHandler {
    config;
    hookPlanner;
    hookRunner;
    hookAggregator;
    sessionHooksManager;
    /** Optional provider for conversation history */
    messagesProvider;
    constructor(config, hookPlanner, hookRunner, hookAggregator, sessionHooksManager, messagesProvider) {
        this.config = config;
        this.hookPlanner = hookPlanner;
        this.hookRunner = hookRunner;
        this.hookAggregator = hookAggregator;
        this.sessionHooksManager = sessionHooksManager;
        this.messagesProvider = messagesProvider;
    }
    /**
     * Set the messages provider for automatic conversation history passing
     */
    setMessagesProvider(provider) {
        this.messagesProvider = provider;
    }
    /**
     * Get the current messages provider
     */
    getMessagesProvider() {
        return this.messagesProvider;
    }
    /**
     * Fire a UserPromptSubmit event
     * Called by handleHookExecutionRequest - executes hooks directly
     */
    async fireUserPromptSubmitEvent(prompt, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.UserPromptSubmit),
            prompt,
        };
        return this.executeHooks(HookEventName.UserPromptSubmit, input, undefined, signal);
    }
    /**
     * Fire a Stop event
     * Called by handleHookExecutionRequest - executes hooks directly
     */
    async fireStopEvent(stopHookActive = false, lastAssistantMessage = '', signal) {
        const input = {
            ...this.createBaseInput(HookEventName.Stop),
            stop_hook_active: stopHookActive,
            last_assistant_message: lastAssistantMessage,
        };
        return this.executeHooks(HookEventName.Stop, input, undefined, signal);
    }
    /**
     * Fire a SessionStart event
     * Called when a new session starts or resumes
     */
    async fireSessionStartEvent(source, model, permissionMode, agentType, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.SessionStart),
            permission_mode: permissionMode ?? PermissionMode.Default,
            source,
            model,
            agent_type: agentType,
        };
        // Pass source as context for matcher filtering
        return this.executeHooks(HookEventName.SessionStart, input, {
            trigger: source,
        }, signal);
    }
    /**
     * Fire a SessionEnd event
     * Called when a session ends
     */
    async fireSessionEndEvent(reason, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.SessionEnd),
            reason,
        };
        // Pass reason as context for matcher filtering
        return this.executeHooks(HookEventName.SessionEnd, input, {
            trigger: reason,
        }, signal);
    }
    /**
     * Fire a PreToolUse event
     * Called before tool execution begins
     */
    async firePreToolUseEvent(toolName, toolInput, toolUseId, permissionMode, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.PreToolUse),
            permission_mode: permissionMode,
            tool_name: toolName,
            tool_input: toolInput,
            tool_use_id: toolUseId,
        };
        // Pass tool name as context for matcher filtering
        return this.executeHooks(HookEventName.PreToolUse, input, {
            toolName,
        }, signal);
    }
    /**
     * Fire a PostToolUse event
     * Called after successful tool execution
     */
    async firePostToolUseEvent(toolName, toolInput, toolResponse, toolUseId, permissionMode, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.PostToolUse),
            permission_mode: permissionMode,
            tool_name: toolName,
            tool_input: toolInput,
            tool_response: toolResponse,
            tool_use_id: toolUseId,
        };
        // Pass tool name as context for matcher filtering
        return this.executeHooks(HookEventName.PostToolUse, input, {
            toolName,
        }, signal);
    }
    /**
     * Fire a PostToolUseFailure event
     * Called when tool execution fails
     */
    async firePostToolUseFailureEvent(toolUseId, toolName, toolInput, errorMessage, isInterrupt, permissionMode, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.PostToolUseFailure),
            permission_mode: permissionMode ?? PermissionMode.Default,
            tool_use_id: toolUseId,
            tool_name: toolName,
            tool_input: toolInput,
            error: errorMessage,
            is_interrupt: isInterrupt,
        };
        // Pass tool name as context for matcher filtering
        return this.executeHooks(HookEventName.PostToolUseFailure, input, {
            toolName,
        }, signal);
    }
    /**
     * Fire a PreCompact event
     * Called before conversation compaction begins
     */
    async firePreCompactEvent(trigger, customInstructions = '', signal) {
        const input = {
            ...this.createBaseInput(HookEventName.PreCompact),
            trigger,
            custom_instructions: customInstructions,
        };
        // Pass trigger as context for matcher filtering
        return this.executeHooks(HookEventName.PreCompact, input, {
            trigger,
        }, signal);
    }
    /**
     * Fire a Notification event
     */
    async fireNotificationEvent(message, notificationType, title, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.Notification),
            message,
            notification_type: notificationType,
            title,
        };
        // Pass notification_type as context for matcher filtering
        return this.executeHooks(HookEventName.Notification, input, {
            notificationType,
        }, signal);
    }
    /**
     * Fire a PermissionRequest event
     * Called when a permission dialog is about to be shown to the user
     */
    async firePermissionRequestEvent(toolName, toolInput, permissionMode, permissionSuggestions, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.PermissionRequest),
            permission_mode: permissionMode,
            tool_name: toolName,
            tool_input: toolInput,
            permission_suggestions: permissionSuggestions,
        };
        // Pass tool name as context for matcher filtering
        return this.executeHooks(HookEventName.PermissionRequest, input, {
            toolName,
        }, signal);
    }
    /**
     * Fire a SubagentStart event
     * Called when a subagent is spawned via the Agent tool
     */
    async fireSubagentStartEvent(agentId, agentType, permissionMode, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.SubagentStart),
            permission_mode: permissionMode,
            agent_id: agentId,
            agent_type: agentType,
        };
        // Pass agentType as context for matcher filtering
        return this.executeHooks(HookEventName.SubagentStart, input, {
            agentType: String(agentType),
        }, signal);
    }
    /**
     * Fire a SubagentStop event
     * Called when a subagent has finished responding
     */
    async fireSubagentStopEvent(agentId, agentType, agentTranscriptPath, lastAssistantMessage, stopHookActive, permissionMode, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.SubagentStop),
            permission_mode: permissionMode,
            stop_hook_active: stopHookActive,
            agent_id: agentId,
            agent_type: agentType,
            agent_transcript_path: agentTranscriptPath,
            last_assistant_message: lastAssistantMessage,
        };
        // Pass agentType as context for matcher filtering
        return this.executeHooks(HookEventName.SubagentStop, input, {
            agentType: String(agentType),
        }, signal);
    }
    /**
     * Fire a StopFailure event
     * Called when an API error ends the turn (instead of Stop)
     * Fire-and-forget: output and exit codes are ignored
     */
    async fireStopFailureEvent(error, errorDetails, lastAssistantMessage, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.StopFailure),
            error,
            error_details: errorDetails,
            last_assistant_message: lastAssistantMessage,
        };
        // Pass error type as context for matcher filtering (fieldToMatch: 'error')
        return this.executeHooks(HookEventName.StopFailure, input, { error }, signal);
    }
    /**
     * Fire a PostCompact event
     * Called after conversation compaction completes
     */
    async firePostCompactEvent(trigger, compactSummary, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.PostCompact),
            trigger,
            compact_summary: compactSummary,
        };
        // Pass trigger as context for matcher filtering
        return this.executeHooks(HookEventName.PostCompact, input, { trigger }, signal);
    }
    /**
     * Fire a TodoCreated event
     * Called when a new todo item is added to the list
     */
    async fireTodoCreatedEvent(todoId, todoContent, todoStatus, allTodos, phase, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.TodoCreated),
            hook_event_name: 'TodoCreated',
            todo_id: todoId,
            todo_content: todoContent,
            todo_status: todoStatus,
            all_todos: allTodos,
            phase,
        };
        return this.executeHooks(HookEventName.TodoCreated, input, undefined, signal);
    }
    /**
     * Fire a TodoCompleted event
     * Called when a todo item's status changes to 'completed'
     */
    async fireTodoCompletedEvent(todoId, todoContent, previousStatus, allTodos, phase, signal) {
        const input = {
            ...this.createBaseInput(HookEventName.TodoCompleted),
            hook_event_name: 'TodoCompleted',
            todo_id: todoId,
            todo_content: todoContent,
            previous_status: previousStatus,
            all_todos: allTodos,
            phase,
        };
        return this.executeHooks(HookEventName.TodoCompleted, input, undefined, signal);
    }
    /**
     * Execute hooks for a specific event (direct execution without MessageBus)
     * Used as fallback when MessageBus is not available
     */
    async executeHooks(eventName, input, context, signal) {
        const failClosedResult = {
            success: false,
            allOutputs: [],
            errors: [],
            totalDuration: 0,
            finalOutput: eventName === HookEventName.TodoCreated ||
                eventName === HookEventName.TodoCompleted
                ? {
                    decision: 'block',
                    reason: `Hook system failed while processing ${eventName}`,
                }
                : undefined,
        };
        try {
            // Create execution plan from registry hooks
            const plan = this.hookPlanner.createExecutionPlan(eventName, context);
            // Get session hooks and merge with registry hooks
            const sessionId = input.session_id;
            const matcherTarget = getHookMatcherTarget(eventName, context)?.target;
            const sessionHooks = sessionId !== undefined
                ? matcherTarget === undefined
                    ? this.sessionHooksManager.getHooksForEvent(sessionId, eventName)
                    : this.sessionHooksManager.getMatchingHooks(sessionId, eventName, matcherTarget)
                : [];
            // Merge hook configs from registry plan and session hooks
            const registryHookConfigs = plan?.hookConfigs || [];
            const sessionHookConfigs = sessionHooks.map((entry) => entry.config);
            const allHookConfigs = [...registryHookConfigs, ...sessionHookConfigs];
            if (allHookConfigs.length === 0) {
                return {
                    success: true,
                    allOutputs: [],
                    errors: [],
                    totalDuration: 0,
                };
            }
            // Determine execution strategy: sequential if any hook requires it
            const sequential = (plan?.sequential ?? false) ||
                sessionHooks.some((entry) => entry.sequential === true);
            // Build function hook context with messages from provider
            const messages = this.messagesProvider?.();
            const functionContext = {
                messages,
                toolUseID: 'tool_use_id' in input ? input.tool_use_id : undefined,
                signal,
            };
            const totalHooks = allHookConfigs.length;
            const onHookStart = (config, index) => {
                const hookName = this.getHookName(config);
                debugLogger.debug(`Hook ${hookName} started for event ${eventName} (${index + 1}/${totalHooks})`);
            };
            const onHookEnd = (config, result) => {
                const hookName = this.getHookName(config);
                debugLogger.debug(`Hook ${hookName} ended for event ${eventName}: ${result.success ? 'success' : 'failed'}`);
            };
            // Execute hooks according to the merged strategy
            const results = sequential
                ? await this.hookRunner.executeHooksSequential(allHookConfigs, eventName, input, onHookStart, onHookEnd, signal, functionContext)
                : await this.hookRunner.executeHooksParallel(allHookConfigs, eventName, input, onHookStart, onHookEnd, signal, functionContext);
            // Aggregate results
            const aggregated = this.hookAggregator.aggregateResults(results, eventName);
            // Process common hook output fields centrally
            this.processCommonHookOutputFields(aggregated);
            // Log hook execution for telemetry
            this.logHookExecution(eventName, input, results, aggregated);
            return aggregated;
        }
        catch (error) {
            debugLogger.error(`Hook event bus error for ${eventName}: ${error}`);
            const normalizedError = error instanceof Error ? error : new Error(String(error));
            failClosedResult.errors = [normalizedError];
            if (failClosedResult.finalOutput) {
                failClosedResult.finalOutput.reason = `${failClosedResult.finalOutput.reason}: ${normalizedError.message}`;
            }
            return failClosedResult;
        }
    }
    /**
     * Create base hook input with common fields
     */
    createBaseInput(eventName) {
        // Get the transcript path from the Config
        const transcriptPath = this.config.getTranscriptPath();
        return {
            session_id: this.config.getSessionId(),
            transcript_path: transcriptPath,
            cwd: this.config.getWorkingDir(),
            hook_event_name: eventName,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Process common hook output fields centrally
     */
    processCommonHookOutputFields(aggregated) {
        if (!aggregated.finalOutput) {
            return;
        }
        // Handle systemMessage - show to user in transcript mode (not to agent)
        const systemMessage = aggregated.finalOutput.systemMessage;
        if (systemMessage && !aggregated.finalOutput.suppressOutput) {
            debugLogger.warn(`Hook system message: ${systemMessage}`);
        }
        // Handle continue=false - this should stop the entire agent execution
        if (aggregated.finalOutput.continue === false) {
            const stopReason = aggregated.finalOutput.stopReason ||
                aggregated.finalOutput.reason ||
                'No reason provided';
            debugLogger.debug(`Hook requested to stop execution: ${stopReason}`);
        }
    }
    sanitizeHookInputForTelemetry(eventName, input) {
        const telemetryInput = { ...input };
        if (eventName === HookEventName.TodoCreated) {
            delete telemetryInput['todo_content'];
            delete telemetryInput['all_todos'];
            if ('phase' in telemetryInput) {
                telemetryInput['phase'] =
                    telemetryInput['phase'] === HookPhase.PostWrite
                        ? HookPhase.PostWrite
                        : HookPhase.Validation;
            }
        }
        if (eventName === HookEventName.TodoCompleted) {
            delete telemetryInput['todo_content'];
            delete telemetryInput['all_todos'];
            if ('phase' in telemetryInput) {
                telemetryInput['phase'] =
                    telemetryInput['phase'] === HookPhase.PostWrite
                        ? HookPhase.PostWrite
                        : HookPhase.Validation;
            }
        }
        return telemetryInput;
    }
    /**
     * Log hook execution for observability
     */
    logHookExecution(eventName, input, results, aggregated) {
        const failedHooks = results.filter((r) => !r.success);
        const successCount = results.length - failedHooks.length;
        const errorCount = failedHooks.length;
        if (errorCount > 0) {
            const failedNames = failedHooks
                .map((r) => this.getHookNameFromResult(r))
                .join(', ');
            debugLogger.warn(`Hook(s) [${failedNames}] failed for event ${eventName}. Check debug logs for more details.`);
        }
        else {
            debugLogger.debug(`Hook execution for ${eventName}: ${successCount} hooks executed successfully, ` +
                `total duration: ${aggregated.totalDuration}ms`);
        }
        const telemetryInput = this.sanitizeHookInputForTelemetry(eventName, input);
        for (const result of results) {
            const hookName = this.getHookNameFromResult(result);
            const hookType = this.getHookTypeFromResult(result);
            const hookCallEvent = new HookCallEvent(eventName, hookType, hookName, telemetryInput, result.duration, result.success, result.output ? { ...result.output } : undefined, result.exitCode, result.stdout, result.stderr, result.error?.message);
            logHookCall(this.config, hookCallEvent);
        }
        for (const error of aggregated.errors) {
            debugLogger.warn(`Hook execution error: ${error.message}`);
        }
    }
    /**
     * Get hook name from config for display or telemetry
     */
    getHookName(config) {
        if (config.type === 'command') {
            return config.name || config.command || 'unknown-command';
        }
        return config.name || 'unknown-hook';
    }
    /**
     * Get hook name from execution result for telemetry
     */
    getHookNameFromResult(result) {
        return this.getHookName(result.hookConfig);
    }
    /**
     * Get hook type from execution result for telemetry
     */
    getHookTypeFromResult(result) {
        return result.hookConfig.type;
    }
}
//# sourceMappingURL=hookEventHandler.js.map