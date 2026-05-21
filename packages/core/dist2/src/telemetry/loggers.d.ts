/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ApiErrorEvent, ApiCancelEvent, ApiRequestEvent, ApiResponseEvent, FileOperationEvent, ToolCallEvent, UserPromptEvent, UserRetryEvent, FlashFallbackEvent, NextSpeakerCheckEvent, SlashCommandEvent, ConversationFinishedEvent, ChatCompressionEvent, ContentRetryEvent, ContentRetryFailureEvent, RipgrepFallbackEvent, ToolOutputTruncatedEvent, ExtensionDisableEvent, ExtensionEnableEvent, ExtensionUninstallEvent, ExtensionUpdateEvent, ExtensionInstallEvent, ModelSlashCommandEvent, SubagentExecutionEvent, MalformedJsonResponseEvent, InvalidChunkEvent, AuthEvent, SkillLaunchEvent, UserFeedbackEvent, ArenaSessionStartedEvent, ArenaAgentCompletedEvent, ArenaSessionEndedEvent, StartSessionEvent, LoopDetectedEvent, LoopDetectionDisabledEvent, IdeConnectionEvent, KittySequenceOverflowEvent, MemoryExtractEvent, MemoryDreamEvent, MemoryRecallEvent } from './types.js';
export declare function getCommonAttributes(_config: Config): Record<string, unknown>;
export declare function logStartSession(_config: Config, _event: StartSessionEvent): void;
export declare function logUserPrompt(_config: Config, _event: UserPromptEvent): void;
export declare function logUserRetry(_config: Config, _event: UserRetryEvent): void;
export declare function logToolCall(_config: Config, _event: ToolCallEvent): void;
export declare function logToolOutputTruncated(_config: Config, _event: ToolOutputTruncatedEvent): void;
export declare function logFileOperation(_config: Config, _event: FileOperationEvent): void;
export declare function logApiRequest(_config: Config, _event: ApiRequestEvent): void;
export declare function logFlashFallback(_config: Config, _event: FlashFallbackEvent): void;
export declare function logRipgrepFallback(_config: Config, _event: RipgrepFallbackEvent): void;
export declare function logApiError(_config: Config, _event: ApiErrorEvent): void;
export declare function logApiCancel(_config: Config, _event: ApiCancelEvent): void;
export declare function logApiResponse(_config: Config, _event: ApiResponseEvent): void;
export declare function logLoopDetected(_config: Config, _event: LoopDetectedEvent): void;
export declare function logLoopDetectionDisabled(_config: Config, _event: LoopDetectionDisabledEvent): void;
export declare function logNextSpeakerCheck(_config: Config, _event: NextSpeakerCheckEvent): void;
export declare function logSlashCommand(_config: Config, _event: SlashCommandEvent): void;
export declare function logIdeConnection(_config: Config, _event: IdeConnectionEvent): void;
export declare function logConversationFinishedEvent(_config: Config, _event: ConversationFinishedEvent): void;
export declare function logChatCompression(_config: Config, _event: ChatCompressionEvent): void;
export declare function logKittySequenceOverflow(_config: Config, _event: KittySequenceOverflowEvent): void;
export declare function logMalformedJsonResponse(_config: Config, _event: MalformedJsonResponseEvent): void;
export declare function logInvalidChunk(_config: Config, _event: InvalidChunkEvent): void;
export declare function logContentRetry(_config: Config, _event: ContentRetryEvent): void;
export declare function logContentRetryFailure(_config: Config, _event: ContentRetryFailureEvent): void;
export declare function logSubagentExecution(_config: Config, _event: SubagentExecutionEvent): void;
export declare function logModelSlashCommand(_config: Config, _event: ModelSlashCommandEvent): void;
export declare function logExtensionInstallEvent(_config: Config, _event: ExtensionInstallEvent): void;
export declare function logExtensionUpdateEvent(_config: Config, _event: ExtensionUpdateEvent): void;
export declare function logExtensionUninstall(_config: Config, _event: ExtensionUninstallEvent): void;
export declare function logExtensionEnable(_config: Config, _event: ExtensionEnableEvent): void;
export declare function logExtensionDisable(_config: Config, _event: ExtensionDisableEvent): void;
export declare function logAuth(_config: Config, _event: AuthEvent): void;
export declare function logSkillLaunch(_config: Config, _event: SkillLaunchEvent): void;
export declare function logUserFeedback(_config: Config, _event: UserFeedbackEvent): void;
export declare function logArenaSessionStarted(_config: Config, _event: ArenaSessionStartedEvent): void;
export declare function logArenaAgentCompleted(_config: Config, _event: ArenaAgentCompletedEvent): void;
export declare function logArenaSessionEnded(_config: Config, _event: ArenaSessionEndedEvent): void;
export declare function logMemoryExtract(_config: Config, _event: MemoryExtractEvent): void;
export declare function logMemoryDream(_config: Config, _event: MemoryDreamEvent): void;
export declare function logMemoryRecall(_config: Config, _event: MemoryRecallEvent): void;
