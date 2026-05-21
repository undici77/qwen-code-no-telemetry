/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Span, type Context } from './dummy-otel.js';
export declare const API_CALL_FAILED_SPAN_STATUS_MESSAGE = "API call failed";
export declare const API_CALL_ABORTED_SPAN_STATUS_MESSAGE = "API call aborted";
export declare const OPERATION_FAILED_SPAN_STATUS_MESSAGE = "operation failed";
export interface WithSpanOptions {
    autoOkOnSuccess?: boolean;
}
export declare function safeSetStatus(_span: Span, _status: unknown): void;
/**
 * Run an async function within a dummy span.
 */
export declare function withSpan<T>(_name: string, _attributes: Record<string, string | number | boolean>, fn: (span: Span) => Promise<T>, _options?: WithSpanOptions): Promise<T>;
/**
 * Start a dummy span with context.
 */
export declare function startSpanWithContext(_name: string, _attributes: Record<string, string | number | boolean>): {
    span: Span;
    runInContext: <T>(fn: () => T) => T;
};
/**
 * Create a dummy session root context.
 */
export declare function createSessionRootContext(_sessionId: string): Context;
