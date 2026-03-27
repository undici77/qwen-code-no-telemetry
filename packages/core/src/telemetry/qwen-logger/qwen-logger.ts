/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// No-op implementations for no-telemetry policy
// All telemetry logging is replaced with empty stubs

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
  enqueueLogEvent(_event: unknown): void {}
  createRumEvent(
    _eventType: string,
    _type: string,
    _name: string,
    _properties: unknown,
  ): unknown {
    return {};
  }
  createViewEvent(_type: string, _name: string, _properties: unknown): unknown {
    return {};
  }
  createActionEvent(
    _type: string,
    _name: string,
    _properties: unknown,
  ): unknown {
    return {};
  }
  createResourceEvent(
    _type: string,
    _name: string,
    _properties: unknown,
  ): unknown {
    return {};
  }
  createExceptionEvent(
    _type: string,
    _name: string,
    _properties: unknown,
  ): unknown {
    return {};
  }
  async createRumPayload(): Promise<unknown> {
    return {};
  }
  flushIfNeeded(): void {}
  readSourceInfo(): string {
    return '';
  }
  async flushToRum(): Promise<unknown> {
    return {};
  }

  // session events
  async logStartSessionEvent(_event: unknown): Promise<void> {
    return Promise.resolve();
  }
  logEndSessionEvent(_event: unknown): void {}
  logConversationFinishedEvent(_event: unknown): void {}

  // user action events
  logNewPromptEvent(_event: unknown): void {}
  logRetryEvent(_event: unknown): void {}
  logSlashCommandEvent(_event: unknown): void {}
  logModelSlashCommandEvent(_event: unknown): void {}

  // tool call events
  logToolCallEvent(_event: unknown): void {}
  logFileOperationEvent(_event: unknown): void {}
  logSubagentExecutionEvent(_event: unknown): void {}
  logToolOutputTruncatedEvent(_event: unknown): void {}

  // api events
  logApiRequestEvent(_event: unknown): void {}
  logApiResponseEvent(_event: unknown): void {}
  logApiCancelEvent(_event: unknown): void {}
  logApiErrorEvent(_event: unknown): void {}

  // error events
  logInvalidChunkEvent(_event: unknown): void {}
  logContentRetryFailureEvent(_event: unknown): void {}
  logMalformedJsonResponseEvent(_event: unknown): void {}
  logLoopDetectedEvent(_event: unknown): void {}
  logKittySequenceOverflowEvent(_event: unknown): void {}

  // ide events
  logIdeConnectionEvent(_event: unknown): void {}

  // extension events
  logExtensionInstallEvent(_event: unknown): void {}
  logExtensionUninstallEvent(_event: unknown): void {}
  logExtensionUpdateEvent(_event: unknown): void {}
  logExtensionEnableEvent(_event: unknown): void {}
  logExtensionDisableEvent(_event: unknown): void {}

  // auth events
  logAuthEvent(_event: unknown): void {}

  // misc events
  logFlashFallbackEvent(_event: unknown): void {}
  logRipgrepFallbackEvent(_event: unknown): void {}
  logLoopDetectionDisabledEvent(): void {}
  logNextSpeakerCheck(_event: unknown): void {}
  logSkillLaunchEvent(_event: unknown): void {}
  logUserFeedbackEvent(_event: unknown): void {}
  logChatCompressionEvent(_event: unknown): void {}
  logContentRetryEvent(_event: unknown): void {}

  // arena events - no-op for no-telemetry policy
  logArenaSessionStartedEvent(_event: unknown): void {}
  logArenaAgentCompletedEvent(_event: unknown): void {}
  logArenaSessionEndedEvent(_event: unknown): void {}

  logHookCallEvent(_event: unknown): void {}

  getProxyAgent(): unknown {
    return undefined;
  }
}
