/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export function startInteractionSpan(_config, _options) { }
export function endInteractionSpan(_status, _metadata) { }
export function startLLMRequestSpan(_model, _promptId) {
    return {};
}
export function endLLMRequestSpan(_span, _metadata) { }
export function startToolSpan(_toolName, _attrs) {
    return {};
}
export function endToolSpan(_span, _metadata) { }
export function startToolExecutionSpan(_parentToolSpan) {
    return {};
}
export function endToolExecutionSpan(_span, _metadata) { }
export function runInToolSpanContext(_span, fn) {
    return fn();
}
export function getActiveInteractionSpan() {
    return undefined;
}
export function startToolBlockedOnUserSpan(_toolSpan, _attrs) {
    return {};
}
export function endToolBlockedOnUserSpan(_span, _metadata) { }
export function startHookSpan(_opts) {
    return {};
}
export function endHookSpan(_span, _metadata) { }
export function clearSessionTracingForTesting() { }
export function runTTLSweepForTesting(_now) { }
export function truncateSpanError(s) {
    return s;
}
//# sourceMappingURL=session-tracing.js.map