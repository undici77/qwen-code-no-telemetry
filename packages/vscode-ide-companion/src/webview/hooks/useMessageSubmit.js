/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { getRandomLoadingMessage } from '../../constants/loadingMessages.js';
import { ZERO_WIDTH_SPACE, stripZeroWidthSpaces } from '@qwen-code/webui';
export const shouldSendMessage = ({ inputText, attachedImages, isStreaming, isWaitingForResponse, }) => {
    if (isStreaming || isWaitingForResponse) {
        return false;
    }
    const hasText = stripZeroWidthSpaces(inputText).trim().length > 0;
    const hasAttachments = (attachedImages?.length ?? 0) > 0;
    return hasText || hasAttachments;
};
/**
 * Message submit Hook
 * Handles message submission logic and context parsing
 */
export const useMessageSubmit = ({ vscode, inputText, setInputText, attachedImages = [], clearImages, inputFieldRef, isStreaming, isWaitingForResponse, editTargetTurnIndex = null, onSubmitted, skipAutoActiveContext = false, fileContext, messageHandling, }) => {
    const handleSubmit = useCallback((e, explicitText) => {
        e.preventDefault();
        // Use explicit text if provided (e.g., from prompt suggestion Enter accept)
        const textToSend = explicitText ?? inputText;
        if (!shouldSendMessage({
            inputText: textToSend,
            attachedImages,
            isStreaming,
            isWaitingForResponse,
        })) {
            return;
        }
        // Handle /account command - show account info dialog
        if (textToSend.trim() === '/account') {
            setInputText('');
            if (inputFieldRef.current) {
                inputFieldRef.current.textContent = ZERO_WIDTH_SPACE;
                inputFieldRef.current.setAttribute('data-empty', 'true');
            }
            vscode.postMessage({ type: 'getAccountInfo', data: {} });
            return;
        }
        // Handle /auth (and its legacy alias /login) — trigger interactive
        // auth flow directly in the extension instead of sending the command
        // to the agent.
        const trimmedInput = textToSend.trim();
        if (trimmedInput === '/auth' || trimmedInput === '/login') {
            setInputText('');
            if (inputFieldRef.current) {
                inputFieldRef.current.textContent = ZERO_WIDTH_SPACE;
                inputFieldRef.current.setAttribute('data-empty', 'true');
            }
            vscode.postMessage({
                type: 'auth',
                data: {},
            });
            try {
                messageHandling.setWaitingForResponse('Authenticating Qwen Code...');
            }
            catch (_err) {
                // Best-effort UI hint; ignore if hook not available
            }
            return;
        }
        messageHandling.setWaitingForResponse(getRandomLoadingMessage());
        // Parse @file references from input text
        const context = [];
        const fileRefPattern = /@([^\s]+)/g;
        let match;
        while ((match = fileRefPattern.exec(textToSend)) !== null) {
            const fileName = match[1];
            const filePath = fileContext.getFileReference(fileName);
            if (filePath) {
                context.push({
                    type: 'file',
                    name: fileName,
                    value: filePath,
                });
            }
        }
        // Add active file selection context if present and not skipped
        if (fileContext.activeFilePath && !skipAutoActiveContext) {
            const fileName = fileContext.activeFileName || 'current file';
            context.push({
                type: 'file',
                name: fileName,
                value: fileContext.activeFilePath,
                startLine: fileContext.activeSelection?.startLine,
                endLine: fileContext.activeSelection?.endLine,
            });
        }
        let fileContextForMessage;
        if (fileContext.activeFilePath &&
            fileContext.activeFileName &&
            !skipAutoActiveContext) {
            fileContextForMessage = {
                fileName: fileContext.activeFileName,
                filePath: fileContext.activeFilePath,
                startLine: fileContext.activeSelection?.startLine,
                endLine: fileContext.activeSelection?.endLine,
            };
        }
        vscode.postMessage({
            type: typeof editTargetTurnIndex === 'number'
                ? 'editMessage'
                : 'sendMessage',
            data: {
                text: textToSend,
                context: context.length > 0 ? context : undefined,
                fileContext: fileContextForMessage,
                attachments: attachedImages.length > 0 ? attachedImages : undefined,
                ...(typeof editTargetTurnIndex === 'number'
                    ? { targetTurnIndex: editTargetTurnIndex }
                    : {}),
            },
        });
        setInputText('');
        if (inputFieldRef.current) {
            inputFieldRef.current.textContent = ZERO_WIDTH_SPACE;
            inputFieldRef.current.setAttribute('data-empty', 'true');
        }
        fileContext.clearFileReferences();
        if (clearImages) {
            clearImages();
        }
        onSubmitted?.();
    }, [
        inputText,
        attachedImages,
        clearImages,
        isStreaming,
        setInputText,
        inputFieldRef,
        vscode,
        fileContext,
        skipAutoActiveContext,
        isWaitingForResponse,
        messageHandling,
        editTargetTurnIndex,
        onSubmitted,
    ]);
    return { handleSubmit };
};
//# sourceMappingURL=useMessageSubmit.js.map