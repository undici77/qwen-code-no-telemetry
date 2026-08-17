/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  GenerateContentResponse,
  Content,
  GenerateContentConfig,
  SendMessageParameters,
  Part,
  Tool,
} from '@google/genai';
import { type RetryInfo } from '../utils/rateLimit.js';
import type { Config } from '../config/config.js';
import type { StructuredError } from './turn.js';
import { type ChatRecordingService } from '../services/chatRecordingService.js';
import { type CompactTrigger } from '../services/chatCompressionService.js';
import { type MicrocompactMeta } from '../services/microcompaction/microcompact.js';
import type { UiTelemetryService } from '../telemetry/uiTelemetry.js';
import { type ChatCompressionInfo } from './turn.js';
import type { SessionStartSource } from '../hooks/types.js';
import { InvalidStreamError } from './invalid-stream-error.js';
import type { GoalTurnPermit } from '../goals/goal-protocol.js';
export { InvalidStreamError };
/**
 * Single source of the pointer text that replaces an approved plan's
 * `functionCall.args.plan` (#6237). Shared by the tool scheduler's
 * post-approval rewrite and the load-side pass below so the two surfaces
 * cannot drift.
 */
export declare function approvedPlanRedactionText(planPath: string): string;
/**
 * Pure history-wide variant of the approved-plan redaction: rewrites the
 * `plan` argument of every `exit_plan_mode` `functionCall` whose paired
 * `functionResponse` carries an approval `llmContent` AND whose plan text
 * equals `savedPlanContent` (the current on-disk plan file). Returns a new
 * array when anything changed, or null when the history is untouched.
 *
 * Exported for tests; production callers go through
 * `GeminiChat.setHistory` / the constructor.
 */
export declare function redactApprovedPlansInHistory(
  history: Content[],
  savedPlanContent: string,
  planPath: string,
): Content[] | null;
/**
 * Replaces the args on a `structured_output` `functionCall` with the
 * same `__redacted` placeholder used by `ToolCallEvent` telemetry
 * (`packages/core/src/telemetry/types.ts`).
 *
 * The chat-recording JSONL (`<projectDir>/chats/<sessionId>.jsonl`)
 * persists assistant turns to disk and re-feeds them on
 * `--continue` / `--resume`. For `--json-schema` runs the tool args
 * ARE the user's structured payload — already emitted on stdout via
 * `result` / `structured_result`. Recording them verbatim here would
 * mean the same payload (and every validation-failure retry along the
 * way) sits on disk indefinitely, contradicting the privacy contract
 * documented next to the telemetry redaction. Mirror the placeholder
 * here so the chat-recording surface matches.
 *
 * Non-`structured_output` `functionCall`s pass through untouched.
 *
 * Exported for tests; callers should prefer the inline use inside
 * `recordAssistantTurn` invocation below.
 */
export declare function redactStructuredOutputArgsForRecording(part: Part): {
  functionCall: NonNullable<Part['functionCall']>;
} | null;
export declare enum StreamEventType {
  /** A regular content chunk from the API. */
  CHUNK = 'chunk',
  /** A signal that a retry is about to happen. The UI should discard any partial
   * content from the attempt that just failed. */
  RETRY = 'retry',
  /** Emitted once at the start of the stream when an automatic compression
   * pass succeeded. Carries the compression result so callers (the main
   * agent UI, subagent loop) can surface it without each call site running
   * its own compaction step. */
  COMPRESSED = 'compressed',
  /** Emitted when the primary model (or a prior fallback) exhausted its retry
   * budget on a capacity/availability error and the system is switching to the
   * next fallback model. The UI should discard partial content and display a
   * notification about the model switch. */
  MODEL_FALLBACK = 'model_fallback',
}
/** Information about a model fallback transition. */
export interface ModelFallbackInfo {
  /** The model that exhausted its retry budget. */
  fromModel: string;
  /** The model the system is switching to. */
  toModel: string;
  /** HTTP status code that triggered the fallback (e.g. 429, 503, 529). */
  statusCode?: number;
  /** 1-based index of the fallback in the configured fallback chain. */
  fallbackIndex: number;
}
export type StreamEvent =
  | {
      type: StreamEventType.CHUNK;
      value: GenerateContentResponse;
    }
  | {
      type: StreamEventType.RETRY;
      retryInfo?: RetryInfo;
      /** When true, the retry is a continuation (recovery) rather than a
       *  fresh restart (escalation). The UI should keep the accumulated text
       *  buffer so the continuation appends to it. */
      isContinuation?: boolean;
      /** Set when the retry raised the automatic max output token limit. */
      maxOutputTokensEscalated?: number;
    }
  | {
      type: StreamEventType.COMPRESSED;
      info: ChatCompressionInfo;
    }
  | {
      type: StreamEventType.MODEL_FALLBACK;
      info: ModelFallbackInfo;
    };
