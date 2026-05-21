/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../../config/config.js';
export declare class QwenLogger {
    private static instance;
    private constructor();
    static getInstance(config?: Config): QwenLogger | undefined;
    enqueueLogEvent(_event: unknown): void;
    createRumEvent(_eventType: string, _type: string, _name: string, _properties: unknown): unknown;
    createViewEvent(_type: string, _name: string, _properties: unknown): unknown;
    createActionEvent(_type: string, _name: string, _properties: unknown): unknown;
    createResourceEvent(_type: string, _name: string, _properties: unknown): unknown;
    createExceptionEvent(_type: string, _name: string, _properties: unknown): unknown;
    createRumPayload(): Promise<unknown>;
    flushIfNeeded(): void;
    readSourceInfo(): string;
    flushToRum(): Promise<unknown>;
    logStartSessionEvent(_event: unknown): Promise<void>;
    logEndSessionEvent(_event: unknown): void;
    logConversationFinishedEvent(_event: unknown): void;
    logNewPromptEvent(_event: unknown): void;
    logRetryEvent(_event: unknown): void;
    logSlashCommandEvent(_event: unknown): void;
    logModelSlashCommandEvent(_event: unknown): void;
    logToolCallEvent(_event: unknown): void;
    logFileOperationEvent(_event: unknown): void;
    logSubagentExecutionEvent(_event: unknown): void;
    logToolOutputTruncatedEvent(_event: unknown): void;
    logApiRequestEvent(_event: unknown): void;
    logApiResponseEvent(_event: unknown): void;
    logApiCancelEvent(_event: unknown): void;
    logApiErrorEvent(_event: unknown): void;
    logInvalidChunkEvent(_event: unknown): void;
    logContentRetryFailureEvent(_event: unknown): void;
    logMalformedJsonResponseEvent(_event: unknown): void;
    logLoopDetectedEvent(_event: unknown): void;
    logKittySequenceOverflowEvent(_event: unknown): void;
    logIdeConnectionEvent(_event: unknown): void;
    logExtensionInstallEvent(_event: unknown): void;
    logExtensionUninstallEvent(_event: unknown): void;
    logExtensionUpdateEvent(_event: unknown): void;
    logExtensionEnableEvent(_event: unknown): void;
    logExtensionDisableEvent(_event: unknown): void;
    logAuthEvent(_event: unknown): void;
    logFlashFallbackEvent(_event: unknown): void;
    logRipgrepFallbackEvent(_event: unknown): void;
    logLoopDetectionDisabledEvent(): void;
    logNextSpeakerCheck(_event: unknown): void;
    logSkillLaunchEvent(_event: unknown): void;
    logUserFeedbackEvent(_event: unknown): void;
    logChatCompressionEvent(_event: unknown): void;
    logContentRetryEvent(_event: unknown): void;
    logArenaSessionStartedEvent(_event: unknown): void;
    logArenaAgentCompletedEvent(_event: unknown): void;
    logArenaSessionEndedEvent(_event: unknown): void;
    logHookCallEvent(_event: unknown): void;
    getProxyAgent(): unknown;
}
