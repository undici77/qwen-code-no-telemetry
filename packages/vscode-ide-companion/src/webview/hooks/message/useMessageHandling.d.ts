/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface TextMessage {
    role: 'user' | 'assistant' | 'thinking';
    content: string;
    timestamp: number;
    turnIndex?: number;
    kind?: 'image';
    imagePath?: string;
    imageSrc?: string;
    imageMissing?: boolean;
    fileContext?: {
        fileName: string;
        filePath: string;
        startLine?: number;
        endLine?: number;
    };
}
/**
 * Message handling Hook
 * Manages message list, streaming responses, and loading state
 */
export declare const useMessageHandling: () => {
    messages: TextMessage[];
    isStreaming: boolean;
    isWaitingForResponse: boolean;
    loadingMessage: string;
    addMessage: (message: TextMessage) => void;
    clearMessages: () => void;
    startStreaming: (timestamp?: number) => void;
    appendStreamChunk: (chunk: string) => void;
    endStreaming: () => void;
    appendThinkingChunk: (chunk: string) => void;
    clearThinking: () => void;
    breakAssistantSegment: () => void;
    breakThinkingSegment: () => void;
    setWaitingForResponse: (message: string) => void;
    clearWaitingForResponse: () => void;
    setMessages: import("react").Dispatch<import("react").SetStateAction<TextMessage[]>>;
};
