/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const MISSING_SESSION_HTTP_STATUSES = [404, 410];
const MISSING_SESSION_HTTP_STATUS_SET = new Set(MISSING_SESSION_HTTP_STATUSES);
export function isMissingSessionHttpStatus(status) {
    return status !== undefined && MISSING_SESSION_HTTP_STATUS_SET.has(status);
}
/**
 * Preserve 404/410 after heartbeat detects a missing session so a later
 * status-less transport retry cannot hide the missing-session empty state.
 */
export function resolveConnectionErrorStatus(nextStatus, currentStatus) {
    if (isMissingSessionHttpStatus(currentStatus) &&
        !isMissingSessionHttpStatus(nextStatus)) {
        return currentStatus;
    }
    return nextStatus;
}
//# sourceMappingURL=status.js.map