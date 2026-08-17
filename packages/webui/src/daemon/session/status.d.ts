/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const MISSING_SESSION_HTTP_STATUSES: readonly [404, 410];
export declare function isMissingSessionHttpStatus(
  status: number | undefined,
): boolean;
/**
 * Preserve 404/410 after heartbeat detects a missing session so a later
 * status-less transport retry cannot hide the missing-session empty state.
 */
export declare function resolveConnectionErrorStatus(
  nextStatus: number | undefined,
  currentStatus: number | undefined,
): number | undefined;
