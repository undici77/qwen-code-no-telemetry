/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// No-op implementations for no-telemetry policy
// All telemetry functions are replaced with empty stubs
export function getCommonAttributes(_config) {
    return {};
}
export function logStartSession(_config, _event) { }
export function logUserPrompt(_config, _event) { }
export function logUserRetry(_config, _event) { }
export function logToolCall(_config, _event) { }
export function logToolOutputTruncated(_config, _event) { }
export function logFileOperation(_config, _event) { }
export function logApiRequest(_config, _event) { }
export function logFlashFallback(_config, _event) { }
export function logRipgrepFallback(_config, _event) { }
export function logApiError(_config, _event) { }
export function logApiCancel(_config, _event) { }
export function logApiResponse(_config, _event) { }
export function logLoopDetected(_config, _event) { }
export function logLoopDetectionDisabled(_config, _event) { }
export function logNextSpeakerCheck(_config, _event) { }
export function logSlashCommand(_config, _event) { }
export function logIdeConnection(_config, _event) { }
export function logConversationFinishedEvent(_config, _event) { }
export function logChatCompression(_config, _event) { }
export function logKittySequenceOverflow(_config, _event) { }
export function logMalformedJsonResponse(_config, _event) { }
export function logInvalidChunk(_config, _event) { }
export function logContentRetry(_config, _event) { }
export function logContentRetryFailure(_config, _event) { }
export function logSubagentExecution(_config, _event) { }
export function logModelSlashCommand(_config, _event) { }
export function logExtensionInstallEvent(_config, _event) { }
export function logExtensionUpdateEvent(_config, _event) { }
export function logExtensionUninstall(_config, _event) { }
export function logExtensionEnable(_config, _event) { }
export function logExtensionDisable(_config, _event) { }
export function logAuth(_config, _event) { }
export function logSkillLaunch(_config, _event) { }
export function logUserFeedback(_config, _event) { }
export function logArenaSessionStarted(_config, _event) { }
export function logArenaAgentCompleted(_config, _event) { }
export function logArenaSessionEnded(_config, _event) { }
export function logMemoryExtract(_config, _event) { }
export function logMemoryDream(_config, _event) { }
export function logMemoryRecall(_config, _event) { }
//# sourceMappingURL=loggers.js.map