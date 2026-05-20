/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';

export interface StartInteractionOptions {
  promptId: string;
  model: string;
  messageType: string;
}

export interface EndInteractionOptions {
  errorMessage?: string;
}

export interface LLMRequestMetadata {
  inputTokens?: number;
  outputTokens?: number;
  success: boolean;
  durationMs?: number;
  error?: string;
}

export interface ToolSpanMetadata {
  success?: boolean;
  error?: string;
  cancelled?: boolean;
}

export function startInteractionSpan(
  _config: Config,
  _options: StartInteractionOptions,
): void {}

export function endInteractionSpan(
  _status: 'ok' | 'error' | 'cancelled',
  _metadata?: EndInteractionOptions,
): void {}

export function startLLMRequestSpan(_model?: string, _promptId?: string): any {
  return {};
}

export function endLLMRequestSpan(_span: any, _metadata?: LLMRequestMetadata): void {}

export function startToolSpan(_toolName: string, _attrs?: Record<string, string | number | boolean>): any {
  return {};
}

export function endToolSpan(_span: any, _metadata?: ToolSpanMetadata): void {}

export function startToolExecutionSpan(_parentToolSpan?: any): any {
  return {};
}

export function endToolExecutionSpan(_span: any, _metadata?: ToolSpanMetadata): void {}

export function runInToolSpanContext<T>(_span: any, fn: () => T): T {
  return fn();
}

export function getActiveInteractionSpan(): any {
  return undefined;
}

export function clearSessionTracingForTesting(): void {}
