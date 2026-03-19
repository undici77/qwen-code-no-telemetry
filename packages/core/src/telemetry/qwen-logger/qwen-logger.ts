/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// No-op implementations for no-telemetry policy
// All telemetry logging is replaced with empty stubs

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
  EndSessionEvent,
  ExtensionUpdateEvent,
  ArenaSessionStartedEvent,
  ArenaAgentCompletedEvent,
  ArenaSessionEndedEvent,
} from '../types.js';
import type { Config } from '../../config/config.js';

export class QwenLogger {
  private static instance: QwenLogger;

  private constructor(_config: Config) {}

  static getInstance(config?: Config): QwenLogger | undefined {
    if (config === undefined) return undefined;
    if (!QwenLogger.instance) {
      QwenLogger.instance = new QwenLogger(config);
    }
    return QwenLogger.instance;
  }

  // All methods are no-ops for no-telemetry policy
  enqueueLogEvent(_event: any): void {}
  createRumEvent(
    _eventType: string,
    _type: string,
    _name: string,
    _properties: any,
  ): any {
    return {};
  }
  createViewEvent(_type: string, _name: string, _properties: any): any {
    return {};
  }
  createActionEvent(_type: string, _name: string, _properties: any): any {
    return {};
  }
  createResourceEvent(_type: string, _name: string, _properties: any): any {
    return {};
  }
  createExceptionEvent(_type: string, _name: string, _properties: any): any {
    return {};
  }
  async createRumPayload(): Promise<any> {
    return {};
  }
  flushIfNeeded(): void {}
  readSourceInfo(): string {
    return '';
  }
  async flushToRum(): Promise<any> {
    return {};
  }

  // session events
  async logStartSessionEvent(_event: any): Promise<void> {
    return Promise.resolve();
  }
  logEndSessionEvent(_event: any): void {}
  logConversationFinishedEvent(_event: any): void {}

  // user action events
  logNewPromptEvent(_event: any): void {}
  logRetryEvent(_event: any): void {}
  logSlashCommandEvent(_event: any): void {}
  logModelSlashCommandEvent(_event: any): void {}

  // tool call events
  logToolCallEvent(_event: any): void {}
  logFileOperationEvent(_event: any): void {}
  logSubagentExecutionEvent(_event: any): void {}
  logToolOutputTruncatedEvent(_event: any): void {}

  // api events
  logApiRequestEvent(_event: any): void {}
  logApiResponseEvent(_event: any): void {}
  logApiCancelEvent(_event: any): void {}
  logApiErrorEvent(_event: any): void {}

  // error events
  logInvalidChunkEvent(_event: any): void {}
  logContentRetryFailureEvent(_event: any): void {}
  logMalformedJsonResponseEvent(_event: any): void {}
  logLoopDetectedEvent(_event: any): void {}
  logKittySequenceOverflowEvent(_event: any): void {}

  // ide events
  logIdeConnectionEvent(_event: any): void {}

  // extension events
  logExtensionInstallEvent(_event: any): void {}
  logExtensionUninstallEvent(_event: any): void {}
  logExtensionUpdateEvent(_event: any): void {}
  logExtensionEnableEvent(_event: any): void {}
  logExtensionDisableEvent(_event: any): void {}

  // auth events
  logAuthEvent(_event: any): void {}

  // misc events
  logFlashFallbackEvent(_event: any): void {}
  logRipgrepFallbackEvent(_event: any): void {}
  logLoopDetectionDisabledEvent(): void {}
  logNextSpeakerCheck(_event: any): void {}
  logSkillLaunchEvent(_event: any): void {}
  logUserFeedbackEvent(_event: any): void {}
  logChatCompressionEvent(_event: any): void {}
  logContentRetryEvent(_event: any): void {}

  // arena events - no-op for no-telemetry policy
  logArenaSessionStartedEvent(_event: ArenaSessionStartedEvent): void {}
  logArenaAgentCompletedEvent(_event: ArenaAgentCompletedEvent): void {}
  logArenaSessionEndedEvent(_event: ArenaSessionEndedEvent): void {}

  getProxyAgent(): any {
    return undefined;
  }

  private requeueFailedEvents(_eventsToSend: any[]): void {}
}

export const TEST_ONLY = {
  MAX_RETRY_EVENTS: 0,
  MAX_EVENTS: 0,
  FLUSH_INTERVAL_MS: 0,
};
