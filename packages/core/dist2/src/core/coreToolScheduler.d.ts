/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolCallRequestInfo, ToolCallResponseInfo, ToolCallConfirmationDetails, ToolResultDisplay, EditorType, Config, ToolConfirmationPayload, AnyDeclarativeTool, AnyToolInvocation, ChatRecordingService } from '../index.js';
import { ToolConfirmationOutcome } from '../index.js';
import type { Part, PartListUnion } from '@google/genai';
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
    tool: AnyDeclarativeTool;
    invocation: AnyToolInvocation;
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
export type ToolCall = ValidatingToolCall | ScheduledToolCall | ErroredToolCall | SuccessfulToolCall | ExecutingToolCall | CancelledToolCall | WaitingToolCall;
export type CompletedToolCall = SuccessfulToolCall | CancelledToolCall | ErroredToolCall;
/**
 * Pull the filesystem path-bearing fields out of a tool's input.
 * Per-tool dispatcher because the field name and shape differ:
 *
 *  - read_file / edit / write_file → `file_path`
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
export declare function extractToolFilePaths(toolName: string, toolInput: unknown): string[];
export type ConfirmHandler = (toolCall: WaitingToolCall) => Promise<ToolConfirmationOutcome>;
export type OutputUpdateHandler = (toolCallId: string, outputChunk: ToolResultDisplay) => void;
export type AllToolCallsCompleteHandler = (completedToolCalls: CompletedToolCall[]) => Promise<void>;
export type ToolCallsUpdateHandler = (toolCalls: ToolCall[]) => void;
export declare function convertToFunctionResponse(toolName: string, callId: string, llmContent: PartListUnion): Part[];
interface CoreToolSchedulerOptions {
    config: Config;
    outputUpdateHandler?: OutputUpdateHandler;
    onAllToolCallsComplete?: AllToolCallsCompleteHandler;
    onToolCallsUpdate?: ToolCallsUpdateHandler;
    getPreferredEditor: () => EditorType | undefined;
    onEditorClose: () => void;
    /**
     * Optional recording service. If provided, tool results will be recorded.
     */
    chatRecordingService?: ChatRecordingService;
}
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
    private isFinalizingToolCalls;
    private isScheduling;
    private validationRetryCounts;
    private toolSpans;
    private blockedSpans;
    private callIdToBatch;
    private requestQueue;
    constructor(options: CoreToolSchedulerOptions);
    private setStatusInternal;
    private setArgsInternal;
    private isRunning;
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
    private buildInvocation;
    /**
     * Generates error message for unknown tool. Returns early with skill-specific
     * message if the name matches a skill, otherwise uses Levenshtein suggestions.
     */
    private getToolNotFoundMessage;
    /** Suggests similar tool names using Levenshtein distance. */
    private getToolSuggestion;
    schedule(request: ToolCallRequestInfo | ToolCallRequestInfo[], signal: AbortSignal): Promise<void>;
    /**
     * Removes all validation retry counters for the given tool. Keys are
     * "<toolName>:<errorMessage>", so a plain `Map.delete(toolName)` would not
     * match anything.
     */
    private clearRetryCountsForTool;
    private _schedule;
    handleConfirmationResponse(callId: string, originalOnConfirm: (outcome: ToolConfirmationOutcome, payload?: ToolConfirmationPayload) => Promise<void>, outcome: ToolConfirmationOutcome, signal: AbortSignal, payload?: ToolConfirmationPayload): Promise<void>;
    private _handleConfirmationResponseInner;
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
    /**
     * Execute multiple tool calls concurrently with a concurrency cap.
     */
    private runConcurrently;
    private executeSingleToolCall;
    private _executeToolCallBody;
    private checkAndNotifyCompletion;
    /**
     * Records tool results to the chat recording service.
     * This captures both the raw Content (for API reconstruction) and
     * enriched metadata (for UI recovery).
     */
    private recordToolResults;
    private notifyToolCallsUpdate;
    private setToolCallOutcome;
    private autoApproveCompatiblePendingTools;
}
export {};