interface TryCompressOptions {
  originalTokenCountOverride?: number;
  trigger?: CompactTrigger;
  /**
   * Pending user message about to be sent. Threaded through to the
   * compression service's cheap-gate so it can see the real prompt size
   * even when `lastPromptTokenCount === 0` (first send after inherited
   * history). See `estimatePromptTokens` for the fallback math.
   */
  pendingUserMessage?: Content;
  /**
   * Pre-computed all-inclusive effective prompt count from the caller. When
   * set, the cheap-gate uses this instead of recomputing — avoids a second
   * `getHistory(true)` clone per send and prevents provider-reported overflow
   * counts from double-counting the previous model output.
   */
  precomputedEffectiveTokens?: number;
  /** Per-request overrides needed to preserve the main request cache prefix. */
  requestGenerationConfig?: GenerateContentConfig;
  /**
   * Delay writing the compression checkpoint until the caller has run any
   * post-compression guards that may roll the in-memory chat state back.
   */
  deferChatCompressionRecord?: boolean;
  /**
   * Forwarded to the compression side-query system prompt. Sourced from
   * `/compress <text>` invocation arg; appended after the base prompt as
   * an `Additional Instructions:` block so the summary model can focus
   * on the user's stated concern.
   */
  customInstructions?: string;
}
export declare function isValidNonThoughtTextPart(part: Part): boolean;
/**
 * Default error text used when a synthesized `functionResponse` has to stand
 * in for a real tool result that never made it back into history (e.g. the
 * process crashed between the partial-tool_use push and tool completion, or
 * the user hit Ctrl+Y before the in-flight tool finished and the scheduler's
 * `onAllToolCallsComplete` was a single-shot that already fired into an
 * `isResponding` early-return).
 */
export declare const ORPHAN_TOOL_USE_REPAIR_REASON: string;
/**
 * Forward-walk `history`, planning and applying the repair for each
 * `model[functionCall]` turn in turn. Iteration is index-based and the
 * cursor advances by the count of user turns inserted ahead of it so
 * a freshly-injected turn isn't re-visited.
 *
 * Splitting scan / decision / mutation into separate functions keeps
 * each phase auditable in isolation — index drift can only happen in
 * `applyRepair`, the only function that mutates `history`.
 */
