/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// No-op implementations for no-telemetry policy
// All telemetry functions are replaced with empty stubs
// Except: logApiResponse, logApiError, logToolCall forward to uiTelemetryService
// (local-only EventEmitter, zero network — see NO_TELEMETRY_GUIDELINES.MD §11)

import type { Config } from '../config/config.js';
import {
  uiTelemetryService,
  EVENT_TOOL_CALL,
  EVENT_API_ERROR,
  EVENT_API_RESPONSE,
} from './uiTelemetry.js';
import type { UiEvent } from './uiTelemetry.js';
||||||| 567de0378
  EVENT_USER_PROMPT,
  EVENT_USER_RETRY,
  EVENT_FLASH_FALLBACK,
  EVENT_NEXT_SPEAKER_CHECK,
  SERVICE_NAME,
  EVENT_SLASH_COMMAND,
  EVENT_CONVERSATION_FINISHED,
  EVENT_CHAT_COMPRESSION,
  EVENT_CONTENT_RETRY,
  EVENT_CONTENT_RETRY_FAILURE,
  EVENT_PROTOCOL_TAG_SANITIZED,
  EVENT_API_RETRY,
  EVENT_FILE_OPERATION,
  EVENT_RIPGREP_FALLBACK,
  EVENT_EXTENSION_INSTALL,
  EVENT_MODEL_SLASH_COMMAND,
  EVENT_EXTENSION_DISABLE,
  EVENT_SUBAGENT_EXECUTION,
  EVENT_MALFORMED_JSON_RESPONSE,
  EVENT_INVALID_CHUNK,
  EVENT_AUTH,
  EVENT_SKILL_LAUNCH,
  EVENT_EXTENSION_UPDATE,
  EVENT_USER_FEEDBACK,
  EVENT_ARENA_SESSION_STARTED,
  EVENT_ARENA_AGENT_COMPLETED,
  EVENT_ARENA_SESSION_ENDED,
  EVENT_PROMPT_SUGGESTION,
  EVENT_SPECULATION,
  EVENT_WORKFLOW_KEYWORD,
  EVENT_WORKFLOW_RUN,
  EVENT_MEMORY_EXTRACT,
  EVENT_MEMORY_DREAM,
  EVENT_MEMORY_RECALL,
  EVENT_TOOL_OUTPUT_TRUNCATED,
} from './constants.js';
import {
  recordApiErrorMetrics,
  recordApiResponseMetrics,
  recordChatCompressionMetrics,
  recordContentRetry,
  recordContentRetryFailure,
  recordApiRetry,
  recordFileOperationMetric,
  recordInvalidChunk,
  recordModelSlashCommand,
  recordSubagentExecutionMetrics,
  recordTokenUsageMetrics,
  recordToolCallMetrics,
  recordArenaSessionStartedMetrics,
  recordArenaAgentCompletedMetrics,
  recordArenaSessionEndedMetrics,
  recordMemoryExtractMetrics,
  recordMemoryDreamMetrics,
  recordMemoryRecallMetrics,
} from './metrics.js';
import { QwenLogger } from './qwen-logger/qwen-logger.js';
import { isTelemetrySdkInitialized } from './sdk.js';

} from './types.js';

export function getCommonAttributes(_config: Config): Record<string, unknown> {
  return {};
}

function recordUiTelemetryEventToChat(config: Config, uiEvent: UiEvent): void {
  config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
}

export function logStartSession(
  _config: Config,
  _event: StartSessionEvent,
): void {}
export function logUserPrompt(_config: Config, _event: UserPromptEvent): void {}
export function logUserRetry(_config: Config, _event: UserRetryEvent): void {}

export function logToolCall(config: Config, event: ToolCallEvent): void {
  const uiEvent = {
    ...event,
    'event.name': EVENT_TOOL_CALL,
    'event.timestamp': new Date().toISOString(),
  } as UiEvent;
  uiTelemetryService.addEvent(uiEvent, config.getSessionId());
  recordUiTelemetryEventToChat(config, uiEvent);
}

export function logHookCall(_config: Config, _event: HookCallEvent): void {}
export function logToolOutputTruncated(
  _config: Config,
  _event: ToolOutputTruncatedEvent,
): void {}
export function logFileOperation(
  _config: Config,
  _event: FileOperationEvent,
): void {}

export function logApiRequest(_config: Config, _event: ApiRequestEvent): void {}
export function logFlashFallback(
  _config: Config,
  _event: FlashFallbackEvent,
): void {}
export function logRipgrepFallback(
  _config: Config,
  _event: RipgrepFallbackEvent,
): void {}

