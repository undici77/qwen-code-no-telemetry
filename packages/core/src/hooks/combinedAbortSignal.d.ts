/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Create a combined AbortSignal that aborts when either:
 * - The provided external signal is aborted, OR
 * - The timeout is reached
 *
 * @param externalSignal - Optional external AbortSignal to combine
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object containing the combined signal and a cleanup function
 */
export declare function createCombinedAbortSignal(externalSignal?: AbortSignal, options?: {
    timeoutMs?: number;
}): {
    signal: AbortSignal;
    cleanup: () => void;
};
