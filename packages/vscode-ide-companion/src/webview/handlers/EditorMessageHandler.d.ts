/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseMessageHandler } from './BaseMessageHandler.js';
/**
 * Editor message handler
 * Handles all editor state-related messages
 */
export declare class EditorMessageHandler extends BaseMessageHandler {
    canHandle(messageType: string): boolean;
    handle(message: {
        type: string;
        data?: unknown;
    }): Promise<void>;
    /**
     * Get current active editor info
     */
    private handleGetActiveEditor;
    /**
     * Focus on active editor
     */
    private handleFocusActiveEditor;
}
