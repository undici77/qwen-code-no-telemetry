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

export function safeSetStatus(_span: Span, _status: unknown): void {}

export async function withSpan<T>(
  _name: string,
  _attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
  _options?: WithSpanOptions,
): Promise<T> {
  const span = trace.getTracer().startSpan(_name);
  return fn(span);
}

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

export function shouldForceSampled(): boolean {
  return false;
}

/**
 * @deprecated No longer used for span parenting — each interaction is now a
 * trace root with its own traceId. Retained for backward compatibility
 * and existing tests.
 */
export function createSessionRootContext(_sessionId: string): Context {
  return {};
}
