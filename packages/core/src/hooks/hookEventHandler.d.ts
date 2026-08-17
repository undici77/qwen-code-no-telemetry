/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { HookPlanner } from './hookPlanner.js';
import type { HookRunner } from './hookRunner.js';
import type { HookAggregator, AggregatedHookResult } from './hookAggregator.js';
import type { SessionHooksManager } from './sessionHooksManager.js';
import type {
  ContextUsageData,
  SessionStartSource,
  SessionEndReason,
  AgentType,
  PostToolBatchToolCall,
  PreCompactTrigger,
  PostCompactTrigger,
  NotificationType,
  PermissionDeniedReason,
  PermissionSuggestion,
  MessagesProvider,
  StopFailureErrorType,
  TodoItem,
  TodoStatus,
  InstructionMemoryType,
  InstructionLoadReason,
} from './types.js';
import { HookPhase, PermissionMode } from './types.js';
/**
 * Hook event bus that coordinates hook execution across the system
 */
export declare class HookEventHandler {
  private readonly config;
  private readonly hookPlanner;
  private readonly hookRunner;
  private readonly hookAggregator;
  private readonly sessionHooksManager;
  /** Optional provider for conversation history */
  private messagesProvider?;
  constructor(
    config: Config,
    hookPlanner: HookPlanner,
    hookRunner: HookRunner,
    hookAggregator: HookAggregator,
    sessionHooksManager: SessionHooksManager,
    messagesProvider?: MessagesProvider,
  );
  /**
   * Set the messages provider for automatic conversation history passing
   */
  setMessagesProvider(provider: MessagesProvider): void;
  /**
   * Get the current messages provider
   */
  getMessagesProvider(): MessagesProvider | undefined;
  /**
   * Snapshot of current background tasks for hook payloads.
   * Non-blocking: reads registry state synchronously.
   */
  private getBackgroundTaskSnapshot;
  /**
   * Snapshot of current cron jobs for hook payloads.
   * Non-blocking: reads scheduler state synchronously.
   */
  private getCronJobSnapshot;
  /**
   * Fire a UserPromptSubmit event
   * Called by handleHookExecutionRequest - executes hooks directly
   */
  fireUserPromptSubmitEvent(
    prompt: string,
    signal?: AbortSignal,
    submittedPrompt?: string,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire an InstructionsLoaded event.
   * Called when instruction/context files are loaded during session startup or
   * import resolution.
   */
  fireInstructionsLoadedEvent(
    filePath: string,
    memoryType: InstructionMemoryType,
    loadReason: InstructionLoadReason,
    options?: {
      triggerFilePath?: string;
      parentFilePath?: string;
    },
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a UserPromptExpansion event
   * Called when a slash command expands into a prompt.
   */
  fireUserPromptExpansionEvent(
    commandName: string,
    commandArgs: string,
    prompt: string,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a Stop event
   * Called by handleHookExecutionRequest - executes hooks directly
   */
  fireStopEvent(
    stopHookActive?: boolean,
    lastAssistantMessage?: string,
    contextUsage?: ContextUsageData,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a MessageDisplay event
   * Called repeatedly as the assistant's reply streams (before Stop). Fire-and-forget:
   * callers should not await this on the critical streaming path — see client.ts, which
   * fires it without blocking the next chunk's display.
   */
  fireMessageDisplayEvent(
    messageId: string,
    displayedText: string,
    isFinal: boolean,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a SessionStart event
   * Called when a new session starts or resumes
   */
  fireSessionStartEvent(
    source: SessionStartSource,
    model: string,
    permissionMode?: PermissionMode,
    agentType?: AgentType,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a SessionEnd event
   * Called when a session ends
   */
  fireSessionEndEvent(
    reason: SessionEndReason,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a SessionDelete event after an explicitly selected session is deleted.
   */
  fireSessionDeleteEvent(
    deletedSessionId: string,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PreToolUse event
   * Called before tool execution begins
   */
  firePreToolUseEvent(
    toolName: string,
    toolInput: Record<string, unknown>,
    toolUseId: string,
    permissionMode: PermissionMode,
    signal?: AbortSignal,
    tool_call_id?: string,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PostToolUse event
   * Called after successful tool execution
   */
  firePostToolUseEvent(
    toolName: string,
    toolInput: Record<string, unknown>,
    toolResponse: Record<string, unknown>,
    toolUseId: string,
    permissionMode: PermissionMode,
    signal?: AbortSignal,
    tool_call_id?: string,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PostToolUseFailure event
   * Called when tool execution fails
   */
  firePostToolUseFailureEvent(
    toolUseId: string,
    toolName: string,
    toolInput: Record<string, unknown>,
    errorMessage: string,
    isInterrupt?: boolean,
    permissionMode?: PermissionMode,
    signal?: AbortSignal,
    tool_call_id?: string,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PreCompact event
   * Called before conversation compaction begins
   */
  firePreCompactEvent(
    trigger: PreCompactTrigger,
    customInstructions?: string,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PostToolBatch event
   * Called once after every tool call in a batch has resolved
   */
  firePostToolBatchEvent(
    toolCalls: PostToolBatchToolCall[],
    permissionMode?: PermissionMode,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a Notification event
   */
  fireNotificationEvent(
    message: string,
    notificationType: NotificationType,
    title?: string,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PermissionRequest event
   * Called when a permission dialog is about to be shown to the user
   */
  firePermissionRequestEvent(
    toolName: string,
    toolInput: Record<string, unknown>,
    permissionMode: PermissionMode,
    permissionSuggestions?: PermissionSuggestion[],
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PermissionDenied event for tool calls rejected before manual
   * permission handling starts. Unlike PermissionRequest, this event does not
   * ask hooks to approve or modify the call; it reports AUTO-mode denials that
   * happen before any permission dialog would be shown.
   */
  firePermissionDeniedEvent(
    toolName: string,
    toolInput: Record<string, unknown>,
    toolUseId: string,
    reason: PermissionDeniedReason,
    signal?: AbortSignal,
    tool_call_id?: string,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a SubagentStart event
   * Called when a subagent is spawned via the Agent tool
   */
  fireSubagentStartEvent(
    agentId: string,
    agentType: AgentType | string,
    permissionMode: PermissionMode,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a SubagentStop event
   * Called when a subagent has finished responding
   */
  fireSubagentStopEvent(
    agentId: string,
    agentType: AgentType | string,
    agentTranscriptPath: string,
    lastAssistantMessage: string,
    stopHookActive: boolean,
    permissionMode: PermissionMode,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a StopFailure event
   * Called when an API error ends the turn (instead of Stop)
   * Fire-and-forget: output and exit codes are ignored
   */
  fireStopFailureEvent(
    error: StopFailureErrorType,
    errorDetails?: string,
    lastAssistantMessage?: string,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a PostCompact event
   * Called after conversation compaction completes
   */
  firePostCompactEvent(
    trigger: PostCompactTrigger,
    compactSummary: string,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a TodoCreated event
   * Called when a new todo item is added to the list
   */
  fireTodoCreatedEvent(
    todoId: string,
    todoContent: string,
    todoStatus: TodoStatus,
    allTodos: TodoItem[],
    phase: HookPhase,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Fire a TodoCompleted event
   * Called when a todo item's status changes to 'completed'
   */
  fireTodoCompletedEvent(
    todoId: string,
    todoContent: string,
    previousStatus: 'pending' | 'in_progress',
    allTodos: TodoItem[],
    phase: HookPhase,
    signal?: AbortSignal,
  ): Promise<AggregatedHookResult>;
  /**
   * Execute hooks for a specific event (direct execution without MessageBus)
   * Used as fallback when MessageBus is not available
   */
  private executeHooks;
  /**
   * Create base hook input with common fields
   */
  private createBaseInput;
  /**
   * Process common hook output fields centrally
   */
  private processCommonHookOutputFields;
  private sanitizeHookInputForTelemetry;
  /**
   * Log hook execution for observability
   */
  private logHookExecution;
  /**
   * Get hook name from config for display or telemetry
   */
  private getHookName;
  /**
   * Get hook name from execution result for telemetry
   */
  private getHookNameFromResult;
  /**
   * Get hook type from execution result for telemetry
   */
  private getHookTypeFromResult;
}
