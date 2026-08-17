/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../../config/config.js';
import { type RuntimeContentGeneratorView } from './agent-context.js';
import type {
  ToolCallConfirmationDetails,
  ToolResultDisplay,
} from '../../tools/tools.js';
import type {
  Content,
  FunctionCall,
  GenerateContentConfig,
  FunctionDeclaration,
} from '@google/genai';
import { GeminiChat } from '../../core/geminiChat.js';
import type {
  PromptConfig,
  ModelConfig,
  RunConfig,
  ToolConfig,
  AgentMessage,
  AgentExternalInput,
} from './agent-types.js';
import { AgentTerminateMode } from './agent-types.js';
import type { AgentHooks } from './agent-events.js';
import { AgentEventEmitter } from './agent-events.js';
import { AgentStatistics, type AgentStatsSummary } from './agent-statistics.js';
import { type ContextState } from './agent-headless.js';
import type { TeammateIdentity } from '../team/types.js';
/**
 * Result of a single reasoning loop invocation.
 */
/**
 * Tools that must never be available to non-team subagents (including
 * forked agents spawned via the Agent tool).
 * - AgentTool is depth-gated rather than unconditionally excluded:
 *   `isExcluded()` in `prepareTools()` re-admits it while
 *   `canSpawnNestedAgent()` permits another nesting level, and consults
 *   this set only for every other tool. The entry here remains the
 *   fail-closed floor for consumers of the raw set.
 * - Cron tools are session-scoped and should only run from the main session.
 * - TaskStop and SendMessage are parent-side control-plane tools for managing
 *   background subagents; subagents have no agent IDs to manage natively, so
 *   exposing them only widens the surface for cross-agent interference if an
 *   ID leaks via prompt or transcript.
 * - Team management (team_create/team_delete) and task coordination
 *   (task_create/task_update/task_list) are leader/teammate tools. A
 *   non-team Agent subagent has no teammate identity, so isTeammate()
 *   returns false and these tools would treat it as the leader — letting
 *   it delete or rewrite the active team.
 * - Plan lifecycle tools are owned by the caller/main session. A subagent
 *   should return its plan to the caller instead of entering or exiting mode.
 * - Todo state is also parent-owned because subagents share the session's
 *   persisted Todo sidecar.
 */
export declare const EXCLUDED_TOOLS_FOR_SUBAGENTS: ReadonlySet<string>;
/**
 * Extract the parent session's advertised tool names from its generation
 * config: flatten every function declaration, drop tools a subagent must
 * never inherit (EXCLUDED_TOOLS_FOR_SUBAGENTS), and deduplicate. Shared by
 * fork launch (the Agent tool) and fork resume (background-agent-resume) so
 * both derive the inherited tool surface identically — a single source of
 * truth prevents the two paths from silently diverging when the exclusion or
 * extraction logic changes.
 */
export declare function extractParentToolNames(
  generationConfig: GenerateContentConfig | undefined,
): string[];
/**
 * Prefix applied to each external message injected into a background agent's
 * reasoning loop via getExternalMessages. Kept here so tests and any future
 * parsers can import the same literal.
 */
export declare const EXTERNAL_MESSAGE_PREFIX = '[Message from parent agent]:';
export interface ReasoningLoopResult {
  /** The final model text response (empty if terminated by abort/limits). */
  text: string;
  /** Why the loop ended. null = normal text completion (no tool calls). */
  terminateMode: AgentTerminateMode | null;
  /** Number of model round-trips completed. */
  turnsUsed: number;
}
/**
 * Options for configuring a reasoning loop invocation.
 */
