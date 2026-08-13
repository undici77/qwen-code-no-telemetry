/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { createDebugLogger, OutputFormat, } from '@qwen-code/qwen-code-core';
import { t } from '../i18n/index.js';
import { writeStderrLine } from './stdioHelpers.js';
export const CHAT_RECORDING_FAILURE_MESSAGE = 'Session recording stopped after a write failure. New messages for the affected session will not be saved. Check disk space and permissions, then start a new session to resume recording. See the debug log for details.';
export const TUI_CHAT_RECORDING_FAILURE_MESSAGE = 'Session recording stopped after a write failure. New messages for the affected session will not be saved. Check disk space and permissions, then run `/clear` to start a new recorded session. See the debug log for details.';
const CHAT_RECORDING_SETTLE_TIMEOUT_MS = 2000;
const debugLogger = createDebugLogger('CHAT_RECORDING');
export function createChatRecordingFailureSystemMessage(event) {
    return {
        type: 'system',
        subtype: 'session_recording_degraded',
        uuid: randomUUID(),
        session_id: event.sessionId,
        parent_tool_use_id: null,
        data: {
            session_id: event.sessionId,
            reason: 'write_failed',
            message: CHAT_RECORDING_FAILURE_MESSAGE,
        },
    };
}
export function reportChatRecordingFailureToAdapter(adapter, event) {
    adapter.emitMessage(createChatRecordingFailureSystemMessage(event));
}
export function subscribeToHeadlessChatRecordingFailures(config, adapter) {
    if (typeof config.onChatRecordingFailure !== 'function')
        return () => { };
    return config.onChatRecordingFailure((event) => {
        if (config.getOutputFormat() === OutputFormat.TEXT) {
            writeStderrLine(`Warning: ${t(CHAT_RECORDING_FAILURE_MESSAGE)}`);
            return;
        }
        reportChatRecordingFailureToAdapter(adapter, event);
    });
}
export async function settleChatRecording(config, options) {
    if (typeof config.getChatRecordingService !== 'function')
        return 'settled';
    const recorder = config.getChatRecordingService();
    if (!recorder)
        return 'settled';
    if (options.finalize)
        recorder.finalize();
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => {
            debugLogger.debug('Timed out waiting for chat recording to flush');
            resolve('timeout');
        }, CHAT_RECORDING_SETTLE_TIMEOUT_MS);
    });
    const settled = recorder.flush().then(() => 'settled', () => 'settled');
    try {
        return await Promise.race([settled, timeout]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
//# sourceMappingURL=chat-recording-failure.js.map