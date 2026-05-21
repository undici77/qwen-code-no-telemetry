/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentResponse } from '@google/genai';
export interface HttpError extends Error {
    status?: number;
}
export interface HeartbeatInfo {
    attempt: number;
    remainingMs: number;
    error: unknown;
}
export interface RetryOptions {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    shouldRetryOnError: (error: Error) => boolean;
    shouldRetryOnContent?: (content: GenerateContentResponse) => boolean;
    authType?: string;
    persistentMode?: boolean;
    persistentMaxBackoffMs?: number;
    persistentCapMs?: number;
    heartbeatIntervalMs?: number;
    heartbeatFn?: (info: HeartbeatInfo) => void;
    signal?: AbortSignal;
}
/**
 * Determines if an error is a transient capacity error eligible for persistent retry.
 * Only 429 (Rate Limit) and 529 (Overloaded) qualify — HTTP 500 is excluded
 * because it may indicate a permanent server bug.
 */
export declare function isTransientCapacityError(error: unknown): boolean;
/**
 * Detects whether persistent retry mode is explicitly enabled.
 * Requires the user to opt in via QWEN_CODE_UNATTENDED_RETRY — we intentionally
 * do NOT auto-activate on CI=true, because silently turning a fast-fail CI job
 * into an infinite-wait job would be surprising and dangerous.
 */
export declare function isUnattendedMode(): boolean;
/**
 * Retries a function with exponential backoff and jitter.
 * Supports persistent retry mode for unattended/CI environments where transient
 * capacity errors (429/529) should be retried indefinitely rather than failing.
 * @param fn The asynchronous function to retry.
 * @param options Optional retry configuration.
 * @returns A promise that resolves with the result of the function if successful.
 * @throws The last error encountered if all attempts fail.
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
