/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  ToolCallRequestInfo,
  ToolCallResponseInfo,
  ToolCallConfirmationDetails,
  ToolResultDisplay,
  EditorType,
  Config,
  ToolConfirmationPayload,
  AnyDeclarativeTool,
  AnyToolInvocation,
  ChatRecordingService,
} from '../index.js';
import { ToolConfirmationOutcome, Kind } from '../index.js';
import type { Part, PartListUnion } from '@google/genai';
import { type RuntimeContentGeneratorView } from '../agents/runtime/agent-context.js';
export type ValidatingToolCall = {
  status: 'validating';
  request: ToolCallRequestInfo;
  tool: AnyDeclarativeTool;
  invocation: AnyToolInvocation;
  startTime?: number;
  outcome?: ToolConfirmationOutcome;
};
export type ScheduledToolCall = {
  status: 'scheduled';
  request: ToolCallRequestInfo;
  tool: AnyDeclarativeTool;
  invocation: AnyToolInvocation;
  startTime?: number;
  outcome?: ToolConfirmationOutcome;
};
export type ErroredToolCall = {
  status: 'error';
  request: ToolCallRequestInfo;
  response: ToolCallResponseInfo;
  tool?: AnyDeclarativeTool;
  durationMs?: number;
  outcome?: ToolConfirmationOutcome;
};
export type SuccessfulToolCall = {
  status: 'success';
  request: ToolCallRequestInfo;
  tool: AnyDeclarativeTool;
  response: ToolCallResponseInfo;
  invocation: AnyToolInvocation;
  durationMs?: number;
  outcome?: ToolConfirmationOutcome;
};
export type ExecutingToolCall = {
  status: 'executing';
  request: ToolCallRequestInfo;
  tool: AnyDeclarativeTool;
  invocation: AnyToolInvocation;
  liveOutput?: ToolResultDisplay;
  /** Timestamp when the tool was first scheduled (validating). */
  startTime?: number;
  /**
   * Timestamp when the tool actually began executing (after any
   * approval/scheduling wait). Use this for "how long has this been
   * running" displays; prefer it over startTime to exclude approval time.
   */
  executionStartTime?: number;
  outcome?: ToolConfirmationOutcome;
  pid?: number;
  /**
   * Set during a foreground shell-tool invocation: the AbortController
   * the user/UI can fire (with `signal.reason = { kind: 'background' }`)
   * to promote the running command to a background entry. Set right
   * after `setPidCallback` fires (see ShellTool.execute), cleared
   * implicitly when the tool transitions to a terminal status. Only
   * meaningful for the shell tool's foreground path; absent on every
   * other tool kind.
   */
  promoteAbortController?: AbortController;
};
export type CancelledToolCall = {
  status: 'cancelled';
  request: ToolCallRequestInfo;
  response: ToolCallResponseInfo;
  tool?: AnyDeclarativeTool;
  invocation?: AnyToolInvocation;
  durationMs?: number;
  outcome?: ToolConfirmationOutcome;
};
export type WaitingToolCall = {
  status: 'awaiting_approval';
  request: ToolCallRequestInfo;
  tool: AnyDeclarativeTool;
  invocation: AnyToolInvocation;
  confirmationDetails: ToolCallConfirmationDetails;
  startTime?: number;
  outcome?: ToolConfirmationOutcome;
};
export type Status = ToolCall['status'];
export type ToolCall =
  | ValidatingToolCall
  | ScheduledToolCall
  | ErroredToolCall
  | SuccessfulToolCall
  | ExecutingToolCall
  | CancelledToolCall
  | WaitingToolCall;
export type CompletedToolCall =
  | SuccessfulToolCall
  | CancelledToolCall
  | ErroredToolCall;
/**
 * Pull the filesystem path-bearing fields out of a tool's input.
 * Per-tool dispatcher because the field name and shape differ:
 *
 *  - read_file / zoom_image / edit / write_file → `file_path`
 *  - notebook_edit → `notebook_path`
 *  - list_directory → `path` (search root)
 *  - glob → `path` (search root, optional) + `pattern` (path-shaped
 *    selector); `<path>/<pattern>` is the effective glob walked
 *  - grep_search → `path` (search root, optional) + `glob` (path-shaped
 *    file filter); `pattern` is a regex on contents, NOT a path
 *  - lsp → `filePath` (URI-aware: `file://` accepted, others dropped)
 *    plus `callHierarchyItem.uri` for incomingCalls / outgoingCalls
 *
 * Used by ConditionalRulesRegistry / SkillActivationRegistry hooks to
 * route every project-relative path the tool actually touched through
 * the same activation pipeline. Returns `[]` for tool names outside
 * `FS_PATH_TOOL_NAMES` — see that set's docstring for why this is gated.
 */
