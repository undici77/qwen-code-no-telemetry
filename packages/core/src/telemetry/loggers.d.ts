/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LogAttributes } from './dummy-otel.js';
import type { Config } from '../config/config.js';
import type {
  ApiErrorEvent,
  ApiCancelEvent,
  ApiRequestEvent,
  ApiResponseEvent,
  FileOperationEvent,
  IdeConnectionEvent,
  StartSessionEvent,
  ToolCallEvent,
  UserPromptEvent,
  UserRetryEvent,
  FlashFallbackEvent,
  NextSpeakerCheckEvent,
  LoopDetectedEvent,
  RepeatedToolFailureGuardEvent,
  LoopDetectionDisabledEvent,
  SlashCommandEvent,
  ConversationFinishedEvent,
  KittySequenceOverflowEvent,
  ChatCompressionEvent,
  ContentRetryEvent,
  ContentRetryFailureEvent,
  ProtocolTagSanitizedEvent,
  ApiRetryEvent,
  RipgrepFallbackEvent,
  RipgrepRuntimeRecoveryEvent,
  ToolOutputTruncatedEvent,
  ExtensionDisableEvent,
  ExtensionEnableEvent,
  ExtensionUninstallEvent,
  ExtensionUpdateEvent,
  ExtensionInstallEvent,
  ModelSlashCommandEvent,
  SubagentExecutionEvent,
  MalformedJsonResponseEvent,
  InvalidChunkEvent,
  AuthEvent,
  SkillLaunchEvent,
  UserFeedbackEvent,
  ArenaSessionStartedEvent,
  ArenaAgentCompletedEvent,
  ArenaSessionEndedEvent,
  PromptSuggestionEvent,
  SpeculationEvent,
  WorkflowKeywordEvent,
  WorkflowRunEvent,
  MemoryExtractEvent,
  MemoryDreamEvent,
  MemoryRecallEvent,
  MemoryRecallDeliveryEvent,
} from './types.js';
import type { HookCallEvent } from './types.js';
declare function getCommonAttributes(config: Config): LogAttributes;
export { getCommonAttributes };
type NormalizedToolCallEvent = ToolCallEvent & {
  execution_status: NonNullable<ToolCallEvent['execution_status']>;
};
/**
 * Normalizes a tool call event for telemetry sinks. Error fields are
 * deleted (not set to undefined) on success so downstream consumers
 * see key-absent rather than key-present-with-undefined.
 */
export declare function normalizeToolCallEvent(
  event: ToolCallEvent,
): NormalizedToolCallEvent;
export declare function logStartSession(
  config: Config,
  event: StartSessionEvent,
  previousSessionId?: string,
): void;
export declare function logSessionEnd(config: Config): void;
export declare function logUserPrompt(
  config: Config,
  event: UserPromptEvent,
): void;
export declare function logUserRetry(
  config: Config,
  event: UserRetryEvent,
): void;
export declare function logToolCall(config: Config, event: ToolCallEvent): void;
export declare function logToolOutputTruncated(
  config: Config,
  event: ToolOutputTruncatedEvent,
): void;
export declare function logFileOperation(
  config: Config,
  event: FileOperationEvent,
): void;
export declare function logApiRequest(
  config: Config,
  event: ApiRequestEvent,
  sessionId?: string,
): void;
export declare function logFlashFallback(
  config: Config,
  event: FlashFallbackEvent,
): void;
export declare function logRipgrepFallback(
  config: Config,
  event: RipgrepFallbackEvent,
): void;
export declare function logRipgrepRuntimeRecovery(
  config: Config,
  event: RipgrepRuntimeRecoveryEvent,
): void;
export declare function logApiError(
  config: Config,
  event: ApiErrorEvent,
  sessionId?: string,
): void;
export declare function logApiCancel(
  config: Config,
  event: ApiCancelEvent,
): void;
export declare function logApiResponse(
  config: Config,
  event: ApiResponseEvent,
  sessionId?: string,
): void;
export declare function logLoopDetected(
  config: Config,
  event: LoopDetectedEvent,
  options?: {
    recordToQwenLogger?: boolean;
  },
): void;
export declare function logRepeatedToolFailureGuard(
  event: RepeatedToolFailureGuardEvent,
): void;
export declare function logLoopDetectionDisabled(
  config: Config,
  _event: LoopDetectionDisabledEvent,
): void;
export declare function logNextSpeakerCheck(
  config: Config,
  event: NextSpeakerCheckEvent,
): void;
export declare function logSlashCommand(
  config: Config,
  event: SlashCommandEvent,
): void;
export declare function logIdeConnection(
  config: Config,
  event: IdeConnectionEvent,
): void;
export declare function logConversationFinishedEvent(
  config: Config,
  event: ConversationFinishedEvent,
): void;
export declare function logChatCompression(
  config: Config,
  event: ChatCompressionEvent,
): void;
export declare function logKittySequenceOverflow(
  config: Config,
  event: KittySequenceOverflowEvent,
): void;
export declare function logMalformedJsonResponse(
  config: Config,
  event: MalformedJsonResponseEvent,
): void;
export declare function logInvalidChunk(
  config: Config,
  event: InvalidChunkEvent,
): void;
export declare function logContentRetry(
  config: Config,
  event: ContentRetryEvent,
): void;
export declare function logProtocolTagSanitized(
  config: Config,
  event: ProtocolTagSanitizedEvent,
): void;
export declare function logContentRetryFailure(
  config: Config,
  event: ContentRetryFailureEvent,
): void;
/**
 * Phase 4b — Emits an HTTP-status retry event fired from `retryWithBackoff`
 * at an LLM call site (via the `onRetry` callback opt-in). Distinct from
 * `logContentRetry`, which is fired by `geminiChat`'s content-recovery loop.
 *
 * Fan-out (sink 0 fires first, before the SDK guard, so retries are counted
 * even with telemetry off; sinks 1–3 match the `logContentRetry` shape):
 *   0. `apiActivityTracker` increment — daemon-status model-API-health charts
 *      (drained per live model round by the ACP MessageEmitter).
 *   1. QwenLogger RUM ingestion (Aliyun internal stats)
 *   2. OTel log signal via `logger.emit()` — picked up by LogToSpanProcessor
 *      and bridged to a span sibling under the caller's active span (typically
 *      interaction or tool, NOT the failed LLM span — that span has already
 *      ended by the time onRetry fires).
 *   3. `recordApiRetry` Counter increment for per-model retry-rate dashboards.
 */
