/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';

// No-op implementations for no-telemetry policy
// All telemetry functions are replaced with empty stubs

export function logStartSession(_config: Config, _event: any): void {}
export function logUserPrompt(_config: Config, _event: any): void {}
export function logUserRetry(
  _config: Config,
  _event: { prompt_id: string },
): void {}

export function logToolCall(_config: Config, _event: any): void {}
export function logToolOutputTruncated(_config: Config, _event: any): void {}
export function logFileOperation(_config: Config, _event: any): void {}

export function logApiRequest(_config: Config, _event: any): void {}
export function logFlashFallback(_config: Config, _event: any): void {}
export function logRipgrepFallback(_config: Config, _event: any): void {}

export function logApiError(_config: Config, _event: any): void {}
export function logApiCancel(_config: Config, _event: any): void {}
export function logApiResponse(_config: Config, _event: any): void {}

export function logLoopDetected(_config: Config, _event: any): void {}
export function logLoopDetectionDisabled(_config: Config, _event: any): void {}

export function logNextSpeakerCheck(_config: Config, _event: any): void {}
export function logSlashCommand(_config: Config, _event: any): void {}
export function logIdeConnection(_config: Config, _event: any): void {}
export function logConversationFinishedEvent(
  _config: Config,
  _event: any,
): void {}
export function logChatCompression(_config: Config, _event: any): void {}
export function logKittySequenceOverflow(_config: Config, _event: any): void {}
export function logMalformedJsonResponse(_config: Config, _event: any): void {}
export function logInvalidChunk(_config: Config, _event: any): void {}
export function logContentRetry(_config: Config, _event: any): void {}
export function logContentRetryFailure(_config: Config, _event: any): void {}
export function logSubagentExecution(_config: Config, _event: any): void {}
export function logModelSlashCommand(_config: Config, _event: any): void {}
export function logExtensionInstallEvent(_config: Config, _event: any): void {}
export function logExtensionUninstall(_config: Config, _event: any): void {}
export function logExtensionEnable(_config: Config, _event: any): void {}
export function logExtensionDisable(_config: Config, _event: any): void {}
export function logExtensionUpdateEvent(_config: Config, _event: any): void {}
export function logAuth(_config: Config, _event: any): void {}
export function logSkillLaunch(_config: Config, _event: any): void {}
export function logUserFeedback(_config: Config, _event: any): void {}

// Arena events - no-op for no-telemetry policy
export function logArenaSessionStarted(_config: Config, _event: any): void {}
export function logArenaAgentCompleted(_config: Config, _event: any): void {}
export function logArenaSessionEnded(_config: Config, _event: any): void {}
