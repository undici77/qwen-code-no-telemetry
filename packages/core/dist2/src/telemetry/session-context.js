/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let sessionRootContext;
let currentSessionId;
export function setSessionContext(ctx, sessionId) {
    sessionRootContext = ctx;
    currentSessionId = sessionId;
}
export function getSessionContext() {
    return sessionRootContext;
}
/**
 * Returns the most recent session ID passed to setSessionContext.
 * Used by LogToSpanProcessor as a fallback to derive the correct traceId
 * when a log record has no session.id attribute (e.g. after /clear or /resume).
 */
export function getCurrentSessionId() {
    return currentSessionId;
}
//# sourceMappingURL=session-context.js.map