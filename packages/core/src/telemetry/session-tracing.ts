// No-op implementation for no-telemetry policy — all telemetry logic neutralized.
// See NO_TELEMETRY_GUIDELINES.MD for the privacy policy.

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Type exports (all no-op) ---

export type StartInteractionOptions = any;
export type EndInteractionOptions = any;
export type LLMRequestMetadata = any;
export type ToolSpanMetadata = any;
export type ToolBlockedDecision =
  | 'cli'
  | 'ide'
  | 'hook'
  | 'auto'
  | 'system'
  | 'aborted'
  | 'error'
  | 'cancel'
  | 'proceed_once'
  | 'proceed_always'
  | 'auto_approved';

export type ToolBlockedSource = 'cli' | 'ide' | 'hook' | 'auto' | 'system';

export type HookEvent =
  | 'start'
  | 'end'
  | 'proceed_once'
  | 'proceed_always'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'PostToolBatch';

export interface StartHookSpanOptions {
  [key: string]: any;
}

export interface HookSpanMetadata {
  hookName?: string;
  result?: string;
  success?: boolean;
  error?: string;
  hasAdditionalContext?: boolean;
}

export type SubagentInvocationKind =
  | 'tool'
  | 'command'
  | 'skill'
  | 'foreground'
  | 'background'
  | 'fork';

export type SubagentStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'aborted';

export interface StartSubagentSpanOptions {
  kind?: SubagentInvocationKind;
  toolName?: string;
}

export interface SubagentSpanMetadata {
  status?: SubagentStatus;
  durationMs?: number;
  error?: string;
  terminateReason?: string;
  resultSummaryPresent?: boolean;
  errorType?: string;
}

// --- Span context types (no-op) ---

type Span = any;

// --- Interaction spans ---

export function startInteractionSpan(_opts?: any, _extra?: any): Span {
  return {} as Span;
}

export function endInteractionSpan(_span: Span, _metadata?: any): void {}

// --- LLM request spans ---

export function startLLMRequestSpan(_opts?: any, _extra?: any): Span {
  return {} as Span;
}

export function endLLMRequestSpan(_span: Span, _metadata?: any): void {}

// --- Tool spans ---

export function startToolSpan(_toolName: string, _options?: any): Span {
  return {} as Span;
}

export function endToolSpan(_span: Span, _metadata?: any): void {}

export function runInToolSpanContext<T>(_span: Span, fn: () => T): T {
  return fn();
}

export function startToolExecutionSpan(_parentToolSpan?: Span): Span {
  return {} as Span;
}

export function endToolExecutionSpan(_span: Span, _metadata?: any): void {}

// --- Tool blocked on user spans ---

export function startToolBlockedOnUserSpan(
  _toolSpan: Span,
  _attrs?: any,
): Span {
  return {} as Span;
}

export function endToolBlockedOnUserSpan(_span: Span, _metadata?: any): void {}

// --- Hook spans ---

export function startHookSpan(_opts: any): Span {
  return {} as Span;
}

export function endHookSpan(_span: Span, _metadata?: any): void {}

// --- Subagent spans ---

export function startSubagentSpan(_opts: any, _extra?: any): Span {
  return {} as Span;
}

export function endSubagentSpan(_span: Span, _metadata?: any): void {}

export function runInSubagentSpanContext<T>(
  _span: Span,
  _fn: () => T,
): T {
  return _fn();
}

// --- Utility functions ---

export function getActiveInteractionSpan(): Span | undefined {
  return undefined;
}

export function truncateSpanError(s: string): string {
  return s;
}

// --- Testing utilities ---

export function clearSessionTracingForTesting(): void {}

export function runTTLSweepForTesting(_now: number): void {}
