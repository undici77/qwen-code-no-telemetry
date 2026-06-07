/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import {
  uiTelemetryService,
  EVENT_TOOL_CALL,
  EVENT_API_ERROR,
  EVENT_API_RESPONSE,
} from './uiTelemetry.js';
import type {
  ApiErrorEvent,
  ApiCancelEvent,
  ApiRequestEvent,
  ApiResponseEvent,
  FileOperationEvent,
  ToolCallEvent,
  UserPromptEvent,
  UserRetryEvent,
  FlashFallbackEvent,
  NextSpeakerCheckEvent,
  SlashCommandEvent,
  ConversationFinishedEvent,
  ChatCompressionEvent,
  ContentRetryEvent,
  ContentRetryFailureEvent,
  ApiRetryEvent,
  RipgrepFallbackEvent,
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
  StartSessionEvent,
  LoopDetectedEvent,
  LoopDetectionDisabledEvent,
  IdeConnectionEvent,
  KittySequenceOverflowEvent,
  MemoryExtractEvent,
  MemoryDreamEvent,
  MemoryRecallEvent,
  HookCallEvent,
} from './types.js';

// No-op implementations for no-telemetry policy
// All telemetry functions are replaced with empty stubs

export function getCommonAttributes(_config: Config): Record<string, unknown> {
  return {};
}

export function logStartSession(
  _config: Config,
  _event: StartSessionEvent,
): void {}
export function logUserPrompt(_config: Config, _event: UserPromptEvent): void {}
export function logUserRetry(_config: Config, _event: UserRetryEvent): void {}

export function logToolCall(config: Config, event: ToolCallEvent): void {
  const uiEvent = Object.assign(event, {
    'event.name': EVENT_TOOL_CALL as typeof EVENT_TOOL_CALL,
  });
  uiTelemetryService.addEvent(uiEvent);
  config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
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
export function logApiRetry(_config: Config, _event: ApiRetryEvent): void {}

export function logApiError(config: Config, event: ApiErrorEvent): void {
  const uiEvent = Object.assign(event, {
    'event.name': EVENT_API_ERROR as typeof EVENT_API_ERROR,
  });
  uiTelemetryService.addEvent(uiEvent);
  config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
}

export function logApiCancel(_config: Config, _event: ApiCancelEvent): void {}

export function logApiResponse(config: Config, event: ApiResponseEvent): void {
  const uiEvent = Object.assign(event, {
    'event.name': EVENT_API_RESPONSE as typeof EVENT_API_RESPONSE,
  });
  uiTelemetryService.addEvent(uiEvent);
  config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent);
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