export declare function logApiRetry(config: Config, event: ApiRetryEvent): void;
export declare function logSubagentExecution(
  config: Config,
  event: SubagentExecutionEvent,
): void;
export declare function logModelSlashCommand(
  config: Config,
  event: ModelSlashCommandEvent,
): void;
export declare function logHookCall(config: Config, event: HookCallEvent): void;
export declare function logExtensionInstallEvent(
  config: Config,
  event: ExtensionInstallEvent,
): void;
export declare function logExtensionUninstall(
  config: Config,
  event: ExtensionUninstallEvent,
): void;
export declare function logExtensionUpdateEvent(
  config: Config,
  event: ExtensionUpdateEvent,
): Promise<void>;
export declare function logExtensionEnable(
  config: Config,
  event: ExtensionEnableEvent,
): void;
export declare function logExtensionDisable(
  config: Config,
  event: ExtensionDisableEvent,
): void;
export declare function logAuth(config: Config, event: AuthEvent): void;
export declare function logSkillLaunch(
  config: Config,
  event: SkillLaunchEvent,
): void;
export declare function recordSkillInvocation(
  config: Config,
  event: {
    skillName: string;
    success: boolean;
  },
): void;
export declare function logUserFeedback(
  config: Config,
  event: UserFeedbackEvent,
): void;
export declare function logArenaSessionStarted(
  config: Config,
  event: ArenaSessionStartedEvent,
): void;
export declare function logArenaAgentCompleted(
  config: Config,
  event: ArenaAgentCompletedEvent,
): void;
export declare function logArenaSessionEnded(
  config: Config,
  event: ArenaSessionEndedEvent,
): void;
export declare function logPromptSuggestion(
  config: Config,
  event: PromptSuggestionEvent,
): void;
export declare function logSpeculation(
  config: Config,
  event: SpeculationEvent,
): void;
export declare function logWorkflowKeyword(
  config: Config,
  event: WorkflowKeywordEvent,
): void;
export declare function logWorkflowRun(
  config: Config,
  event: WorkflowRunEvent,
): void;
export declare function logMemoryExtract(
  config: Config,
  event: MemoryExtractEvent,
): void;
export declare function logMemoryDream(
  config: Config,
  event: MemoryDreamEvent,
): void;
export declare function logMemoryRecall(
  config: Config,
  event: MemoryRecallEvent,
): void;
export declare function logMemoryRecallDelivery(
  config: Config,
  event: MemoryRecallDeliveryEvent,
): void;
