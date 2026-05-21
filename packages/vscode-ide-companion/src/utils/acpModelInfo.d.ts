/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ModelInfo } from '@agentclientprotocol/sdk';
import type { ApprovalModeValue } from '../types/approvalModeValueTypes.js';
/**
 * SessionModelState as returned from ACP session/new.
 */
export interface SessionModelState {
    availableModels: ModelInfo[];
    currentModelId: string;
}
export interface SessionModeState {
    currentModeId?: ApprovalModeValue;
    availableModes?: Array<{
        id: ApprovalModeValue;
        name: string;
        description: string;
    }>;
}
/**
 * Extract complete model state from ACP `session/new` result.
 *
 * Returns both the list of available models and the current model ID.
 */
export declare const extractSessionModelState: (result: unknown) => SessionModelState | null;
export declare const extractSessionModeState: (result: unknown) => SessionModeState | null;
/**
 * Extract model info from ACP `session/new` result.
 *
 * Per Agent Client Protocol draft schema, NewSessionResponse includes `models`.
 * We also accept legacy shapes for compatibility.
 */
export declare const extractModelInfoFromNewSessionResult: (result: unknown) => ModelInfo | null;
