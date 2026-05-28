/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { trace, type Span } from './dummy-otel.js';

export type StartInteractionOptions = any;
export type EndInteractionOptions = any;
export type LLMRequestMetadata = any;
export type ToolSpanMetadata = any;
export type ToolBlockedDecision = any;
export type ToolBlockedSource = any;
export type HookEvent = any;
export type StartHookSpanOptions = any;
export type HookSpanMetadata = any;

const tracer = trace.getTracer('qwen-code-dummy');

export function startInteractionSpan(_opts: any, _extra?: any): Span {
  return tracer.startSpan('interaction');
}

export function endInteractionSpan(_span: Span, _metadata?: any): void {}

export function startLLMRequestSpan(_opts: any, _extra?: any): Span {
  return tracer.startSpan('llm_request');
}

export function endLLMRequestSpan(_span: Span, _metadata?: any): void {}

export function startToolSpan(_toolName: string, _options?: any): Span {
  return tracer.startSpan('tool');
}

export function endToolSpan(_span: Span, _metadata?: any): void {}

export function startToolExecutionSpan(_parentToolSpan?: Span): Span {
  return tracer.startSpan('tool_execution');
}

export function endToolExecutionSpan(_span: Span, _metadata?: any): void {}

export function runInToolSpanContext<T>(_span: Span, fn: () => T): T {
  return fn();
}

export function getActiveInteractionSpan(): Span | undefined {
  return undefined;
}

export function startToolBlockedOnUserSpan(
  _toolSpan: Span,
  _attrs?: any,
): Span {
  return tracer.startSpan('tool_blocked_on_user');
}

export function endToolBlockedOnUserSpan(
  _span: Span,
  _metadata?: any,
): void {}

export function startHookSpan(_opts: any): Span {
  return tracer.startSpan('hook_call');
}

export function endHookSpan(_span: Span, _metadata?: any): void {}

export function clearSessionTracingForTesting(): void {}

export function runTTLSweepForTesting(_now: number): void {}

export function truncateSpanError(s: string): string {
  return s;
}
