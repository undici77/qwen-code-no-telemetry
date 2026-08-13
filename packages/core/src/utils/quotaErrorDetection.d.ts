/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { StructuredError } from '../core/turn.js';
export interface ApiError {
    error: {
        code: number;
        message: string;
        status: string;
        details: unknown[];
    };
}
export declare function isApiError(error: unknown): error is ApiError;
export declare function isStructuredError(error: unknown): error is StructuredError;
export declare function isProQuotaExceededError(error: unknown): boolean;
export declare function isGenericQuotaExceededError(error: unknown): boolean;
export declare function isQwenQuotaExceededError(error: unknown): boolean;
/**
 * Prefix marking a friendly quota-exhausted message produced by
 * {@link formatQuotaExhaustedMessage}. `parseAndFormatApiError` recognizes it
 * so the message is surfaced verbatim instead of being re-wrapped in
 * "[API Error: …]".
 */
export declare const QUOTA_EXHAUSTED_PREFIX = "Quota exhausted: ";
/**
 * Detects permanent quota-exhaustion errors that carry a reset time.
 *
 * Unlike transient rate-limiting (TPM/RPM throttling, which lifts within
 * seconds–minutes), these signal an allocated quota fully spent and only
 * resetting at a specific future time. Retrying cannot succeed until then —
 * the caller should fast-fail and surface the reset time instead of hanging
 * the session through the full retry budget with no output.
 *
 * Matches e.g. the Bailian token-plan error surfaced via the OpenAI SDK:
 *   "429 Your token-plan 1-week quota has been exhausted. The quota will
 *    reset at 07-27 09:25:00 UTC."
 *
 * @param error The error to check (Error, ApiError, or message string).
 * @returns True when the error names a quota that is exhausted/exceeded AND
 *   carries a reset time — the combination that signals a permanent condition.
 */
export declare function isQuotaExhaustedError(error: unknown): boolean;
/**
 * Builds a friendly, self-contained message for a permanent quota-exhaustion
 * error. Preserves the provider's verbatim wording (which names the quota and
 * the reset time) and appends an actionable hint.
 *
 * The result is prefixed with {@link QUOTA_EXHAUSTED_PREFIX} so
 * `parseAndFormatApiError` surfaces it verbatim rather than wrapping it.
 *
 * @param error The error whose message should be surfaced.
 * @returns A user-facing message starting with `QUOTA_EXHAUSTED_PREFIX`.
 */
export declare function formatQuotaExhaustedMessage(error: unknown): string;
