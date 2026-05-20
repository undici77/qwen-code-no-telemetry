/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Span, type Context, trace } from './dummy-otel.js';

export const API_CALL_FAILED_SPAN_STATUS_MESSAGE = 'API call failed';
export const API_CALL_ABORTED_SPAN_STATUS_MESSAGE = 'API call aborted';
export const OPERATION_FAILED_SPAN_STATUS_MESSAGE = 'operation failed';

export interface WithSpanOptions {
  autoOkOnSuccess?: boolean;
}

export function safeSetStatus(_span: Span, _status: unknown): void {
  // No-op
}

/**
 * Run an async function within a dummy span.
 */
export async function withSpan<T>(
  _name: string,
  _attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
  _options?: WithSpanOptions,
): Promise<T> {
  const span = trace.getTracer().startSpan(_name);
  return fn(span);
}

/**
 * Start a dummy span with context.
 */
export function startSpanWithContext(
  _name: string,
  _attributes: Record<string, string | number | boolean>,
): {
  span: Span;
  runInContext: <T>(fn: () => T) => T;
} {
  const span = trace.getTracer().startSpan(_name);
  return {
    span,
    runInContext: <T>(fn: () => T) => fn(),
  };
}

/**
 * Create a dummy session root context.
 */
export function createSessionRootContext(_sessionId: string): Context {
  return {};
}
