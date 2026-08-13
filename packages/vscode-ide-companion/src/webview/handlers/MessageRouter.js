/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { logger } from '../../utils/logger.js';
import { SessionMessageHandler } from './SessionMessageHandler.js';
import { FileMessageHandler } from './FileMessageHandler.js';
import { EditorMessageHandler } from './EditorMessageHandler.js';
import { AuthMessageHandler } from './AuthMessageHandler.js';
/**
 * Message Router
 * Routes messages to appropriate handlers
 */
export class MessageRouter {
    handlers = [];
    sessionHandler;
    authHandler;
    fileHandler;
    currentConversationId = null;
    permissionHandler = null;
    askUserQuestionHandler = null;
    constructor(agentManager, conversationStore, currentConversationId, sendToWebView) {
        this.currentConversationId = currentConversationId;
        // Initialize all handlers
        this.sessionHandler = new SessionMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView, (id) => this.setCurrentConversationId(id));
        this.fileHandler = new FileMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView);
        const editorHandler = new EditorMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView);
        this.authHandler = new AuthMessageHandler(agentManager, conversationStore, currentConversationId, sendToWebView);
        // Register handlers in order of priority
        this.handlers = [
            this.sessionHandler,
            this.fileHandler,
            editorHandler,
            this.authHandler,
        ];
    }
    setupFileWatchers() {
        return this.fileHandler.setupFileWatchers();
    }
    /**
     * Route message to appropriate handler
     */
    async route(message) {
        logger.log('[MessageRouter] Routing message:', message.type);
        // Handle permission response specially
        if (message.type === 'permissionResponse') {
            if (this.permissionHandler) {
                this.permissionHandler(message);
            }
            return;
        }
        // Handle ask user question response specially
        if (message.type === 'askUserQuestionResponse') {
            if (this.askUserQuestionHandler) {
                this.askUserQuestionHandler(message);
            }
            return;
        }
        // Find appropriate handler
        const handler = this.handlers.find((h) => h.canHandle(message.type));
        if (handler) {
            try {
                await handler.handle(message);
            }
            catch (error) {
                logger.error('[MessageRouter] Handler error:', error);
                throw error;
            }
        }
        else {
            logger.warn('[MessageRouter] No handler found for message type:', message.type);
        }
    }
    /**
     * Set current conversation ID
     */
    setCurrentConversationId(id) {
        this.currentConversationId = id;
        // Update all handlers
        this.handlers.forEach((handler) => {
            if ('setCurrentConversationId' in handler) {
                handler.setCurrentConversationId(id);
            }
        });
    }
    /**
     * Get current conversation ID
     */
    getCurrentConversationId() {
        return this.currentConversationId;
    }
    /**
     * Set permission handler
     */
    setPermissionHandler(handler) {
        this.permissionHandler = handler;
    }
    /**
     * Set ask user question handler
     */
    setAskUserQuestionHandler(handler) {
        this.askUserQuestionHandler = handler;
    }
    /**
     * Set auth interactive handler — interactive auth flow.
     * Also registers the handler on the session handler so
     * "Configure" prompts in session flows trigger the interactive flow.
     */
    setAuthInteractiveHandler(handler) {
        this.authHandler.setAuthInteractiveHandler(handler);
        // SessionMessageHandler's authHandler is a simple () => Promise<void>.
        // Wrap so "Configure" prompts trigger the full interactive auth QuickPick.
        this.sessionHandler?.setAuthHandler?.(() => this.authHandler.handle({ type: 'auth' }));
    }
    /**
     * Append stream content
     */
    appendStreamContent(chunk) {
        this.sessionHandler.appendStreamContent(chunk);
    }
}
//# sourceMappingURL=MessageRouter.js.map