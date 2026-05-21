/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Qwen Session Update Handler
 *
 * Handles session updates from ACP and dispatches them to appropriate callbacks
 */
import type { SessionNotification } from '@agentclientprotocol/sdk';
import type { QwenAgentCallbacks } from '../types/chatTypes.js';
/**
 * Qwen Session Update Handler class
 * Processes various session update events and calls appropriate callbacks
 */
export declare class QwenSessionUpdateHandler {
    private callbacks;
    constructor(callbacks: QwenAgentCallbacks);
    /**
     * Update callbacks
     *
     * @param callbacks - New callback collection
     */
    updateCallbacks(callbacks: QwenAgentCallbacks): void;
    /**
     * Handle session update
     *
     * @param data - ACP session update data
     */
    handleSessionUpdate(data: SessionNotification): void;
    private getTextContent;
    private emitUsageMeta;
}
