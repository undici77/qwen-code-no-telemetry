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
 * Message Router
 * Routes messages to appropriate handlers
 */
export declare class MessageRouter {
    private handlers;
    private sessionHandler;
    private authHandler;
    private fileHandler;
    private currentConversationId;
    private permissionHandler;
    private askUserQuestionHandler;
    constructor(agentManager: QwenAgentManager, conversationStore: ConversationStore, currentConversationId: string | null, sendToWebView: (message: unknown) => void);
    setupFileWatchers(): vscode.Disposable;
    /**
     * Route message to appropriate handler
     */
    route(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Set current conversation ID
     */
    setCurrentConversationId(id: string | null): void;
    /**
     * Get current conversation ID
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
     * Also registers the handler on the session handler so
     * "Configure" prompts in session flows trigger the interactive flow.
     */
    setAuthInteractiveHandler(handler: (config: import('@qwen-code/qwen-code-core').ProviderConfig, inputs: import('@qwen-code/qwen-code-core').ProviderSetupInputs) => Promise<void>): void;
    /**
     * Append stream content
     */
    appendStreamContent(chunk: string): void;
}
