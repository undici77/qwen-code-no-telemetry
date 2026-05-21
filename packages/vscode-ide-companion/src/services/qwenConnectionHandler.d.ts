/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AcpConnection } from './acpConnection.js';
import type { ModelInfo } from '@agentclientprotocol/sdk';
import type { ApprovalModeValue } from '../types/approvalModeValueTypes.js';
export interface QwenConnectionResult {
    sessionCreated: boolean;
    requiresAuth: boolean;
    modelInfo?: ModelInfo;
    availableModels?: ModelInfo[];
    currentModeId?: ApprovalModeValue;
    availableModes?: Array<{
        id: ApprovalModeValue;
        name: string;
        description: string;
    }>;
}
/**
 * Qwen Connection Handler class
 * Handles connection, authentication, and session initialization
 */
export declare class QwenConnectionHandler {
    /**
     * Connect to Qwen service and establish session
     *
     * @param connection - ACP connection instance
     * @param workingDir - Working directory
     * @param cliPath - CLI path (optional, if provided will override the path in configuration)
     */
    connect(connection: AcpConnection, workingDir: string, cliEntryPath: string, options?: {
        autoAuthenticate?: boolean;
    }): Promise<QwenConnectionResult>;
    /**
     * Create new session (with retry)
     *
     * @param connection - ACP connection instance
     * @param workingDir - Working directory
     * @param maxRetries - Maximum number of retries
     */
    private newSessionWithRetry;
}
