/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface RetryInfo {
    /** Formatted error message for display, produced by parseAndFormatApiError. */
    message?: string;
    /** Current retry attempt (1-based). */
    attempt: number;
    /** Max retries allowed. */
    maxRetries: number;
    /** Delay in milliseconds before the retry happens. */
    delayMs: number;
    /** When called, resolves the delay promise early so the retry happens immediately. */
    skipDelay: () => void;
}
export interface RateLimitErrorDetails {
    statusCode?: number;
    providerCode?: string;
    providerMessage?: string;
    requestId?: string;
    transport: 'http' | 'sse' | 'unknown';
}
export interface RateLimitRetryDelayOptions {
    initialDelayMs: number;
    maxDelayMs: number;
    error?: unknown;
}
/**
 * Detects rate-limit / throttling errors and returns retry info.
 *
 * @param error - The error to check.
 * @param extraCodes - Additional error codes to treat as rate-limit errors,
 *   merged with the built-in set at call time (not mutating the default set).
 */
export declare function isRateLimitError(error: unknown, extraCodes?: readonly number[]): boolean;
/**
 * Extracts structured diagnostic fields from known HTTP and SSE rate-limit
 * error shapes without changing retryability decisions.
 */
export declare function getRateLimitErrorDetails(error: unknown): RateLimitErrorDetails;
/**
 * Calculates the stream-side rate-limit retry delay.
 *
 * Retry-After is treated as a provider-supplied minimum wait, but the final
 * delay is still capped by maxDelayMs so an interactive session cannot be
 * parked indefinitely by an oversized header.
 */
export declare function getRateLimitRetryDelayMs(attempt: number, options: RateLimitRetryDelayOptions): number;
