/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { logger } from '../utils/logger.js';
export class ConversationStore {
    context;
    currentConversationId = null;
    constructor(context) {
        this.context = context;
    }
    async createConversation(title = 'New Chat') {
        const conversation = {
            id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const conversations = await this.getAllConversations();
        conversations.push(conversation);
        await this.context.globalState.update('conversations', conversations);
        this.currentConversationId = conversation.id;
        return conversation;
    }
    async getAllConversations() {
        return this.context.globalState.get('conversations', []);
    }
    async getConversation(id) {
        const conversations = await this.getAllConversations();
        return conversations.find((c) => c.id === id) || null;
    }
    async addMessage(conversationId, message) {
        const conversations = await this.getAllConversations();
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation) {
            conversation.messages.push(message);
            conversation.updatedAt = Date.now();
            await this.context.globalState.update('conversations', conversations);
        }
    }
    async replaceMessages(conversationId, messages) {
        const conversations = await this.getAllConversations();
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) {
            logger.warn('[ConversationStore] replaceMessages: conversation not found:', conversationId);
            return false;
        }
        conversation.messages = messages.map((message) => ({ ...message }));
        conversation.updatedAt = Date.now();
        await this.context.globalState.update('conversations', conversations);
        return true;
    }
    async renameConversationId(fromConversationId, toConversationId) {
        if (fromConversationId === toConversationId) {
            return true;
        }
        const conversations = await this.getAllConversations();
        const sourceIndex = conversations.findIndex((c) => c.id === fromConversationId);
        if (sourceIndex < 0) {
            logger.warn('[ConversationStore] renameConversationId: source conversation not found:', fromConversationId);
            return false;
        }
        if (conversations.some((c) => c.id === toConversationId)) {
            logger.warn('[ConversationStore] renameConversationId: target conversation already exists:', toConversationId);
            return false;
        }
        const source = conversations[sourceIndex];
        if (!source) {
            return false;
        }
        conversations[sourceIndex] = {
            ...source,
            id: toConversationId,
            updatedAt: Date.now(),
        };
        await this.context.globalState.update('conversations', conversations);
        if (this.currentConversationId === fromConversationId) {
            this.currentConversationId = toConversationId;
        }
        return true;
    }
    async upsertConversation(conversation) {
        const conversations = await this.getAllConversations();
        const storedConversation = {
            ...conversation,
            messages: conversation.messages.map((message) => ({ ...message })),
        };
        const existingIndex = conversations.findIndex((c) => c.id === conversation.id);
        if (existingIndex >= 0) {
            conversations[existingIndex] = storedConversation;
        }
        else {
            conversations.push(storedConversation);
        }
        await this.context.globalState.update('conversations', conversations);
        this.currentConversationId = conversation.id;
    }
    async truncateFromUserTurn(conversationId, targetTurnIndex) {
        const conversations = await this.getAllConversations();
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) {
            logger.warn('[ConversationStore] truncateFromUserTurn: conversation not found:', conversationId);
            return false;
        }
        let userTurnIndex = 0;
        let truncateAt = -1;
        for (let i = 0; i < conversation.messages.length; i++) {
            if (conversation.messages[i]?.role !== 'user') {
                continue;
            }
            if (userTurnIndex === targetTurnIndex) {
                truncateAt = i;
                break;
            }
            userTurnIndex += 1;
        }
        if (truncateAt < 0) {
            logger.warn('[ConversationStore] truncateFromUserTurn: target turn not found:', targetTurnIndex);
            return false;
        }
        conversation.messages = conversation.messages.slice(0, truncateAt);
        conversation.updatedAt = Date.now();
        await this.context.globalState.update('conversations', conversations);
        return true;
    }
    async deleteConversation(id) {
        const conversations = await this.getAllConversations();
        const filtered = conversations.filter((c) => c.id !== id);
        await this.context.globalState.update('conversations', filtered);
        if (this.currentConversationId === id) {
            this.currentConversationId = null;
        }
    }
    getCurrentConversationId() {
        return this.currentConversationId;
    }
    setCurrentConversationId(id) {
        this.currentConversationId = id;
    }
}
//# sourceMappingURL=conversationStore.js.map