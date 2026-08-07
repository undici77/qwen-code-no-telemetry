/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// No-op implementation for no-telemetry policy — all telemetry logic neutralized.
// See NO_TELEMETRY_GUIDELINES.MD for the privacy policy.

import type { Config } from '../../config/config.js';
import type {
  StartSessionEvent,
  UserPromptEvent,
  ToolCallEvent,
  ApiRequestEvent,
  ApiResponseEvent,
  ApiErrorEvent,
  ApiCancelEvent,
  FileOperationEvent,
  FlashFallbackEvent,
  LoopDetectedEvent,
  NextSpeakerCheckEvent,
  SlashCommandEvent,
  MalformedJsonResponseEvent,
  IdeConnectionEvent,
  KittySequenceOverflowEvent,
  ChatCompressionEvent,
  InvalidChunkEvent,
  ContentRetryEvent,
  ProtocolTagSanitizedEvent,
  ApiRetryEvent,
  ContentRetryFailureEvent,
  ConversationFinishedEvent,
  SubagentExecutionEvent,
  ExtensionInstallEvent,
  ExtensionUninstallEvent,
  ToolOutputTruncatedEvent,
  ExtensionEnableEvent,
  ModelSlashCommandEvent,
  ExtensionDisableEvent,
  AuthEvent,
  SkillLaunchEvent,
  UserFeedbackEvent,
  UserRetryEvent,
  RipgrepFallbackEvent,
  RipgrepRuntimeRecoveryEvent,
  EndSessionEvent,
  ExtensionUpdateEvent,
  ArenaSessionStartedEvent,
  ArenaAgentCompletedEvent,
  ArenaSessionEndedEvent,
  HookCallEvent,
} from '../types.js';

/**
 * No-op QwenLogger — all methods are empty stubs.
 * See NO_TELEMETRY_GUIDELINES.MD for the privacy policy.
 */
export class QwenLogger {
  static getInstance(_config?: Config): QwenLogger | null {
    return null; // no-op
  }

  // session events
  logStartSessionEvent(_event: StartSessionEvent): void {}
  logEndSessionEvent(_event: EndSessionEvent): void {}

  // user events
  logUserPromptEvent(_event: UserPromptEvent): void {}
  logNewPromptEvent(_event: unknown): void {}
  logUserRetryEvent(_event: UserRetryEvent): void {}
  logUserFeedbackEvent(_event: UserFeedbackEvent): void {}

  // API events
  logApiRequestEvent(_event: ApiRequestEvent): void {}
  logApiResponseEvent(_event: ApiResponseEvent): void {}
  logApiErrorEvent(_event: ApiErrorEvent): void {}
  logApiCancelEvent(_event: ApiCancelEvent): void {}

  // tool events
  logToolCallEvent(_event: ToolCallEvent): void {}
  logFileOperationEvent(_event: FileOperationEvent): void {}
  logSubagentExecutionEvent(_event: SubagentExecutionEvent): void {}
  logToolOutputTruncatedEvent(_event: ToolOutputTruncatedEvent): void {}

  // loop detection
  logLoopDetectedEvent(_event: LoopDetectedEvent): void {}
  logLoopDetectionDisabledEvent(): void {}
  logNextSpeakerCheckEvent(_event: NextSpeakerCheckEvent): void {}
  logNextSpeakerCheck(_event: unknown): void {}

  // slash command
  logSlashCommandEvent(_event: SlashCommandEvent): void {}
  logModelSlashCommandEvent(_event: ModelSlashCommandEvent): void {}

  // content events
  logMalformedJsonResponseEvent(_event: MalformedJsonResponseEvent): void {}
  logKittySequenceOverflowEvent(_event: KittySequenceOverflowEvent): void {}
  logChatCompressionEvent(_event: ChatCompressionEvent): void {}
  logInvalidChunkEvent(_event: InvalidChunkEvent): void {}
  logContentRetryEvent(_event: ContentRetryEvent): void {}
  logContentRetryFailureEvent(_event: ContentRetryFailureEvent): void {}
  logProtocolTagSanitizedEvent(_event: ProtocolTagSanitizedEvent): void {}

  // retry
  logApiRetryEvent(_event: ApiRetryEvent): void {}
  logRetryEvent(_event: unknown): void {}

  // conversation
  logConversationFinishedEvent(_event: ConversationFinishedEvent): void {}

  // extension events
  logExtensionInstallEvent(_event: ExtensionInstallEvent): void {}
  logExtensionUninstallEvent(_event: ExtensionUninstallEvent): void {}
  logExtensionEnableEvent(_event: ExtensionEnableEvent): void {}
  logExtensionDisableEvent(_event: ExtensionDisableEvent): void {}
  logExtensionUpdateEvent(_event: ExtensionUpdateEvent): void {}

  // flash fallback
  logFlashFallbackEvent(_event: FlashFallbackEvent): void {}

  // auth
  logAuthEvent(_event: AuthEvent): void {}

  // skill
  logSkillLaunchEvent(_event: SkillLaunchEvent): void {}

  // IDE
  logIdeConnectionEvent(_event: IdeConnectionEvent): void {}

  // ripgrep
  logRipgrepFallbackEvent(_event: RipgrepFallbackEvent): void {}
  logRipgrepRuntimeRecoveryEvent(_event: RipgrepRuntimeRecoveryEvent): void {}

  // arena
  logArenaSessionStartedEvent(_event: ArenaSessionStartedEvent): void {}
  logArenaAgentCompletedEvent(_event: ArenaAgentCompletedEvent): void {}
  logArenaSessionEndedEvent(_event: ArenaSessionEndedEvent): void {}

  // hook
  logHookCallEvent(_event: HookCallEvent): void {}

  private constructor() {}
}
