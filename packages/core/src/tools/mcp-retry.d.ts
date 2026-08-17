/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Determine whether an error is a transient network error that is
 * worth retrying. Permanent errors (auth failure, invalid config,
 * method-not-found) are NOT considered transient.
 *
 * Transient error codes / patterns:
 * - Node.js network error codes: ECONNRESET, ETIMEDOUT, ENOTFOUND,
 *   ECONNREFUSED, EAI_AGAIN, EPIPE, EHOSTUNREACH, ENETUNREACH
 * - MCP / JSON-RPC transport-level errors that embed those codes
 * - HTTP status codes that indicate temporary server-side failures:
 *   502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout)
 *
 * Non-transient (not retried):
 * - 401 (Unauthorized) / 403 (Forbidden) — auth / permission errors
 * - -32601 (Method not found) — server doesn't implement the method
 * - -32600 (Invalid request) / -32602 (Invalid params) — client bugs
 */
export declare function isTransientNetworkError(error: unknown): boolean;
/**
 * Retry a fallible async operation with short exponential backoff on
 * transient network errors. Permanent errors (auth, invalid config,
 * method-not-found) propagate immediately without retry.
 *
 * @param fn        The async operation to attempt.
 * @param label     A human-readable label for debug logging.
 * @param opts      Optional overrides for maxRetries, baseDelayMs, and signal.
 * @returns         The result of `fn()` on success.
 * @throws          The last error if all retries are exhausted, the
 *                  original error if it is not transient, or an
 *                  AbortError if the signal fires during backoff.
 */
export declare function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string,
  opts?: {
    maxRetries?: number;
    baseDelayMs?: number;
    signal?: AbortSignal;
  },
): Promise<T>;
