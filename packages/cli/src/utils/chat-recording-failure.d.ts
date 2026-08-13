/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ChatRecordingFailureEvent, type Config } from '@qwen-code/qwen-code-core';
import type { JsonOutputAdapterInterface } from '../nonInteractive/io/BaseJsonOutputAdapter.js';
import type { CLISystemMessage } from '../nonInteractive/types.js';
export declare const CHAT_RECORDING_FAILURE_MESSAGE = "Session recording stopped after a write failure. New messages for the affected session will not be saved. Check disk space and permissions, then start a new session to resume recording. See the debug log for details.";
export declare const TUI_CHAT_RECORDING_FAILURE_MESSAGE = "Session recording stopped after a write failure. New messages for the affected session will not be saved. Check disk space and permissions, then run `/clear` to start a new recorded session. See the debug log for details.";
export declare function createChatRecordingFailureSystemMessage(event: ChatRecordingFailureEvent): CLISystemMessage;
export declare function reportChatRecordingFailureToAdapter(adapter: JsonOutputAdapterInterface, event: ChatRecordingFailureEvent): void;
export declare function subscribeToHeadlessChatRecordingFailures(config: Config, adapter: JsonOutputAdapterInterface): () => void;
export declare function settleChatRecording(config: Config, options: {
    finalize: boolean;
}): Promise<'settled' | 'timeout'>;