export function logApiError(config: Config, event: ApiErrorEvent): void {
  const uiEvent = {
    ...event,
    'event.name': EVENT_API_ERROR,
    'event.timestamp': new Date().toISOString(),
  } as UiEvent;
  uiTelemetryService.addEvent(uiEvent, config.getSessionId());
  recordUiTelemetryEventToChat(config, uiEvent);
}

export function logApiCancel(_config: Config, _event: ApiCancelEvent): void {}

export function logApiResponse(config: Config, event: ApiResponseEvent): void {
  const uiEvent = {
    ...event,
    'event.name': EVENT_API_RESPONSE,
    'event.timestamp': new Date().toISOString(),
  } as UiEvent;
  uiTelemetryService.addEvent(uiEvent, config.getSessionId());
  recordUiTelemetryEventToChat(config, uiEvent);
}

export function logLoopDetected(
  _config: Config,
  _event: LoopDetectedEvent,
): void {}
export function logLoopDetectionDisabled(
  _config: Config,
  _event: LoopDetectionDisabledEvent,
): void {}

export function logNextSpeakerCheck(
  _config: Config,
  _event: NextSpeakerCheckEvent,
): void {}
export function logSlashCommand(
  _config: Config,
  _event: SlashCommandEvent,
): void {}
export function logIdeConnection(
  _config: Config,
  _event: IdeConnectionEvent,
): void {}
export function logConversationFinishedEvent(
  _config: Config,
  _event: ConversationFinishedEvent,
): void {}
export function logChatCompression(
  _config: Config,
  _event: ChatCompressionEvent,
): void {}
export function logKittySequenceOverflow(
  _config: Config,
  _event: KittySequenceOverflowEvent,
): void {}
export function logMalformedJsonResponse(
  _config: Config,
  _event: MalformedJsonResponseEvent,
): void {}
export function logInvalidChunk(
  _config: Config,
  _event: InvalidChunkEvent,
): void {}
export function logContentRetry(
  _config: Config,
  _event: ContentRetryEvent,
): void {}
export function logProtocolTagSanitized(
  _config: Config,
  _event: ProtocolTagSanitizedEvent,
): void {}
export function logContentRetryFailure(
  _config: Config,
  _event: ContentRetryFailureEvent,
): void {}
export function logApiRetry(_config: Config, _event: ApiRetryEvent): void {}
export function logSubagentExecution(
  _config: Config,
  _event: SubagentExecutionEvent,
): void {}
export function logModelSlashCommand(
  _config: Config,
  _event: ModelSlashCommandEvent,
): void {}
export function logExtensionInstallEvent(
  _config: Config,
  _event: ExtensionInstallEvent,
): void {}
export function logExtensionUpdateEvent(
  _config: Config,
  _event: ExtensionUpdateEvent,
): void {}
export function logExtensionUninstall(
  _config: Config,
  _event: ExtensionUninstallEvent,
): void {}
export function logExtensionEnable(
  _config: Config,
  _event: ExtensionEnableEvent,
): void {}
export function logExtensionDisable(
  _config: Config,
  _event: ExtensionDisableEvent,
): void {}
export function logAuth(_config: Config, _event: AuthEvent): void {}
export function logSkillLaunch(
  _config: Config,
  _event: SkillLaunchEvent,
): void {}
export function logUserFeedback(
  _config: Config,
  _event: UserFeedbackEvent,
): void {}
export function logArenaSessionStarted(
  _config: Config,
  _event: ArenaSessionStartedEvent,
): void {}
export function logArenaAgentCompleted(
  _config: Config,
  _event: ArenaAgentCompletedEvent,
): void {}
export function logArenaSessionEnded(
  _config: Config,
  _event: ArenaSessionEndedEvent,
): void {}

// ─── Workflow Log Functions — no-op in no-telemetry fork ─────────────────────

export function logWorkflowKeyword(
  _config: Config,
  _event: WorkflowKeywordEvent,
): void {}

export function logWorkflowRun(
  _config: Config,
  _event: WorkflowRunEvent,
): void {}

// ─── Auto-Memory Log Functions ───────────────────────────────────────────────
export function logMemoryExtract(
  _config: Config,
  _event: MemoryExtractEvent,
): void {}
export function logMemoryDream(
  _config: Config,
  _event: MemoryDreamEvent,
): void {}
export function logMemoryRecall(
  _config: Config,
  _event: MemoryRecallEvent,
): void {}
export function logPromptSuggestion(_config: Config, _event: unknown): void {}
export function logSpeculation(_config: Config, _event: unknown): void {}

export function recordSkillInvocation(
  config: Config,
  event: { skillName: string; success: boolean },
): void {
  uiTelemetryService.recordSkillInvocation(
    event.skillName,
    event.success,
    config.getSessionId(),
  );
}
