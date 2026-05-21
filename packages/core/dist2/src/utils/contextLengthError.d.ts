/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ContextLengthExceededInfo {
    isExceeded: boolean;
    message: string;
    actualTokens?: number;
    limitTokens?: number;
}
export declare function getContextLengthExceededInfo(error: unknown): ContextLengthExceededInfo;
export declare function isContextLengthExceededError(error: unknown): boolean;