export declare function extractToolFilePaths(
  toolName: string,
  toolInput: unknown,
): string[];
export type ConfirmHandler = (
  toolCall: WaitingToolCall,
) => Promise<ToolConfirmationOutcome>;
export type OutputUpdateHandler = (
  toolCallId: string,
  outputChunk: ToolResultDisplay,
) => void;
export type AllToolCallsCompleteHandler = (
  completedToolCalls: CompletedToolCall[],
) => Promise<void>;
export type ToolCallsUpdateHandler = (toolCalls: ToolCall[]) => void;
export declare function convertToFunctionResponse(
  toolName: string,
  callId: string,
  llmContent: PartListUnion,
): Part[];
export declare function convertToFunctionErrorResponse(
  toolName: string,
  callId: string,
  llmContent: PartListUnion,
  fallbackError: string,
): Part[];
interface CoreToolSchedulerOptions {
  config: Config;
  outputUpdateHandler?: OutputUpdateHandler;
  onAllToolCallsComplete?: AllToolCallsCompleteHandler;
  onToolCallsUpdate?: ToolCallsUpdateHandler;
  getPreferredEditor: () => EditorType | undefined;
  onEditorClose: () => void;
  /**
   * Optional recording service for direct scheduler consumers.
   * Aggregating runtimes record at their outer boundary instead.
   */
  chatRecordingService?: ChatRecordingService;
  onToolResultFullTurnModel?: (model: string) => boolean;
}
/**
 * A batch of items grouped by concurrency safety: `concurrent` batches may run
 * their `calls` in parallel; non-concurrent batches run one at a time.
 */
export interface ConcurrencyBatch<T> {
  concurrent: boolean;
  calls: T[];
}
/**
 * Returns true if a tool call can safely execute concurrently with other
 * safe tools (no side effects, no shared mutable state), decided from its
 * raw name/kind/args alone. Shared by the interactive scheduler's batch
 * partitioning and the headless runner (`runNonInteractive`) so both
 * runtimes parallelize exactly the same set of tools.
 *
 * `kind` is the resolved tool's {@link Kind}; pass `undefined` when the tool
 * cannot be resolved from the registry, which is treated as unsafe (the call
 * runs sequentially).
 */
export declare function isToolCallConcurrencySafe(
  name: string,
  kind: Kind | undefined,
  args: unknown,
): boolean;
/**
 * Partition items into consecutive batches by concurrency safety: consecutive
 * safe items are merged into a single parallel batch, and each unsafe item
 * forms its own sequential batch. Order is preserved.
 *
 * Shared by the interactive scheduler ({@link partitionToolCalls}) and the
 * headless runner (`partitionHeadlessToolCalls` in nonInteractiveCli) via the
 * {@link isToolCallConcurrencySafe} predicate, so the two runtimes partition
 * using one algorithm and can't silently diverge.
 *
 * Example: [Read, Read, Edit, Read] → [[Read,Read](parallel), [Edit](seq), [Read](seq)]
 */
