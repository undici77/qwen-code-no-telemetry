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
}

export function startInteractionSpan(
  _config: Config,
  _options: StartInteractionOptions,
): void {}

export function endInteractionSpan(
  _status: 'ok' | 'error' | 'cancelled',
  _metadata?: EndInteractionOptions,
): void {}

export function startLLMRequestSpan(): void {}

export function endLLMRequestSpan(_metadata: LLMRequestMetadata): void {}

export function startToolSpan(_toolName: string): void {}

export function endToolSpan(_metadata: ToolSpanMetadata): void {}

export function startToolExecutionSpan(_toolName: string): void {}

export function endToolExecutionSpan(_metadata: ToolSpanMetadata): void {}

export function clearSessionTracingForTesting(): void {}