export declare function repairOrphanedToolUseTurns(
  history: Content[],
  reason?: string,
): {
  injected: Array<{
    callId: string;
    name: string;
  }>;
  droppedDuplicates: Array<{
    callId: string;
    name: string;
  }>;
};
export declare class GeminiChat {
  private readonly config;
  private readonly generationConfig;
  private history;
  private readonly chatRecordingService?;
  private readonly telemetryService?;
  private sendPromise;
  /**
   * Per-chat last-prompt-token-count, populated from `usageMetadata` on each
   * model response. Used by the compaction threshold check so that subagents
   * (which intentionally don't write to the global telemetry singleton) can
   * still make compaction decisions based on their *own* context size.
   */
  private lastPromptTokenCount;
  private lastPromptTokenCountIsEstimated;
  /**
   * Per-chat output-token count from the previous model response. The
   * previous response is appended to local history after `promptTokenCount`
   * was reported, so steady-state prompt estimates add this value to avoid
   * under-counting the next request near the hard compaction threshold.
   */
  private lastOutputTokenCount;
  /**
   * Number of consecutive auto-compaction failures for this chat. The
   * cheap-gate NOOPs once this reaches MAX_CONSECUTIVE_FAILURES (default 3)
   * until a successful compress (forced or not) resets it to 0. Replaces the
   * single-shot hasFailedCompressionAttempt lock that previously disabled
   * auto-compaction for the rest of the session on any failure.
   *
   * SEMANTICS (R5.3): this counter tracks "non-force, non-hard-rescue
   * consecutive failures", NOT every failure literally.
   *   - Auto-compaction failures (cheap-gate path): increment by 1.
   *   - Manual `/compress` failures: skipped (`force=true` → `!force`
   *     guard in the failure branch).
   *   - Hard-tier rescue failures: skipped here because force=true bypasses
   *     this breaker; bounded separately by hardRescueFailureCount.
   *   - Reactive overflow failures: explicitly incremented in the overflow
   *     handler so N repeated reactive failures still trip this breaker.
   *
   * If you're debugging "why is hard-rescue firing but the counter is 0",
   * that's by design.
   */
  private consecutiveFailures;
  /**
   * Number of failed hard-tier rescue attempts for this chat. Hard rescue is
   * forced and therefore bypasses the cheap-gate breaker, so it needs its own
   * bound to avoid spending one compression side-query on every send when
   * history repeatedly cannot shrink. NOOP counts toward this bound because
   * it leaves the prompt oversized and would otherwise spend one compression
   * side-query on every send. COMPRESSED resets this unless the
   * post-compression hard-limit guard still rejects the send.
   */
  private hardRescueFailureCount;
  /**
   * Partial-push markers — index of the in-memory `model[partial fc]`
   * and the matching deferred JSONL record. See the canonical note
   * above `ORPHAN_TOOL_USE_REPAIR_REASON` for the lifecycle and the
   * wedge they prevent.
   */
  private pendingPartialAssistantTurnIndex;
  private pendingPartialAssistantRecord;
  private readonly imagePayloadStore;
  /**
   * Monotonically counts user-content pushes that survived into history.
   * Incremented when `sendMessageStream` pushes the user content and decremented
   * only if that same push is rolled back on a setup-time failure. Auto-
   * compression mutates history length but never touches this counter, so a
   * caller (the Retry strip/restore in client.ts) can snapshot it and tell
   * whether the re-submitted content actually landed — a history-length delta
   * can't, since compression shrinks history independently of the push.
   */
  private userContentPushCount;
  private manualPlanExitNoticesEnabled;
  /**
   * Reset both partial-push markers in lockstep. Every history-mutation
   * site uses this — single-field resets are a bug because the fields
   * are always paired by lifecycle.
   */
  private clearPendingPartialState;
  private popPendingPartialAssistantTurn;
  /**
   * Creates a new GeminiChat instance.
   *
   * @param config - The configuration object.
   * @param generationConfig - Optional generation configuration.
   * @param history - Optional initial conversation history.
   * @param chatRecordingService - Optional recording service. If provided, chat
   *   messages will be recorded.
   * @param telemetryService - Optional UI telemetry service. When provided,
   *   prompt token counts are reported on each API response. Pass `undefined`
   *   for sub-agent chats to avoid overwriting the main agent's context usage.
   */
  constructor(
    config: Config,
    generationConfig?: GenerateContentConfig,
    history?: Content[],
    chatRecordingService?: ChatRecordingService | undefined,
    telemetryService?: UiTelemetryService | undefined,
  );
  enableManualPlanExitNotices(): void;
  /**
   * Most recent prompt-token count reported by the model for *this* chat,
   * mirroring the value in {@link UiTelemetryService} for the main session.
   * Subagent chats have no telemetry service wired but still need a per-chat
   * count for compaction decisions, so this is always populated regardless
   * of whether the global telemetry is updated.
   */
  getLastPromptTokenCount(): number;
  /** Previous model-response tokens used by the next prompt estimate. */
  getLastOutputTokenCount(): number;
  /**
   * Builds request contents for the content generator without deep-cloning the
   * whole chat history. This is an internal hot path: long sessions can make a
   * full `structuredClone` larger than the remaining V8 heap headroom.
   *
   * Public history readers still use {@link getHistory}, which returns a
   * defensive deep copy for caller mutation safety.
   */
  private getRequestHistory;
  private getRequestHistoryForRoute;
  /**
   * Seed the last-prompt-token-count for chats created with inherited
   * history (forks, subagents, speculation). Without this, the auto-compress
   * threshold check sees `0` and refuses to compress — so the first API call
   * can 400 from oversized history. Callers pass the parent chat's
   * `getLastPromptTokenCount()` here. This also clears any remembered
   * previous-response output token count because the seeded prompt count
   * comes from a different chat instance and should not inherit this chat's
   * last response size.
   */
  setLastPromptTokenCount(count: number, isEstimated?: boolean): void;
  isLastPromptTokenCountEstimated(): boolean;
  private promptCountIsEstimateDerived;
  /**
   * Seed the restored prompt and previous-response output token counts in one
   * step. Resume restores chat history plus both counters and their provenance
   * from the same checkpoint, so callers must avoid the normal
   * setLastPromptTokenCount() clearing behavior.
   */
  seedResumeTokenCounts(
    promptTokenCount: number,
    outputTokenCount: number,
    isEstimated?: boolean,
  ): void;
  /**
   * Attempt to compress this chat's history.
   *
   * Returns the compression info regardless of outcome. On a successful
   * compaction (`COMPRESSED`), this method has already mutated the chat's
   * history, recorded the event to `chatRecordingService` (if wired and
   * unless `options.deferChatCompressionRecord` is set), and updated both
   * the per-chat token count and (when wired) the global telemetry singleton.
   * Deferred callers are responsible for recording after their own
   * post-compression guards pass.
   */
  tryCompress(
    promptId: string,
    force?: boolean,
    signal?: AbortSignal,
    options?: TryCompressOptions,
  ): Promise<ChatCompressionInfo>;
  /**
   * Fast, rule-based compression without any LLM side-query.
   *
   * Force-runs microcompaction (clear old tool results + media, keep recent N)
   * then strips thinking parts from all model turns.
   */
  compressFast(): {
    info: ChatCompressionInfo;
    microcompactMeta?: MicrocompactMeta;
  };
  setSystemInstruction(sysInstr: string): void;
  setSessionStartContext(extraInstruction: string): void;
  applySessionStartContext(
    extraInstruction: string,
    _source: SessionStartSource,
  ): void;
  /**
   * Sends a message to the model and returns the response in chunks.
   *
   * @remarks
   * This method will wait for the previous message to be processed before
   * sending the next message.
   *
   * @see {@link Chat#sendMessage} for non-streaming method.
   * @param params - parameters for sending the message.
   * @return The model's response.
   *
   * @example
   * ```ts
   * const chat = ai.chats.create({model: 'gemini-2.0-flash'});
   * const response = await chat.sendMessageStream({
   * message: 'Why is the sky blue?'
   * });
   * for await (const chunk of response) {
   * console.log(chunk.text);
   * }
   * ```
   */
  sendMessageStream(
    model: string,
    params: SendMessageParameters,
    prompt_id: string,
    goalContext?: GoalTurnPermit,
  ): Promise<AsyncGenerator<StreamEvent>>;
  /**
   * Makes an API call with retry logic and returns the processed stream.
   *
   * When called without `overrides`, uses the session's primary content
   * generator and provider config (the common path for the main model).
   * Pass `overrides` to run against a different content generator — used
   * by the fallback chain to call alternative models without duplicating
   * the retry wiring.
   */
  private makeApiCallAndProcessStream;
  private makeFallbackStream;
  /**
   * Returns the chat history.
   *
   * @remarks
   * The history is a list of contents alternating between user and model.
   *
   * There are two types of history:
   * - The `curated history` contains only the valid turns between user and
   * model, which will be included in the subsequent requests sent to the model.
   * - The `comprehensive history` contains all turns, including invalid or
   * empty model outputs, providing a complete record of the history.
   *
   * The history is updated after receiving the response from the model,
   * for streaming response, it means receiving the last chunk of the response.
   *
   * The `comprehensive history` is returned by default. To get the `curated
   * history`, set the `curated` parameter to `true`.
   *
   * @param curated - whether to return the curated history or the comprehensive
   * history.
   * @return History contents alternating between user and model for the entire
   * chat session.
   */
  getHistory(curated?: boolean): Content[];
  /**
   * Returns a deep-copied tail of the chat history. This avoids cloning the
   * entire session when callers only need recent context.
   */
  getHistoryTail(count: number, curated?: boolean): Content[];
  /**
   * Returns a shallow copy of the history and each entry's parts array without
   * cloning large part payloads. Use only for read-only consumers or consumers
   * that replace touched entries before mutating them.
   */
  getHistoryShallow(curated?: boolean): Content[];
  getHistoryForForkWindow(): Content[];
  /**
   * Shallow tail variant for hot paths that only need recent history.
   */
  getHistoryTailShallow(count: number, curated?: boolean): Content[];
  /**
   * Returns a defensive copy of the last raw history entry without cloning the
   * full conversation. This avoids O(history) cloning, though cloning the last
   * entry is still proportional to that entry's own size.
   */
  getLastHistoryEntry(): Content | undefined;
  /**
   * Returns the last raw history entry for read-only checks. Callers must not
   * mutate the returned object.
   */
  peekLastHistoryEntry(): Content | undefined;
  /**
   * Returns concatenated text from the last model entry without cloning the
   * full history. Used by stop hooks, where only the latest assistant text is
   * needed.
   */
  getLastModelMessageText(): string | undefined;
  /**
   * Returns the number of entries in the raw chat history. O(1) and
   * does not clone — use this when you only need the count and would
   * otherwise pay the {@link getHistory} `structuredClone` cost.
   */
  getHistoryLength(): number;
  /**
   * Monotonic count of user-content pushes that survived into history (see the
   * field doc). Snapshot it before a send and compare after to tell whether the
   * send actually pushed the user content — robust to auto-compression, which
   * changes history length without touching this counter.
   */
  getUserContentPushCount(): number;
  /**
   * Set of `functionResponse.id` strings in user turns. Walk-only,
   * no clone — `useGeminiStream.handleCompletedTools` calls this per
   * tool-completion batch, so {@link getHistory}'s `structuredClone`
   * would stall the UI on long sessions.
   */
  getHistoryFunctionResponseIds(): Set<string>;
  /**
   * Clears the chat history.
   */
  clearHistory(): void;
  /**
   * Adds a new entry to the chat history.
   */
  addHistory(content: Content): void;
  /**
   * Replaces the `plan` argument of an `exit_plan_mode` `functionCall` in
   * history with a short reference, keeping every other part and argument
   * intact.
   *
   * The full plan text a model submits to `exit_plan_mode` stays in history
   * as its own tool-call arguments; on long conversations models
   * occasionally regurgitate chunks of that blob in later responses
   * (#6237). Once the plan is approved it is persisted to disk by
   * `Config.savePlan`, so the in-context copy can be swapped for a pointer
   * without losing information. Rejected plans are left untouched — the
   * model needs the text to revise them.
   *
   * When `expectedPlan` is provided the rewrite additionally requires the
   * in-history plan to equal it byte-for-byte. Callers pass the on-disk
   * plan-file content here so the pointer can never claim a save that
   * failed (`savePlanBestEffort` swallows filesystem errors) or reference
   * a file that holds a different plan.
   *
   * The entry is replaced immutably at the same index; the partial-push
   * markers compare by index and role, so this cannot desync them.
   *
   * @returns true when a matching functionCall was found and rewritten.
   */
  redactApprovedPlanFromHistory(
    callId: string,
    replacement: string,
    expectedPlan?: string,
  ): boolean;
  /**
   * Read-side counterpart of {@link redactApprovedPlanFromHistory}: the
   * chat-recording JSONL captured the assistant turn (with the full plan
   * argument) before the tool ran, so a `--resume` / `--continue` reload
   * re-feeds the plan text the in-session redaction already removed
   * (#6237). Every wholesale history load re-applies the redaction to
   * approved `exit_plan_mode` calls.
   *
   * Only calls whose in-history plan matches the current on-disk plan file
   * are rewritten — same never-lie rule as the write side. With several
   * approved plans in one session the file holds only the last one, so
   * earlier calls rehydrate unredacted; safe, just not minimal.
   */
  private redactApprovedPlansFromLoadedHistory;
  setHistory(history: Content[]): void;
  truncateHistory(keepCount: number): void;
  stripThoughtsFromHistory(): void;
  /**
   * Pop orphaned trailing user entries from chat history.
   * In a valid conversation the last entry is always a model response;
   * any trailing user entries are leftovers from a request that failed.
   */
  stripOrphanedUserEntriesFromHistory(): Content[];
  /**
   * Instance wrapper around the free-function {@link repairOrphanedToolUseTurns}.
   * See the canonical note above `ORPHAN_TOOL_USE_REPAIR_REASON`.
   */
  repairOrphanedToolUseTurns(reason?: string): {
    injected: Array<{
      callId: string;
      name: string;
    }>;
    droppedDuplicates: Array<{
      callId: string;
      name: string;
    }>;
  };
  setTools(tools: Tool[]): void;
  /** Returns a shallow copy of the current generation config (for cache param snapshots). */
  getGenerationConfig(): GenerateContentConfig;
  maybeIncludeSchemaDepthContext(error: StructuredError): Promise<void>;
  /**
   * @param transportContinuationPrefix - Text a previous attempt already
   *   delivered before a socket cut, which this attempt was asked to resume
   *   from (issue #7832). On success it is folded into the response parts
   *   before either durable write, so the JSONL transcript and in-memory
   *   history carry the same merged turn (issue #8094). Undefined on every
   *   non-continuation send.
   */
  private processStreamResponse;
  /**
   * Merge `pairCount` trailing (user_recovery, model_continuation) pairs back
   * into the model turn that precedes them. Used after the output-token
   * recovery loop so the internal OUTPUT_RECOVERY_MESSAGE control prompt
   * does not persist in durable history as if the user sent it.
   *
   * Expected tail shape per iteration (walking from the back):
   *   [..., precedingModel, userRecovery, modelContinuation]
   *
   * If any pair doesn't match that shape the method bails defensively
   * rather than corrupting history.
   */
  private coalesceRecoveryPairs;
}
/** Visible for Testing */
export declare function isSchemaDepthError(errorMessage: string): boolean;
export declare function isInvalidArgumentError(errorMessage: string): boolean;
