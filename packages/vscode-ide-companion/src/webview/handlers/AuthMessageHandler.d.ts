/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseMessageHandler } from './BaseMessageHandler.js';
import { type ProviderConfig, type ProviderSetupInputs } from '@qwen-code/qwen-code-core';
/**
 * Auth message handler
 * Handles all authentication-related messages.
 *
 * Uses the shared ProviderConfig registry from core to dynamically
 * generate setup flows instead of hardcoding provider-specific logic.
 */
export declare class AuthMessageHandler extends BaseMessageHandler {
    private authInteractiveHandler;
    canHandle(messageType: string): boolean;
    handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Set auth interactive handler — called with provider config and user inputs.
     */
    setAuthInteractiveHandler(handler: (config: ProviderConfig, inputs: ProviderSetupInputs) => Promise<void>): void;
    /**
     * Handle getAccountInfo request
     */
    private handleGetAccountInfo;
    /**
     * Notify the webview that the interactive auth flow was dismissed.
     */
    private notifyAuthCancelled;
    /**
     * Helper: show a QuickPick and return the selected item's `value`.
     * Returns undefined if the user cancels.
     *
     * Items with `kind: Separator` are rendered by VSCode as non-selectable
     * group headers; they should be left in `items` to preserve grouping.
     */
    private pick;
    /**
     * Helper: show an InputBox. Returns undefined if the user cancels.
     */
    private input;
    /**
     * Handle auth — full interactive auth flow.
     * Dynamically generates provider choices from the shared registry.
     */
    private handleAuthInteractive;
    private runProviderSetupFlow;
}
