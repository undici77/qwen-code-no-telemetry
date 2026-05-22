/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import { trace, type Span } from './dummy-otel.js';

const tracer = trace.getTracer('qwen-code-dummy');

// No-op implementations for no-telemetry policy
// All tracing functions are replaced with empty stubs or dummy spans

export interface StartInteractionOptions {
  intent?: string;
  source?: string;
  promptId?: string;
  model?: string;
  messageType?: string;
}

export interface EndInteractionOptions {
  metadata?: Record<string, string | number | boolean>;
  errorMessage?: string;
}

export interface LLMRequestMetadata {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  /**
   * Tokens served from the provider's prompt cache (Anthropic
   * cache_read_input_tokens, OpenAI prompt_tokens_details.cached_tokens, etc).
   * Normalized to GenerateContentResponseUsageMetadata.cachedContentTokenCount
   * by each provider generator before reaching LoggingContentGenerator.
   */
  cachedInputTokens?: number;
  success?: boolean;
  durationMs?: number;
  error?: string;
  /**
   * Time from the successful attempt's request dispatch to the first stream
   * chunk containing user-visible content (text / functionCall / inlineData /
   * executableCode / thought). Undefined for non-streaming requests, requests
   * aborted before the first user-visible chunk, and any path that does not
   * pass through LoggingContentGenerator's stream wrapper.
   */
  ttftMs?: number;
  /**
   * Time from generateContent/generateContentStream entry to the start of the
   * successful attempt (ms). Includes all failed retries + backoff sleeps.
   * Populated by the retry layer in Phase 4b; undefined in Phase 4a.
   */
  requestSetupMs?: number;
  /**
   * Final attempt number (1-based). 1 = no retries. Populated by the retry
   * layer in Phase 4b; undefined in Phase 4a.
   */
  attempt?: number;
  /**
   * Sum of all backoff delays before the successful attempt (ms). 0 if no
   * retries occurred. Populated by the retry layer in Phase 4b; undefined
   * in Phase 4a.
   */
  retryTotalDelayMs?: number;
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
  return tracer.startSpan('llm_request');
}

export function endLLMRequestSpan(
  _span: Span,
  _metadata?: LLMRequestMetadata,
): void {}

export function startToolSpan(
  _toolName: string,
  _attrs?: Record<string, string | number | boolean>,
): Span {
  return tracer.startSpan('tool_use');
}

export function endToolSpan(_span: Span, _metadata?: ToolSpanMetadata): void {}

export function startToolExecutionSpan(_parentToolSpan?: Span): Span {
  return tracer.startSpan('tool_execution');
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
  return tracer.startSpan('tool_blocked_on_user');
}

export function endToolBlockedOnUserSpan(
  _span: Span,
  _metadata?: {
    decision?: ToolBlockedDecision;
    source?: ToolBlockedSource;
  },
): void {}

export function startHookSpan(_opts: StartHookSpanOptions): Span {
  return tracer.startSpan('hook_call');
}

export function endHookSpan(_span: Span, _metadata?: HookSpanMetadata): void {}

export function clearSessionTracingForTesting(): void {}

export function runTTLSweepForTesting(_now: number): void {}

export function truncateSpanError(s: string): string {
  return s;
}
