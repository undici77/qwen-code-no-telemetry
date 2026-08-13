/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const DEFAULT_SESSION_RESTORE_TIMEOUT_MS = 60_000;
export const MAX_SESSION_RESTORE_TIMEOUT_MS = 2_147_483_647;
/** Floor for any restore-related retry hint, matching `session_limit_exceeded`. */
export const MIN_RESTORE_RETRY_AFTER_SECONDS = 5;
/** Ceiling, so a very long configured budget cannot advertise an absurd wait. */
export const MAX_RESTORE_RETRY_AFTER_SECONDS = 120;
/**
 * Retry hint, in seconds, for a state that persists for about one restore
 * budget: the fence behind an abandoned restore, the 504 that created it, and
 * the quarantine that can follow. All three outlive the ordinary 5-second
 * cadence, and advertising 5 there is a tight loop against a state the client
 * cannot clear. Clamped at both ends — see the design doc, which documents the
 * clamp rather than just the budget.
 */
export function restoreRetryAfterSeconds(timeoutMs) {
    return Math.min(MAX_RESTORE_RETRY_AFTER_SECONDS, Math.max(MIN_RESTORE_RETRY_AFTER_SECONDS, Math.ceil(timeoutMs / 1000)));
}
function assertValidTimeoutMs(field, timeoutMs) {
    if (!Number.isFinite(timeoutMs) ||
        !Number.isInteger(timeoutMs) ||
        timeoutMs <= 0 ||
        timeoutMs > MAX_SESSION_RESTORE_TIMEOUT_MS) {
        throw new TypeError(`Invalid ${field}: ${timeoutMs}. Must be a positive integer no greater than ${MAX_SESSION_RESTORE_TIMEOUT_MS}.`);
    }
}
export function resolveSessionRestoreTimeoutMs(opts) {
    if (opts.sessionRestoreTimeoutMs !== undefined) {
        assertValidTimeoutMs('sessionRestoreTimeoutMs', opts.sessionRestoreTimeoutMs);
        return opts.sessionRestoreTimeoutMs;
    }
    if (opts.initializeTimeoutMs !== undefined) {
        assertValidTimeoutMs('initializeTimeoutMs', opts.initializeTimeoutMs);
        // A startup budget may RAISE the restore budget but never lower it. The
        // two measure different work — a strict child-initialize check must not
        // silently reimpose the sub-default restore deadline that #8678 was
        // filed against.
        return Math.max(opts.initializeTimeoutMs, DEFAULT_SESSION_RESTORE_TIMEOUT_MS);
    }
    return DEFAULT_SESSION_RESTORE_TIMEOUT_MS;
}
//# sourceMappingURL=session-restore-timeout.js.map