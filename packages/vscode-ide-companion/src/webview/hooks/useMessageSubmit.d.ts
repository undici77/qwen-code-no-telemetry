/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VSCodeAPI } from './useVSCode.js';
import type { ImageAttachment } from './useImage.js';
interface UseMessageSubmitProps {
    vscode: VSCodeAPI;
    inputText: string;
    setInputText: (text: string) => void;
    attachedImages?: ImageAttachment[];
    clearImages?: () => void;
    inputFieldRef: React.RefObject<HTMLDivElement | null>;
    isStreaming: boolean;
    isWaitingForResponse: boolean;
    editTargetTurnIndex?: number | null;
    onSubmitted?: () => void;
    skipAutoActiveContext?: boolean;
    fileContext: {
        getFileReference: (fileName: string) => string | undefined;
        activeFilePath: string | null;
        activeFileName: string | null;
        activeSelection: {
            startLine: number;
            endLine: number;
        } | null;
        clearFileReferences: () => void;
    };
    messageHandling: {
        setWaitingForResponse: (message: string) => void;
    };
}
export declare const shouldSendMessage: ({ inputText, attachedImages, isStreaming, isWaitingForResponse, }: {
    inputText: string;
    attachedImages?: ImageAttachment[];
    isStreaming: boolean;
    isWaitingForResponse: boolean;
}) => boolean;
/**
 * Message submit Hook
 * Handles message submission logic and context parsing
 */
export declare const useMessageSubmit: ({ vscode, inputText, setInputText, attachedImages, clearImages, inputFieldRef, isStreaming, isWaitingForResponse, editTargetTurnIndex, onSubmitted, skipAutoActiveContext, fileContext, messageHandling, }: UseMessageSubmitProps) => {
    handleSubmit: (e: React.FormEvent | React.KeyboardEvent, explicitText?: string) => void;
};
export {};
