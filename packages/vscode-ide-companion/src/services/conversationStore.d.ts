/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as vscode from 'vscode';
import type { ChatMessage } from './qwenAgentManager.js';
export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}
export declare class ConversationStore {
    private context;
    private currentConversationId;
    constructor(context: vscode.ExtensionContext);
    createConversation(title?: string): Promise<Conversation>;
    getAllConversations(): Promise<Conversation[]>;
    getConversation(id: string): Promise<Conversation | null>;
    addMessage(conversationId: string, message: ChatMessage): Promise<void>;
    replaceMessages(conversationId: string, messages: ChatMessage[]): Promise<boolean>;
    renameConversationId(fromConversationId: string, toConversationId: string): Promise<boolean>;
    upsertConversation(conversation: Conversation): Promise<void>;
    truncateFromUserTurn(conversationId: string, targetTurnIndex: number): Promise<boolean>;
    deleteConversation(id: string): Promise<void>;
    getCurrentConversationId(): string | null;
    setCurrentConversationId(id: string): void;
}
