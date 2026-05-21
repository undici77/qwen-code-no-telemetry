/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { Span } from './dummy-otel.js';

// No-op implementations for no-telemetry policy
// All tracing functions are replaced with empty stubs

export interface StartInteractionOptions {
  intent?: string;
  source?: string;
}

export interface EndInteractionOptions {
  metadata?: Record<string, string | number | boolean>;
}

export interface LLMRequestMetadata {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  success?: boolean;
  error?: string;
  durationMs?: number;
}

export interface ToolSpanMetadata {
  success?: boolean;
  error?: string;
  durationMs?: number;
}

export type ToolBlockedDecision =
  | 'proceed_once'
  | 'proceed_always'
  | 'cancel'
  | 'aborted'
  | 'auto_approved'
  | 'error';

export type ToolBlockedSource = 'cli' | 'ide' | 'hook' | 'auto' | 'system';

export type HookEvent = 'PreToolUse' | 'PostToolUse' | 'PostToolUseFailure';

export interface StartHookSpanOptions {
  hookEvent: HookEvent;
  toolName: string;
  toolUseId?: string;
  isInterrupt?: boolean;
}

export interface HookSpanMetadata {
  success?: boolean;
  shouldProceed?: boolean;
  shouldStop?: boolean;
  blockType?: 'denied' | 'ask' | 'stop';
  hasAdditionalContext?: boolean;
  error?: string;
}

export function startInteractionSpan(
  _config: Config,
  _options: StartInteractionOptions,
): void {}

export function endInteractionSpan(
  _status: 'ok' | 'error' | 'cancelled',
  _metadata?: EndInteractionOptions,
): void {}

export function startLLMRequestSpan(_model?: string, _promptId?: string): Span {
  return {} as Span;
}

export function endLLMRequestSpan(
  _span: Span,
  _metadata?: LLMRequestMetadata,
): void {}

export function startToolSpan(
  _toolName: string,
  _attrs?: Record<string, string | number | boolean>,
): Span {
  return {} as Span;
}

export function endToolSpan(_span: Span, _metadata?: ToolSpanMetadata): void {}

export function startToolExecutionSpan(_parentToolSpan?: Span): Span {
  return {} as Span;
}

export function endToolExecutionSpan(_span: Span, _metadata?: unknown): void {}

export function runInToolSpanContext<T>(_span: Span, fn: () => T): T {
  return fn();
}

export function getActiveInteractionSpan(): Span | undefined {
  return undefined;
}

export function startToolBlockedOnUserSpan(
  _toolSpan: Span,
  _attrs?: { tool_name?: string; call_id?: string },
): Span {
  return {} as Span;
}

export function endToolBlockedOnUserSpan(
  _span: Span,
  _metadata?: {
    decision?: ToolBlockedDecision;
    source?: ToolBlockedSource;
  },
): void {}

export function startHookSpan(_opts: StartHookSpanOptions): Span {
  return {} as Span;
}

export function endHookSpan(_span: Span, _metadata?: HookSpanMetadata): void {}

export function clearSessionTracingForTesting(): void {}

export function runTTLSweepForTesting(_now: number): void {}

export function truncateSpanError(s: string): string {
  return s;
}
