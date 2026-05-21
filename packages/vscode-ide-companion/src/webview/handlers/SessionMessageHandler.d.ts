/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseMessageHandler } from './BaseMessageHandler.js';
/**
 * Session message handler
 * Handles all session-related messages
 */
export declare class SessionMessageHandler extends BaseMessageHandler {
    private currentStreamContent;
    private authHandler;
    private isTitleSet;
    canHandle(messageType: string): boolean;
    /**
     * Set auth handler
     */
    setAuthHandler(handler: () => Promise<void>): void;
    handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Get current stream content
     */
    getCurrentStreamContent(): string;
    /**
     * Append stream content
     */
    appendStreamContent(chunk: string): void;
    /**
     * Reset stream content
     */
    resetStreamContent(): void;
    private captureConversationSnapshot;
    private restoreConversationSnapshot;
    /**
     * Monotonically increasing request counter used to tag streamStart/streamEnd
     * so the WebView can detect and discard stale events from previous requests.
     */
    private requestCounter;
    private currentRequestId;
    private streamEndSent;
    /**
     * Notify the webview that streaming has finished.
     * Includes the `requestId` so the webview can ignore stale events.
     * Guarded by `streamEndSent` to prevent duplicate streamEnd for the
     * same request (e.g. cancel handler + error handler both sending one).
     *
     * @param reason  Optional reason string (e.g. 'user_cancelled').
     * @param forRequestId  When provided, the call is scoped to a specific
     *   request invocation.  If a newer request has since overwritten
     *   `this.currentRequestId`, the call is silently dropped — this
     *   prevents a stale `handleSendMessage` invocation (resumed after
     *   cancellation) from emitting a streamEnd tagged as the newer request.
     */
    private sendStreamEnd;
    /**
     * Prompt user to authenticate and invoke the registered auth handler/command.
     * Returns true if authentication was initiated.
     */
    private promptAuth;
    /**
     * Prompt user to authenticate or view offline. Returns 'auth', 'offline', or 'dismiss'.
     * When configure is chosen, it triggers the auth handler/command.
     */
    private promptAuthOrOffline;
    private getErrorMessage;
    private shouldPromptAuth;
    private resolveSessionWorkingDir;
    private handleExportCommand;
    /**
     * Handle send message request
     */
    private handleSendMessage;
    /**
     * Handle new Qwen session request
     */
    private handleNewQwenSession;
    /**
     * Handle switch Qwen session request
     */
    private handleSwitchQwenSession;
    /**
     * Handle get Qwen sessions request
     */
    private handleGetQwenSessions;
    /**
     * Handle cancel streaming request
     */
    private handleCancelStreaming;
    /**
     * Handle resume session request
     */
    private handleResumeSession;
    /**
     * Handle delete session request
     */
    private handleDeleteQwenSession;
    /**
     * Handle rename session request
     */
    private handleRenameQwenSession;
    /**
     * Set approval mode via agent (ACP session/set_mode)
     */
    private handleSetApprovalMode;
    /**
     * Set model via agent (ACP session/set_model)
     * Displays VSCode native notifications on success or failure.
     */
    private handleSetModel;
}
