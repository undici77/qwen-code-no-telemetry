/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { trace } from './dummy-otel.js';
export const API_CALL_FAILED_SPAN_STATUS_MESSAGE = 'API call failed';
export const API_CALL_ABORTED_SPAN_STATUS_MESSAGE = 'API call aborted';
export const OPERATION_FAILED_SPAN_STATUS_MESSAGE = 'operation failed';
export function safeSetStatus(_span, _status) {
    // No-op
}
/**
 * Run an async function within a dummy span.
 */
export async function withSpan(_name, _attributes, fn, _options) {
    const span = trace.getTracer().startSpan(_name);
    return fn(span);
}
/**
 * Start a dummy span with context.
 */
export function startSpanWithContext(_name, _attributes) {
    const span = trace.getTracer().startSpan(_name);
    return {
        span,
        runInContext: (fn) => fn(),
    };
}
/**
 * Create a dummy session root context.
 */
export function createSessionRootContext(_sessionId) {
    return {};
}
//# sourceMappingURL=tracer.js.map