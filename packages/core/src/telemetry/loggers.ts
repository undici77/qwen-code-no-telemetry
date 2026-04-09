/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
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
  PromptSuggestionEvent,
  SpeculationEvent,
  StartSessionEvent,
  LoopDetectedEvent,
  LoopDetectionDisabledEvent,
  IdeConnectionEvent,
  KittySequenceOverflowEvent,
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
): void {
  // Use any to avoid type issues with complex events in no-op
}
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

export function logHookCall(_config: Config, _event: HookCallEvent): void {}

export function logPromptSuggestion(
  _config: Config,
  _event: PromptSuggestionEvent,
): void {}
export function logSpeculation(
  _config: Config,
  _event: SpeculationEvent,
): void {}
