/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export class QwenLogger {
    static instance;
    constructor(_config) { }
    static getInstance(config) {
        if (config === undefined)
            return undefined;
        if (!QwenLogger.instance) {
            QwenLogger.instance = new QwenLogger(config);
        }
        return QwenLogger.instance;
    }
    // All methods are no-ops for no-telemetry policy
    enqueueLogEvent(_event) { }
    createRumEvent(_eventType, _type, _name, _properties) {
        return {};
    }
    createViewEvent(_type, _name, _properties) {
        return {};
    }
    createActionEvent(_type, _name, _properties) {
        return {};
    }
    createResourceEvent(_type, _name, _properties) {
        return {};
    }
    createExceptionEvent(_type, _name, _properties) {
        return {};
    }
    async createRumPayload() {
        return {};
    }
    flushIfNeeded() { }
    readSourceInfo() {
        return '';
    }
    async flushToRum() {
        return {};
    }
    // session events
    async logStartSessionEvent(_event) {
        return Promise.resolve();
    }
    logEndSessionEvent(_event) { }
    logConversationFinishedEvent(_event) { }
    // user action events
    logNewPromptEvent(_event) { }
    logRetryEvent(_event) { }
    logSlashCommandEvent(_event) { }
    logModelSlashCommandEvent(_event) { }
    // tool call events
    logToolCallEvent(_event) { }
    logFileOperationEvent(_event) { }
    logSubagentExecutionEvent(_event) { }
    logToolOutputTruncatedEvent(_event) { }
    // api events
    logApiRequestEvent(_event) { }
    logApiResponseEvent(_event) { }
    logApiCancelEvent(_event) { }
    logApiErrorEvent(_event) { }
    // error events
    logInvalidChunkEvent(_event) { }
    logContentRetryFailureEvent(_event) { }
    logMalformedJsonResponseEvent(_event) { }
    logLoopDetectedEvent(_event) { }
    logKittySequenceOverflowEvent(_event) { }
    // ide events
    logIdeConnectionEvent(_event) { }
    // extension events
    logExtensionInstallEvent(_event) { }
    logExtensionUninstallEvent(_event) { }
    logExtensionUpdateEvent(_event) { }
    logExtensionEnableEvent(_event) { }
    logExtensionDisableEvent(_event) { }
    // auth events
    logAuthEvent(_event) { }
    // misc events
    logFlashFallbackEvent(_event) { }
    logRipgrepFallbackEvent(_event) { }
    logLoopDetectionDisabledEvent() { }
    logNextSpeakerCheck(_event) { }
    logSkillLaunchEvent(_event) { }
    logUserFeedbackEvent(_event) { }
    logChatCompressionEvent(_event) { }
    logContentRetryEvent(_event) { }
    // arena events - no-op for no-telemetry policy
    logArenaSessionStartedEvent(_event) { }
    logArenaAgentCompletedEvent(_event) { }
    logArenaSessionEndedEvent(_event) { }
    logHookCallEvent(_event) { }
    getProxyAgent() {
        return undefined;
    }
}
//# sourceMappingURL=qwen-logger.js.map