export interface ReasoningLoopOptions {
  /** Maximum number of turns before stopping. */
  maxTurns?: number;
  /** Maximum wall-clock time in minutes before stopping. */
  maxTimeMinutes?: number;
  /** Start time in ms (for timeout calculation). Defaults to Date.now(). */
  startTimeMs?: number;
  /** Rounds already completed in the same logical turn. */
  roundOffset?: number;
  /**
   * Optional callback to drain external messages between model rounds.
   * Returned inputs are appended to the next model request as user-role
   * content.
   */
  getExternalMessages?: () => AgentExternalInput[];
  /**
   * Optional callback to wait for external messages while the agent is idle.
   * The callback must resolve with any queued inputs or [] when the signal is
   * aborted.
   */
  waitForExternalMessages?: (
    signal: AbortSignal,
  ) => Promise<AgentExternalInput[]>;
  /**
   * Optional predicate controlling whether a no-tool response should wait for
   * future external inputs instead of finalizing immediately.
   */
  shouldWaitForExternalMessages?: () => boolean;
}
/**
 * Options for chat creation.
 */
export interface CreateChatOptions {
  /**
   * When true, omits the "non-interactive mode" system prompt suffix.
   * Used by AgentInteractive for persistent interactive agents.
   */
  interactive?: boolean;
  /**
   * Optional conversation history from a parent session. When provided,
   * this history is prepended to the chat so the agent has prior
   * conversational context (e.g., from AgentInteractive.start()).
   */
  extraHistory?: Content[];
}
/**
 * Legacy execution stats maintained for backward compatibility.
 */
export interface ExecutionStats {
  startTimeMs: number;
  totalDurationMs: number;
  rounds: number;
  totalToolCalls: number;
  successfulToolCalls: number;
  failedToolCalls: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}
/**
 * AgentCore — shared execution engine for model reasoning and tool scheduling.
 *
 * This class encapsulates:
 * - Chat/model session creation (`createChat`)
 * - Tool list preparation (`prepareTools`)
 * - The inner reasoning loop (`runReasoningLoop`)
 * - Tool call scheduling and execution (`processFunctionCalls`)
 * - Statistics tracking and event emission
 *
 * It does NOT manage lifecycle (start/stop/terminate), abort signals,
 * or final result interpretation — those are the caller's responsibility.
 */
