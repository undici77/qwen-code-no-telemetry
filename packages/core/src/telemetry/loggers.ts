/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import { safeJsonStringify } from '../utils/safeJsonStringify.js';
import {
  EVENT_API_ERROR,
  EVENT_API_CANCEL,
  EVENT_API_REQUEST,
  EVENT_API_RESPONSE,
  EVENT_CLI_CONFIG,
  EVENT_EXTENSION_UNINSTALL,
  EVENT_EXTENSION_ENABLE,
  EVENT_IDE_CONNECTION,
  EVENT_TOOL_CALL,
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
} from './constants.js';
import {
  recordApiErrorMetrics,
  recordApiResponseMetrics,
  recordChatCompressionMetrics,
  recordContentRetry,
  recordContentRetryFailure,
  recordFileOperationMetric,
  recordInvalidChunk,
  recordModelSlashCommand,
  recordSubagentExecutionMetrics,
  recordTokenUsageMetrics,
  recordToolCallMetrics,
  recordArenaSessionStartedMetrics,
  recordArenaAgentCompletedMetrics,
  recordArenaSessionEndedMetrics,
} from './metrics.js';
import { QwenLogger } from './qwen-logger/qwen-logger.js';
import { isTelemetrySdkInitialized } from './sdk.js';
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
  FlashFallbackEvent,
  NextSpeakerCheckEvent,
  SlashCommandEvent,
  ConversationFinishedEvent,
  KittySequenceOverflowEvent,
  ChatCompressionEvent,
  ContentRetryEvent,
  ContentRetryFailureEvent,
  RipgrepFallbackEvent,
  ToolOutputTruncatedEvent,
  ExtensionDisableEvent,
  ExtensionEnableEvent,
  ExtensionUninstallEvent,
  ExtensionInstallEvent,
  ModelSlashCommandEvent,
  SubagentExecutionEvent,
  MalformedJsonResponseEvent,
  InvalidChunkEvent,
  AuthEvent,
  SkillLaunchEvent,
  UserFeedbackEvent,
  ExtensionUpdateEvent,
  ArenaSessionStartedEvent,
  ArenaAgentCompletedEvent,
  ArenaSessionEndedEvent,
} from './types.js';

// No-op implementations for no-telemetry policy
// All telemetry functions are replaced with empty stubs

export function logStartSession(
  _config: Config,
  _event: StartSessionEvent,
): void {}
export function logUserPrompt(_config: Config, _event: UserPromptEvent): void {}
export function logUserRetry(
  _config: Config,
  _event: { prompt_id: string },
): void {}

export function logToolCall(_config: Config, _event: ToolCallEvent): void {}
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

export function logApiError(_config: Config, _event: ApiErrorEvent): void {}
export function logApiCancel(_config: Config, _event: ApiCancelEvent): void {}
export function logApiResponse(
  _config: Config,
  _event: ApiResponseEvent,
): void {}

export function logLoopDetected(_config: Config, _event: any): void {}
export function logLoopDetectionDisabled(_config: Config, _event: any): void {}

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
export function logContentRetryFailure(
  _config: Config,
  _event: ContentRetryFailureEvent,
): void {}
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
export function logExtensionUpdateEvent(
  _config: Config,
  _event: ExtensionUpdateEvent,
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

// Arena events - no-op for no-telemetry policy
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
