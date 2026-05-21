/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as vscode from 'vscode';
import type { QwenAgentManager } from '../../services/qwenAgentManager.js';
import type { ConversationStore } from '../../services/conversationStore.js';
import type { PermissionResponseMessage, AskUserQuestionResponseMessage } from '../../types/webviewMessageTypes.js';
/**
 * MessageHandler (Refactored Version)
 * This is a lightweight wrapper class that internally uses MessageRouter and various sub-handlers
 * Maintains interface compatibility with the original code
 */
export declare class MessageHandler {
    private router;
    constructor(agentManager: QwenAgentManager, conversationStore: ConversationStore, currentConversationId: string | null, sendToWebView: (message: unknown) => void);
    /**
     * Route messages to the corresponding handler
     */
    route(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Set current session ID
     */
    setCurrentConversationId(id: string | null): void;
    /**
     * Get current session ID
     */
    getCurrentConversationId(): string | null;
    /**
     * Set permission handler
     */
    setPermissionHandler(handler: (message: PermissionResponseMessage) => void): void;
    /**
     * Set ask user question handler
     */
    setAskUserQuestionHandler(handler: (message: AskUserQuestionResponseMessage) => void): void;
    /**
     * Set auth interactive handler — interactive auth flow.
     */
    setAuthInteractiveHandler(handler: (config: import('@qwen-code/qwen-code-core').ProviderConfig, inputs: import('@qwen-code/qwen-code-core').ProviderSetupInputs) => Promise<void>): void;
    /**
     * Append stream content
     */
    appendStreamContent(chunk: string): void;
    setupFileWatchers(): vscode.Disposable;
}
