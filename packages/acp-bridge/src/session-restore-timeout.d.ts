/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const DEFAULT_SESSION_RESTORE_TIMEOUT_MS = 60000;
export declare const MAX_SESSION_RESTORE_TIMEOUT_MS = 2147483647;
/** Floor for any restore-related retry hint, matching `session_limit_exceeded`. */
export declare const MIN_RESTORE_RETRY_AFTER_SECONDS = 5;
/** Ceiling, so a very long configured budget cannot advertise an absurd wait. */
export declare const MAX_RESTORE_RETRY_AFTER_SECONDS = 120;
/**
 * Retry hint, in seconds, for a state that persists for about one restore
 * budget: the fence behind an abandoned restore, the 504 that created it, and
 * the quarantine that can follow. All three outlive the ordinary 5-second
 * cadence, and advertising 5 there is a tight loop against a state the client
 * cannot clear. Clamped at both ends — see the design doc, which documents the
 * clamp rather than just the budget.
 */
export declare function restoreRetryAfterSeconds(timeoutMs: number): number;
export interface SessionRestoreTimeoutOptions {
    sessionRestoreTimeoutMs?: number;
    initializeTimeoutMs?: number;
}
export declare function resolveSessionRestoreTimeoutMs(opts: SessionRestoreTimeoutOptions): number;