export declare function partitionByConcurrencySafety<T>(
  items: T[],
  isSafe: (item: T) => boolean,
): Array<ConcurrencyBatch<T>>;
export declare class CoreToolScheduler {
  private toolRegistry;
  private toolCalls;
  private outputUpdateHandler?;
  private onAllToolCallsComplete?;
  private onToolCallsUpdate?;
  private getPreferredEditor;
  private config;
  private onEditorClose;
  private chatRecordingService?;
  private onToolResultFullTurnModel?;
  private isFinalizingToolCalls;
  private postToolBatchEnabledForBatch;
  private postToolBatchSpanCallId;
  private postToolBatchConfigWarned;
  private isScheduling;
  private validationRetryCounts;
  private autoModeFallbackCallIds;
  private toolSpans;
  private blockedSpans;
  private callIdToBatch;
  private callIdToPostToolBatchSignal;
  private readonly bouncedAwaitingApproval;
  private readonly bouncedToolUseId;
  private readonly runtimeContentGeneratorViews;
  private requestQueue;
  constructor(options: CoreToolSchedulerOptions);
  private get memoryMonitor();
  private compactResultDisplayForInteractiveHistory;
  private processToolResultImages;
  private setStatusInternal;
  private setArgsInternal;
  private isRunning;
  private cancelPreExecutionIfAborted;
  /**
   * End the tool span for `callId` (if any) and remove it from the map.
   * Centralizes terminal-state cleanup so every cancel/error/success path
   * goes through one place — easier to audit for leaks. Idempotent:
   * second call for the same callId is a no-op.
   *
   * No `metadata` parameter: every caller pre-sets span status via
   * `setToolSpan{Failure,Cancelled,Ok}` before this call (#4321 review).
   */
  private finalizeToolSpan;
  /**
   * End the blocked_on_user span for `callId` (if any) and remove it from
   * the map. Idempotent. ModifyWithEditor must NOT call this — the same
   * blocked span covers the entire awaiting period including editor side
   * trips.
   */
  private finalizeBlockedSpan;
  /**
   * Hook called by finalizeToolSpan when a callId drains from the
   * scheduler-local maps. If this was the last live callId of its batch,
   * remove the abort listener so the AbortSignal doesn't accumulate
   * listeners across many `_schedule` calls in a long-lived session
   * (#4321 review-3 wenshao Critical).
   */
  private releaseBatchListenerIfDrained;
  /**
   * Best-effort attribution of the surface that resolved the blocked
   * decision. When IDE mode is on, confirmations are most often resolved
   * via the IDE diff flow (`openIdeDiffIfEnabled`) — but a CLI-fallback
   * confirmation in IDE mode is also reported as 'ide' here. Operators
   * can drill into the trace if they need finer-grained attribution.
   */
  private getBlockedSource;
  /**
   * Drain any tool/blocked spans associated with `callIds` that are still
   * live in the scheduler-local maps. Called on signal.abort for spans
   * that no other code path will finalize (e.g. user walks away from
   * awaiting_approval and the session aborts).
   *
   * Deferred to a macrotask so existing finalize paths that await on the
   * SAME aborted signal — explicit user Cancel via
   * `handleConfirmationResponse`, mid-execution `setToolSpanCancelled`
   * inside `_executeToolCallBody` — win the race and set the canonical
   * decision/status before this safety-net drain runs. By the time the
   * timer fires, those paths have removed the entries from the Maps and
   * the drain is a no-op for the common cases. Only the genuine
   * walk-away-then-abort case survives to be drained here.
   *
   * Idempotent for callIds whose spans were already finalized by a normal
   * path — `finalizeBlockedSpan` / `finalizeToolSpan` are no-ops on
   * missing entries.
   */
  private drainSpansForBatch;
  /**
   * Shared toEndMeta callback for the 4 PostToolUseFailure hook fire
   * sites. Each was previously inlined as a byte-identical lambda; the
   * helper avoids drift between cancel-vs-error and abort-vs-non-abort
   * branches and keeps protocol changes (e.g. new metadata fields) in
   * one place (#4321 review-3 wenshao Suggestion).
   */
  private postToolUseFailureEndMeta;
  /**
   * Wrap a hook fire site with span lifecycle management. Centralizes the
   * try/finally pattern across the 6 hook fire sites (PreToolUse,
   * PostToolUse, 4× PostToolUseFailure) so future protocol changes
   * (e.g. new metadata fields) can be made in one place instead of in
   * lockstep across each site (#4321 review wenshao Suggestion).
   *
   * On the happy path `toEndMeta(result)` builds the metadata recorded on
   * the span. On a throw, the default `endMeta = { success: false }`
   * survives — today's hook helpers in `toolHookTriggers.ts` swallow
   * throws internally so this branch is unreachable, but the pattern
   * future-proofs the lifecycle if that contract changes.
   */
  private withHookSpan;
  /**
   * Builds a tool invocation and threads optional context (callId,
   * promptId) into it via duck-typed setters when the invocation
   * exposes them. Both setters are intentionally optional:
   * - Existing tools whose invocations do not implement these setters
   *   stay compatible without any change.
   * - Future contexts (subagent / direct buildAndExecute / non-scheduler
   *   callers) may invoke this with fewer arguments and still get a
   *   valid invocation back.
   * Production call sites in this scheduler always pass both — see
   * the setArgs path at L1036 and the schedule path at L1497.
   */
  private buildInvocation;
  /**
   * Generates error message for unknown tool. Returns early with skill-specific
   * message if the name matches a skill, otherwise uses Levenshtein suggestions.
   */
  private getToolNotFoundMessage;
  /**
   * For an `mcp__<server>__<tool>` name whose tool is not registered, explains
   * *why* in MCP terms — the server was removed this session, is not (or no
   * longer) configured, or is configured but lacks that tool — instead of
   * letting the generic Levenshtein path suggest unrelated tools. Returns null
   * for non-MCP names so they keep the existing suggestion behaviour unchanged.
   *
   * Detection is by prefix-membership against known server names (each
   * sanitized the way `generateValidName` builds the registered tool name),
   * never by parsing the server back out of the unknown name: the `__`
   * separator is ambiguous and long names are truncated, so extraction is
   * unreliable. A name we cannot classify falls through to the generic message.
   */
  private getMcpToolUnavailableMessage;
  /** Suggests similar tool names using Levenshtein distance. */
  private getToolSuggestion;
  schedule(
    request: ToolCallRequestInfo | ToolCallRequestInfo[],
    signal: AbortSignal,
    runtimeView?: RuntimeContentGeneratorView,
  ): Promise<void>;
  private drainRequestQueueIfIdle;
  /**
   * Removes all validation retry counters for the given tool. Keys are
   * "<toolName>:<errorMessage>", so a plain `Map.delete(toolName)` would not
   * match anything.
   */
  private clearRetryCountsForTool;
  /**
   * Increments the retry counter for a (tool, errorMessage) pair and prunes any
   * other error counters for the same tool, so a different failure on the same
   * tool restarts the count rather than tripping the loop threshold. Shared by
   * the truncated-Edit rejection path and the schema-validation failure path so
   * both feed the same RETRY LOOP DETECTED detector.
   */
  private recordRetryableToolError;
  private _schedule;
  handleConfirmationResponse(
    callId: string,
    originalOnConfirm: (
      outcome: ToolConfirmationOutcome,
      payload?: ToolConfirmationPayload,
    ) => Promise<void>,
    outcome: ToolConfirmationOutcome,
    signal: AbortSignal,
    payload?: ToolConfirmationPayload,
  ): Promise<void>;
  private _handleConfirmationResponseInner;
  private recordAutoModeFallbackResolution;
  /**
   * Opens an IDE diff view for edit-type tools when IDE mode is active.
   * The IDE resolution is handled asynchronously — if the user accepts or
   * rejects from the IDE, it triggers handleConfirmationResponse.
   *
   * Uses confirmationDetails.filePath / newContent (the same data shown in
   * CLI diff) rather than ModifyContext so that the IDE diff is always
   * consistent with the CLI and with resolveDiffFromCli.
   */
  private openIdeDiffIfEnabled;
  /**
   * Applies user-provided content changes to a tool call that is awaiting confirmation.
   * This method updates the tool's arguments and refreshes the confirmation prompt with a new diff
   * before the tool is scheduled for execution.
   * @private
   */
  private _applyInlineModify;
  private attemptExecutionOfScheduledCalls;
  private hasExecutingOrAwaitingApprovalCall;
  /**
   * Execute multiple tool calls concurrently with a concurrency cap.
   */
  private runConcurrently;
  private executeSingleToolCall;
  /**
   * Whether a PreToolUse 'ask' decision can be surfaced as an interactive
   * TUI confirmation. Mirrors the confirmation-phase guards: a
   * non-interactive CLI (unless STREAM_JSON, which can answer control
   * requests) and background agents cannot prompt, so an 'ask' there must
   * fall back to deny rather than hang forever in awaiting_approval.
   */
  private canPromptForAskBounce;
  /**
   * Bounce a tool from the EXECUTION phase back to awaiting_approval so the
   * user can confirm a PreToolUse 'ask' decision in the TUI. Reuses the
   * standard confirmation machinery: a synthetic 'info' confirmation whose
   * onConfirm routes through handleConfirmationResponse (ProceedOnce →
   * re-execute, Cancel → cancelled). `hideAlwaysAllow` is set because the
   * hook re-evaluates on every call, so an "always allow" rule is
   * meaningless. The callId is added to `bouncedAwaitingApproval` BEFORE
   * the status change so executeSingleToolCall's finally keeps the tool
   * span open across the bounce and the re-execution skips the hook +
   * prelude (see `_executeToolCallBody`).
   */
  private bounceToAwaitingApprovalForAsk;
  private safelyAddToolArgumentsAttributes;
  private safelyAddToolCallResultAttributes;
  private _executeToolCallBody;
  private checkAndNotifyCompletion;
  private maybePersistLargeToolResult;
  private applyBatchOutputBudget;
  private recordToolResults;
  private notifyToolCallsUpdate;
  private setToolCallOutcome;
  private autoApproveCompatiblePendingTools;
}
export {};
