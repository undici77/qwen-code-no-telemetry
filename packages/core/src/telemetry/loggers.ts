/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import { uiTelemetryService } from './uiTelemetry.js';
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
} from './types.js';

// We still keep the uiTelemetryService functional for local UI stats.
// But we remove all OpenTelemetry logging.

export function logStartSession(_config: Config, _event: StartSessionEvent): void {}
export function logUserPrompt(_config: Config, _event: UserPromptEvent): void {}

export function logToolCall(_config: Config, event: ToolCallEvent): void {
  uiTelemetryService.addEvent({ ...event, 'event.name': 'tool_call' } as any);
}

export function logToolOutputTruncated(_config: Config, _event: ToolOutputTruncatedEvent): void {}
export function logFileOperation(_config: Config, _event: FileOperationEvent): void {}

export function logApiRequest(_config: Config, _event: ApiRequestEvent): void {}

export function logFlashFallback(_config: Config, _event: FlashFallbackEvent): void {}
export function logRipgrepFallback(_config: Config, _event: RipgrepFallbackEvent): void {}

export function logApiError(_config: Config, event: ApiErrorEvent): void {
  uiTelemetryService.addEvent({ ...event, 'event.name': 'api_error' } as any);
}

export function logApiCancel(_config: Config, _event: ApiCancelEvent): void {}

export function logApiResponse(_config: Config, event: ApiResponseEvent): void {
  uiTelemetryService.addEvent({ ...event, 'event.name': 'api_response' } as any);
}

export function logLoopDetected(_config: Config, _event: any): void {}
export function logLoopDetectionDisabled(_config: Config, _event: any): void {}
export function logNextSpeakerCheck(_config: Config, _event: NextSpeakerCheckEvent): void {}
export function logSlashCommand(_config: Config, _event: SlashCommandEvent): void {}
export function logIdeConnection(_config: Config, _event: IdeConnectionEvent): void {}
export function logConversationFinishedEvent(_config: Config, _event: ConversationFinishedEvent): void {}
export function logChatCompression(_config: Config, _event: ChatCompressionEvent): void {}
export function logKittySequenceOverflow(_config: Config, _event: KittySequenceOverflowEvent): void {}
export function logMalformedJsonResponse(_config: Config, _event: MalformedJsonResponseEvent): void {}
export function logInvalidChunk(_config: Config, _event: InvalidChunkEvent): void {}
export function logContentRetry(_config: Config, _event: ContentRetryEvent): void {}
export function logContentRetryFailure(_config: Config, _event: ContentRetryFailureEvent): void {}
export function logSubagentExecution(_config: Config, _event: SubagentExecutionEvent): void {}
export function logModelSlashCommand(_config: Config, _event: ModelSlashCommandEvent): void {}
export function logExtensionInstallEvent(_config: Config, _event: ExtensionInstallEvent): void {}
export function logExtensionUninstall(_config: Config, _event: ExtensionUninstallEvent): void {}
export function logExtensionEnable(_config: Config, _event: ExtensionEnableEvent): void {
  uiTelemetryService.addEvent({ ..._event, 'event.name': 'extension_enable' } as any);
}
export function logExtensionDisable(_config: Config, _event: ExtensionDisableEvent): void {
  uiTelemetryService.addEvent({ ..._event, 'event.name': 'extension_disable' } as any);
}
export function logExtensionUpdateEvent(_config: Config, _event: ExtensionUpdateEvent): void {}
export function logAuth(_config: Config, _event: AuthEvent): void {}
export function logSkillLaunch(_config: Config, _event: SkillLaunchEvent): void {}
export function logUserFeedback(_config: Config, _event: UserFeedbackEvent): void {}
