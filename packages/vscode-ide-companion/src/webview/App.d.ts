/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { TextMessage } from './hooks/message/useMessageHandling.js';
import type { ToolCallData } from './components/messages/toolcalls/ToolCall.js';
/**
 * Memoized message list that only re-renders when messages or callbacks change,
 * not on every keystroke in the input field.
 */
export interface MessageListItem {
    type: 'message' | 'in-progress-tool-call' | 'completed-tool-call';
    data: TextMessage | ToolCallData;
    timestamp: number;
}
export declare const getLastUserTurnIndex: (allMessages: MessageListItem[]) => number | null;
export declare const App: React.FC;