export declare class AgentCore {
  private promptOrdinal;
  readonly subagentId: string;
  readonly name: string;
  readonly runtimeContext: Config;
  readonly promptConfig: PromptConfig;
  readonly modelConfig: ModelConfig;
  readonly runConfig: RunConfig;
  readonly toolConfig?: ToolConfig;
  private readonly executionAllowedTools?;
  private readonly executionAllowedExactTools?;
  private readonly executionAllowedMcpPatterns?;
  private readonly executionAllowlistErrorSummary?;
  /**
   * Event emitter for this agent. Always present — if the caller doesn't
   * pass one, AgentCore allocates its own so the observable state below
   * is populated regardless of who constructs the agent.
   */
  readonly eventEmitter: AgentEventEmitter;
  readonly hooks?: AgentHooks;
  readonly stats: AgentStatistics;
  /**
   * When the agent runs with a model different from the parent session,
   * this view is published via AsyncLocalStorage during execution so any
   * `Config.getContentGenerator{,Config}()` call inside the run resolves
   * to the agent's values — even from tools that captured the parent
   * Config at construction.
   */
  readonly runtimeView?: RuntimeContentGeneratorView;
  private readonly messages;
  private readonly pendingApprovals;
  private readonly liveOutputs;
  private readonly shellPids;
  /**
   * Legacy execution stats maintained for aggregate tracking.
   */
  executionStats: ExecutionStats;
  /**
   * The prompt token count from the most recent model response.
   * Exposed so UI hooks can seed initial state without waiting for events.
   */
  lastPromptTokenCount: number;
  private toolUsage;
  constructor(
    name: string,
    runtimeContext: Config,
    promptConfig: PromptConfig,
    modelConfig: ModelConfig,
    runConfig: RunConfig,
    toolConfig?: ToolConfig,
    eventEmitter?: AgentEventEmitter,
    hooks?: AgentHooks,
    runtimeView?: RuntimeContentGeneratorView,
  );
  /**
   * Creates a GeminiChat instance configured for this agent.
   *
   * @param context - Context state for template variable substitution.
   * @param options - Chat creation options.
   *   - `interactive`: When true, omits the "non-interactive mode" system prompt suffix.
   * @returns A configured GeminiChat, or undefined if initialization fails.
   */
  createChat(
    context: ContextState,
    options?: CreateChatOptions,
  ): Promise<GeminiChat | undefined>;
  /**
   * Returns true if this agent's effective tool surface will include the Skill
   * tool. Used before `prepareTools()` to decide whether to inject the
   * `<available_skills>` snapshot.
   */
  private willHaveSkillTool;
  /**
   * Prepares the list of tools available to this agent.
   *
   * If no explicit toolConfig or it contains "*" or is empty,
   * inherits all tools (excluding AgentTool to prevent recursion).
   */
  prepareTools(): Promise<FunctionDeclaration[]>;
  /**
   * Runs the inner model reasoning loop.
   *
   * This is the core execution cycle:
   * send messages → stream response → collect tool calls → execute tools → repeat.
   *
   * The loop terminates when:
   * - The model produces a text response without tool calls (normal completion)
   * - maxTurns is reached
   * - maxTimeMinutes is exceeded
   * - The abortController signal fires
   *
   * @param chat - The GeminiChat session to use.
   * @param initialMessages - The first messages to send (e.g., user task prompt).
   * @param toolsList - Available tool declarations.
   * @param abortController - Controls cancellation of the current loop.
   * @param options - Optional limits (maxTurns, maxTimeMinutes).
   * @returns ReasoningLoopResult with the final text, terminate mode, and turns used.
   */
  runReasoningLoop(
    chat: GeminiChat,
    initialMessages: Content[],
    toolsList: FunctionDeclaration[],
    abortController: AbortController,
    options?: ReasoningLoopOptions,
  ): Promise<ReasoningLoopResult>;
  /**
   * Run `fn` inside both ALS frames this agent owns:
   * 1. {@link subagentNameContext} so token-attribution code resolves to
   *    this agent's name.
   * 2. The per-agent runtime ContentGenerator view (when set) so
   *    `Config.getContentGenerator{,Config}()` calls inside resolve to
   *    the agent rather than to the parent Config tools captured at
   *    construction time.
   * 3. The logical owner agent id (when captured) so approved tools that
   *    consult agent context, such as Monitor, keep subagent ownership.
   *
   * Used both around the reasoning loop and around the deferred-approval
   * `onConfirm` continuation — the latter runs from the parent UI's input
   * handler, on a different async chain than the loop, so without this
   * re-entry the resumed tool body would fall back to the parent's view
   * and mis-attribute its tokens.
   *
   * `inheritedView` lets a caller pass an ambient view captured earlier
   * (e.g. at approval-emit time, when the parent's ALS frame is still
   * live) for inheriting agents that own no view themselves. Without it,
   * a nested `model: inherit` agent under a runtime-view-bearing parent
   * would lose that view across the deferred-approval boundary, since
   * the UI invokes `respond` from a fresh async chain where the parent's
   * ALS frame is gone.
   *
   * `inheritedAgentId` does the same for logical agent ownership. It is
   * needed by deferred approval because the user's approval response runs
   * from the parent UI chain, after the subagent's AsyncLocalStorage frame
   * has unwound. `inheritedAgentDepth` accompanies it: without the original
   * nesting depth the restored frame recomputes to depth 0, letting a
   * deferred-approved `agent` tool call from a leaf-depth sub-agent bypass
   * maxSubagentDepth.
   *
   * `inheritedTeammateIdentity` restores the in-process teammate identity
   * frame (`teammateIdentityStore`). Deferred approval needs it for the
   * same reason as the others: when a teammate's `send_message` /
   * `task_update` resumes from the UI chain, `getAgentName()` would
   * otherwise be undefined and the tool would mis-attribute the message
   * to the leader (forged `from="leader"` envelope) and slip past the
   * leader-only `isTeammate()` guard. No-op on the reasoning-loop path,
   * where TeamManager already establishes this frame.
   *
   * Exposed (rather than inlined twice) so the contract stays testable in
   * isolation; see `agent-core.test.ts`.
   */
  runInAgentFrames<T>(
    fn: () => Promise<T>,
    inheritedView?: RuntimeContentGeneratorView,
    inheritedAgentId?: string,
    inheritedTeammateIdentity?: TeammateIdentity,
    inheritedAgentDepth?: number,
  ): Promise<T>;
  /**
   * Wraps `fn` in the effective runtime view: this agent's own view if
   * set, else `inheritedView` if the caller captured one. Internal —
   * public callers should use {@link runInAgentFrames}, which also
   * restores the subagent-name frame.
   */
  private withRuntimeView;
  private _runReasoningLoopInner;
  private drainExternalInputs;
  private externalInputText;
  private externalInputsToParts;
  private externalInputsToContent;
  private emitExternalInputEvents;
  private hasTurnBudgetForAnotherRound;
  private getRemainingTimeMs;
  private waitForExternalInputs;
  private emitSyntheticToolError;
  private isToolExecutionAllowed;
  /**
   * Processes a list of function calls via CoreToolScheduler.
   *
   * Validates each call against the allowed tools list, schedules authorized
   * calls, collects results, and emits events for each call/result.
   *
   * Validates each call, schedules authorized calls, collects results, and emits events.
   */
  processFunctionCalls(
    functionCalls: FunctionCall[],
    abortController: AbortController,
    promptId: string,
    currentRound: number,
    toolsList: FunctionDeclaration[],
    responseId?: string,
    wasOutputTruncated?: boolean,
    handledProviderToolCallIds?: Set<string>,
    duplicateProviderToolCallResponseIds?: Set<string>,
  ): Promise<{
    messages: Content[];
    repeatedDuplicateProviderToolCall: boolean;
  }>;
  getMessages(): readonly AgentMessage[];
  /**
   * Tool calls currently awaiting user approval. Mutated by
   * AgentInteractive's TOOL_WAITING_APPROVAL handler; headless agents
   * never populate this because they run with
   * `getShouldAvoidPermissionPrompts === true`.
   */
  getPendingApprovals(): ReadonlyMap<string, ToolCallConfirmationDetails>;
  getLiveOutputs(): ReadonlyMap<string, ToolResultDisplay>;
  getShellPids(): ReadonlyMap<string, number>;
  pushMessage(
    role: AgentMessage['role'],
    content: string,
    options?: {
      thought?: boolean;
      metadata?: Record<string, unknown>;
    },
  ): void;
  setPendingApproval(
    callId: string,
    details: ToolCallConfirmationDetails,
  ): void;
  deletePendingApproval(callId: string): void;
  clearPendingApprovals(): void;
  resetExecutionStats(): void;
  getEventEmitter(): AgentEventEmitter;
  getExecutionSummary(): AgentStatsSummary;
  /**
   * Returns legacy execution statistics and per-tool usage.
   * Returns legacy execution statistics and per-tool usage.
   */
  getStatistics(): {
    successRate: number;
    toolUsage: Array<{
      name: string;
      count: number;
      success: number;
      failure: number;
      lastError?: string;
      totalDurationMs?: number;
      averageDurationMs?: number;
    }>;
  } & ExecutionStats;
  /**
   * Safely retrieves the description of a tool by attempting to build it.
   * Returns an empty string if any error occurs during the process.
   * Note: Assumes tools are warmed via warmAll() before the reasoning loop.
   */
  getToolDescription(toolName: string, args: Record<string, unknown>): string;
  private getToolIsOutputMarkdown;
  /**
   * Records tool call statistics for both successful and failed tool calls.
   */
  recordToolCallStats(
    toolName: string,
    success: boolean,
    durationMs: number,
    errorMessage?: string,
  ): void;
  /**
   * TOOL_WAITING_APPROVAL is deliberately NOT listened to here because
   * the correct response depends on whether the consumer is interactive
   * (needs to wrap onConfirm with cancel-round behavior) or headless
   * (approvals never fire). AgentInteractive owns that listener and
   * writes into `pendingApprovals` via the public mutator API.
   */
  private setupStateListeners;
  /**
   * Builds the system prompt with template substitution and optional
   * non-interactive instructions suffix.
   */
  private buildChatSystemPrompt;
  /**
   * Records token usage from model response metadata.
   */
  private recordTokenUsage;
}
