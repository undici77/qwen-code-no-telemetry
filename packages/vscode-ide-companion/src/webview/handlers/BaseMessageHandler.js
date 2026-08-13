/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Base message handler class
 * Provides common dependency injection and helper methods
 */
export class BaseMessageHandler {
    agentManager;
    conversationStore;
    currentConversationId;
    sendToWebView;
    syncCurrentConversationId;
    constructor(agentManager, conversationStore, currentConversationId, sendToWebView, syncCurrentConversationId) {
        this.agentManager = agentManager;
        this.conversationStore = conversationStore;
        this.currentConversationId = currentConversationId;
        this.sendToWebView = sendToWebView;
        this.syncCurrentConversationId = syncCurrentConversationId;
    }
    /**
     * Update current conversation ID
     */
    setCurrentConversationId(id) {
        this.currentConversationId = id;
    }
    /**
     * Update current conversation ID through the owning router when available.
     */
    updateCurrentConversationId(id) {
        if (this.syncCurrentConversationId) {
            this.syncCurrentConversationId(id);
            return;
        }
        this.currentConversationId = id;
    }
    /**
     * Get current conversation ID
     */
    getCurrentConversationId() {
        return this.currentConversationId;
    }
}
//# sourceMappingURL=BaseMessageHandler.js.map