/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { Span } from './dummy-otel.js';
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
export type ToolBlockedDecision = 'proceed_once' | 'proceed_always' | 'cancel' | 'aborted' | 'auto_approved' | 'error';
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
export declare function startInteractionSpan(_config: Config, _options: StartInteractionOptions): void;
export declare function endInteractionSpan(_status: 'ok' | 'error' | 'cancelled', _metadata?: EndInteractionOptions): void;
export declare function startLLMRequestSpan(_model?: string, _promptId?: string): Span;
export declare function endLLMRequestSpan(_span: Span, _metadata?: LLMRequestMetadata): void;
export declare function startToolSpan(_toolName: string, _attrs?: Record<string, string | number | boolean>): Span;
export declare function endToolSpan(_span: Span, _metadata?: ToolSpanMetadata): void;
export declare function startToolExecutionSpan(_parentToolSpan?: Span): Span;
export declare function endToolExecutionSpan(_span: Span, _metadata?: unknown): void;
export declare function runInToolSpanContext<T>(_span: Span, fn: () => T): T;
export declare function getActiveInteractionSpan(): Span | undefined;
export declare function startToolBlockedOnUserSpan(_toolSpan: Span, _attrs?: {
    tool_name?: string;
    call_id?: string;
}): Span;
export declare function endToolBlockedOnUserSpan(_span: Span, _metadata?: {
    decision?: ToolBlockedDecision;
    source?: ToolBlockedSource;
}): void;
export declare function startHookSpan(_opts: StartHookSpanOptions): Span;
export declare function endHookSpan(_span: Span, _metadata?: HookSpanMetadata): void;
export declare function clearSessionTracingForTesting(): void;
export declare function runTTLSweepForTesting(_now: number): void;
export declare function truncateSpanError(s: string): string;
